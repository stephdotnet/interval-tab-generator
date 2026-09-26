import { parseNote } from '../theory/pitch'

/** Parses note names (lowest string first) into MIDI numbers, null if any name is invalid. */
export function parseTuning(notes: readonly string[]): number[] | null {
  const midis = notes.map(parseNote)
  return midis.every((m): m is number => m !== null) ? midis : null
}

const STANDARD_TOP = [5, 5, 5, 4, 5]

/**
 * Tells whether the tuning follows the standard guitar intervals (E A D G B E, transposed or not),
 * extra low strings being tuned in fourths. Returns the number of extra low strings, or null.
 */
export function standardOffset(tuning: readonly number[]): number | null {
  if (tuning.length < 6) {
    return null
  }
  const intervals = tuning.slice(1).map((m, i) => m - tuning[i])
  const extra = tuning.length - 6
  const top = intervals.slice(extra)
  const low = intervals.slice(0, extra)
  const matches = top.every((v, i) => v === STANDARD_TOP[i]) && low.every((v) => v === 5)
  return matches ? extra : null
}
