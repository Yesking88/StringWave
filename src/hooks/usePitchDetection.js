import { useState, useEffect, useRef, useCallback } from 'react'
import { PitchDetector } from 'pitchy'
import { analyzeFrequency, frequencyToMidi, STANDARD_TUNING } from '../utils/tunerUtils'

// ─── Tuning constants ────────────────────────────────────────────────────────
// Larger FFT → finer frequency resolution for low strings.
// At 44100 Hz sample rate: 4096 FFT ≈ 10.8 Hz/bin (vs 21.5 Hz/bin with 2048)
const FFT_SIZE = 4096

// Pitchy McLeod confidence gate. 0.93 keeps only clean, unambiguous reads.
const CLARITY_THRESHOLD = 0.93

// RMS amplitude floor — rejects background hiss and finger touches.
const RMS_THRESHOLD = 0.01

// Guitar frequency range (Hz). Open strings: E2=82 → E4=330.
// Upper bound set to 660 to capture all fret positions but cut 3rd harmonics.
const MIN_FREQUENCY = 60
const MAX_FREQUENCY = 660

// Harmonic correction threshold (Hz)
const OCTAVE_CORRECT_ABOVE = 160

// Rolling median window size (frames). More frames = smoother but more lag.
const FREQ_BUFFER_SIZE = 12

// Number of consecutive frames the same MIDI note must appear
// before it becomes the displayed note. Prevents flicker on transients.
const NOTE_LOCK_FRAMES = 5

// After this many frames of silence/noise, clear the display.
const SILENCE_CLEAR_FRAMES = 45

// Minimum milliseconds between React state updates (~15 fps max).
// Keeps the needle moving smoothly without hammering React reconciliation.
const STATE_UPDATE_MS = 66

// ─── Signal math helpers ─────────────────────────────────────────────────────

/** RMS (root-mean-square) amplitude of a float buffer. */
function calcRMS(buffer) {
  let sum = 0
  for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i]
  return Math.sqrt(sum / buffer.length)
}

