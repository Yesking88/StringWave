/**
 * StringWave — Scales Data & Logic Module
 *
 * This module defines the core musical logic for guitar scales.
 * It provides interval formulas and calculations for root keys and pitches.
 */

export const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const OPEN_STRINGS = ['E', 'A', 'D', 'G', 'B', 'E'];

export const OPEN_STRING_MIDIS = [40, 45, 50, 55, 59, 64];

export const SCALE_FORMULAS = {
  major: [2, 2, 1, 2, 2, 2, 1],
  natural_minor: [2, 1, 2, 2, 1, 2, 2],
  major_pentatonic: [2, 2, 3, 2, 3],
  minor_pentatonic: [3, 2, 2, 3, 2],
  blues: [3, 2, 1, 1, 3, 2],
  dorian: [2, 1, 2, 2, 2, 1, 2],
  phrygian: [1, 2, 2, 2, 1, 2, 2],
  lydian: [2, 2, 2, 1, 2, 2, 1],
  mixolydian: [2, 2, 1, 2, 2, 1, 2],
  locrian: [1, 2, 2, 1, 2, 2, 2],
  harmonic_minor: [2, 1, 2, 2, 1, 3, 1],
  melodic_minor: [2, 1, 2, 2, 2, 2, 1],
  whole_tone: [2, 2, 2, 2, 2, 2],
};

export const SCALE_TYPES = [
  { id: 'major', label: 'Major' },
  { id: 'natural_minor', label: 'Natural Minor' },
  { id: 'major_pentatonic', label: 'Major Pentatonic' },
  { id: 'minor_pentatonic', label: 'Minor Pentatonic' },
  { id: 'blues', label: 'Blues Scale' },
  { id: 'dorian', label: 'Dorian Mode' },
  { id: 'phrygian', label: 'Phrygian Mode' },
  { id: 'lydian', label: 'Lydian Mode' },
  { id: 'mixolydian', label: 'Mixolydian Mode' },
  { id: 'locrian', label: 'Locrian Mode' },
  { id: 'harmonic_minor', label: 'Harmonic Minor' },
  { id: 'melodic_minor', label: 'Melodic Minor' },
  { id: 'whole_tone', label: 'Whole Tone Scale' },
];

/**
 * Returns an array of note names belonging to the specified scale.
 * E.g., getScaleNotes('C', 'major') -> ['C', 'D', 'E', 'F', 'G', 'A', 'B']
 *
 * @param {string} root - Root note (e.g. 'C', 'F#')
 * @param {string} scaleType - Scale identifier (e.g. 'major')
 * @returns {string[]} Note strings in the scale
 */
export function getScaleNotes(root, scaleType) {
  const formula = SCALE_FORMULAS[scaleType];
  if (!formula) return [];

  const rootIndex = CHROMATIC.indexOf(root);
  if (rootIndex === -1) return [];

  const scaleNotes = [root];
  let currentIndex = rootIndex;

  // Walk through the interval steps, except the final octave return step which completes the scale
  // Note: For pentatonic [3, 2, 2, 3, 2], there are 5 notes before repeating the root.
  // The sum of the steps in the formula equals 12 (one octave).
  for (let i = 0; i < formula.length - 1; i++) {
    currentIndex = (currentIndex + formula[i]) % 12;
    scaleNotes.push(CHROMATIC[currentIndex]);
  }

  return scaleNotes;
}

/**
 * Helper to retrieve the lowest MIDI pitch of a note class playable on a standard guitar (>= E2/40).
 * E.g., E -> 40, A -> 45, C -> 48
 *
 * @param {string} noteName
 * @returns {number} MIDI pitch
 */
export function getLowestMidiForNote(noteName) {
  const targetClass = CHROMATIC.indexOf(noteName);
  if (targetClass === -1) return 60; // Fallback to middle C

  for (let midi = 40; midi < 52; midi++) {
    if (midi % 12 === targetClass) {
      return midi;
    }
  }
  // If not found in the lowest octave range, search up to 64
  for (let midi = 52; midi < 64; midi++) {
    if (midi % 12 === targetClass) {
      return midi;
    }
  }
  return 60;
}

/**
 * Generates an ascending array of MIDI pitches for a given scale starting from its lowest root position.
 * Spans a single full octave (N + 1 notes).
 * E.g., getScaleMidiPitches('C', 'major') -> [48, 50, 52, 53, 55, 57, 59, 60]
 *
 * @param {string} root
 * @param {string} scaleType
 * @returns {number[]} MIDI pitches array
 */
export function getScaleMidiPitches(root, scaleType) {
  const startMidi = getLowestMidiForNote(root);
  const formula = SCALE_FORMULAS[scaleType];
  if (!formula) return [];

  const pitches = [startMidi];
  let currentMidi = startMidi;
  formula.forEach(step => {
    currentMidi += step;
    pitches.push(currentMidi);
  });

  return pitches;
}
