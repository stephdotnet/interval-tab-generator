export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
export type Letter = (typeof LETTERS)[number]

export const LETTER_PC: Record<Letter, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export function pitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12
}

export function accidental(offset: number): string {
  return offset > 0 ? '#'.repeat(offset) : 'b'.repeat(-offset)
}

/** Parses a note name with octave ("E2", "Eb4", "F#3") into a MIDI number (C4 = 60). */
export function parseNote(name: string): number | null {
  const match = /^([A-Ga-g])(#{1,2}|b{1,2})?(-?\d)$/.exec(name.trim())
  if (!match) {
    return null
  }
  const letter = match[1].toUpperCase() as Letter
  const acc = match[2] ?? ''
  const offset = acc.startsWith('#') ? acc.length : -acc.length
  return (Number(match[3]) + 1) * 12 + LETTER_PC[letter] + offset
}

/** Sharp-based name with octave, used for tunings and alphaTex. */
export function midiToName(midi: number): string {
  return SHARP_NAMES[pitchClass(midi)] + (Math.floor(midi / 12) - 1)
}
