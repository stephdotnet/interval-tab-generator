import type { FretNote, Position } from '../fingering/types'
import { applyPattern } from '../patterns'
import type { PatternOptions, PitchItem } from '../patterns/types'
import type { Degree } from '../theory/degrees'
import { bestPath } from './bestPath'
import type { CostWeights } from './cost'

export const NAVIGATION_MODES = ['single', 'all', 'bestPath'] as const
export type NavigationMode = (typeof NAVIGATION_MODES)[number]

export const GAP_MODES = ['none', 'newBar', 'restBar'] as const
export type GapMode = (typeof GAP_MODES)[number]

export interface NavigationOptions {
  mode: NavigationMode
  positionIndex: number
  /** Separation between positions in "all" mode. */
  gap: GapMode
  weights: CostWeights
}

export type Step = { kind: 'note'; note: FretNote; position: Position } | { kind: 'gap' }

export function clampIndex(index: number, length: number): number {
  return Math.min(Math.max(0, index), Math.max(0, length - 1))
}

function positionSteps(position: Position, pattern: PatternOptions, reference: Degree | null): Step[] {
  return applyPattern(position.notes, pattern, reference).map((note) => ({ kind: 'note', note, position }))
}

/** All distinct pitches reachable in the positions, sorted, with their degree. */
function pitchPool(positions: readonly Position[]): PitchItem[] {
  const byMidi = new Map<number, PitchItem>()
  positions.forEach((p) => p.notes.forEach((n) => byMidi.set(n.midi, { midi: n.midi, degree: n.degree })))
  return [...byMidi.values()].sort((a, b) => a.midi - b.midi)
}

export function navigate(
  positions: readonly Position[],
  options: NavigationOptions,
  pattern: PatternOptions,
  reference: Degree | null,
): Step[] {
  if (positions.length === 0) {
    return []
  }
  switch (options.mode) {
    case 'single':
      return positionSteps(positions[clampIndex(options.positionIndex, positions.length)], pattern, reference)
    case 'all':
      return positions.flatMap((position, i) => [
        ...(i > 0 && options.gap !== 'none' ? [{ kind: 'gap' } as const] : []),
        ...positionSteps(position, pattern, reference),
      ])
    case 'bestPath': {
      const sequence = applyPattern(pitchPool(positions), pattern, reference)
      return bestPath(sequence, positions, options.weights).map(({ note, position }) => ({
        kind: 'note',
        note,
        position,
      }))
    }
  }
}
