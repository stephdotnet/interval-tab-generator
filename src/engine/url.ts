import { APPROACH_SCALE_AUTO, APPROACH_SCALE_CHROMATIC, ENCLOSURE_DIRECTIONS, ENCLOSURE_TARGETS } from './enclosures'
import { LABEL_MODES, NOTATION_MODES } from './export/alphatex'
import { CAGED_SHAPES, FINGERING_SYSTEMS, type CagedShape } from './fingering/types'
import { parseNote } from './theory/pitch'
import { COST_PRESET_IDS, type CostWeights } from './navigation/cost'
import { GAP_MODES, NAVIGATION_MODES } from './navigation/navigate'
import { DIRECTIONS, PAIR_ORDERS, PAIR_PLACEMENTS, PATTERN_TYPES } from './patterns/types'
import { SUBDIVISIONS, TIME_DENOMINATORS } from './rhythm/rhythm'
import { DEFAULT_SETTINGS, MAX_FRET, sanitizeSettings, type Settings } from './settings'
import { isDegree, normalizeDegrees } from './theory/degrees'
import { LIBRARY_ENTRIES } from './theory/library'
import { TONICS } from './theory/spelling'

const VERSION = '1'

interface Field {
  key: string
  read: (s: Settings) => string
  /** Applies a raw value; invalid values are ignored so the default stays. */
  write: (s: Settings, raw: string) => void
}

function num(key: string, get: (s: Settings) => number, set: (s: Settings, v: number) => void, min: number, max: number): Field {
  return {
    key,
    read: (s) => String(get(s)),
    write: (s, raw) => {
      const value = Number(raw)
      if (raw !== '' && Number.isFinite(value)) {
        set(s, Math.min(max, Math.max(min, Math.round(value))))
      }
    },
  }
}

function bool(key: string, get: (s: Settings) => boolean, set: (s: Settings, v: boolean) => void): Field {
  return { key, read: (s) => (get(s) ? '1' : '0'), write: (s, raw) => set(s, raw === '1') }
}

function oneOf<T extends string | number>(
  key: string,
  values: readonly T[],
  get: (s: Settings) => T,
  set: (s: Settings, v: T) => void,
): Field {
  return {
    key,
    read: (s) => String(get(s)),
    write: (s, raw) => {
      const value = values.find((v) => String(v) === raw)
      if (value !== undefined) {
        set(s, value)
      }
    },
  }
}

function text(key: string, get: (s: Settings) => string, set: (s: Settings, v: string) => void): Field {
  return { key, read: get, write: (s, raw) => set(s, raw.slice(0, 64)) }
}

const WEIGHT_KEYS: (keyof CostWeights)[] = [
  'shift',
  'jump',
  'positionChange',
  'stringChange',
  'stringSkip',
  'backtrack',
  'extension',
  'open',
  'highFret',
  'maxRun',
  'runPenalty',
]

