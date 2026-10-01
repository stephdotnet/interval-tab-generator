import { importer, Settings as AlphaTabSettings } from '@coderline/alphatab'
import { describe, expect, it } from 'vitest'
import {
  approachDegree,
  approachMidi,
  approachScale,
  enclosureExample,
  enclosurePlan,
  ENCLOSURE_PRESETS,
  lineDirections,
  orientEnclosure,
  parseEnclosure,
  placeApproach,
  type EnclosureOptions,
} from './enclosures'
import { buildExercise } from './exercise'
import type { FretNote, Position } from './fingering/types'
import type { Step } from './navigation/navigate'
import { DEGREE_INFO, type Degree } from './theory/degrees'
import { buildTargets } from './theory/targets'
import { midiToName, pitchClass } from './theory/pitch'
import { spellDegree } from './theory/spelling'
import { DEFAULT_SETTINGS, type Settings } from './settings'
import { settingsFromQuery, settingsToQuery } from './url'

const C_MAJOR = new Set([0, 2, 4, 5, 7, 9, 11])
const G4 = 67
const E4 = 64

/** Approach note names for a target, in C major. */
const approach = (spec: string, target: number) => {
  const pitches: number[] = []
  for (const step of parseEnclosure(spec)) {
    const midi = approachMidi(target, step, C_MAJOR)
    if (midi !== target && midi !== pitches[pitches.length - 1]) {
      pitches.push(midi)
    }
  }
  return pitches.map((m) => midiToName(m).replace(/\d/, '')).join(' ')
}

const OPTIONS: EnclosureOptions = { ...DEFAULT_SETTINGS.enclosure, enabled: true }

const settings = (patch: (s: Settings) => void): Settings => {
  const s = structuredClone(DEFAULT_SETTINGS)
  s.enclosure.enabled = true
  patch(s)
  return s
}

describe('parsing', () => {
  it('reads approach steps in order', () => {
    expect(parseEnclosure('D+ C-')).toEqual([
      { diatonic: true, above: true },
      { diatonic: false, above: false },
    ])
    expect(parseEnclosure('d+c-, x, C+')).toHaveLength(3)
    expect(parseEnclosure('nothing')).toEqual([])
    expect(parseEnclosure('C- C- C- C- C- C- C- C-')).toHaveLength(6)
  })

  it('has presets that all parse', () => {
    for (const preset of ENCLOSURE_PRESETS) {
      expect(parseEnclosure(preset.spec).length, preset.spec).toBe(preset.spec.split(' ').length)
    }
  })
})

const form = (steps: { diatonic: boolean; above: boolean }[]) =>
  steps.map((s) => (s.diatonic ? 'D' : 'C') + (s.above ? '+' : '-')).join(' ')

describe('orientation', () => {
  const orient = (spec: string, ascending: boolean) => form(orientEnclosure(parseEnclosure(spec), ascending))

  it('keeps a form whose last approach comes from the side of the line', () => {
    expect(orient('D+ C-', true)).toBe('D+ C-')
    expect(orient('C- D+', false)).toBe('C- D+')
    expect(orient('D+ C+', false)).toBe('D+ C+')
    expect(orient('', true)).toBe('')
  })

  it('reverses the groups of a two-sided form', () => {
    expect(orient('D+ C-', false)).toBe('C- D+')
    expect(orient('C- D+', true)).toBe('D+ C-')
    expect(orient('D+ C+ D- C-', false)).toBe('D- C- D+ C+')
    expect(orient('D+ C+ C-', false)).toBe('C- D+ C+')
  })

  it('switches side for a one-sided form, or when reversing is not enough', () => {
    expect(orient('C-', false)).toBe('C+')
    expect(orient('D- C-', false)).toBe('D+ C+')
    expect(orient('D+ C+', true)).toBe('D- C-')
    expect(orient('D+ C- D+', true)).toBe('D- C+ D-')
  })
})

