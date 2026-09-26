export interface CostWeights {
  /** Per fret of hand displacement between two positions. */
  shift: number
  /** Per squared fret of displacement: favors several small shifts over one big jump. */
  jump: number
  /** Flat cost of leaving the current position. */
  positionChange: number
  /** Flat cost of moving to another string. */
  stringChange: number
  /** Per string skipped when jumping over strings. */
  stringSkip: number
  /** Going back to a lower string while the melody goes up (or the opposite). */
  backtrack: number
  /** Note played with a finger stretch. */
  extension: number
  /** Open string (negative to favor them). */
  open: number
  /** Per fret, to prefer lower positions when all else is equal. */
  highFret: number
  /** Consecutive notes allowed on one string before `runPenalty` applies (0 = no limit). */
  maxRun: number
  runPenalty: number
}

export const COST_PRESETS = {
  stay: {
    label: 'Rester en position',
    weights: { shift: 2, jump: 0, positionChange: 8, stringChange: 0, stringSkip: 2, backtrack: 1, extension: 1, open: 0, highFret: 0.02, maxRun: 0, runPenalty: 0 },
  },
  diagonal: {
    label: 'Diagonale (petits glissements)',
    weights: { shift: 0.2, jump: 0.8, positionChange: 1, stringChange: 0.5, stringSkip: 1.5, backtrack: 3, extension: 1, open: 0, highFret: 0.02, maxRun: 4, runPenalty: 3 },
  },
  slide: {
    label: 'Glisser le long du manche',
    weights: { shift: 0.3, jump: 0, positionChange: 0.5, stringChange: 3, stringSkip: 3, backtrack: 0, extension: 0.5, open: 0, highFret: 0.01, maxRun: 0, runPenalty: 0 },
  },
} satisfies Record<string, { label: string; weights: CostWeights }>

export type CostPreset = keyof typeof COST_PRESETS
export const COST_PRESET_IDS = Object.keys(COST_PRESETS) as CostPreset[]
