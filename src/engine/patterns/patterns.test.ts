import { describe, expect, it } from 'vitest'
import type { Degree } from '../theory/degrees'
import { applyPattern } from './index'
import { parseMotif } from './sequences'
import type { PatternOptions, PitchItem } from './types'

// C D E F G A B C over one octave, the tonic being C
const SCALE: PitchItem[] = [60, 62, 64, 65, 67, 69, 71, 72].map((midi, i) => ({
  midi,
  degree: (['1', '2', '3', '4', '5', '6', '7', '1'] as Degree[])[i],
}))
const NAMES: Record<number, string> = { 59: 'B', 74: 'D', 60: 'C', 62: 'D', 64: 'E', 65: 'F', 67: 'G', 69: 'A', 71: 'B', 72: 'C' }

const DEFAULTS: PatternOptions = {
  type: 'ascDesc',
  repeats: 1,
  fromRoot: false,
  direction: 'up',
  repeatTurn: false,
  motif: '0 1 2',
  step: 1,
  randomCount: 16,
  seed: 1,
  noRepeat: true,
  maxLeap: 0,
  pairOrder: 'refFirst',
  pairPlacement: 'above',
}

const play = (options: Partial<PatternOptions>, items = SCALE) =>
  applyPattern(items, { ...DEFAULTS, ...options }, '1')
    .map((i) => NAMES[i.midi])
    .join(' ')

describe('ascDesc', () => {
  it('goes up, down and round trip', () => {
    expect(play({ direction: 'up' })).toBe('C D E F G A B C')
    expect(play({ direction: 'down' })).toBe('C B A G F E D C')
    expect(play({ direction: 'upDown' })).toBe('C D E F G A B C B A G F E D C')
    expect(play({ direction: 'upDown', repeatTurn: true })).toBe('C D E F G A B C C B A G F E D C')
  })

  it('does not double the shared note between repeated round trips', () => {
    const items = SCALE.slice(0, 3)
    expect(play({ direction: 'upDown', repeats: 2 }, items)).toBe('C D E D C D E D C')
    expect(play({ direction: 'up', repeats: 2 }, items)).toBe('C D E C D E')
  })

  it('trims to the tonic', () => {
    const items = [{ midi: 59, degree: '7' as Degree }, ...SCALE, { midi: 74, degree: '2' as Degree }]
    expect(play({ fromRoot: true }, items)).toBe('C D E F G A B C')
    expect(play({ fromRoot: false }, items)).toBe('B C D E F G A B C D')
  })
})

describe('sequence', () => {
  it('builds groups of 3 up and down', () => {
    const items = SCALE.slice(0, 5)
    expect(play({ type: 'sequence', motif: '0 1 2' }, items)).toBe('C D E D E F E F G')
    expect(play({ type: 'sequence', motif: '0 1 2', direction: 'down' }, items)).toBe('G F E F E D E D C')
  })

  it('handles thirds, steps and negative offsets', () => {
    const items = SCALE.slice(0, 5)
    expect(play({ type: 'sequence', motif: '0 2' }, items)).toBe('C E D F E G')
    expect(play({ type: 'sequence', motif: '0 1', step: 2 }, items)).toBe('C D E F')
    expect(play({ type: 'sequence', motif: '0 -1' }, items)).toBe('D C E D F E G F')
  })

  it('parses motifs', () => {
    expect(parseMotif('0 1 2')).toEqual([0, 1, 2])
    expect(parseMotif('0,-1, 3')).toEqual([0, -1, 3])
    expect(parseMotif('abc')).toEqual([0])
  })
})

describe('random', () => {
  it('is reproducible with the same seed', () => {
    const a = play({ type: 'random', seed: 42 })
    expect(play({ type: 'random', seed: 42 })).toBe(a)
    expect(play({ type: 'random', seed: 43 })).not.toBe(a)
    expect(a.split(' ')).toHaveLength(16)
  })

  it('avoids repeats and limits leaps', () => {
    const result = applyPattern(SCALE, { ...DEFAULTS, type: 'random', randomCount: 200, maxLeap: 2 }, '1')
    for (let i = 1; i < result.length; i++) {
      const from = SCALE.indexOf(result[i - 1])
      const to = SCALE.indexOf(result[i])
      expect(from).not.toBe(to)
      expect(Math.abs(from - to)).toBeLessThanOrEqual(2)
    }
  })
})

describe('pairs', () => {
  const items = SCALE.filter((i) => i.degree === '1' || i.degree === '3' || i.degree === '5')

  it('pairs the tonic with each degree above', () => {
    expect(play({ type: 'pairs' }, items)).toBe('C E C G')
    expect(play({ type: 'pairs', pairOrder: 'degreeFirst' }, items)).toBe('E C G C')
  })

  it('pairs below and both ways', () => {
    expect(play({ type: 'pairs', pairPlacement: 'below' }, items)).toBe('C G C E')
    expect(play({ type: 'pairs', pairPlacement: 'both' }, items)).toBe('C E C G C G C E')
  })

  it('falls back to the plain list without reference', () => {
    const result = applyPattern(items, { ...DEFAULTS, type: 'pairs' }, null)
    expect(result).toEqual(items)
  })
})