describe('line direction', () => {
  const position = { id: 'p' } as Position
  const notes = (...midis: (number | 'gap')[]): Step[] =>
    midis.map((m) =>
      m === 'gap' ? { kind: 'gap' } : { kind: 'note', note: { string: 0, fret: 0, midi: m, degree: '1', ext: false }, position },
    )
  const directions = (steps: Step[]) => steps.filter((s) => s.kind === 'note').map((s) => lineDirections(steps).get(s))

  it('compares each note with the previous one', () => {
    expect(directions(notes(60, 62, 64, 62, 60))).toEqual([true, true, true, false, false])
  })

  it('gives the first note the direction the line leaves in, and keeps it on repeated pitches', () => {
    expect(directions(notes(64, 62, 60))).toEqual([false, false, false])
    expect(directions(notes(60, 60, 62, 62))).toEqual([true, true, true, true])
    expect(directions(notes(64, 62, 62))).toEqual([false, false, false])
  })

  it('restarts after a gap', () => {
    expect(directions(notes(60, 64, 'gap', 67, 65))).toEqual([true, true, false, false])
  })
})

describe('approach pitches (C major)', () => {
  it('builds the classic enclosures on G', () => {
    // Sharp names from midiToName: F# is F#, Ab is G#
    expect(approach('C-', G4)).toBe('F#')
    expect(approach('C+', G4)).toBe('G#')
    expect(approach('D+', G4)).toBe('A')
    expect(approach('D-', G4)).toBe('F')
    expect(approach('D+ C-', G4)).toBe('A F#')
    expect(approach('C+ C-', G4)).toBe('G# F#')
    expect(approach('D+ D-', G4)).toBe('A F')
    expect(approach('D+ C+', G4)).toBe('A G#')
    expect(approach('D- C-', G4)).toBe('F F#')
    expect(approach('D+ D- C-', G4)).toBe('A F F#')
    expect(approach('D+ C+ D- C-', G4)).toBe('A G# F F#')
  })

  it('drops an approach that repeats the previous one', () => {
    // Over E, the diatonic neighbor F is also the half step above
    expect(approach('D+ C+', E4)).toBe('F')
    expect(approach('D+ C-', E4)).toBe('F D#')
  })

  it('uses a whole step without scale', () => {
    expect(approachMidi(G4, { diatonic: true, above: true }, null)).toBe(69)
    expect(approachMidi(G4, { diatonic: true, above: false }, null)).toBe(65)
  })
})

describe('spelling', () => {
  const ionian: Degree[] = ['1', '2', '3', '4', '5', '6', '7']
  const name = (target: Degree, targetMidi: number, midi: number, scale: Degree[] | null = ionian) =>
    spellDegree('C', approachDegree('C', target, targetMidi, midi, scale))

  it('names chromatic approaches from the neighbor letter', () => {
    expect(name('5', G4, 66)).toBe('F#')
    expect(name('5', G4, 68)).toBe('Ab')
    expect(name('3', E4, 63)).toBe('D#')
    expect(name('1', 60, 59)).toBe('B')
  })

  it('uses the scale degree when the approach is in the scale', () => {
    expect(approachDegree('C', '3', E4, 65, ionian)).toBe('4')
    expect(approachDegree('C', 'b3', 63, 65, ['1', '2', 'b3', '4', '5', '6', 'b7'])).toBe('4')
  })

  it('falls back to a flat when the sharp degree does not exist', () => {
    expect(name('2', 62, 61)).toBe('Db')
    expect(name('7', 71, 70, null)).toBe('Bb')
  })
})

describe('approach scale', () => {
  const scale = (degrees: string) => approachScale(degrees.split(' ') as Degree[], 'auto').name

  it('finds the parent scale of an arpeggio', () => {
    expect(scale('1 3 5 7')).toBe('Ionien (gamme majeure)')
    expect(scale('1 3 5 b7')).toBe('Mixolydien')
    expect(scale('1 b3 5 b7')).toBe('Dorien')
    expect(scale('1 b3 b5 b7')).toBe('Locrien')
    expect(scale('1 b3 b5 bb7')).toBe('Diminuée ton / demi-ton')
    expect(scale('1 b2 3 5 b7')).toBe('Diminuée demi-ton / ton')
    expect(scale('1 3 #5 b7')).toBe('Mixolydien b6')
    expect(scale('1 b3 5 7')).toBe('Mineure mélodique')
    expect(scale('1 2 b3 4 5 6 b7')).toBe('Degrés choisis')
  })

  it('honours an explicit choice', () => {
    expect(approachScale(['1', '3', '5'], 'lydian').name).toBe('Lydien')
    expect(approachScale(['1', '3', '5'], 'chromatic').degrees).toBeNull()
  })
})

