/**
 * StringWave — Multi-Instrument Style Scheduler
 *
 * Provides BPM-synchronised, multi-channel chord playback in six
 * distinct rhythmic styles, plus synthesised drum patterns, ride cymbals,
 * and crash cymbals.
 *
 * ── Public API ─────────────────────────────────────────────────────────────
 *  noteToHz(note, octave)                                 → Hz
 *  guitarFrequencies(chord)                               → [{freq, stringIdx}]
 *  bassFrequency(chord)                                   → Hz
 *  getProgressionCtx()                                    → AudioContext
 *  scheduleStyleBlock(ctx, chord, style, mix, t0, dur, bpm, measureIndex) → nodeGroup[]
 *  cleanupNodes(nodeGroups)                               → void
 *
 *  Legacy (kept for backward compatibility with any direct callers):
 *  scheduleChordStrum(ctx, chord, instrument, t0, dur)    → nodeGroup[]
 */

import {
  getSamplerCtx,
  playNote,
  fadeOutAndStop,
} from './tonePlayer'

// ── Pitch math ──────────────────────────────────────────────────────────────

const NOTE_SEMI = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3,
  E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8,
  Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
}

const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function noteToHz(note, octave = 4) {
  const semi = NOTE_SEMI[note]
  if (semi === undefined) return 440
  return 440 * Math.pow(2, ((octave + 1) * 12 + semi - 69) / 12)
}

function freqToMidi(hz) {
  return Math.round(12 * Math.log2(hz / 440) + 69)
}

// ── Open-string reference frequencies ────────────────────────────────────────
const OPEN_STRINGS = [
  ['E', 2], ['A', 2], ['D', 3], ['G', 3], ['B', 3], ['E', 4],
]

export function guitarFrequencies(chord) {
  return chord.frets
    .map((fret, idx) => {
      if (fret === -1) return null
      const [n, o] = OPEN_STRINGS[idx]
      return { freq: noteToHz(n, o) * Math.pow(2, fret / 12), stringIdx: idx }
    })
    .filter(Boolean)
}

export function bassFrequency(chord) {
  for (let i = 0; i < chord.frets.length; i++) {
    const f = chord.frets[i]
    if (f === -1) continue
    const [n, o] = OPEN_STRINGS[i]
    return (noteToHz(n, o) * Math.pow(2, f / 12)) / 2
  }
  return 110
}

// ── AudioContext (shared with tonePlayer) ────────────────────────────────────

export function getProgressionCtx() { return getSamplerCtx() }

// ── Default mix ────────────────────────────────────────────────────────────
export const DEFAULT_MIX = {
  guitar: { enabled: true,  volume: 0.72 },
  piano:  { enabled: true,  volume: 0.58 },
  bass:   { enabled: true,  volume: 0.68 },
  drums:  { enabled: true,  volume: 0.60 },
}

// ── Drum synthesis & Compressor Routing ──────────────────────────────────────
const DRUM_STAGE_GAIN = 0.15 // Lower master gain coefficient to prevent clipping

let _drumCompressor = null
let _drumCompressorCtx = null

function getDrumDestination(ctx) {
  if (!_drumCompressor || _drumCompressorCtx !== ctx) {
    try {
      _drumCompressor = ctx.createDynamicsCompressor()
      _drumCompressor.threshold.setValueAtTime(-24, ctx.currentTime)
      _drumCompressor.knee.setValueAtTime(30, ctx.currentTime)
      _drumCompressor.ratio.setValueAtTime(4, ctx.currentTime)
      _drumCompressor.attack.setValueAtTime(0.01, ctx.currentTime)
      _drumCompressor.release.setValueAtTime(0.25, ctx.currentTime)
      _drumCompressor.connect(ctx.destination)
      _drumCompressorCtx = ctx
    } catch (e) {
      console.warn("Failed to create drum compressor, falling back to destination", e)
      return ctx.destination
    }
  }
  return _drumCompressor
}

/**
 * Schedule a synthesized kick drum.
 * Frequency sweeps from 85 Hz → 45 Hz over 60ms (punchy thud).
 */
function scheduleKick(ctx, time, vol = 0.9) {
  const osc  = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain); gain.connect(getDrumDestination(ctx))

  osc.frequency.setValueAtTime(85, time)
  osc.frequency.exponentialRampToValueAtTime(45, time + 0.06)
  gain.gain.setValueAtTime(vol * DRUM_STAGE_GAIN, time)
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18)

  osc.start(time); osc.stop(time + 0.2)
  return { source: osc, gain }
}

