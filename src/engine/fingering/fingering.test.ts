import { describe, expect, it } from 'vitest'
import type { Fretboard } from '../instrument/fretboard'
import { parseTuning } from '../instrument/tuning'
import type { Degree } from '../theory/degrees'
import type { Tonic } from '../theory/spelling'
import { buildTargets } from '../theory/targets'
import { STRATEGIES } from './registry'
import type { FingeringContext, FingeringOptions, FretNote } from './types'

const STANDARD = parseTuning(['E2', 'A2', 'D3', 'G3', 'B3', 'E4'])!
const MAJOR: Degree[] = ['1', '2', '3', '4', '5', '6', '7']

const OPTIONS: FingeringOptions = {
  system: 'box',
  boxWidth: 4,
  extLow: true,
  extHigh: true,
  cagedShapes: ['C', 'A', 'G', 'E', 'D'],
  npsPerString: 3,
  npsMaxSpan: 5,
}

function context(
  degrees: Degree[],
  options: Partial<FingeringOptions> = {},
  board: Partial<Fretboard> = {},
  tonic: Tonic = 'C',
): FingeringContext {
  return {
    board: { tuning: STANDARD, minFret: 0, maxFret: 22, allowOpen: true, disabledStrings: [], ...board },
    targets: buildTargets(tonic, degrees),
    options: { ...OPTIONS, ...options },
  }
}

const frets = (notes: FretNote[]) => notes.map((n) => [n.string, n.fret])

describe('box', () => {
  it('places C and D in the box at fret 7', () => {
    const box = STRATEGIES.box.listPositions(context(['1', '2'])).find((p) => p.id === 'box-7')!
    expect(frets(box.notes)).toEqual([
      [0, 8],
      [0, 10],
      [2, 10],
      [3, 7],
      [5, 8],
      [5, 10],
    ])
    expect(box.notes.map((n) => n.degree)).toEqual(['1', '2', '1', '2', '1', '2'])
  })

  it('prefers the core window over a stretch for the same pitch', () => {
    const box = STRATEGIES.box.listPositions(context(MAJOR)).find((p) => p.id === 'box-5')!
    // E4 is both G string fret 9 (stretch) and B string fret 5 (core)
    expect(box.notes.find((n) => n.midi === 64)).toMatchObject({ string: 4, fret: 5, ext: false })
    expect(box.notes.filter((n) => n.ext).every((n) => n.fret === 4 || n.fret === 9)).toBe(true)
  })

  it('keeps each pitch once and sorts by pitch', () => {
    for (const position of STRATEGIES.box.listPositions(context(MAJOR))) {
      const midis = position.notes.map((n) => n.midi)
      expect(midis).toEqual([...new Set(midis)].sort((a, b) => a - b))
    }
  })

  it('disables stretches', () => {
    const box = STRATEGIES.box
      .listPositions(context(MAJOR, { extLow: false, extHigh: false }))
      .find((p) => p.id === 'box-5')!
    expect(box.notes.every((n) => n.fret >= 5 && n.fret <= 8)).toBe(true)
  })

  it('includes open strings only at the nut and when allowed', () => {
    const positions = STRATEGIES.box.listPositions(context(MAJOR))
    expect(positions[0].notes.some((n) => n.fret === 0)).toBe(true)
    expect(positions.slice(2).some((p) => p.notes.some((n) => n.fret === 0))).toBe(false)
    const closed = STRATEGIES.box.listPositions(context(MAJOR, {}, { allowOpen: false }))
    expect(closed.some((p) => p.notes.some((n) => n.fret === 0))).toBe(false)
  })

  it('respects the fret range and the box width', () => {
    const positions = STRATEGIES.box.listPositions(context(MAJOR, { boxWidth: 5 }, { minFret: 3, maxFret: 12 }))
    expect(positions[0].lo).toBe(3)
    expect(positions[positions.length - 1].hi).toBe(12)
    expect(positions.every((p) => p.notes.every((n) => n.fret >= 3 && n.fret <= 12))).toBe(true)
  })

  it('works on a 4-string bass', () => {
    const bass = parseTuning(['E1', 'A1', 'D2', 'G2'])!
    const box = STRATEGIES.box.listPositions(context(['1', '5'], {}, { tuning: bass })).find((p) => p.id === 'box-2')!
    // C on A string fret 3, G on low E fret 3, G on D string fret 5, C on G string fret 5
    expect(frets(box.notes)).toEqual([
      [0, 3],
      [1, 3],
      [2, 5],
      [3, 5],
    ])
  })
})