describe('placement', () => {
  const board = {
    tuning: [40, 45, 50, 55, 59, 64],
    minFret: 0,
    maxFret: 15,
    allowOpen: true,
    disabledStrings: [],
  }
  // Box 7-10, target C4 on the D string fret 10
  const position = { id: 'p', label: 'p', lo: 7, hi: 10, center: 8.5, notes: [], candidates: [] } as Position
  const target: FretNote = { string: 2, fret: 10, midi: 60, degree: '1', ext: false }

  it('prefers the target string, inside the window', () => {
    // B3 under C4 (D string fret 10): D string fret 9
    expect(placeApproach(board, position, target, 59, '7')).toMatchObject({ string: 2, fret: 9, approach: true, ext: false })
    // D4 over C4: fret 12 on the D string is 2 frets outside, the G string fret 7 is inside
    expect(placeApproach(board, position, target, 62, '2')).toMatchObject({ string: 3, fret: 7 })
  })

  it('marks one-fret stretches and refuses unplayable notes', () => {
    expect(placeApproach(board, position, target, 61, 'b2')).toMatchObject({ string: 2, fret: 11, ext: true })
    expect(placeApproach(board, position, { ...target, string: 0, fret: 0, midi: 40 }, 39, '7')).toBeNull()
  })
})

describe('plan and alignment', () => {
  it('picks the subdivision that puts every target on a beat', () => {
    const plan = (spec: string, patch: Partial<EnclosureOptions> = {}, tsDen = 4) =>
      enclosurePlan({ ...OPTIONS, spec, ...patch }, ['1', '3', '5'], '8', tsDen)
    expect(plan('C-').subdivision).toBe('8')
    expect(plan('D+ C-').subdivision).toBe('8t')
    expect(plan('D+ D- C-').subdivision).toBe('16')
    expect(plan('D+ C-', { targets: 'every', every: 4 }).subdivision).toBe('16t')
    expect(plan('D+ C-', { align: false }).subdivision).toBe('8')
    expect(plan('D+ C-', {}, 8).subdivision).toBe('16t')
  })

  it('explains when alignment is impossible', () => {
    const plan = enclosurePlan({ ...OPTIONS, spec: 'D+ C+ D- C-' }, ['1', '3', '5'], '8', 4)
    expect(plan.aligned).toBe(false)
    expect(plan.subdivision).toBe('8')
    expect(plan.alignProblem).toMatch(/5 notes/)
    expect(enclosurePlan({ ...OPTIONS, targets: 'reference' }, ['1', '3', '5'], '8', 4).alignProblem).toMatch(/toutes/)
  })

  it('describes the enclosure on the reference degree', () => {
    const example = (tonic: 'C' | 'Eb', degrees: Degree[], spec: string) =>
      enclosureExample(buildTargets(tonic, degrees), enclosurePlan({ ...OPTIONS, spec }, degrees, '8', 4))
    expect(example('C', ['1', '3', '5'], 'D+ C-')).toEqual({ up: 'D B → C', down: 'B D → C' })
    expect(example('Eb', ['1', 'b3', '5', 'b7'], 'C+ C-')).toEqual({ up: 'Fb D → Eb', down: 'D Fb → Eb' })
    expect(example('C', ['3', '5'], 'D+ C-')?.up).toBe('F D# → E')
    expect(example('C', ['1', '3', '5'], 'C-')).toEqual({ up: 'B → C', down: 'Db → C' })
    expect(example('C', ['1'], '')).toBeNull()
  })

  it('is inactive when disabled or empty', () => {
    expect(enclosurePlan({ ...OPTIONS, enabled: false }, ['1'], '8', 4).length).toBe(0)
    expect(enclosurePlan({ ...OPTIONS, spec: '' }, ['1'], '8', 4).subdivision).toBe('8')
  })
})

