import type { Degree } from '../theory/degrees'

export interface PitchItem {
  midi: number
  degree: Degree
}

export const PATTERN_TYPES = ['ascDesc', 'sequence', 'random', 'pairs'] as const
export type PatternType = (typeof PATTERN_TYPES)[number]

export const DIRECTIONS = ['up', 'down', 'upDown', 'downUp'] as const
export type Direction = (typeof DIRECTIONS)[number]

export const PAIR_ORDERS = ['refFirst', 'degreeFirst'] as const
export type PairOrder = (typeof PAIR_ORDERS)[number]

export const PAIR_PLACEMENTS = ['above', 'below', 'both'] as const
export type PairPlacement = (typeof PAIR_PLACEMENTS)[number]

export interface PatternOptions {
  type: PatternType
  /** How many times the whole pattern is played. */
  repeats: number
  /** Start and end on the reference degree (the tonic when selected). */
  fromRoot: boolean
  /** Montée / descente and sequences. */
  direction: Direction
  /** Play the top (or bottom) note twice at the turn. */
  repeatTurn: boolean
  /** Sequence offsets, e.g. "0 1 2" for groups of 3, "0 2" for thirds. */
  motif: string
  step: number
  randomCount: number
  seed: number
  noRepeat: boolean
  /** Maximum distance between two random notes, counted in notes of the list (0 = no limit). */
  maxLeap: number
  pairOrder: PairOrder
  pairPlacement: PairPlacement
}
