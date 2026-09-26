import { enabledStrings, isFretPlayable } from '../instrument/fretboard'
import { degreeOf } from '../theory/targets'
import type { FingeringContext, FretNote, Position } from './types'

export interface WindowNotes {
  /** One location per pitch: core frets win over stretches, then the lowest string wins. */
  notes: FretNote[]
  /** Every location of a target pitch in the window. */
  candidates: FretNote[]
}

/**
 * Collects the target notes reachable by a hand whose fingers cover frets [lo, hi],
 * plus one stretch fret on each enabled side. Open strings are included when the window
 * starts at the nut.
 */
export function collectWindow(ctx: FingeringContext, lo: number, hi: number): WindowNotes {
  const { board, targets, options } = ctx
  const from = lo - (options.extLow ? 1 : 0)
  const to = hi + (options.extHigh ? 1 : 0)
  const frets: number[] = []
  if (lo <= 1 && from > 0) {
    frets.push(0)
  }
  for (let fret = from; fret <= to; fret++) {
    frets.push(fret)
  }

  const candidates: FretNote[] = []
  const byPitch = new Map<number, FretNote>()
  for (const string of enabledStrings(board)) {
    for (const fret of frets) {
      if (!isFretPlayable(board, fret)) {
        continue
      }
      const midi = board.tuning[string] + fret
      const degree = degreeOf(targets, midi)
      if (!degree) {
        continue
      }
      const note: FretNote = { string, fret, midi, degree, ext: fret !== 0 && (fret < lo || fret > hi) }
      candidates.push(note)
      const current = byPitch.get(midi)
      if (!current || (current.ext && !note.ext)) {
        byPitch.set(midi, note)
      }
    }
  }
  return { notes: [...byPitch.values()].sort((a, b) => a.midi - b.midi), candidates }
}

export function notesKey(notes: readonly FretNote[]): string {
  return notes.map((n) => n.string + ':' + n.fret).join(',')
}

const stretchCount = (p: Position) => p.notes.filter((n) => n.ext).length

/**
 * Removes empty positions and merges positions with identical notes, keeping the one that
 * needs the fewest stretches (the window that fits the notes best).
 */
export function uniquePositions(positions: readonly Position[]): Position[] {
  const best = new Map<string, Position>()
  for (const position of positions) {
    const key = notesKey(position.notes)
    const current = best.get(key)
    if (position.notes.length > 0 && (!current || stretchCount(position) < stretchCount(current))) {
      best.set(key, position)
    }
  }
  const kept = new Set(best.values())
  return positions.filter((p) => kept.has(p))
}
