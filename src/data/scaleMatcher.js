/**
 * StringWave — Scale Matcher Utility
 *
 * Matches an active playing chord to a compatible scale for overlays.
 */

export function getCompatibleScale(chordName) {
  if (!chordName) return { key: 'C', scaleType: 'major_pentatonic', scale: 'Major Pentatonic' };

  // 1. Extract root key (e.g. C, C#, Db, etc.)
  const rootMatch = chordName.match(/^([A-G][#b]?)/);
  const key = rootMatch ? rootMatch[1] : 'C';
  const suffix = chordName.slice(key.length);

  let scaleType = 'major_pentatonic';
  let scale = 'Major Pentatonic';

  // 2. Parse suffix / quality mapping:
  // - Minor/Min7 -> Minor Pentatonic
  // - Dominant 7/9 -> Blues Scale
  // - Major/Maj7/Add9 -> Major Pentatonic
  const isMinor = /^(m|min|minor|m7|min7|m9|min9|m11)/i.test(suffix) && !/^maj/i.test(suffix);
  const isDominant = /^(7|9|11|13|dom|dominant)/.test(suffix);

  if (isMinor) {
    scaleType = 'minor_pentatonic';
    scale = 'Minor Pentatonic';
  } else if (isDominant) {
    scaleType = 'blues';
    scale = 'Blues Scale';
  } else {
    scaleType = 'major_pentatonic';
    scale = 'Major Pentatonic';
  }

  return { key, scaleType, scale };
}
