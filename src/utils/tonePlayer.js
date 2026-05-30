/**
 * StringWave — Multi-Instrument Sampler Engine
 *
 * Manages real acoustic sample buffers for three melodic instruments
 * simultaneously using the Gleitz / MusyngKite soundfont CDN.
 *
 *   Instrument keys:  'guitar' | 'piano' | 'bass'
 *   CDN:  https://gleitz.github.io/midi-js-soundfonts/MusyngKite/
 *
 * ── Public API ────────────────────────────────────────────────────────────────
 *  getSamplerCtx()                          → AudioContext (shared singleton)
 *  getSamplerReady(instrument?)             → Promise<void>  (loads that bank)
 *  ensureAllLoaded()                        → Promise<void>  (loads all 3)
 *  playNote(midi, ctx, t0, dur, gain, rel, instrument?) → { source, gain } | null
 *  fadeOutAndStop(source, gainNode, ctx, fadeMs)
 *
 *  (Tuner) toggleReferenceTone(frequency, onStopCb?) → boolean
 *  (Tuner) stopReferenceTone()
 */

// ── Soundfont CDN URLs ────────────────────────────────────────────────────────
const SF_BASE = 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/'
const SF_URLS = {
  guitar: `${SF_BASE}acoustic_guitar_steel-mp3.js`,
  piano:  `${SF_BASE}acoustic_grand_piano-mp3.js`,
  bass:   `${SF_BASE}electric_bass_finger-mp3.js`,
}

// ── Note name → semitone ──────────────────────────────────────────────────────
const NAME_TO_SEMI = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3,
  E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8,
  Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
}

