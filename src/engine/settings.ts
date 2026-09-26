import type { LabelMode, NotationMode } from './export/alphatex'
import type { FingeringOptions } from './fingering/types'
import { findInstrument } from './instrument/presets'
import { COST_PRESETS, type CostPreset, type CostWeights } from './navigation/cost'
import type { GapMode, NavigationMode } from './navigation/navigate'
import type { PatternOptions } from './patterns/types'
import type { RhythmOptions } from './rhythm/rhythm'
import type { Degree } from './theory/degrees'
import type { Tonic } from './theory/spelling'

export const CUSTOM_TUNING = 'custom'
export const MAX_FRET = 24

export interface InstrumentSettings {
  presetId: string
  /** Preset tuning id, or CUSTOM_TUNING. */
  tuningId: string
  /** Note names, lowest string first. */
  tuning: string[]
  minFret: number
  maxFret: number
  allowOpen: boolean
  disabledStrings: number[]
  program: number
}

export interface NavigationSettings {
  mode: NavigationMode
  positionIndex: number
  gap: GapMode
  costPreset: CostPreset | 'custom'
  /** Used when costPreset is 'custom'. */
  weights: CostWeights
}

export interface DisplaySettings {
  labels: LabelMode
  notation: NotationMode
}

export interface PlayerSettings {
  loop: boolean
  metronome: boolean
  countIn: boolean
  ramp: boolean
  /** BPM added at each step of the ramp. */
  rampStep: number
  /** Loops played before each step. */
  rampEvery: number
  rampMax: number
}

export interface Settings {
  tonic: Tonic
  degrees: Degree[]
  instrument: InstrumentSettings
  fingering: FingeringOptions
  navigation: NavigationSettings
  pattern: PatternOptions
  rhythm: RhythmOptions
  display: DisplaySettings
  player: PlayerSettings
}

export const DEFAULT_SETTINGS: Settings = {
  tonic: 'C',
  degrees: ['1', '2'],
  instrument: {
    presetId: 'guitar6',
    tuningId: 'standard',
    tuning: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    minFret: 0,
    maxFret: 15,
    allowOpen: true,
    disabledStrings: [],
    program: 25,
  },
  fingering: {
    system: 'box',
    boxWidth: 4,
    extLow: true,
    extHigh: true,
    cagedShapes: ['C', 'A', 'G', 'E', 'D'],
    npsPerString: 3,
    npsMaxSpan: 5,
  },
  navigation: {
    mode: 'single',
    positionIndex: 0,
    gap: 'newBar',
    costPreset: 'diagonal',
    weights: COST_PRESETS.diagonal.weights,
  },
  pattern: {
    type: 'ascDesc',
    repeats: 1,
    fromRoot: false,
    direction: 'upDown',
    repeatTurn: false,
    motif: '0 1 2',
    step: 1,
    randomCount: 16,
    seed: 1,
    noRepeat: true,
    maxLeap: 0,
    pairOrder: 'refFirst',
    pairPlacement: 'above',
  },
  rhythm: { subdivision: '8', tsNum: 4, tsDen: 4, tempo: 80 },
  display: { labels: 'degree', notation: 'tab' },
  player: { loop: true, metronome: false, countIn: true, ramp: false, rampStep: 5, rampEvery: 2, rampMax: 160 },
}

export function effectiveWeights(navigation: NavigationSettings): CostWeights {
  return navigation.costPreset === 'custom' ? navigation.weights : COST_PRESETS[navigation.costPreset].weights
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** Fixes values that depend on each other (fret range, strings of the instrument...). */
export function sanitizeSettings(s: Settings): Settings {
  const strings = s.instrument.tuning.length
  const maxFret = clamp(s.instrument.maxFret, 4, MAX_FRET)
  const minFret = clamp(s.instrument.minFret, 0, maxFret - 3)
  return {
    ...s,
    instrument: {
      ...s.instrument,
      presetId: findInstrument(s.instrument.presetId) ? s.instrument.presetId : DEFAULT_SETTINGS.instrument.presetId,
      minFret,
      maxFret,
      disabledStrings: s.instrument.disabledStrings.filter((i) => i >= 0 && i < strings),
    },
    fingering: {
      ...s.fingering,
      boxWidth: clamp(s.fingering.boxWidth, 2, 6),
      npsPerString: clamp(s.fingering.npsPerString, 1, 5),
      npsMaxSpan: clamp(s.fingering.npsMaxSpan, 2, 8),
    },
    rhythm: { ...s.rhythm, tempo: clamp(s.rhythm.tempo, 20, 300), tsNum: clamp(s.rhythm.tsNum, 1, 12) },
  }
}
