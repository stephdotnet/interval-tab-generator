import type { Fretboard } from '../instrument/fretboard'
import type { Degree } from '../theory/degrees'
import type { TargetSet } from '../theory/targets'

export interface FretNote {
  string: number
  fret: number
  midi: number
  degree: Degree
  /** Played with a finger stretch outside the core window. */
  ext: boolean
  /** Enclosure note leading to a target, not one of the chosen degrees. */
  approach?: boolean
}

export interface Position {
  id: string
  label: string
  /** Window bounds (for N notes per string: lowest and highest fret used). */
  lo: number
  hi: number
  /** Hand center, used to measure shifts between positions. */
  center: number
  /** One location per pitch, sorted by pitch. */
  notes: FretNote[]
  /** Every location reachable in the position (a pitch may appear on two strings), for the best path. */
  candidates: FretNote[]
}

export const FINGERING_SYSTEMS = ['box', 'caged', 'nps'] as const
export type FingeringSystem = (typeof FINGERING_SYSTEMS)[number]

export const CAGED_SHAPES = ['C', 'A', 'G', 'E', 'D'] as const
export type CagedShape = (typeof CAGED_SHAPES)[number]

export interface FingeringOptions {
  system: FingeringSystem
  boxWidth: number
  extLow: boolean
  extHigh: boolean
  cagedShapes: CagedShape[]
  npsPerString: number
  npsMaxSpan: number
}

export interface FingeringContext {
  board: Fretboard
  targets: TargetSet
  options: FingeringOptions
}

export interface FingeringStrategy {
  id: FingeringSystem
  label: string
  /** Null when the system can be used, otherwise the reason why it cannot. */
  unavailableReason(ctx: FingeringContext): string | null
  listPositions(ctx: FingeringContext): Position[]
}
