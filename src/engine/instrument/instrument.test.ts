import { describe, expect, it } from 'vitest'
import { buildTargets, degreeOf } from '../theory/targets'
import { isFretPlayable, locationsOf, type Fretboard } from './fretboard'
import { INSTRUMENTS } from './presets'
import { parseTuning, standardOffset } from './tuning'

const tuningOf = (instrument: string, tuning: string) =>
  parseTuning(INSTRUMENTS.find((i) => i.id === instrument)!.tunings.find((t) => t.id === tuning)!.notes)!

describe('tuning', () => {
  it('parses every preset', () => {
    for (const instrument of INSTRUMENTS) {
      for (const tuning of instrument.tunings) {
        expect(parseTuning(tuning.notes), instrument.id + '/' + tuning.id).not.toBeNull()
      }
    }
  })

  it('rejects invalid names', () => {
    expect(parseTuning(['E2', 'X2'])).toBeNull()
  })

  it('detects standard-like tunings', () => {
    expect(standardOffset(tuningOf('guitar6', 'standard'))).toBe(0)
    expect(standardOffset(tuningOf('guitar6', 'eb'))).toBe(0)
    expect(standardOffset(tuningOf('guitar6', 'dstd'))).toBe(0)
    expect(standardOffset(tuningOf('guitar7', 'standard'))).toBe(1)
    expect(standardOffset(tuningOf('guitar8', 'standard'))).toBe(2)
    expect(standardOffset(tuningOf('guitar6', 'dropd'))).toBeNull()
    expect(standardOffset(tuningOf('guitar6', 'dadgad'))).toBeNull()
    expect(standardOffset(tuningOf('bass4', 'standard'))).toBeNull()
  })
})

describe('fretboard', () => {
  const board: Fretboard = {
    tuning: tuningOf('guitar6', 'standard'),
    minFret: 0,
    maxFret: 12,
    allowOpen: true,
    disabledStrings: [],
  }

  it('finds every location of a pitch', () => {
    // C4: B string fret 1, G string fret 5, D string fret 10
    expect(locationsOf(board, 60)).toEqual([
      { string: 2, fret: 10 },
      { string: 3, fret: 5 },
      { string: 4, fret: 1 },
    ])
  })

  it('respects open strings, fret range and disabled strings', () => {
    expect(locationsOf(board, 40)).toEqual([{ string: 0, fret: 0 }])
    expect(locationsOf({ ...board, allowOpen: false }, 40)).toEqual([])
    expect(locationsOf({ ...board, disabledStrings: [3] }, 60)).toHaveLength(2)
    expect(isFretPlayable({ ...board, minFret: 5 }, 0)).toBe(false)
    expect(isFretPlayable(board, 13)).toBe(false)
  })
})

describe('targets', () => {
  it('maps pitch classes to degrees', () => {
    const targets = buildTargets('C', ['2', '1'])
    expect(targets.degrees).toEqual(['1', '2'])
    expect(degreeOf(targets, 62)).toBe('2')
    expect(degreeOf(targets, 48)).toBe('1')
    expect(degreeOf(targets, 64)).toBeUndefined()
    expect(targets.reference).toBe('1')
  })

  it('keeps the first degree for enharmonic duplicates', () => {
    const targets = buildTargets('C', ['b5', '#4'])
    expect(degreeOf(targets, 66)).toBe('#4')
    expect(buildTargets('C', ['3', '5']).reference).toBe('3')
  })
})