/** Median of a numeric array — more robust than mean for removing outliers. */
function median(arr) {
  if (arr.length === 0) return 0
  const s = [...arr].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 !== 0 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** Helper to find cents distance to closest standard tuning string */
function getCentsDistanceToString(freq, tuning = STANDARD_TUNING) {
  let minDiff = Infinity
  for (const s of tuning) {
    const diff = Math.abs(1200 * Math.log2(freq / s.frequency))
    if (diff < minDiff) minDiff = diff
  }
  return minDiff
}

/**
 * Octave guard: pitchy sometimes reports 2× the fundamental
 * (the 2nd harmonic) on guitar strings with clear tone.
 * If the raw pitch is above our threshold, only correct the octave
 * if the halved sub-octave matches a standard string significantly better.
 */
function correctOctave(freq, tuning = STANDARD_TUNING) {
  const sub = freq / 2
  if (sub >= MIN_FREQUENCY) {
    const origDist = getCentsDistanceToString(freq, tuning)
    const subDist = getCentsDistanceToString(sub, tuning)
    // Halve only if the sub-octave matches a standard string significantly closer
    if (subDist < origDist - 50) {
      return sub
    }
  }
  return freq
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * usePitchDetection
 *
 * Web Audio API + pitchy pipeline with:
 *   • RMS amplitude gate (ignores silence / background noise)
 *   • Octave correction for harmonic misreads
 *   • Rolling median buffer for frequency smoothing
 *   • Note-lock: requires N consecutive same-note frames before updating UI
 *   • State update throttle to avoid hammering React
 *   • Extended silence detection to clear the display
 */
export function usePitchDetection(activeTuning = STANDARD_TUNING) {
  const [state, setState] = useState('idle')   // idle | requesting | active | error
  const [error, setError] = useState(null)
  const [pitch, setPitch] = useState(null)

  const activeTuningRef = useRef(activeTuning)
  useEffect(() => {
    activeTuningRef.current = activeTuning
  }, [activeTuning])

  // ── Audio graph refs ──────────────────────────────────────────────────────
  const audioCtxRef   = useRef(null)
  const analyserRef   = useRef(null)
  const streamRef     = useRef(null)
  const detectorRef   = useRef(null)
  const rafRef        = useRef(null)
  const bufferRef     = useRef(null)

  // ── Smoothing / stability state — ONE ref object to avoid HMR hooks-count drift.
  // All fields are mutated directly inside the RAF loop; none trigger renders.
  const sm = useRef({
    freqWindow:    [],   // rolling buffer of valid raw frequencies
    pendingMidi:   null, // MIDI note we're accumulating frames for
    pendingCount:  0,    // consecutive frames of pendingMidi
    lockedMidi:    null, // the MIDI note committed to the display
    silenceFrames: 0,    // consecutive silent/noisy frames
    lastUpdate:    0,    // timestamp of last setPitch() call
  })

  // ── Teardown ──────────────────────────────────────────────────────────────
  const teardown = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
    if (audioCtxRef.current) { audioCtxRef.current.close().catch(() => {}); audioCtxRef.current = null }

    analyserRef.current = null
    detectorRef.current = null
    bufferRef.current   = null

    // Reset all smoothing state
    sm.current = {
      freqWindow: [], pendingMidi: null, pendingCount: 0,
      lockedMidi: null, silenceFrames: 0, lastUpdate: 0,
    }
  }, [])

  // ── Analysis loop ─────────────────────────────────────────────────────────
  const startLoop = useCallback(() => {
    const analyser = analyserRef.current
    const detector = detectorRef.current
    const buffer   = bufferRef.current
    const ctx      = audioCtxRef.current
    if (!analyser || !detector || !buffer || !ctx) return

    const loop = () => {
      analyser.getFloatTimeDomainData(buffer)
      const s = sm.current  // shorthand — avoids repeated .current lookups

      // ── Step 1: Amplitude gate ───────────────────────────────────────────
      const rms = calcRMS(buffer)

      if (rms < RMS_THRESHOLD) {
        s.silenceFrames++

        if (s.silenceFrames >= SILENCE_CLEAR_FRAMES) {
          s.freqWindow   = []
          s.pendingMidi  = null
          s.pendingCount = 0
          s.lockedMidi   = null

          const now = performance.now()
          if (now - s.lastUpdate >= STATE_UPDATE_MS) {
            s.lastUpdate = now
            setPitch(null)
          }
        }

        rafRef.current = requestAnimationFrame(loop)
        return
      }

      s.silenceFrames = 0

      // ── Step 2: Pitch detection ──────────────────────────────────────────
      const [rawFreq, clarity] = detector.findPitch(buffer, ctx.sampleRate)

      if (
        clarity < CLARITY_THRESHOLD ||
        rawFreq  < MIN_FREQUENCY    ||
        rawFreq  > MAX_FREQUENCY
      ) {
        rafRef.current = requestAnimationFrame(loop)
        return
      }

      // ── Step 3: Octave correction ────────────────────────────────────────
      const freq = correctOctave(rawFreq, activeTuningRef.current)

      // ── Step 4 + 5: MIDI-mode smoothing + note lock ─────────────────────
      //
      // Problem with raw-Hz median: if half the buffer contains readings at
      // ~130 Hz (C3 harmonic) and half at ~82 Hz (E2 fundamental), the median
      // lands somewhere between them and maps to the wrong note.
      //
      // Fix: group every reading in the window by its nearest MIDI note,
      // find the MIDI note with the most votes (mode), then take the median
      // Hz only from readings that belong to that note.
      // Spurious notes in the buffer now can't pull the result across note boundaries.

      // Responsive note transition flush:
      // If the new raw frequency is more than 1.5 semitones away from the current window's median,
      // it indicates a new string pluck. Flush the window to adapt immediately and avoid note dragging.
      if (s.freqWindow.length > 0) {
        const currentMedian = median(s.freqWindow)
        const semitoneDiff = Math.abs(12 * Math.log2(freq / currentMedian))
        if (semitoneDiff > 1.5) {
          s.freqWindow = []
          s.pendingMidi = null
          s.pendingCount = 0
          s.lockedMidi = null
        }
      }

      s.freqWindow.push(freq)
      if (s.freqWindow.length > FREQ_BUFFER_SIZE) s.freqWindow.shift()

      if (s.freqWindow.length < Math.ceil(FREQ_BUFFER_SIZE / 2)) {
        rafRef.current = requestAnimationFrame(loop)
        return
      }

      // Group readings by MIDI note
      const groups = {}
      for (const f of s.freqWindow) {
        const m = frequencyToMidi(f)
        if (!groups[m]) groups[m] = []
        groups[m].push(f)
      }

      // Dominant MIDI note = the one with the most readings
      const [dominantMidi, dominantFreqs] = Object.entries(groups)
        .sort((a, b) => b[1].length - a[1].length)[0]
      const midi = parseInt(dominantMidi, 10)

      // Smooth frequency using only readings that belong to the dominant note
      const smoothedFreq = median(dominantFreqs)

      // Note lock: require N consecutive evaluations with the same dominant note
      if (midi === s.pendingMidi) {
        s.pendingCount++
      } else {
        s.pendingMidi  = midi
        s.pendingCount = 1
      }

      if (s.pendingCount >= NOTE_LOCK_FRAMES) {
        s.lockedMidi = midi
      }

      if (s.lockedMidi === null) {
        rafRef.current = requestAnimationFrame(loop)
        return
      }

      // ── Step 6: Throttled state update ──────────────────────────────────
      const now = performance.now()
      if (now - s.lastUpdate < STATE_UPDATE_MS) {
        rafRef.current = requestAnimationFrame(loop)
        return
      }
      s.lastUpdate = now

      const result = analyzeFrequency(smoothedFreq, activeTuningRef.current)
      if (result) setPitch(result)

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
  }, [])

  // ── Start ─────────────────────────────────────────────────────────────────
  const start = useCallback(async () => {
    if (state === 'active' || state === 'requesting') return

    setState('requesting')
    setError(null)
    setPitch(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation:  false,
          noiseSuppression:  false,
          autoGainControl:   false,
          // Minimize system processing — we want the raw signal
          latency: 0,
        },
      })
      streamRef.current = stream

      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      audioCtxRef.current = ctx

      const analyser = ctx.createAnalyser()
      analyser.fftSize               = FFT_SIZE
      // Disable the built-in EWMA smoothing — we do our own median smoothing
      analyser.smoothingTimeConstant = 0
      analyser.minDecibels           = -90
      analyser.maxDecibels           = -10
      analyserRef.current = analyser

      const source = ctx.createMediaStreamSource(stream)
      source.connect(analyser)

      // PitchDetector sized to match our FFT buffer
      detectorRef.current = PitchDetector.forFloat32Array(FFT_SIZE)
      bufferRef.current   = new Float32Array(FFT_SIZE)

      setState('active')
      startLoop()
    } catch (err) {
      teardown()
      const msg =
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Microphone access was denied. Please allow mic access and try again.'
          : err.name === 'NotFoundError'
          ? 'No microphone found. Please connect one and try again.'
          : `Microphone error: ${err.message}`
      setError(msg)
      setState('error')
    }
  }, [state, startLoop, teardown])

  // ── Stop ──────────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    teardown()
    setState('idle')
    setPitch(null)
  }, [teardown])

  useEffect(() => () => teardown(), [teardown])

  return {
    state,
    error,
    pitch,
    isListening: state === 'active',
    start,
    stop,
  }
}