describe('exercise', () => {
  const noteSteps = (s: Settings) => buildExercise(s).steps.filter((step) => step.kind === 'note')

  it('puts approaches before every target, next to it on the neck', () => {
    const exercise = buildExercise(settings((s) => (s.degrees = ['1', '3', '5'])))
    const notes = exercise.steps.flatMap((step) => (step.kind === 'note' ? [step] : []))
    notes.forEach((step, i) => {
      if (!step.note.approach) {
        return
      }
      const target = notes.slice(i + 1).find((n) => !n.note.approach)!
      expect(Math.abs(step.note.fret - target.note.fret), 'approach close to its target').toBeLessThanOrEqual(4)
      expect(step.position).toBe(target.position)
    })
    expect(notes.some((n) => n.note.approach)).toBe(true)
  })

  it('keeps every target on a beat when aligned', () => {
    // Box 5-8: no open string, every approach is playable
    const exercise = buildExercise(settings((s) => {
      s.degrees = ['1', '3', '5']
      s.navigation.positionIndex = 3
    }))
    expect(exercise.subdivision).toBe('8t')
    const beatSize = 3
    exercise.bars.forEach((bar) =>
      bar.forEach((slot, i) => {
        if (slot && !slot.note.approach) {
          expect(i % beatSize).toBe(0)
        }
      }),
    )
    // Pickup: one rest, then the two approach notes of the first target
    expect(exercise.bars[0][0]).toBeNull()
    expect(exercise.bars[0][1]?.note.approach).toBe(true)
    expect(exercise.bars[0][2]?.note.approach).toBe(true)
    expect(exercise.bars[0][3]?.note.approach).toBeFalsy()
  })

  it('encloses only the chosen targets', () => {
    const tonicOnly = noteSteps(settings((s) => {
      s.degrees = ['1', '3', '5']
      s.enclosure.targets = 'reference'
    }))
    tonicOnly.forEach((step, i) => {
      if (step.kind === 'note' && step.note.approach) {
        const target = tonicOnly.slice(i + 1).find((n) => n.kind === 'note' && !n.note.approach)
        expect(target?.kind === 'note' && target.note.degree).toBe('1')
      }
    })
    const everyThird = noteSteps(settings((s) => {
      s.degrees = ['1', '2', '3', '4', '5', '6', '7']
      s.navigation.positionIndex = 3
      s.pattern = { ...s.pattern, type: 'sequence', motif: '0 2 4', direction: 'up' }
      s.enclosure = { ...s.enclosure, targets: 'every', every: 3, spec: 'C-' }
    }))
    let plainIndex = 0
    let approaches = 0
    everyThird.forEach((step, i) => {
      if (step.kind !== 'note') {
        return
      }
      if (step.note.approach) {
        approaches++
        const next = everyThird[i + 1]
        expect(next.kind === 'note' && !next.note.approach).toBe(true)
        expect(plainIndex % 3).toBe(0)
      } else {
        plainIndex++
      }
    })
    expect(approaches).toBeGreaterThan(3)
  })

  /** For each enclosed target: whether the line arrives going up, and its approach pitches. */
  const enclosed = (s: Settings) => {
    const plain: number[] = []
    const result: { ascending: boolean; target: number; previous: number | null; approaches: number[] }[] = []
    let approaches: number[] = []
    for (const step of buildExercise(s).steps) {
      if (step.kind !== 'note') {
        continue
      }
      if (step.note.approach) {
        approaches.push(step.note.midi)
        continue
      }
      const previous = plain.length ? plain[plain.length - 1] : null
      if (approaches.length && previous !== null && previous !== step.note.midi) {
        result.push({ ascending: step.note.midi > previous, target: step.note.midi, previous, approaches })
      }
      plain.push(step.note.midi)
      approaches = []
    }
    return result
  }
  const scaleUpDown = (patch: (e: EnclosureOptions) => void) =>
    settings((s) => {
      s.degrees = ['1', '2', '3', '4', '5', '6', '7']
      s.navigation.positionIndex = 3
      s.pattern = { ...s.pattern, type: 'ascDesc', direction: 'upDown' }
      s.enclosure.align = false
      patch(s.enclosure)
    })

  it('orients the enclosure with the line: last approach from below going up, from above going down', () => {
    const groups = enclosed(scaleUpDown(() => {}))
    expect(groups.some((g) => g.ascending)).toBe(true)
    expect(groups.some((g) => !g.ascending)).toBe(true)
    for (const g of groups) {
      const last = g.approaches[g.approaches.length - 1]
      expect(last < g.target, 'target ' + g.target).toBe(g.ascending)
    }
  })

  it('plays the same form everywhere when fixed', () => {
    for (const g of enclosed(scaleUpDown((e) => (e.direction = 'fixed')))) {
      expect(g.approaches[g.approaches.length - 1]).toBeLessThan(g.target)
    }
  })

  it('never repeats the note just played', () => {
    const groups = enclosed(scaleUpDown((e) => (e.direction = 'fixed')))
    for (const g of groups) {
      expect(g.approaches[0]).not.toBe(g.previous)
    }
    // Falling scale with D+ C-: the scale step above the target is the note just played, only C- remains
    expect(groups.some((g) => !g.ascending && g.approaches.length === 1)).toBe(true)
  })

  it('uses one form each way, padding the shorter one when aligned', () => {
    const s = scaleUpDown((e) => {
      e.direction = 'custom'
      e.spec = 'C-'
      e.specDown = 'D+ C+'
      e.align = true
    })
    const exercise = buildExercise(s)
    expect(exercise.enclosure.length).toBe(2)
    expect(exercise.subdivision).toBe('8t')
    exercise.bars.forEach((bar) =>
      bar.forEach((slot, i) => {
        if (slot && !slot.note.approach) {
          expect(i % 3).toBe(0)
        }
      }),
    )
    s.enclosure.align = false
    for (const g of enclosed(s)) {
      expect(g.approaches.length).toBe(g.ascending ? 1 : g.approaches.length)
      if (g.ascending) {
        expect(g.approaches[0]).toBe(g.target - 1)
      }
    }
  })

  it('writes approach labels in parentheses and ghost notes on demand', () => {
    const tex = (ghost: boolean) =>
      buildExercise(settings((s) => {
        s.degrees = ['1', '3', '5']
        s.enclosure.ghost = ghost
      })).tex
    const parse = (text: string) => {
      const texImporter = new importer.AlphaTexImporter()
      texImporter.logErrors = false
      texImporter.initFromString(text, new AlphaTabSettings())
      const score = texImporter.readScore()
      return { score, errors: [...texImporter.parserDiagnostics.items, ...texImporter.semanticDiagnostics.items] }
    }
    const plain = parse(tex(false))
    expect(plain.errors).toEqual([])
    const beats = plain.score.tracks[0].staves[0].bars.flatMap((b) => b.voices[0].beats).filter((b) => !b.isRest)
    expect(beats.some((b) => b.text?.startsWith('('))).toBe(true)
    expect(beats.every((b) => !b.notes[0].isGhost)).toBe(true)
    const ghost = parse(tex(true))
    expect(ghost.errors).toEqual([])
    const ghostBeats = ghost.score.tracks[0].staves[0].bars.flatMap((b) => b.voices[0].beats).filter((b) => !b.isRest)
    ghostBeats.forEach((b) => expect(b.notes[0].isGhost).toBe((b.text ?? '').startsWith('(')))
  })

  it('round-trips through the URL', () => {
    const s = settings((x) => {
      x.enclosure = {
        enabled: true,
        spec: 'D+ C+ C-',
        direction: 'custom',
        specDown: 'C+',
        targets: 'every',
        every: 4,
        scale: 'dorian',
        align: false,
        ghost: true,
      }
    })
    expect(settingsFromQuery(settingsToQuery(s))).toEqual(s)
    expect(settingsFromQuery('enc=1&encsc=nope').enclosure.scale).toBe('auto')
  })

  it('names every approach note with a degree of its real pitch', () => {
    const exercise = buildExercise(settings((s) => {
      s.tonic = 'Eb'
      s.degrees = ['1', 'b3', '5', 'b7']
      s.enclosure.spec = 'D+ C+ D- C-'
      s.enclosure.align = false
    }))
    const approaches = exercise.steps.flatMap((step) => (step.kind === 'note' && step.note.approach ? [step.note] : []))
    expect(approaches.length).toBeGreaterThan(0)
    for (const note of approaches) {
      expect(DEGREE_INFO[note.degree].semitones).toBe(pitchClass(note.midi - 3))
    }
  })
})
