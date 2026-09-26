export interface Fretboard {
  /** MIDI of each open string, lowest string first (index 0). */
  tuning: number[]
  minFret: number
  maxFret: number
  allowOpen: boolean
  disabledStrings: number[]
}

export interface Location {
  string: number
  fret: number
}

export function isStringEnabled(board: Fretboard, string: number): boolean {
  return !board.disabledStrings.includes(string)
}

export function enabledStrings(board: Fretboard): number[] {
  return board.tuning.map((_, s) => s).filter((s) => isStringEnabled(board, s))
}

/** Lowest fret a finger can play, open strings aside. */
export function lowestFret(board: Fretboard): number {
  return Math.max(1, board.minFret)
}

export function isFretPlayable(board: Fretboard, fret: number): boolean {
  if (fret === 0) {
    return board.allowOpen && board.minFret === 0
  }
  return fret >= board.minFret && fret <= board.maxFret
}

/** All playable locations of a MIDI pitch. */
export function locationsOf(board: Fretboard, midi: number): Location[] {
  return enabledStrings(board)
    .map((string) => ({ string, fret: midi - board.tuning[string] }))
    .filter((l) => isFretPlayable(board, l.fret))
}