/**
 * Schedule a synthesized snare drum.
 * Layered filtered noise burst + short resonant ring.
 */
function scheduleSnare(ctx, time, vol = 0.75) {
  const nodes = []

  // Noise layer
  const sampleRate  = ctx.sampleRate
  const bufLen      = Math.ceil(sampleRate * 0.12)
  const buf         = ctx.createBuffer(1, bufLen, sampleRate)
  const data        = buf.getChannelData(0)
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1

  const noise     = ctx.createBufferSource()
  noise.buffer    = buf
  const bpf       = ctx.createBiquadFilter()
  bpf.type        = 'bandpass'
  bpf.frequency.setValueAtTime(2200, time)
  bpf.Q.setValueAtTime(0.9, time)
  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(vol * 0.9 * DRUM_STAGE_GAIN, time)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12)
  noise.connect(bpf); bpf.connect(noiseGain); noiseGain.connect(getDrumDestination(ctx))
  noise.start(time)
  nodes.push({ source: noise, gain: noiseGain })

  // Tonal ring (150 Hz sine burst)
  const ringOsc  = ctx.createOscillator()
  const ringGain = ctx.createGain()
  ringOsc.frequency.setValueAtTime(150, time)
  ringGain.gain.setValueAtTime(vol * 0.35 * DRUM_STAGE_GAIN, time)
  ringGain.gain.exponentialRampToValueAtTime(0.001, time + 0.06)
  ringOsc.connect(ringGain); ringGain.connect(getDrumDestination(ctx))
  ringOsc.start(time); ringOsc.stop(time + 0.07)
  nodes.push({ source: ringOsc, gain: ringGain })

  return nodes
}

/**
 * Schedule a synthesized hi-hat.
 * Very short burst of band-passed noise at high frequency.
 * @param {boolean} open  Whether to use a slightly longer open hi-hat.
 */
function scheduleHihat(ctx, time, vol = 0.45, open = false) {
  const dur       = open ? 0.18 : 0.04
  const sampleRate = ctx.sampleRate
  const bufLen    = Math.ceil(sampleRate * dur)
  const buf       = ctx.createBuffer(1, bufLen, sampleRate)
  const data      = buf.getChannelData(0)
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1

  const noise     = ctx.createBufferSource()
  noise.buffer    = buf
  const hpf       = ctx.createBiquadFilter()
  hpf.type        = 'highpass'
  hpf.frequency.setValueAtTime(7000, time)
  const hhGain    = ctx.createGain()
  hhGain.gain.setValueAtTime(vol * DRUM_STAGE_GAIN, time)
  hhGain.gain.exponentialRampToValueAtTime(0.001, time + dur)
  noise.connect(hpf); hpf.connect(hhGain); hhGain.connect(getDrumDestination(ctx))
  noise.start(time)
  return { source: noise, gain: hhGain }
}

/**
 * Schedule a synthesized crash cymbal strike.
 * Long burst of high-passed white noise with a smooth exponential decay.
 */
function scheduleCrash(ctx, time, vol = 0.5) {
  const sampleRate = ctx.sampleRate
  const dur        = 1.2 // Long ring
  const bufLen     = Math.ceil(sampleRate * dur)
  const buf        = ctx.createBuffer(1, bufLen, sampleRate)
  const data       = buf.getChannelData(0)
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1

  const noise      = ctx.createBufferSource()
  noise.buffer     = buf
  const hpf        = ctx.createBiquadFilter()
  hpf.type         = 'highpass'
  hpf.frequency.setValueAtTime(4500, time)
  hpf.Q.setValueAtTime(1.0, time)

  const gain       = ctx.createGain()
  gain.gain.setValueAtTime(vol * DRUM_STAGE_GAIN, time)
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur)

  noise.connect(hpf); hpf.connect(gain); gain.connect(getDrumDestination(ctx))
  noise.start(time)
  return { source: noise, gain }
}

/**
 * Schedule a synthesized soft metallic ride cymbal tap.
 * High-pitched metallic ring overlay with soft exponential decay.
 */