describe('caged', () => {
  it('builds the five shapes in C', () => {
    const positions = STRATEGIES.caged.listPositions(context(MAJOR))
    expect(positions.map((p) => [p.label.split(' ')[1], p.lo, p.hi]).slice(0, 5)).toEqual([
      ['C', 0, 3],
      ['A', 2, 5],
      ['G', 5, 8],
      ['E', 7, 10],
      ['D', 10, 13],
    ])
    expect(positions.slice(5).map((p) => p.lo)).toEqual([12, 14, 17, 19])
  })

  it('builds the shapes in G', () => {
    const positions = STRATEGIES.caged.listPositions(context(MAJOR, {}, {}, 'G'))
    expect(positions.map((p) => [p.label.split(' ')[1], p.lo]).slice(0, 5)).toEqual([
      ['G', 0],
      ['E', 2],
      ['D', 5],
      ['C', 7],
      ['A', 9],
    ])
  })

  it('filters shapes', () => {
    const positions = STRATEGIES.caged.listPositions(context(MAJOR, { cagedShapes: ['E'] }))
    expect(positions.map((p) => p.lo)).toEqual([7, 19])
  })

  it('handles 7-string guitars and refuses non-standard tunings', () => {
    const seven = parseTuning(['B1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4'])!
    const positions = STRATEGIES.caged.listPositions(context(MAJOR, {}, { tuning: seven }))
    expect(positions.map((p) => p.lo).slice(0, 5)).toEqual([0, 2, 5, 7, 10])
    expect(positions[3].notes.some((n) => n.string === 0)).toBe(true)

    const dropD = context(MAJOR, {}, { tuning: parseTuning(['D2', 'A2', 'D3', 'G3', 'B3', 'E4'])! })
    expect(STRATEGIES.caged.unavailableReason(dropD)).not.toBeNull()
    expect(STRATEGIES.caged.listPositions(dropD)).toEqual([])
  })
})

describe('nps', () => {
  it('builds the seven 3-notes-per-string patterns of C major', () => {
    const positions = STRATEGIES.nps.listPositions(context(MAJOR, {}, { allowOpen: false }))
    expect(positions.map((p) => p.notes[0].fret)).toEqual([1, 3, 5, 7, 8, 10, 12])
    expect(frets(positions[1].notes)).toEqual([
      [0, 3], [0, 5], [0, 7],
      [1, 3], [1, 5], [1, 7],
      [2, 3], [2, 5], [2, 7],
      [3, 4], [3, 5], [3, 7],
      [4, 5], [4, 6], [4, 8],
      [5, 5], [5, 7], [5, 8],
    ])
  })

  it('keeps notes strictly ascending', () => {
    for (const position of STRATEGIES.nps.listPositions(context(MAJOR))) {
      const midis = position.notes.map((n) => n.midi)
      expect(midis.every((m, i) => i === 0 || m > midis[i - 1])).toBe(true)
    }
  })

  it('falls back to the next string when the span is too wide', () => {
    const positions = STRATEGIES.nps.listPositions(context(['1', '2']))
    for (const position of positions) {
      const byString = new Map<number, number[]>()
      position.notes.forEach((n) => byString.set(n.string, [...(byString.get(n.string) ?? []), n.fret]))
      for (const list of byString.values()) {
        expect(list.length).toBeLessThanOrEqual(2)
        expect(Math.max(...list) - Math.min(...list)).toBeLessThanOrEqual(5)
      }
    }
  })

  it('skips a string when nothing fits in the fret range', () => {
    // 1-2 in C up to fret 15: the G string cannot hold C5 (fret 17), the B string can (fret 13)
    const positions = STRATEGIES.nps.listPositions(context(['1', '2'], {}, { maxFret: 15 }))
    const first = positions.find((p) => p.notes[0].fret === 8)!
    expect(frets(first.notes)).toEqual([[0, 8], [0, 10], [1, 15], [2, 12], [4, 13], [4, 15]])
  })

  it('supports 2 and 4 notes per string', () => {
    const two = STRATEGIES.nps.listPositions(context(MAJOR, { npsPerString: 2 }, { allowOpen: false }))
    expect(frets(two[1].notes).slice(0, 4)).toEqual([[0, 3], [0, 5], [1, 2], [1, 3]])
    const four = STRATEGIES.nps.listPositions(context(MAJOR, { npsPerString: 4 }, { allowOpen: false }))
    expect(frets(four[1].notes).slice(0, 5)).toEqual([[0, 3], [0, 5], [0, 7], [0, 8], [1, 5]])
  })
})
