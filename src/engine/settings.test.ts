import { describe, expect, it } from 'vitest'
import { buildExercise } from './exercise'
import { DEFAULT_SETTINGS, type Settings } from './settings'
import { settingsFromQuery, settingsToQuery } from './url'

describe('url', () => {
  it('keeps the URL empty for default settings', () => {
    expect(settingsToQuery(DEFAULT_SETTINGS)).toBe('')
    expect(settingsFromQuery('')).toEqual(DEFAULT_SETTINGS)
  })

  it('round-trips every kind of setting', () => {
    const s: Settings = structuredClone(DEFAULT_SETTINGS)
    s.tonic = 'F#'
    s.degrees = ['1', 'b3', '#4', '7']
    s.instrument = {
      presetId: 'guitar7',
      tuningId: 'custom',
      tuning: ['A1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
      minFret: 2,
      maxFret: 20,
      allowOpen: false,
      disabledStrings: [0, 6],
      program: 30,
    }
    s.fingering = { system: 'caged', boxWidth: 5, extLow: false, extHigh: true, cagedShapes: ['E', 'D'], npsPerString: 4, npsMaxSpan: 6 }
    s.navigation = {
      mode: 'bestPath',
      positionIndex: 3,
      gap: 'restBar',
      costPreset: 'custom',
      weights: { ...DEFAULT_SETTINGS.navigation.weights, shift: 1.5, maxRun: 2 },
    }
    s.pattern = { ...s.pattern, type: 'sequence', motif: '0 2 -1', step: 2, direction: 'downUp', repeats: 3, fromRoot: true }
    s.rhythm = { subdivision: '16t', tsNum: 6, tsDen: 8, tempo: 132 }
    s.display = { labels: 'none', notation: 'scoreTab' }
    s.player = { loop: false, metronome: true, countIn: false, ramp: true, rampStep: 4, rampEvery: 3, rampMax: 180 }
    s.enclosure = {
      enabled: true,
      spec: 'C- D+',
      direction: 'fixed',
      specDown: 'D-',
      targets: 'every',
      every: 2,
      scale: 'mixolydian',
      align: false,
      ghost: true,
    }

    const query = settingsToQuery(s)
    expect(query).toContain('key=F%23')
    expect(settingsFromQuery(query)).toEqual(s)
  })

  it('ignores invalid values', () => {
    const s = settingsFromQuery('key=H&deg=1,9,b3&sys=foo&bpm=abc&fmax=99&notes=E2,X4&tsd=5')
    expect(s.tonic).toBe('C')
    expect(s.degrees).toEqual(['1', 'b3'])
    expect(s.fingering.system).toBe('box')
    expect(s.rhythm.tempo).toBe(80)
    expect(s.instrument.maxFret).toBe(24)
    expect(s.instrument.tuning).toEqual(DEFAULT_SETTINGS.instrument.tuning)
    expect(s.rhythm.tsDen).toBe(4)
  })

  it('sanitizes dependent values', () => {
    const s = settingsFromQuery('fmin=20&fmax=10&off=0,9')
    expect(s.instrument.maxFret).toBe(10)
    expect(s.instrument.minFret).toBe(7)
    expect(s.instrument.disabledStrings).toEqual([0])
  })
})

describe('exercise', () => {
  it('builds the default exercise', () => {
    const exercise = buildExercise(DEFAULT_SETTINGS)
    expect(exercise.problems).toEqual([])
    expect(exercise.positions.length).toBeGreaterThan(5)
    expect(exercise.bars.length).toBeGreaterThan(0)
    expect(exercise.bars.every((bar) => bar.length === 8)).toBe(true)
  })

  it('reports an unavailable system', () => {
    const s = structuredClone(DEFAULT_SETTINGS)
    s.fingering.system = 'caged'
    s.instrument.tuning = ['D2', 'A2', 'D3', 'G3', 'B3', 'E4']
    const exercise = buildExercise(s)
    expect(exercise.positions).toEqual([])
    expect(exercise.problems[0]).toMatch(/CAGED/)
  })

  it('works for every system and navigation mode', () => {
    for (const system of ['box', 'caged', 'nps'] as const) {
      for (const mode of ['single', 'all', 'bestPath'] as const) {
        const s = structuredClone(DEFAULT_SETTINGS)
        s.degrees = ['1', '3', '5']
        s.fingering.system = system
        s.navigation.mode = mode
        const exercise = buildExercise(s)
        expect(exercise.problems, system + '/' + mode).toEqual([])
        expect(exercise.steps.length, system + '/' + mode).toBeGreaterThan(0)
      }
    }
  })
})
