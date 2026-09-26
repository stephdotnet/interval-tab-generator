import { describe, expect, it } from 'vitest'
import { STRATEGIES } from '../fingering/registry'
import type { FingeringContext, Position } from '../fingering/types'
import { parseTuning } from '../instrument/tuning'
import type { PatternOptions } from '../patterns/types'
import type { Degree } from '../theory/degrees'
import { buildTargets } from '../theory/targets'
import { bestPath } from './bestPath'
import { COST_PRESETS, type CostWeights } from './cost'
import { navigate, type NavigationOptions, type Step } from './navigate'

const MAJOR: Degree[] = ['1', '2', '3', '4', '5', '6', '7']

const ctx = (degrees: Degree[]): FingeringContext => ({
  board: {
    tuning: parseTuning(['E2', 'A2', 'D3', 'G3', 'B3', 'E4'])!,
    minFret: 0,
    maxFret: 15,
    allowOpen: false,
    disabledStrings: [],
  },
  targets: buildTargets('C', degrees),
  options: {
    system: 'box',
    boxWidth: 4,
    extLow: true,
    extHigh: true,
    cagedShapes: ['C', 'A', 'G', 'E', 'D'],
    npsPerString: 3,
    npsMaxSpan: 5,
  },
})

const PATTERN: PatternOptions = {
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
}

const NAV: NavigationOptions = { mode: 'single', positionIndex: 0, gap: 'newBar', weights: COST_PRESETS.diagonal.weights }

type NoteStep = Extract<Step, { kind: 'note' }>
const notes = (steps: Step[]) => steps.filter((s): s is NoteStep => s.kind === 'note')

const count = (steps: NoteStep[], changed: (a: NoteStep, b: NoteStep) => boolean) =>
  steps.slice(1).filter((s, i) => changed(steps[i], s)).length

describe('navigate', () => {
  const positions = STRATEGIES.box.listPositions(ctx(MAJOR))

  it('plays a single position with the pattern', () => {
    const steps = notes(navigate(positions, { ...NAV, positionIndex: 4 }, PATTERN, '1'))
    const position = positions[4]
    expect(steps.every((s) => s.position === position)).toBe(true)
    expect(steps).toHaveLength(position.notes.length * 2 - 1)
    expect(steps[0].note.midi).toBe(position.notes[0].midi)
  })

  it('clamps the position index', () => {
    const steps = notes(navigate(positions, { ...NAV, positionIndex: 99 }, PATTERN, '1'))
    expect(steps[0].position).toBe(positions[positions.length - 1])
  })

  it('chains every position with gaps', () => {
    const steps = navigate(positions, { ...NAV, mode: 'all' }, PATTERN, '1')
    expect(steps.filter((s) => s.kind === 'gap')).toHaveLength(positions.length - 1)
    expect(navigate(positions, { ...NAV, mode: 'all', gap: 'none' }, PATTERN, '1').some((s) => s.kind === 'gap')).toBe(
      false,
    )
  })

  it('returns nothing without positions', () => {
    expect(navigate([], NAV, PATTERN, '1')).toEqual([])
  })
})

describe('bestPath', () => {
  const positions = STRATEGIES.box.listPositions(ctx(MAJOR))
  const run = (weights: CostWeights) => notes(navigate(positions, { ...NAV, mode: 'bestPath', weights }, PATTERN, '1'))

  it('plays every pitch of the neck in order', () => {
    const steps = run(COST_PRESETS.diagonal.weights)
    const midis = steps.map((s) => s.note.midi)
    const top = midis.indexOf(Math.max(...midis))
    expect(midis.slice(0, top + 1)).toEqual([...midis.slice(0, top + 1)].sort((a, b) => a - b))
    expect(steps.every((s) => s.position.candidates.includes(s.note))).toBe(true)
    // lowest playable C major note with frets 1-15: F2 on low E fret 1; highest: G5 on high E fret 15
    expect(midis[0]).toBe(41)
    expect(midis[top]).toBe(79)
  })

  it('stays in position with "stay" and slides along strings with "slide"', () => {
    const stay = run(COST_PRESETS.stay.weights)
    const slide = run(COST_PRESETS.slide.weights)
    const positionChanges = (s: NoteStep[]) => count(s, (a, b) => a.position !== b.position)
    const stringChanges = (s: NoteStep[]) => count(s, (a, b) => a.note.string !== b.note.string)
    expect(positionChanges(stay)).toBeLessThan(positionChanges(slide))
    expect(stringChanges(slide)).toBeLessThan(stringChanges(stay))
  })

  it('crosses the neck in small shifts with "diagonal"', () => {
    const up: PatternOptions = { ...PATTERN, direction: 'up' }
    const steps = notes(navigate(positions, { ...NAV, mode: 'bestPath', weights: COST_PRESETS.diagonal.weights }, up, '1'))
    let run = 1
    steps.slice(1).forEach((s, i) => {
      const previous = steps[i].note
      run = s.note.string === previous.string ? run + 1 : 1
      expect(run).toBeLessThanOrEqual(4)
      expect(Math.abs(s.note.fret - previous.fret)).toBeLessThanOrEqual(5)
      // Going up never comes back to a lower string
      expect(s.note.string).toBeGreaterThanOrEqual(previous.string)
    })
  })

  it('finds the optimal path on a small case', () => {
    // Two overlapping positions: the path should not bounce between them
    const make = (id: string, center: number, frets: [number, number, number, boolean][]): Position => ({
      id,
      label: id,
      lo: center - 1,
      hi: center + 1,
      center,
      notes: frets.map(([string, fret, midi, ext]) => ({ string, fret, midi, degree: '1', ext })),
      candidates: [],
    })
    const withCandidates = (p: Position) => ({ ...p, candidates: p.notes })
    // 45 is a stretch in b, so the hand should leave a only for 48
    const a = withCandidates(make('a', 3, [[0, 3, 43, false], [0, 5, 45, false]]))
    const b = withCandidates(make('b', 6, [[0, 5, 45, true], [1, 3, 48, false]]))
    const path = bestPath([{ midi: 43 }, { midi: 45 }, { midi: 48 }, { midi: 99 }], [a, b], COST_PRESETS.stay.weights)
    expect(path.map((p) => p.position.id)).toEqual(['a', 'a', 'b'])
    expect(path[2].note.string).toBe(1)
  })
})