const FIELDS: Field[] = [
  oneOf('key', TONICS, (s) => s.tonic, (s, v) => (s.tonic = v)),
  {
    key: 'deg',
    read: (s) => s.degrees.join(','),
    write: (s, raw) => {
      s.degrees = normalizeDegrees(raw.split(',').filter(isDegree))
    },
  },
  // Instrument
  text('inst', (s) => s.instrument.presetId, (s, v) => (s.instrument.presetId = v)),
  text('tun', (s) => s.instrument.tuningId, (s, v) => (s.instrument.tuningId = v)),
  {
    key: 'notes',
    read: (s) => s.instrument.tuning.join(','),
    write: (s, raw) => {
      const notes = raw.split(',').filter((n) => parseNote(n) !== null)
      if (notes.length >= 4 && notes.length <= 9) {
        s.instrument.tuning = notes
      }
    },
  },
  num('fmin', (s) => s.instrument.minFret, (s, v) => (s.instrument.minFret = v), 0, MAX_FRET),
  num('fmax', (s) => s.instrument.maxFret, (s, v) => (s.instrument.maxFret = v), 0, MAX_FRET),
  bool('open', (s) => s.instrument.allowOpen, (s, v) => (s.instrument.allowOpen = v)),
  {
    key: 'off',
    read: (s) => s.instrument.disabledStrings.join(','),
    write: (s, raw) => {
      s.instrument.disabledStrings = raw.split(',').filter(Boolean).map(Number).filter(Number.isInteger)
    },
  },
  num('sound', (s) => s.instrument.program, (s, v) => (s.instrument.program = v), 0, 127),
  // Fingering
  oneOf('sys', FINGERING_SYSTEMS, (s) => s.fingering.system, (s, v) => (s.fingering.system = v)),
  num('box', (s) => s.fingering.boxWidth, (s, v) => (s.fingering.boxWidth = v), 2, 6),
  bool('extl', (s) => s.fingering.extLow, (s, v) => (s.fingering.extLow = v)),
  bool('exth', (s) => s.fingering.extHigh, (s, v) => (s.fingering.extHigh = v)),
  {
    key: 'shapes',
    read: (s) => s.fingering.cagedShapes.join(''),
    write: (s, raw) => {
      s.fingering.cagedShapes = CAGED_SHAPES.filter((shape: CagedShape) => raw.includes(shape))
    },
  },
  num('nps', (s) => s.fingering.npsPerString, (s, v) => (s.fingering.npsPerString = v), 1, 5),
  num('span', (s) => s.fingering.npsMaxSpan, (s, v) => (s.fingering.npsMaxSpan = v), 2, 8),
  // Navigation
  oneOf('nav', NAVIGATION_MODES, (s) => s.navigation.mode, (s, v) => (s.navigation.mode = v)),
  num('pos', (s) => s.navigation.positionIndex, (s, v) => (s.navigation.positionIndex = v), 0, 99),
  oneOf('gap', GAP_MODES, (s) => s.navigation.gap, (s, v) => (s.navigation.gap = v)),
  oneOf('cost', [...COST_PRESET_IDS, 'custom' as const], (s) => s.navigation.costPreset, (s, v) => (s.navigation.costPreset = v)),
  {
    key: 'w',
    read: (s) => (s.navigation.costPreset === 'custom' ? WEIGHT_KEYS.map((k) => s.navigation.weights[k]).join(',') : ''),
    write: (s, raw) => {
      const values = raw.split(',').map(Number)
      if (values.length === WEIGHT_KEYS.length && values.every(Number.isFinite)) {
        s.navigation.weights = Object.fromEntries(WEIGHT_KEYS.map((k, i) => [k, values[i]])) as unknown as CostWeights
      }
    },
  },
  // Pattern
  oneOf('pat', PATTERN_TYPES, (s) => s.pattern.type, (s, v) => (s.pattern.type = v)),
  num('rep', (s) => s.pattern.repeats, (s, v) => (s.pattern.repeats = v), 1, 16),
  bool('root', (s) => s.pattern.fromRoot, (s, v) => (s.pattern.fromRoot = v)),
  oneOf('dir', DIRECTIONS, (s) => s.pattern.direction, (s, v) => (s.pattern.direction = v)),
  bool('turn', (s) => s.pattern.repeatTurn, (s, v) => (s.pattern.repeatTurn = v)),
  text('motif', (s) => s.pattern.motif, (s, v) => (s.pattern.motif = v)),
  num('step', (s) => s.pattern.step, (s, v) => (s.pattern.step = v), 1, 8),
  num('count', (s) => s.pattern.randomCount, (s, v) => (s.pattern.randomCount = v), 1, 256),
  num('seed', (s) => s.pattern.seed, (s, v) => (s.pattern.seed = v), 0, 999999),
  bool('norep', (s) => s.pattern.noRepeat, (s, v) => (s.pattern.noRepeat = v)),
  num('leap', (s) => s.pattern.maxLeap, (s, v) => (s.pattern.maxLeap = v), 0, 24),
  oneOf('porder', PAIR_ORDERS, (s) => s.pattern.pairOrder, (s, v) => (s.pattern.pairOrder = v)),
  oneOf('pplace', PAIR_PLACEMENTS, (s) => s.pattern.pairPlacement, (s, v) => (s.pattern.pairPlacement = v)),
  // Rhythm
  oneOf('sub', SUBDIVISIONS, (s) => s.rhythm.subdivision, (s, v) => (s.rhythm.subdivision = v)),
  num('tsn', (s) => s.rhythm.tsNum, (s, v) => (s.rhythm.tsNum = v), 1, 12),
  oneOf('tsd', TIME_DENOMINATORS, (s) => s.rhythm.tsDen, (s, v) => (s.rhythm.tsDen = v)),
  num('bpm', (s) => s.rhythm.tempo, (s, v) => (s.rhythm.tempo = v), 20, 300),
  // Enclosures
  bool('enc', (s) => s.enclosure.enabled, (s, v) => (s.enclosure.enabled = v)),
  text('encs', (s) => s.enclosure.spec, (s, v) => (s.enclosure.spec = v)),
  oneOf('encd', ENCLOSURE_DIRECTIONS, (s) => s.enclosure.direction, (s, v) => (s.enclosure.direction = v)),
  text('encs2', (s) => s.enclosure.specDown, (s, v) => (s.enclosure.specDown = v)),
  oneOf('enct', ENCLOSURE_TARGETS, (s) => s.enclosure.targets, (s, v) => (s.enclosure.targets = v)),
  num('encn', (s) => s.enclosure.every, (s, v) => (s.enclosure.every = v), 1, 16),
  {
    key: 'encsc',
    read: (s) => s.enclosure.scale,
    write: (s, raw) => {
      if (raw === APPROACH_SCALE_AUTO || raw === APPROACH_SCALE_CHROMATIC || LIBRARY_ENTRIES.some((e) => e.id === raw)) {
        s.enclosure.scale = raw
      }
    },
  },
  bool('enca', (s) => s.enclosure.align, (s, v) => (s.enclosure.align = v)),
  bool('encg', (s) => s.enclosure.ghost, (s, v) => (s.enclosure.ghost = v)),
  // Display
  oneOf('lab', LABEL_MODES, (s) => s.display.labels, (s, v) => (s.display.labels = v)),
  oneOf('staff', NOTATION_MODES, (s) => s.display.notation, (s, v) => (s.display.notation = v)),
  // Player
  bool('loop', (s) => s.player.loop, (s, v) => (s.player.loop = v)),
  bool('metro', (s) => s.player.metronome, (s, v) => (s.player.metronome = v)),
  bool('countin', (s) => s.player.countIn, (s, v) => (s.player.countIn = v)),
  bool('ramp', (s) => s.player.ramp, (s, v) => (s.player.ramp = v)),
  num('rstep', (s) => s.player.rampStep, (s, v) => (s.player.rampStep = v), 1, 50),
  num('revery', (s) => s.player.rampEvery, (s, v) => (s.player.rampEvery = v), 1, 32),
  num('rmax', (s) => s.player.rampMax, (s, v) => (s.player.rampMax = v), 20, 300),
]

/** Query string holding only the values that differ from the defaults. */
export function settingsToQuery(settings: Settings): string {
  const params = new URLSearchParams()
  for (const field of FIELDS) {
    const value = field.read(settings)
    if (value !== field.read(DEFAULT_SETTINGS)) {
      params.set(field.key, value)
    }
  }
  if ([...params.keys()].length > 0) {
    params.set('v', VERSION)
  }
  return params.toString()
}

export function settingsFromQuery(query: string): Settings {
  const params = new URLSearchParams(query)
  const settings = structuredClone(DEFAULT_SETTINGS)
  for (const field of FIELDS) {
    const raw = params.get(field.key)
    if (raw !== null) {
      field.write(settings, raw)
    }
  }
  return sanitizeSettings(settings)
}