function scheduleRide(ctx, time, vol = 0.25) {
  const sampleRate = ctx.sampleRate
  const dur        = 0.28 // Shorter ring than crash
  const bufLen     = Math.ceil(sampleRate * dur)
  const buf        = ctx.createBuffer(1, bufLen, sampleRate)
  const data       = buf.getChannelData(0)
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1

  const noise      = ctx.createBufferSource()
  noise.buffer     = buf
  const hpf        = ctx.createBiquadFilter()
  hpf.type         = 'highpass'
  hpf.frequency.setValueAtTime(8000, time)

  const gain       = ctx.createGain()
  gain.gain.setValueAtTime(vol * DRUM_STAGE_GAIN, time)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + dur)

  noise.connect(hpf); hpf.connect(gain); gain.connect(getDrumDestination(ctx))
  noise.start(time)
  return { source: noise, gain }
}

// ── Sampler helpers ───────────────────────────────────────────────────────────

function sampledNote(ctx, instrument, midi, t0, dur, gain, rel) {
  return playNote(midi, ctx, t0, dur, gain, rel, instrument)
}

function sineNote(ctx, freq, t0, dur, gain = 0.4) {
  const master = ctx.createGain()
  master.connect(ctx.destination)
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, t0)
  osc.connect(master)
  // Ensure a smooth 250ms decay tail overlap for the sine fallback as well
  const A = 0.008, D = 0.06, S = 0.18, R = Math.max(0.25, Math.min(dur * 0.35, 0.5))
  master.gain.setValueAtTime(0, t0)
  master.gain.linearRampToValueAtTime(gain, t0 + A)
  master.gain.linearRampToValueAtTime(gain * S, t0 + A + D)
  master.gain.setValueAtTime(gain * S, t0 + dur)
  master.gain.linearRampToValueAtTime(0.0001, t0 + dur + R)
  const stopAt = t0 + dur + R + 0.05
  osc.start(t0); osc.stop(stopAt)
  return { source: osc, gain: master, stopAt }
}

// ── Channel helpers ────────────────────────────────────────────────────────────

function isOn(mix, ch) {
  const c = mix?.[ch]
  return c?.enabled && c.volume > 0
}
function vol(mix, ch, def = 0.7) {
  return mix?.[ch]?.volume ?? def
}

function bassMidi(chord) {
  return freqToMidi(bassFrequency(chord) * 2)
}

// ── Style block schedulers ─────────────────────────────────────────────────────

/**
 * Pop / Rock:
 *   Guitar  — quarter-note downstrokes (4 per measure)
 *   Piano   — whole-note block chord with 250ms decay tail
 *   Bass    — root on beats 1 and 3
 *   Drums   — Kick on 1+3, Snare on 2+4, hihat on 8ths, crash on 4th bar
 */
function schedulePopBlock(ctx, chord, mix, t0, chordDur, bpm, measureIndex) {
  const nodes = []
  const beat  = 60 / bpm
  const eighth = beat / 2
  const freqs = guitarFrequencies(chord)
  const baseMidi = bassMidi(chord)

  // ── Guitar ──
  if (isOn(mix, 'guitar')) {
    const gVol  = vol(mix, 'guitar', 0.72)
    const STRUM = 0.013
    for (let beat4 = 0; beat4 < 4; beat4++) {
      const t = t0 + beat4 * beat
      if (t >= t0 + chordDur - 0.02) break
      freqs.forEach(({ freq }, si) => {
        const midi = freqToMidi(freq)
        const t1   = t + si * STRUM
        const velMul = beat4 === 0 ? 1.0 : beat4 === 2 ? 0.82 : 0.68
        const dur  = Math.max(0.05, beat * 1.0 - si * STRUM)
        const res  = sampledNote(ctx, 'guitar', midi, t1, dur, gVol * velMul, 0.25)
        if (res) nodes.push(res)
        else nodes.push(sineNote(ctx, freq, t1, dur, gVol * velMul * 0.7))
      })
    }
  }

  // ── Piano ──
  if (isOn(mix, 'piano')) {
    const pVol = vol(mix, 'piano', 0.58)
    freqs.forEach(({ freq }) => {
      const midi = freqToMidi(freq)
      const res  = sampledNote(ctx, 'piano', midi, t0, chordDur, pVol, 0.25)
      if (res) nodes.push(res)
      else nodes.push(sineNote(ctx, freq, t0, chordDur, pVol * 0.7))
    })
  }

  // ── Bass ──
  if (isOn(mix, 'bass')) {
    const bVol = vol(mix, 'bass', 0.68)
    const bassNote = (time, duration) => {
      if (time >= t0 + chordDur - 0.02) return
      const res = sampledNote(ctx, 'bass', baseMidi, time, duration, bVol, 0.25)
      if (res) nodes.push(res)
      else nodes.push(sineNote(ctx, bassFrequency(chord) * 2, time, duration, bVol * 0.7))
    }
    bassNote(t0,          beat * 1.0)
    bassNote(t0 + 2*beat, beat * 1.0)
  }

  // ── Drums ──
  if (isOn(mix, 'drums')) {
    const dVol = vol(mix, 'drums', 0.60)
    // Pop/Rock crash triggers ONLY on beat 1 of every 4th bar
    if (measureIndex % 4 === 0) {
      nodes.push(scheduleCrash(ctx, t0, dVol * 0.85))
    }

    const totalBeats = Math.floor(chordDur / beat)
    for (let b = 0; b < totalBeats; b++) {
      const t = t0 + b * beat
      if (t >= t0 + chordDur - 0.01) break
      if (b % 4 === 0 || b % 4 === 2) nodes.push(scheduleKick(ctx, t, dVol))
      if (b % 4 === 1 || b % 4 === 3) nodes.push(...scheduleSnare(ctx, t, dVol * 0.9))
      nodes.push(scheduleHihat(ctx, t,           dVol * 0.55))
      nodes.push(scheduleHihat(ctx, t + eighth,  dVol * 0.45))
    }
  }

  return nodes
}

