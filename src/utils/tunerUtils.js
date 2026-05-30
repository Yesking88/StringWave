// ─── Standard guitar tuning reference ────────────────────────────────────────
// String 6 = lowest (thick), String 1 = highest (thin)
export const STANDARD_TUNING = [
  { string: 6, note: 'E', octave: 2, frequency: 82.41  },
  { string: 5, note: 'A', octave: 2, frequency: 110.0  },
  { string: 4, note: 'D', octave: 3, frequency: 146.83 },
  { string: 3, note: 'G', octave: 3, frequency: 196.0  },
  { string: 2, note: 'B', octave: 3, frequency: 246.94 },
  { string: 1, note: 'E', octave: 4, frequency: 329.63 },
]

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const A4_FREQ = 440
const A4_MIDI = 69

// ─── Core pitch math ──────────────────────────────────────────────────────────

/** Convert a frequency (Hz) to the nearest MIDI note number. */
export function frequencyToMidi(frequency) {
  return Math.round(12 * Math.log2(frequency / A4_FREQ) + A4_MIDI)
}

/** Convert a MIDI note number to its exact frequency (Hz). */
export function midiToFrequency(midi) {
  return A4_FREQ * Math.pow(2, (midi - A4_MIDI) / 12)
}

/**
 * Convert a MIDI note number to a note name + octave.
 * @returns {{ note: string, octave: number, fullName: string }}
 */
export function midiToNote(midi) {
  const note   = NOTE_NAMES[((midi % 12) + 12) % 12]
  const octave = Math.floor(midi / 12) - 1
  return { note, octave, fullName: `${note}${octave}` }
}

/**
 * How many cents sharp (+) or flat (-) is a frequency from its nearest note.
 * Clamped to [-50, +50].
 */
export function getCentsOff(frequency) {
  const midi       = frequencyToMidi(frequency)
  const targetFreq = midiToFrequency(midi)
  const raw        = 1200 * Math.log2(frequency / targetFreq)
  return Math.max(-50, Math.min(50, Math.round(raw)))
}

/**
 * Qualitative tuning status from a cents offset.
 * @returns {'in-tune' | 'close' | 'sharp' | 'flat'}
 */
export function getTuningStatus(cents) {
  const abs = Math.abs(cents)
  if (abs <= 3)  return 'in-tune'
  if (abs <= 12) return 'close'
  return cents > 0 ? 'sharp' : 'flat'
}

// ─── Closest-string matching ──────────────────────────────────────────────────

/**
 * Find the guitar string closest to a detected frequency.
 * Compare in cents space for octave-uniform distance.
 */
function findClosestString(frequency, activeTuning = STANDARD_TUNING) {
  const candidates = [frequency]
  if (frequency / 2 >= 60) candidates.push(frequency / 2)

  let bestString = activeTuning[0]
  let bestCents  = Infinity

  for (const f of candidates) {
    for (const s of activeTuning) {
      const diff = Math.abs(1200 * Math.log2(f / s.frequency))
      if (diff < bestCents) {
        bestCents  = diff
        bestString = s
      }
    }
  }

  return bestString
}

// ─── Main analysis entry point ────────────────────────────────────────────────

/**
 * Given a smoothed detected frequency, return the full tuner reading.
 * @returns {TunerReading | null}
 */
export function analyzeFrequency(frequency, activeTuning = STANDARD_TUNING) {
  if (!frequency || frequency <= 0) return null

  const midi       = frequencyToMidi(frequency)
  const { note, octave, fullName } = midiToNote(midi)
  const cents      = getCentsOff(frequency)
  const status     = getTuningStatus(cents)
  const targetFreq = midiToFrequency(midi)

  return {
    note,
    octave,
    fullName,
    frequency:       Math.round(frequency * 10) / 10,
    targetFrequency: Math.round(targetFreq * 10) / 10,
    cents,
    status,
    closestString: findClosestString(frequency, activeTuning),
  }
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

/**
 * Map cents [-50, +50] to a needle rotation in degrees [-45, +45].
 * Applies a mild ease-in curve so small deviations near centre
 * look less twitchy.
 */
export function centsToNeedleAngle(cents) {
  const clamped    = Math.max(-50, Math.min(50, cents))
  const normalised = clamped / 50           // -1 to +1
  // Mild cubic ease — reduces visual jitter for small deviations
  const eased      = normalised * (Math.abs(normalised) * 0.3 + 0.7)
  return eased * 45
}
