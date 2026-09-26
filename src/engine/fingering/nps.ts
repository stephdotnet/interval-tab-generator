import { enabledStrings, lowestFret } from '../instrument/fretboard'
import { spellDegree } from '../theory/spelling'
import { degreeOf } from '../theory/targets'
import type { FingeringContext, FingeringStrategy, FretNote, Position } from './types'
import { uniquePositions } from './windowCollector'

function targetPitches(ctx: FingeringContext, strings: number[], minFret: number): number[] {
  const { board, targets } = ctx
  const pitches: number[] = []
  const low = board.tuning[strings[0]] + minFret
  const high = board.tuning[strings[strings.length - 1]] + board.maxFret
  for (let midi = low; midi <= high; midi++) {
    if (degreeOf(targets, midi)) {
      pitches.push(midi)
    }
  }
  return pitches
}

/**
 * Walks up the strings from a starting pitch, putting the next N target pitches on each string.
 * A string gets fewer notes when the next pitch would exceed the maximum span on it.
 */
function walk(ctx: FingeringContext, strings: number[], pitches: number[], start: number, minFret: number): FretNote[] {
  const { board, targets, options } = ctx
  const notes: FretNote[] = []
  const note = (string: number, midi: number): FretNote => ({
    string,
    fret: midi - board.tuning[string],
    midi,
    degree: degreeOf(targets, midi)!,
    ext: false,
  })
  let i = start
  let previous: number | null = null
  for (const string of strings) {
    const onString: FretNote[] = []
    while (onString.length < options.npsPerString && i < pitches.length) {
      const fret = pitches[i] - board.tuning[string]
      if (fret > board.maxFret || (onString.length > 0 && fret - onString[0].fret > options.npsMaxSpan)) {
        break
      }
      if (fret >= minFret) {
        onString.push(note(string, pitches[i]))
      } else if (previous !== null) {
        // Too low for this string: keep it on the previous one so the line stays complete
        notes.push(note(previous, pitches[i]))
      }
      i++
    }
    if (onString.length === 0) {
      // Nothing fits on this string (fret range): the next string may take the note lower on the neck
      continue
    }
    notes.push(...onString)
    previous = string
  }
  return notes
}

/** N notes per string, one pattern per starting note in the first octave of the lowest string. */
export const npsStrategy: FingeringStrategy = {
  id: 'nps',
  label: 'N notes par corde',

  unavailableReason: () => null,

  listPositions(ctx) {
    const { board, targets } = ctx
    const strings = enabledStrings(board)
    if (strings.length === 0) {
      return []
    }
    const minFret = board.allowOpen && board.minFret === 0 ? 0 : lowestFret(board)
    const pitches = targetPitches(ctx, strings, minFret)
    const positions: Position[] = []
    pitches.forEach((midi, index) => {
      const fret = midi - board.tuning[strings[0]]
      if (fret >= minFret + 12) {
        return
      }
      const notes = walk(ctx, strings, pitches, index, minFret)
      const frets = notes.map((n) => n.fret)
      const fretted = frets.filter((f) => f > 0)
      positions.push({
        id: 'nps-' + midi,
        label: 'Départ ' + spellDegree(targets.tonic, notes[0].degree) + ' case ' + fret,
        lo: Math.min(...frets),
        hi: Math.max(...frets),
        center: fretted.length ? fretted.reduce((a, b) => a + b, 0) / fretted.length : 0,
        notes,
        candidates: notes,
      })
    })
    return uniquePositions(positions)
  },
}
