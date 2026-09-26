import { standardOffset } from '../instrument/tuning'
import { pitchClass } from '../theory/pitch'
import { tonicPitchClass } from '../theory/spelling'
import type { CagedShape, FingeringStrategy, Position } from './types'
import { collectWindow, uniquePositions } from './windowCollector'

interface ShapeAnchor {
  /** String holding the root, in a standard 6-string layout (0 = low E). */
  rootString: number
  /** Window bounds relative to the root fret. */
  lo: number
  hi: number
}

// In C: C 0-3, A 2-5, G 5-8, E 7-10, D 10-13
const SHAPES: Record<CagedShape, ShapeAnchor> = {
  C: { rootString: 1, lo: -3, hi: 0 },
  A: { rootString: 1, lo: -1, hi: 2 },
  G: { rootString: 0, lo: -3, hi: 0 },
  E: { rootString: 0, lo: -1, hi: 2 },
  D: { rootString: 2, lo: 0, hi: 3 },
}

export const cagedStrategy: FingeringStrategy = {
  id: 'caged',
  label: 'CAGED',

  unavailableReason(ctx) {
    return standardOffset(ctx.board.tuning) === null
      ? 'CAGED demande un accordage standard (transposé ou non, 6 à 8 cordes).'
      : null
  },

  listPositions(ctx) {
    const { board, targets, options } = ctx
    const offset = standardOffset(board.tuning)
    if (offset === null) {
      return []
    }
    const positions: Position[] = []
    for (const shape of options.cagedShapes) {
      const anchor = SHAPES[shape]
      const rootString = anchor.rootString + offset
      const firstRoot = pitchClass(tonicPitchClass(targets.tonic) - board.tuning[rootString])
      for (let root = firstRoot; root + anchor.hi <= board.maxFret; root += 12) {
        const lo = Math.max(0, root + anchor.lo)
        const hi = root + anchor.hi
        if (lo < board.minFret) {
          continue
        }
        positions.push({
          id: 'caged-' + shape + '-' + root,
          label: 'Forme ' + shape + ' (cases ' + lo + '-' + hi + ')',
          lo,
          hi,
          center: (lo + hi) / 2,
          ...collectWindow(ctx, Math.max(1, lo), hi),
        })
      }
    }
    return uniquePositions(positions.sort((a, b) => a.lo - b.lo))
  },
}
