import { DEGREE_INFO, type Degree } from './degrees'
import { LETTER_PC, LETTERS, accidental, pitchClass, type Letter } from './pitch'

export const TONICS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const
export type Tonic = (typeof TONICS)[number]

export function isTonic(value: string): value is Tonic {
  return (TONICS as readonly string[]).includes(value)
}

export function tonicPitchClass(tonic: Tonic): number {
  const letter = tonic[0] as Letter
  const offset = tonic.length === 1 ? 0 : tonic[1] === '#' ? 1 : -1
  return pitchClass(LETTER_PC[letter] + offset)
}

/** Name of a degree in a key, e.g. b3 in C = "Eb", 7 in F# = "E#". */
export function spellDegree(tonic: Tonic, degree: Degree): string {
  const { semitones, step } = DEGREE_INFO[degree]
  const letter = LETTERS[(LETTERS.indexOf(tonic[0] as Letter) + step) % 7]
  const target = pitchClass(tonicPitchClass(tonic) + semitones)
  // Offset normalized to [-6, 5] so that the accidental is the smallest one
  const offset = ((target - LETTER_PC[letter] + 18) % 12) - 6
  return letter + accidental(offset)
}
