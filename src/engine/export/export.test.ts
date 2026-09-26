import { importer, Settings as AlphaTabSettings, type model } from '@coderline/alphatab'
import { describe, expect, it } from 'vitest'
import { buildExercise } from '../exercise'
import type { FretNote, Position } from '../fingering/types'
import type { Step } from '../navigation/navigate'
import { layoutBars, notesPerBar, rhythmError, type Slot } from '../rhythm/rhythm'
import { DEFAULT_SETTINGS, type Settings } from '../settings'

function parse(tex: string) {
  const texImporter = new importer.AlphaTexImporter()
  texImporter.logErrors = false
  texImporter.initFromString(tex, new AlphaTabSettings())
  const score = texImporter.readScore()
  const diagnostics = [...texImporter.lexerDiagnostics.items, ...texImporter.parserDiagnostics.items, ...texImporter.semanticDiagnostics.items]
  return { score, diagnostics: diagnostics.map((d) => d.message) }
}

const beatsOf = (score: model.Score) => score.tracks[0].staves[0].bars.map((bar) => bar.voices[0].beats)

const settings = (patch: (s: Settings) => void): Settings => {
  const s = structuredClone(DEFAULT_SETTINGS)
  patch(s)
  return s
}

const note = (midi: number): FretNote => ({ string: 0, fret: midi - 40, midi, degree: '1', ext: false })
const position = { id: 'p' } as Position
const steps = (count: number): Step[] => Array.from({ length: count }, (_, i) => ({ kind: 'note', note: note(40 + i), position }))

describe('rhythm', () => {
  it('computes notes per bar', () => {
    expect(notesPerBar({ subdivision: '8', tsNum: 4, tsDen: 4, tempo: 80 })).toBe(8)
    expect(notesPerBar({ subdivision: '8t', tsNum: 4, tsDen: 4, tempo: 80 })).toBe(12)
    expect(notesPerBar({ subdivision: '16', tsNum: 3, tsDen: 4, tempo: 80 })).toBe(12)
    expect(notesPerBar({ subdivision: '8', tsNum: 6, tsDen: 8, tempo: 80 })).toBe(6)
  })

  it('rejects subdivisions that do not fill a bar', () => {
    expect(rhythmError({ subdivision: '4', tsNum: 5, tsDen: 8, tempo: 80 })).not.toBeNull()
    expect(rhythmError({ subdivision: '8t', tsNum: 5, tsDen: 8, tempo: 80 })).not.toBeNull()
    expect(rhythmError({ subdivision: '8t', tsNum: 3, tsDen: 4, tempo: 80 })).toBeNull()
  })

  it('pads bars and handles gaps', () => {
    const bars = layoutBars([...steps(5), { kind: 'gap' }, ...steps(2)], 4, 'restBar')
    const shape = (bar: Slot[]) => bar.map((s) => (s ? 'n' : 'r')).join('')
    expect(bars.map(shape)).toEqual(['nnnn', 'nrrr', 'rrrr', 'nnrr'])
    expect(layoutBars([...steps(4), { kind: 'gap' }, ...steps(1)], 4, 'newBar').map(shape)).toEqual(['nnnn', 'nrrr'])
  })
})

describe('alphaTex', () => {
  it('produces a score alphaTab parses without errors, matching the exercise', () => {
    const exercise = buildExercise(settings((s) => (s.navigation.positionIndex = 6)))
    const { score, diagnostics } = parse(exercise.tex)
    expect(diagnostics).toEqual([])
    expect(score.title).toBe('C : 1 - 2')
    expect(score.tempo).toBe(80)
    expect(score.tracks[0].staves[0].tuning).toEqual([64, 59, 55, 50, 45, 40])
    expect(score.tracks[0].playbackInfo.program).toBe(25)

    const beats = beatsOf(score)
    expect(beats).toHaveLength(exercise.bars.length)
    exercise.bars.forEach((bar, b) => {
      expect(beats[b]).toHaveLength(bar.length)
      bar.forEach((slot, i) => {
        const beat = beats[b][i]
        if (!slot) {
          expect(beat.isRest).toBe(true)
          return
        }
        // alphaTab strings: 1 = lowest string
        expect(beat.notes[0].fret).toBe(slot.note.fret)
        expect(beat.notes[0].string).toBe(slot.note.string + 1)
        expect(beat.notes[0].realValue).toBe(slot.note.midi)
        expect(beat.text).toBe(slot.note.degree)
      })
    })
  })

  it('writes note names, triplets, standard notation and bass tunings', () => {
    const exercise = buildExercise(
      settings((s) => {
        s.tonic = 'Eb'
        s.degrees = ['1', 'b3', '5']
        s.instrument = { ...s.instrument, presetId: 'bass4', tuningId: 'standard', tuning: ['E1', 'A1', 'D2', 'G2'], program: 33 }
        s.rhythm.subdivision = '8t'
        s.display = { labels: 'note', notation: 'scoreTab' }
      }),
    )
    const { score, diagnostics } = parse(exercise.tex)
    expect(diagnostics).toEqual([])
    const staff = score.tracks[0].staves[0]
    expect(staff.tuning).toHaveLength(4)
    expect(staff.showStandardNotation).toBe(true)
    const beats = beatsOf(score).flat()
    expect(beats[0].tupletNumerator).toBe(3)
    expect(new Set(beats.filter((b) => !b.isRest).map((b) => b.text))).toEqual(new Set(['Eb', 'Gb', 'Bb']))
  })

  it('writes silent bars between positions with one rest per beat', () => {
    const exercise = buildExercise(
      settings((s) => {
        s.navigation.mode = 'all'
        s.navigation.gap = 'restBar'
        s.rhythm.subdivision = '8t'
      }),
    )
    const { score, diagnostics } = parse(exercise.tex)
    expect(diagnostics).toEqual([])
    const beats = beatsOf(score)
    expect(beats).toHaveLength(exercise.bars.length)
    const silent = exercise.bars.findIndex((bar) => bar.every((slot) => !slot))
    expect(silent).toBeGreaterThan(0)
    expect(beats[silent]).toHaveLength(4)
    expect(beats[silent].every((b) => b.isRest && b.tupletNumerator === -1)).toBe(true)
  })

  it('renders an empty rest bar when there is nothing to play', () => {
    const exercise = buildExercise(settings((s) => (s.degrees = [])))
    expect(exercise.problems).toContain('Choisis au moins un degré.')
    const { score, diagnostics } = parse(exercise.tex)
    expect(diagnostics).toEqual([])
    expect(beatsOf(score)[0].every((b) => b.isRest)).toBe(true)
  })
})