/**
 * Arpeggio / Acoustic:
 *   Guitar  — rolling pick pattern with natural decay
 *   Piano   — soft pad background chord
 *   Bass    — root on beat 1 only
 *   Drums   — brushed hi-hats, crash on 4th bar
 */
function scheduleArpeggioBlock(ctx, chord, mix, t0, chordDur, bpm, measureIndex) {
  const nodes  = []
  const eighth = (60 / bpm) / 2
  const freqs  = guitarFrequencies(chord)

  const up   = freqs.map(f => f.freq)
  const down = [...up].reverse().slice(1, -1)
  const pattern = [...up, ...down]

  // ── Guitar ──
  if (isOn(mix, 'guitar')) {
    const gVol = vol(mix, 'guitar', 0.68)
    pattern.forEach((freq, i) => {
      const t = t0 + i * eighth
      if (t >= t0 + chordDur - 0.01) return
      const midi = freqToMidi(freq)
      const noteDur = eighth * 2.0
      const res = sampledNote(ctx, 'guitar', midi, t, noteDur, gVol, 0.25)
      if (res) nodes.push(res)
      else nodes.push(sineNote(ctx, freq, t, noteDur, gVol * 0.75))
    })
  }

  // ── Piano ──
  if (isOn(mix, 'piano')) {
    const pVol = vol(mix, 'piano', 0.42)
    freqs.forEach(({ freq }) => {
      const midi = freqToMidi(freq)
      const res  = sampledNote(ctx, 'piano', midi, t0, chordDur, pVol, 0.25)
      if (res) nodes.push(res)
      else nodes.push(sineNote(ctx, freq, t0, chordDur, pVol * 0.7))
    })
  }

  // ── Bass ──
  if (isOn(mix, 'bass')) {
    const bVol = vol(mix, 'bass', 0.60)
    const res  = sampledNote(ctx, 'bass', bassMidi(chord), t0, chordDur, bVol, 0.25)
    if (res) nodes.push(res)
    else nodes.push(sineNote(ctx, bassFrequency(chord) * 2, t0, chordDur, bVol * 0.7))
  }

  // ── Drums ──
  if (isOn(mix, 'drums')) {
    const dVol  = vol(mix, 'drums', 0.38)
    // Crash on beat 1 of every 4th bar
    if (measureIndex % 4 === 0) {
      nodes.push(scheduleCrash(ctx, t0, dVol * 0.75))
    }

    const steps = Math.floor(chordDur / eighth)
    for (let s = 0; s < steps; s++) {
      const t = t0 + s * eighth
      if (t >= t0 + chordDur - 0.01) break
      nodes.push(scheduleHihat(ctx, t, dVol * (s % 2 === 0 ? 1.0 : 0.7)))
    }
  }

  return nodes
}

