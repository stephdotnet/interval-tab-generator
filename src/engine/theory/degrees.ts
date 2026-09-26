/**
 * Chromatic degrees relative to the tonic. #2, #5 and bb7 share a pitch with b3, b6 and 6 but are
 * needed to spell some scales and chords right (7#9, augmented, diminished 7th, altered scale).
 */
export const DEGREES = ['1', 'b2', '2', '#2', 'b3', '3', '4', '#4', 'b5', '5', '#5', 'b6', '6', 'bb7', 'b7', '7'] as const
export type Degree = (typeof DEGREES)[number]

interface DegreeInfo {
  semitones: number
  /** Letter offset from the tonic (0 = same letter, 2 = third...). */
  step: number
}

export const DEGREE_INFO: Record<Degree, DegreeInfo> = {
  '1': { semitones: 0, step: 0 },
  b2: { semitones: 1, step: 1 },
  '2': { semitones: 2, step: 1 },
  '#2': { semitones: 3, step: 1 },
  b3: { semitones: 3, step: 2 },
  '3': { semitones: 4, step: 2 },
  '4': { semitones: 5, step: 3 },
  '#4': { semitones: 6, step: 3 },
  b5: { semitones: 6, step: 4 },
  '5': { semitones: 7, step: 4 },
  '#5': { semitones: 8, step: 4 },
  b6: { semitones: 8, step: 5 },
  '6': { semitones: 9, step: 5 },
  bb7: { semitones: 9, step: 6 },
  b7: { semitones: 10, step: 6 },
  '7': { semitones: 11, step: 6 },
}

export function isDegree(value: string): value is Degree {
  return (DEGREES as readonly string[]).includes(value)
}

/** Sorts degrees in scale order and removes duplicates. */
export function normalizeDegrees(degrees: readonly Degree[]): Degree[] {
  return DEGREES.filter((d) => degrees.includes(d))
}
