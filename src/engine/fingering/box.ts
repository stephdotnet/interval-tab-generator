import { lowestFret } from '../instrument/fretboard'
import type { FingeringStrategy, Position } from './types'
import { collectWindow, uniquePositions } from './windowCollector'

/** One finger per fret over `boxWidth` frets, one position per starting fret along the neck. */
export const boxStrategy: FingeringStrategy = {
  id: 'box',
  label: 'Box (un doigt par case)',

  unavailableReason: () => null,

  listPositions(ctx) {
    const { board, options } = ctx
    const width = options.boxWidth
    const positions: Position[] = []
    for (let lo = lowestFret(board); lo + width - 1 <= board.maxFret; lo++) {
      const hi = lo + width - 1
      positions.push({
        id: 'box-' + lo,
        label: 'Cases ' + lo + '-' + hi,
        lo,
        hi,
        center: (lo + hi) / 2,
        ...collectWindow(ctx, lo, hi),
      })
    }
    return uniquePositions(positions)
  },
}