/**
 * Sustained / Basic:
 *   Guitar  — single strum, let ring with 250ms decay
 *   Piano   — whole-note chord
 *   Bass    — whole-measure root note
 *   Drums   — none
 */
function scheduleSustainedBlock(ctx, chord, mix, t0, chordDur, bpm, measureIndex) {
  const nodes = []
  const freqs = guitarFrequencies(chord)
  const STRUM = 0.015

  // ── Guitar ──
  if (isOn(mix, 'guitar')) {
    const gVol = vol(mix, 'guitar', 0.70)
    freqs.forEach(({ freq }, i) => {
      const t    = t0 + i * STRUM
      const dur  = Math.max(0.05, chordDur - i * STRUM)
      const midi = freqToMidi(freq)
      const res  = sampledNote(ctx, 'guitar', midi, t, dur, gVol, 0.25)
      if (res) nodes.push(res)
      else nodes.push(sineNote(ctx, freq, t, dur, gVol * 0.75))
    })
  }

  // ── Piano ──
  if (isOn(mix, 'piano')) {
    const pVol = vol(mix, 'piano', 0.52)
    freqs.forEach(({ freq }) => {
      const midi = freqToMidi(freq)
      const res  = sampledNote(ctx, 'piano', midi, t0, chordDur, pVol, 0.25)
      if (res) nodes.push(res)
      else nodes.push(sineNote(ctx, freq, t0, chordDur, pVol * 0.7))
    })
  }

  // ── Bass ──
  if (isOn(mix, 'bass')) {
    const bVol = vol(mix, 'bass', 0.62)
    const res  = sampledNote(ctx, 'bass', bassMidi(chord), t0, chordDur, bVol, 0.25)
    if (res) nodes.push(res)
    else nodes.push(sineNote(ctx, bassFrequency(chord) * 2, t0, chordDur, bVol * 0.7))
  }

  return nodes
}

/**
 * Jazz Swing Syncopations:
 *   Guitar  — swing chord stabs on beat 1, beat 2-and, beat 4
 *   Piano   — rich jazz chords comping
 *   Bass    — walking bass line
 *   Drums   — swing syncopation on hi-hat, soft ride cymbal tap instead of harsh crash
 */
function scheduleJazzBlock(ctx, chord, mix, t0, chordDur, bpm, measureIndex) {
  const nodes = []
  const beat = 60 / bpm
  const eighth = beat / 2
  const swingOffset = beat * 1.5 + (eighth * 0.15)
  const freqs = guitarFrequencies(chord)
  const baseMidi = bassMidi(chord)

  const isMinor = chord.name.includes('m') || chord.category?.includes('minor') || chord.category?.includes('min')

  // ── Guitar ──
  if (isOn(mix, 'guitar')) {
    const gVol = vol(mix, 'guitar', 0.68)
    const playStab = (time, duration, volScale = 1) => {
      if (time >= t0 + chordDur - 0.02) return
      freqs.forEach(({ freq }, si) => {
        const midi = freqToMidi(freq)
        const t = time + si * 0.01
        const res = sampledNote(ctx, 'guitar', midi, t, duration, gVol * volScale, 0.25)
        if (res) nodes.push(res)
        else nodes.push(sineNote(ctx, freq, t, duration, gVol * volScale * 0.7))
      })
    }
    playStab(t0, beat * 0.65, 1.0)
    playStab(t0 + swingOffset, beat * 0.45, 0.8)
    playStab(t0 + 3.0 * beat, beat * 0.75, 0.9)
  }

  // ── Piano ──
  if (isOn(mix, 'piano')) {
    const pVol = vol(mix, 'piano', 0.52)
    freqs.forEach(({ freq }) => {
      const midi = freqToMidi(freq)
      const res = sampledNote(ctx, 'piano', midi, t0, chordDur, pVol, 0.25)
      if (res) nodes.push(res)
      else nodes.push(sineNote(ctx, freq, t0, chordDur, pVol * 0.7))
    })
  }

  // ── Bass ──
  if (isOn(mix, 'bass')) {
    const bVol = vol(mix, 'bass', 0.65)
    const walkNote = (time, midiOffset, duration) => {
      if (time >= t0 + chordDur - 0.02) return
      const midi = baseMidi + midiOffset
      const res = sampledNote(ctx, 'bass', midi, time, duration, bVol, 0.25)
      if (res) nodes.push(res)
      else nodes.push(sineNote(ctx, noteToHz(CHROMATIC[midi % 12], Math.floor(midi / 12) - 1), time, duration, bVol * 0.7))
    }
    const thirdOffset = isMinor ? 3 : 4
    walkNote(t0, 0, beat * 0.9)
    walkNote(t0 + beat, thirdOffset, beat * 0.9)
    walkNote(t0 + 2 * beat, 7, beat * 0.9)
    walkNote(t0 + 3 * beat, 11, beat * 0.9)
  }

  // ── Drums ──
  if (isOn(mix, 'drums')) {
    const dVol = vol(mix, 'drums', 0.55)
    
    // Completely disable harsh crash. Replace with a subtle ride tap.
    // Structural boundaries (every 4th bar) get a stronger accent; non-accented bars get a softer velocity.
    if (measureIndex % 4 === 0) {
      nodes.push(scheduleRide(ctx, t0, dVol * 0.75))
    } else {
      nodes.push(scheduleRide(ctx, t0, dVol * 0.40))
    }

    const totalBeats = Math.floor(chordDur / beat)
    for (let b = 0; b < totalBeats; b++) {
      const t = t0 + b * beat
      if (t >= t0 + chordDur - 0.01) break
      if (b % 4 === 0 || b % 4 === 2) nodes.push(scheduleKick(ctx, t, dVol * 0.45))
      if (b % 4 === 1 || b % 4 === 3) nodes.push(...scheduleSnare(ctx, t, dVol * 0.5))
      nodes.push(scheduleHihat(ctx, t, dVol * 0.6))
      if (b % 2 === 1) nodes.push(scheduleHihat(ctx, t - beat * 0.33, dVol * 0.4))
    }
  }

  return nodes
}