function sfKeyToMidi(key) {
  const m = key.match(/^([A-G][b#]?)(-?\d+)$/)
  if (!m) return null
  const semi = NAME_TO_SEMI[m[1]]
  if (semi === undefined) return null
  return (parseInt(m[2], 10) + 1) * 12 + semi
}

function freqToMidi(hz) {
  return Math.round(12 * Math.log2(hz / 440) + 69)
}

// ── Module-level state ────────────────────────────────────────────────────────
let _ctx = null

// Per-instrument cache: Map<instrument, Map<midi, AudioBuffer>>
const _buffers     = new Map()  // 'guitar' | 'piano' | 'bass' → Map<midi, AudioBuffer>
const _sortedMidis = new Map()  // 'guitar' | 'piano' | 'bass' → number[]
const _promises    = new Map()  // 'guitar' | 'piano' | 'bass' → Promise<void>

// Tuner reference tone state
let _refSource    = null
let _refGain      = null
let _refMidi      = null
let _refTimer     = null
let _refStopCb    = null

// Active strum node tracking
let _activeStrumNotes = []

// Active scale sequence node tracking
let _activeScaleNotes = []

// ── AudioContext ──────────────────────────────────────────────────────────────

export function getSamplerCtx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

// ── Soundfont loading helpers ─────────────────────────────────────────────────

function parseSoundfontText(text) {
  // Extract the JS object literal between the first { and last }
  const start = text.indexOf('{')
  const end   = text.lastIndexOf('}')
  if (start !== -1 && end !== -1) {
    try { return JSON.parse(text.slice(start, end + 1)) } catch (_) {}
  }
  // Sandboxed eval fallback
  const MIDI = { Soundfont: {} }
  // eslint-disable-next-line no-new-func
  new Function('MIDI', text)(MIDI)
  const keys = Object.keys(MIDI.Soundfont)
  return keys.length ? MIDI.Soundfont[keys[0]] : null
}

function decodeDataUri(ctx, dataUri) {
  const base64 = dataUri.split(',')[1]
  if (!base64) return Promise.resolve(null)
  const bin = atob(base64)
  const buf = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
  return ctx.decodeAudioData(buf.buffer).catch(() => null)
}

/**
 * Load and decode one instrument soundfont. Idempotent — returns the existing
 * promise if already loading or loaded.
 *
 * @param {'guitar'|'piano'|'bass'} instrument
 * @returns {Promise<void>}
 */
export function getSamplerReady(instrument = 'guitar') {
  if (_promises.has(instrument)) return _promises.get(instrument)

  const p = (async () => {
    const url = SF_URLS[instrument]
    if (!url) throw new Error(`Unknown instrument: ${instrument}`)

    const ctx  = getSamplerCtx()
    const res  = await fetch(url)
    const text = await res.text()
    const noteMap = parseSoundfontText(text)
    if (!noteMap) throw new Error(`[sampler] Empty note map for ${instrument}`)

    const entries = Object.entries(noteMap)
    const results = await Promise.all(
      entries.map(async ([key, uri]) => {
        const midi   = sfKeyToMidi(key)
        if (midi === null) return null
        const buffer = await decodeDataUri(ctx, uri)
        return buffer ? { midi, buffer } : null
      })
    )

    const bufMap  = new Map()
    const midiArr = []
    for (const r of results) {
      if (!r) continue
      bufMap.set(r.midi, r.buffer)
      midiArr.push(r.midi)
    }
    midiArr.sort((a, b) => a - b)

    _buffers.set(instrument, bufMap)
    _sortedMidis.set(instrument, midiArr)
  })()

  _promises.set(instrument, p)
  return p
}

/** Load all three melodic instruments in parallel. */
export function ensureAllLoaded() {
  return Promise.all(['guitar', 'piano', 'bass'].map(i => getSamplerReady(i)))
}

// Pre-load all instruments eagerly on module import (non-blocking)
if (typeof window !== 'undefined') {
  ensureAllLoaded().catch(() => {})
}

// ── Sample selection ──────────────────────────────────────────────────────────

function nearestMidi(instrument, target) {
  const sorted = _sortedMidis.get(instrument)
  if (!sorted || !sorted.length) return null
  const buf = _buffers.get(instrument)
  if (buf?.has(target)) return target
  let best = sorted[0], bestD = Math.abs(best - target)
  for (const m of sorted) {
    const d = Math.abs(m - target)
    if (d < bestD) { bestD = d; best = m }
    if (d > bestD) break
  }
  return best
}

// ── Core playback primitive ───────────────────────────────────────────────────

/**
 * Schedule one note from the sampler buffer cache.
 *
 * @param {number}  targetMidi
 * @param {AudioContext} ctx
 * @param {number}  startTime     ctx.currentTime offset
 * @param {number}  duration      sustain before release (0 = one-shot)
 * @param {number}  gainValue     0–1 amplitude
 * @param {number}  releaseTime   seconds for fade-out after duration
 * @param {string}  instrument    'guitar' | 'piano' | 'bass'
 * @returns {{ source: AudioBufferSourceNode, gain: GainNode } | null}
 */
export function playNote(
  targetMidi, ctx, startTime,
  duration    = 0,
  gainValue   = 0.7,
  releaseTime = 0.6,
  instrument  = 'guitar',
) {
  const bufMap = _buffers.get(instrument)
  if (!bufMap || !bufMap.size) return null

  const sampleMidi  = nearestMidi(instrument, targetMidi)
  if (sampleMidi === null) return null
  const buffer       = bufMap.get(sampleMidi)
  if (!buffer) return null

  const detune = (targetMidi - sampleMidi) * 100

  const gainNode = ctx.createGain()
  gainNode.gain.setValueAtTime(0, startTime)
  gainNode.gain.linearRampToValueAtTime(gainValue, startTime + 0.005)

  if (duration > 0) {
    gainNode.gain.setValueAtTime(gainValue, startTime + duration)
    gainNode.gain.linearRampToValueAtTime(0.0001, startTime + duration + releaseTime)
  }
  gainNode.connect(ctx.destination)

  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.detune.setValueAtTime(detune, startTime)
  source.connect(gainNode)
  source.start(startTime)

  const stopAt = duration > 0
    ? startTime + duration + releaseTime + 0.05
    : startTime + buffer.duration + 0.1
  source.stop(stopAt)

  return { source, gain: gainNode }
}

// ── Smooth stop ───────────────────────────────────────────────────────────────

/**
 * Fade out and disconnect an active node pair without clicks.
 * @param {AudioBufferSourceNode|OscillatorNode} source
 * @param {GainNode} gainNode
 * @param {AudioContext} ctx
 * @param {number} fadeMs  milliseconds for the fade
 */
export function fadeOutAndStop(source, gainNode, ctx, fadeMs = 80) {
  if (!gainNode || !ctx) return
  const now  = ctx.currentTime
  const fade = fadeMs / 1000
  try {
    gainNode.gain.cancelScheduledValues(now)
    gainNode.gain.setValueAtTime(gainNode.gain.value, now)
    gainNode.gain.linearRampToValueAtTime(0.0001, now + fade)
  } catch (_) {}
  setTimeout(() => {
    try { source?.stop()        } catch (_) {}
    try { source?.disconnect()  } catch (_) {}
    try { gainNode?.disconnect() } catch (_) {}
  }, fadeMs + 20)
}

// ── Public Reference Tone API (Tuner — unchanged surface) ─────────────────────

/**
 * Toggle a reference tone at the given frequency.
 * Uses the guitar sampler if loaded; falls back to a sine oscillator.
 *
 * @param {number}   frequency      Hz
 * @param {Function} [onStopCb]     Fired when the note decays naturally
 * @returns {boolean}  true = playing, false = stopped
 */
export function toggleReferenceTone(frequency, onStopCb) {
  const targetMidi = freqToMidi(frequency)
  if (_refMidi === targetMidi) { stopReferenceTone(); return false }
  stopReferenceTone()

  const ctx       = getSamplerCtx()
  _refStopCb      = onStopCb || null
  const bufMap    = _buffers.get('guitar')

  if (bufMap && bufMap.size > 0) {
    // ── Real sample path ──────────────────────────────────────────────────
    const result = playNote(targetMidi, ctx, ctx.currentTime, 0, 0.75, 1.2, 'guitar')
    if (result) {
      _refSource = result.source
      _refGain   = result.gain
      _refMidi   = targetMidi
      const dur  = (bufMap.get(nearestMidi('guitar', targetMidi))?.duration ?? 3) * 1000 + 200
      _refTimer  = setTimeout(() => {
        _refSource = null; _refGain = null; _refMidi = null
        if (_refStopCb) { _refStopCb(); _refStopCb = null }
      }, dur)
      return true
    }
  }

  // ── Sine fallback (buffers not yet ready) ─────────────────────────────
  const ATTACK = 0.005, DECAY = 0.08, SUSTAIN = 0.15, RELEASE = 0.6
  const TOTAL  = ATTACK + DECAY + RELEASE + 0.05
  const now    = ctx.currentTime

  const gainNode = ctx.createGain()
  gainNode.gain.setValueAtTime(0, now)
  gainNode.gain.linearRampToValueAtTime(0.55, now + ATTACK)
  gainNode.gain.linearRampToValueAtTime(0.55 * SUSTAIN, now + ATTACK + DECAY)
  gainNode.gain.linearRampToValueAtTime(0.0001, now + ATTACK + DECAY + RELEASE)
  gainNode.connect(ctx.destination)

  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(frequency, now)
  osc.connect(gainNode)
  osc.start(now)
  osc.stop(now + TOTAL)

  _refSource = osc; _refGain = gainNode; _refMidi = targetMidi
  _refTimer  = setTimeout(() => {
    _refSource = null; _refGain = null; _refMidi = null
    if (_refStopCb) { _refStopCb(); _refStopCb = null }
  }, Math.round(TOTAL * 1000) + 50)

  return true
}

/** Immediately silence any playing reference tone (80ms fade). */
export function stopReferenceTone() {
  if (_refTimer)  { clearTimeout(_refTimer); _refTimer = null }
  if (_refSource && _refGain && _ctx) fadeOutAndStop(_refSource, _refGain, _ctx, 80)
  _refSource = null; _refGain = null; _refMidi = null; _refStopCb = null
}

const OPEN_STRING_MIDIS = [40, 45, 50, 55, 59, 64]

/**
 * Play a chord with a downward arpeggiated strum sweep.
 * @param {number[]} frets - Array of 6 numbers (-1 for muted)
 * @param {string} instrument - 'guitar' | 'piano' | 'bass'
 */
export function playChordStrum(frets, instrument = 'guitar') {
  try {
    const ctx = getSamplerCtx()
    if (!ctx) return

    // Stop any currently playing strum notes to prevent overlap/distortion
    if (_activeStrumNotes.length > 0) {
      _activeStrumNotes.forEach(note => {
        if (note && note.source && note.gain) {
          fadeOutAndStop(note.source, note.gain, ctx, 120)
        }
      })
      _activeStrumNotes = []
    }

    // Trigger eager loading in the background if not fully loaded.
    // Wrap in try/catch to absorb failure, and verify buffers exist.
    getSamplerReady(instrument).catch(() => {})

    const bufMap = _buffers.get(instrument)
    if (!bufMap || bufMap.size === 0) {
      // Audio buffers not ready yet, play a temporary synthesized fallback chord to avoid silence/crashes
      playSynthFallbackStrum(frets, ctx)
      return
    }

    const now = ctx.currentTime
    const delayStep = 0.05 // 50ms per string -> 250ms total span
    // Calculate how many strings are played to set gain safely (anti-clipping)
    const activeCount = frets.filter(f => f !== -1).length
    const baseGain = activeCount > 0 ? Math.min(0.50, 2.2 / activeCount) : 0.45

    frets.forEach((fret, stringIdx) => {
      // 1. Explicitly skip muted strings
      if (fret === -1 || fret === undefined || fret === null) return

      const midi = OPEN_STRING_MIDIS[stringIdx] + fret
      const startOffset = stringIdx * delayStep

      try {
        const noteResult = playNote(midi, ctx, now + startOffset, 1.6, baseGain, 0.8, instrument)
        if (noteResult) {
          _activeStrumNotes.push(noteResult)
        }
      } catch (err) {
        console.warn(`[Sampler] Failed to play note ${midi}:`, err)
      }
    })
  } catch (err) {
    console.error("[Sampler] Error in playChordStrum:", err)
  }
}

/** Play a triangle wave synth arpeggiation as an asset-loading fallback. */
function playSynthFallbackStrum(frets, ctx) {
  try {
    const now = ctx.currentTime
    const delayStep = 0.05
    const activeCount = frets.filter(f => f !== -1).length
    const baseGain = activeCount > 0 ? Math.min(0.32, 1.4 / activeCount) : 0.27

    frets.forEach((fret, stringIdx) => {
      if (fret === -1 || fret === undefined || fret === null) return
      const midi = OPEN_STRING_MIDIS[stringIdx] + fret
      const hz = 440 * Math.pow(2, (midi - 69) / 12)
      const startOffset = stringIdx * delayStep
      const time = now + startOffset

      const ATTACK = 0.005, DECAY = 0.08, SUSTAIN = 0.2, RELEASE = 0.8
      const TOTAL = ATTACK + DECAY + RELEASE

      const gainNode = ctx.createGain()
      gainNode.gain.setValueAtTime(0, time)
      gainNode.gain.linearRampToValueAtTime(baseGain, time + ATTACK)
      gainNode.gain.linearRampToValueAtTime(baseGain * SUSTAIN, time + ATTACK + DECAY)
      gainNode.gain.linearRampToValueAtTime(0.0001, time + ATTACK + DECAY + RELEASE)
      gainNode.connect(ctx.destination)

      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(hz, time)
      osc.connect(gainNode)
      osc.start(time)
      osc.stop(time + TOTAL)

      _activeStrumNotes.push({ source: osc, gain: gainNode })
    })
  } catch (err) {
    console.error("[Sampler] Error in playSynthFallbackStrum:", err)
  }
}

/**
 * Play a scale sequence ascending (spaced 300ms apart).
 * @param {number[]} midiPitches - Array of MIDI pitch numbers
 */
export function playScaleSequence(midiPitches) {
  try {
    const ctx = getSamplerCtx()
    if (!ctx) return

    // Stop reference tone if any
    stopReferenceTone()

    // Stop and clear any currently playing scale notes to prevent overlapping runs
    if (_activeScaleNotes.length > 0) {
      _activeScaleNotes.forEach(note => {
        if (note && note.source && note.gain) {
          fadeOutAndStop(note.source, note.gain, ctx, 80)
        }
      })
      _activeScaleNotes = []
    }

    // Trigger eager loading of guitar sampler
    getSamplerReady('guitar').catch(() => {})

    const bufMap = _buffers.get('guitar')
    if (!bufMap || bufMap.size === 0) {
      // Audio assets not ready, play synthesized fallback scale
      playSynthFallbackScale(midiPitches, ctx)
      return
    }

    const now = ctx.currentTime
    const stepInterval = 0.3
    const duration = 0.25
    const release = 0.15
    const baseGain = 0.58

    midiPitches.forEach((midi, idx) => {
      if (midi === -1 || midi === undefined || midi === null) return

      const startTime = now + idx * stepInterval
      try {
        const noteResult = playNote(midi, ctx, startTime, duration, baseGain, release, 'guitar')
        if (noteResult) {
          _activeScaleNotes.push(noteResult)
        }
      } catch (err) {
        console.warn(`[Sampler] Failed to play scale note ${midi}:`, err)
      }
    })
  } catch (err) {
    console.error("[Sampler] Error in playScaleSequence:", err)
  }
}

/** Play a synthesized triangle wave scale sequence as fallback. */
function playSynthFallbackScale(midiPitches, ctx) {
  try {
    const now = ctx.currentTime
    const stepInterval = 0.3
    const duration = 0.25
    const release = 0.15
    const total = duration + release
    const baseGain = 0.40

    midiPitches.forEach((midi, idx) => {
      if (midi === -1 || midi === undefined || midi === null) return
      const hz = 440 * Math.pow(2, (midi - 69) / 12)
      const startTime = now + idx * stepInterval

      const gainNode = ctx.createGain()
      gainNode.gain.setValueAtTime(0, startTime)
      gainNode.gain.linearRampToValueAtTime(baseGain, startTime + 0.005)
      gainNode.gain.setValueAtTime(baseGain, startTime + duration)
      gainNode.gain.linearRampToValueAtTime(0.0001, startTime + duration + release)
      gainNode.connect(ctx.destination)

      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(hz, startTime)
      osc.connect(gainNode)
      osc.start(startTime)
      osc.stop(startTime + total + 0.05)

      _activeScaleNotes.push({ source: osc, gain: gainNode })
    })
  } catch (err) {
    console.error("[Sampler] Error in playSynthFallbackScale:", err)
  }
}
