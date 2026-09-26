import type { FretNote, Position } from '../fingering/types'
import type { CostWeights } from './cost'

export interface PlacedNote {
  note: FretNote
  position: Position
}

interface State {
  placed: PlacedNote
  /** Consecutive notes on the same string, capped. */
  run: number
}

function noteCost(note: FretNote, w: CostWeights): number {
  return (note.ext ? w.extension : 0) + (note.fret === 0 ? w.open : 0) + w.highFret * note.fret
}

function moveCost(from: PlacedNote, to: PlacedNote, w: CostWeights): number {
  const stringMove = to.note.string - from.note.string
  const stringDelta = Math.abs(stringMove)
  const distance = Math.abs(to.position.center - from.position.center)
  const positionCost = from.position === to.position ? 0 : w.positionChange + w.shift * distance + w.jump * distance ** 2
  const backtracks = stringMove * (to.note.midi - from.note.midi) < 0
  return (
    positionCost +
    (stringDelta > 0 ? w.stringChange : 0) +
    w.stringSkip * Math.max(0, stringDelta - 1) +
    (backtracks ? w.backtrack : 0)
  )
}

/**
 * Chooses, for each pitch of the sequence, a position and a location in that position so that the
 * total cost (hand shifts, string changes, stretches, long runs on one string...) is minimal.
 * Viterbi over (position, note, run length) states. Pitches that no position contains are dropped.
 */
export function bestPath(sequence: readonly { midi: number }[], positions: readonly Position[], w: CostWeights): PlacedNote[] {
  const cap = w.maxRun > 0 ? w.maxRun + 1 : 1
  const runCost = (run: number) => (w.maxRun > 0 && run > w.maxRun ? w.runPenalty : 0)
  const layers: State[][] = sequence
    .map(({ midi }) =>
      positions.flatMap((position) =>
        position.candidates
          .filter((note) => note.midi === midi)
          .flatMap((note) => Array.from({ length: cap }, (_, i) => ({ placed: { note, position }, run: i + 1 }))),
      ),
    )
    .filter((states) => states.length > 0)
  if (layers.length === 0) {
    return []
  }

  let costs = layers[0].map((s) => (s.run === 1 ? noteCost(s.placed.note, w) : Infinity))
  const back: number[][] = [layers[0].map(() => -1)]
  for (let i = 1; i < layers.length; i++) {
    const next = layers[i].map(() => ({ cost: Infinity, from: -1 }))
    layers[i - 1].forEach((previous, k) => {
      if (costs[k] === Infinity) {
        return
      }
      layers[i].forEach((state, j) => {
        const sameString = state.placed.note.string === previous.placed.note.string
        if (state.run !== (sameString ? Math.min(previous.run + 1, cap) : 1)) {
          return
        }
        const cost = costs[k] + moveCost(previous.placed, state.placed, w)
        if (cost < next[j].cost) {
          next[j] = { cost, from: k }
        }
      })
    })
    costs = next.map((n, j) => n.cost + noteCost(layers[i][j].placed.note, w) + runCost(layers[i][j].run))
    back.push(next.map((n) => n.from))
  }

  let index = costs.indexOf(Math.min(...costs))
  const path: PlacedNote[] = []
  for (let i = layers.length - 1; i >= 0; i--) {
    path.push(layers[i][index].placed)
    index = back[i][index]
  }
  return path.reverse()
}