/**
 * Neo-Soul Grooves:
 *   Guitar  — laid-back micro-delayed stabs
 *   Piano   — warm Rhodes chords
 *   Bass    — groovy syncopated line
 *   Drums   — hip-hop backbeat, soft ride tap instead of crash
 */
function scheduleNeosoulBlock(ctx, chord, mix, t0, chordDur, bpm, measureIndex) {
  const nodes = []
  const beat = 60 / bpm
  const eighth = beat / 2
  const freqs = guitarFrequencies(chord)
  const baseMidi = bassMidi(chord)

  // ── Guitar ──
  if (isOn(mix, 'guitar')) {
    const gVol = vol(mix, 'guitar', 0.65)
    const playStab = (time, duration, volScale = 1) => {
      if (time >= t0 + chordDur - 0.02) return
      freqs.forEach(({ freq }, si) => {
        const midi = freqToMidi(freq)
        const t = time + si * 0.012 + 0.015
        const res = sampledNote(ctx, 'guitar', midi, t, duration, gVol * volScale, 0.25)
        if (res) nodes.push(res)
        else nodes.push(sineNote(ctx, freq, t, duration, gVol * volScale * 0.7))
      })
    }
    playStab(t0, beat * 1.2, 1.0)
    playStab(t0 + 1.75 * beat, beat * 0.6, 0.8)
    playStab(t0 + 3.0 * beat, beat * 0.8, 0.9)
  }

  // ── Piano ──
  if (isOn(mix, 'piano')) {
    const pVol = vol(mix, 'piano', 0.55)
    freqs.forEach(({ freq }) => {
      const midi = freqToMidi(freq)
      const res = sampledNote(ctx, 'piano', midi, t0, chordDur, pVol, 0.25)
      if (res) nodes.push(res)
      else nodes.push(sineNote(ctx, freq, t0, chordDur, pVol * 0.7))
    })
  }

  // ── Bass ──
  if (isOn(mix, 'bass')) {
    const bVol = vol(mix, 'bass', 0.68)
    const playBass = (time, duration, midiOffset = 0) => {
      if (time >= t0 + chordDur - 0.02) return
      const res = sampledNote(ctx, 'bass', baseMidi + midiOffset, time, duration, bVol, 0.25)
      if (res) nodes.push(res)
      else nodes.push(sineNote(ctx, bassFrequency(chord) * 2 * Math.pow(2, midiOffset/12), time, duration, bVol * 0.7))
    }
    playBass(t0, beat * 0.88)
    playBass(t0 + 1.5 * beat, beat * 0.5, 7)
    playBass(t0 + 2.5 * beat, beat * 0.88, 12)
  }

  // ── Drums ──
  if (isOn(mix, 'drums')) {
    const dVol = vol(mix, 'drums', 0.58)
    
    // Completely disable harsh crash. Replace with a subtle ride tap.
    // Structural boundaries (every 4th bar) get a stronger accent; non-accented bars get a softer velocity.
    if (measureIndex % 4 === 0) {
      nodes.push(scheduleRide(ctx, t0, dVol * 0.75))
    } else {
      nodes.push(scheduleRide(ctx, t0, dVol * 0.40))
    }

    const totalBeats = Math.floor(chordDur / beat)
    for (let b = 0; b < totalBeats; b++) {
      const t = t0 + b * beat
      if (t >= t0 + chordDur - 0.01) break
      if (b % 4 === 0) nodes.push(scheduleKick(ctx, t, dVol * 0.95))
      if (b % 4 === 1) nodes.push(scheduleKick(ctx, t + eighth, dVol * 0.75))
      if (b % 4 === 1 || b % 4 === 3) nodes.push(...scheduleSnare(ctx, t + 0.018, dVol * 0.82))
      nodes.push(scheduleHihat(ctx, t, dVol * 0.65))
      nodes.push(scheduleHihat(ctx, t + eighth * 0.5, dVol * 0.4))
      nodes.push(scheduleHihat(ctx, t + eighth, dVol * 0.55))
      nodes.push(scheduleHihat(ctx, t + eighth * 1.5, dVol * 0.38))
    }
  }

  return nodes
}

/**
 * Blues 12-Bar Shuffles:
 *   Guitar  — shuffle triplet chugs
 *   Piano   — comping chords
 *   Bass    — walking blues line
 *   Drums   — swing triplet hi-hat, soft crash accent on 12-bar loop boundary
 */
function scheduleBluesBlock(ctx, chord, mix, t0, chordDur, bpm, measureIndex) {
  const nodes = []
  const beat = 60 / bpm
  const tripletFirst = beat * 0.66
  const freqs = guitarFrequencies(chord)
  const baseMidi = bassMidi(chord)

  const isMinor = chord.name.includes('m') || chord.category?.includes('minor') || chord.category?.includes('min')

  // ── Guitar ──
  if (isOn(mix, 'guitar')) {
    const gVol = vol(mix, 'guitar', 0.72)
    const playChug = (time, duration, volScale = 1) => {
      if (time >= t0 + chordDur - 0.02) return
      freqs.forEach(({ freq }, si) => {
        const midi = freqToMidi(freq)
        const t = time + si * 0.008
        const res = sampledNote(ctx, 'guitar', midi, t, duration, gVol * volScale, 0.25)
        if (res) nodes.push(res)
        else nodes.push(sineNote(ctx, freq, t, duration, gVol * volScale * 0.7))
      })
    }
    const totalBeats = Math.floor(chordDur / beat)
    for (let b = 0; b < totalBeats; b++) {
      const t = t0 + b * beat
      playChug(t, beat * 0.4, 1.0)
      playChug(t + tripletFirst, beat * 0.25, 0.72)
    }
  }

  // ── Piano ──
  if (isOn(mix, 'piano')) {
    const pVol = vol(mix, 'piano', 0.54)
    const playComp = (time, duration) => {
      if (time >= t0 + chordDur - 0.02) return
      freqs.forEach(({ freq }) => {
        const midi = freqToMidi(freq)
        const res = sampledNote(ctx, 'piano', midi, time, duration, pVol, 0.25)
        if (res) nodes.push(res)
        else nodes.push(sineNote(ctx, freq, time, duration, pVol * 0.7))
      })
    }
    playComp(t0, beat * 1.5)
    playComp(t0 + 2 * beat, beat * 1.5)
  }

  // ── Bass ──
  if (isOn(mix, 'bass')) {
    const bVol = vol(mix, 'bass', 0.68)
    const playBass = (time, midiOffset, duration) => {
      if (time >= t0 + chordDur - 0.02) return
      const res = sampledNote(ctx, 'bass', baseMidi + midiOffset, time, duration, bVol, 0.25)
      if (res) nodes.push(res)
      else nodes.push(sineNote(ctx, bassFrequency(chord) * 2 * Math.pow(2, midiOffset/12), time, duration, bVol * 0.7))
    }
    const thirdOffset = isMinor ? 3 : 4
    playBass(t0, 0, beat * 0.9)
    playBass(t0 + beat, thirdOffset, beat * 0.9)
    playBass(t0 + 2 * beat, 7, beat * 0.9)
    playBass(t0 + 3 * beat, 9, beat * 0.9)
  }

  // ── Drums ──
  if (isOn(mix, 'drums')) {
    const dVol = vol(mix, 'drums', 0.60)
    // Low-volume crash triggers ONLY on beat 1 of 12-bar loop sequence
    if (measureIndex % 12 === 0) {
      nodes.push(scheduleCrash(ctx, t0, dVol * 0.35))
    }

    const totalBeats = Math.floor(chordDur / beat)
    for (let b = 0; b < totalBeats; b++) {
      const t = t0 + b * beat
      if (t >= t0 + chordDur - 0.01) break
      if (b % 4 === 0 || b % 4 === 2) nodes.push(scheduleKick(ctx, t, dVol * 0.92))
      if (b % 4 === 1 || b % 4 === 3) nodes.push(...scheduleSnare(ctx, t, dVol * 0.85))
      nodes.push(scheduleHihat(ctx, t, dVol * 0.65))
      nodes.push(scheduleHihat(ctx, t + tripletFirst, dVol * 0.42))
    }
  }

  return nodes
}

// ── Main style dispatcher ─────────────────────────────────────────────────────

/**
 * Schedule one chord block for all enabled channels in the given rhythmic style.
 *
 * @param {AudioContext} ctx
 * @param {Object}  chord        - chord object from CHORDS dataset
 * @param {string}  style        - 'pop' | 'arpeggio' | 'sustained' | 'jazz' | 'neosoul' | 'blues'
 * @param {Object}  mix          - { guitar, piano, bass, drums } channel mix
 * @param {number}  startTime    - ctx.currentTime offset
 * @param {number}  chordDuration - total duration for this chord slot (seconds)
 * @param {number}  bpm          - current BPM
 * @param {number}  measureIndex - current chord loop measure index
 * @returns {Object[]}           - flat array of node groups
 */
export function scheduleStyleBlock(ctx, chord, style, mix, startTime, chordDuration, bpm, measureIndex = 0) {
  const dur = Math.max(0.12, chordDuration)

  switch (style) {
    case 'arpeggio':  return scheduleArpeggioBlock(ctx, chord, mix, startTime, dur, bpm, measureIndex)
    case 'sustained': return scheduleSustainedBlock(ctx, chord, mix, startTime, dur, bpm, measureIndex)
    case 'jazz':      return scheduleJazzBlock(ctx, chord, mix, startTime, dur, bpm, measureIndex)
    case 'neosoul':   return scheduleNeosoulBlock(ctx, chord, mix, startTime, dur, bpm, measureIndex)
    case 'blues':     return scheduleBluesBlock(ctx, chord, mix, startTime, dur, bpm, measureIndex)
    case 'pop':
    default:          return schedulePopBlock(ctx, chord, mix, startTime, dur, bpm, measureIndex)
  }
}

// ── Node cleanup ─────────────────────────────────────────────────────────────

/**
 * Stop all node groups returned by scheduleStyleBlock.
 * Sampler nodes get a smooth 300ms fade; synth/osc nodes get hard-stopped.
 */
export function cleanupNodes(nodeGroups) {
  const ctx = getSamplerCtx()
  nodeGroups.forEach(group => {
    if (!group) return
    if (group.source && group.gain) {
      fadeOutAndStop(group.source, group.gain, ctx, 280)
      return
    }
    Object.values(group).forEach(node => {
      if (typeof node?.stop       === 'function') try { node.stop()       } catch (_) {}
      if (typeof node?.disconnect === 'function') try { node.disconnect() } catch (_) {}
    })
  })
}

// ── Legacy compat shim ────────────────────────────────────────────────────────

/**
 * Legacy: scheduleChordStrum — kept so any direct callers don't break.
 */
export function scheduleChordStrum(ctx, chord, instrument, startTime, duration) {
  const fakeMix = {
    guitar: { enabled: instrument === 'Guitar', volume: 0.7 },
    piano:  { enabled: instrument === 'Piano',  volume: 0.58 },
    bass:   { enabled: instrument === 'Bass',   volume: 0.68 },
    drums:  { enabled: false, volume: 0 },
  }
  return scheduleSustainedBlock(ctx, chord, fakeMix, startTime, duration, 90, 0)
}
