import type { FretNote, Position } from './fingering/types'
import { enabledStrings, isFretPlayable, type Fretboard } from './instrument/fretboard'
import type { Step } from './navigation/navigate'
import { noteTicks, SUBDIVISIONS, WHOLE_TICKS, type Subdivision } from './rhythm/rhythm'
import { DEGREE_INFO, DEGREES, type Degree } from './theory/degrees'
import { LIBRARY, LIBRARY_ENTRIES } from './theory/library'
import { pitchClass } from './theory/pitch'
import { spellDegree, tonicPitchClass, type Tonic } from './theory/spelling'
import type { TargetSet } from './theory/targets'

/** One approach note, defined relative to the target: diatonic (scale neighbor) or chromatic (half step), above or below. */
export interface ApproachStep {
  diatonic: boolean
  above: boolean
}

export const ENCLOSURE_TARGETS = ['all', 'reference', 'every'] as const
export type EnclosureTargets = (typeof ENCLOSURE_TARGETS)[number]

/** "line": the form follows the direction of the line; "fixed": the same form everywhere; "custom": one form each way. */
export const ENCLOSURE_DIRECTIONS = ['line', 'fixed', 'custom'] as const
export type EnclosureDirection = (typeof ENCLOSURE_DIRECTIONS)[number]

export const APPROACH_SCALE_AUTO = 'auto'
export const APPROACH_SCALE_CHROMATIC = 'chromatic'

export interface EnclosureOptions {
  enabled: boolean
  /** Approach steps in playing order, e.g. "D+ C-". With direction "custom": the form for a rising line. */
  spec: string
  direction: EnclosureDirection
  /** With direction "custom": the form for a falling line. */
  specDown: string
  targets: EnclosureTargets
  /** With targets "every": one target every N notes. */
  every: number
  /** Scale giving the diatonic neighbors: auto, chromatic, or a library entry id. */
  scale: string
  /** Put every target on a beat (subdivision chosen from the group size, pickup rests). */
  align: boolean
  /** Write approach notes as ghost notes (parentheses, played softer). */
  ghost: boolean
}

export const ENCLOSURE_PRESETS: { spec: string; label: string; family: string }[] = [
  { spec: 'C-', label: 'Chromatique par dessous', family: 'Approche simple' },
  { spec: 'C+', label: 'Chromatique par dessus', family: 'Approche simple' },
  { spec: 'D+', label: 'Diatonique par dessus', family: 'Approche simple' },
  { spec: 'D-', label: 'Diatonique par dessous', family: 'Approche simple' },
  { spec: 'D+ C-', label: 'Bebop : diatonique dessus, chromatique dessous', family: 'Enclosure 2 notes' },
  { spec: 'C+ C-', label: 'Chromatique dessus et dessous', family: 'Enclosure 2 notes' },
  { spec: 'D+ D-', label: 'Diatonique dessus et dessous', family: 'Enclosure 2 notes' },
  { spec: 'C- D+', label: 'Chromatique dessous, diatonique dessus', family: 'Enclosure 2 notes' },
  { spec: 'D+ C+', label: 'Double chromatique par dessus', family: 'Double approche' },
  { spec: 'D- C-', label: 'Double chromatique par dessous', family: 'Double approche' },
  { spec: 'D+ D- C-', label: 'Dessus, dessous, chromatique dessous', family: 'Enclosure 3 notes' },
  { spec: 'D+ C+ C-', label: 'Dessus, chromatique dessus, chromatique dessous', family: 'Enclosure 3 notes' },
  { spec: 'D+ C+ D- C-', label: 'Double dessus, double dessous', family: 'Enclosure 4 notes' },
]

/** Reads "D+ C-" (also "d+c-", "D+, C-"). Unknown tokens are ignored, 6 steps at most. */
export function parseEnclosure(spec: string): ApproachStep[] {
  return (spec.toUpperCase().match(/[DC][+-]/g) ?? [])
    .slice(0, 6)
    .map((token) => ({ diatonic: token[0] === 'D', above: token[1] === '+' }))
}

/**
 * The form to play when the line arrives on the target going up (ascending) or down: the last
 * approach note comes from the side the line comes from (below when rising, above when falling),
 * so the enclosure turns away from the line just before the target. A form already ending on that
 * side is kept. Otherwise a form with notes on both sides plays its groups in reverse order (same
 * notes, D+ C- -> C- D+: A F# G rising, F# A G falling); a one-sided form switches side (C- -> C+).
 */
export function orientEnclosure(steps: readonly ApproachStep[], ascending: boolean): ApproachStep[] {
  const rightSide = (form: readonly ApproachStep[]) => form.length === 0 || form[form.length - 1].above !== ascending
  if (rightSide(steps)) {
    return [...steps]
  }
  // Runs of consecutive steps on the same side keep their inner order: D+ C+ D- C- -> D- C- D+ C+
  const runs: ApproachStep[][] = []
  for (const step of steps) {
    const run = runs[runs.length - 1]
    if (run && run[0].above === step.above) {
      run.push(step)
    } else {
      runs.push([step])
    }
  }
  const reversed = runs.reverse().flat()
  return runs.length > 1 && rightSide(reversed) ? reversed : steps.map((s) => ({ ...s, above: !s.above }))
}

export interface ApproachScale {
  /** Null: no scale, a diatonic approach is a whole step away. */
  degrees: Degree[] | null
  name: string
}

const semitones = (degrees: readonly Degree[]) => new Set(degrees.map((d) => DEGREE_INFO[d].semitones))

// Where "auto" looks for a scale holding the chosen degrees, in this order. "Other" (diminished
// scales...) comes before the harmonic minor modes: dim7 -> whole-half, 7b9 -> half-whole
const AUTO_CATEGORIES = ['major-modes', 'melodic-minor', 'other', 'harmonic-minor']

/**
 * Scale used for diatonic approaches. "auto": the chosen degrees when they form a scale (7 notes or
 * more), else the first 7-note scale of the library that contains them (Cmaj7 -> ionian, Cm7 -> dorian).
 */
export function approachScale(degrees: readonly Degree[], choice: string): ApproachScale {
  if (choice === APPROACH_SCALE_CHROMATIC) {
    return { degrees: null, name: 'Chromatique' }
  }
  const chosen = LIBRARY_ENTRIES.find((e) => e.id === choice)
  if (chosen) {
    return { degrees: chosen.degrees, name: chosen.name }
  }
  if (degrees.length >= 7) {
    return { degrees: [...degrees], name: 'Degrés choisis' }
  }
  const wanted = semitones(degrees)
  const match = AUTO_CATEGORIES.flatMap((id) => LIBRARY.find((c) => c.id === id)!.entries).find((e) => {
    const scale = semitones(e.degrees)
    return e.degrees.length >= 7 && [...wanted].every((s) => scale.has(s))
  })
  return match ? { degrees: match.degrees, name: match.name } : { degrees: null, name: 'Chromatique' }
}

/** Pitch of an approach note for a target. */
export function approachMidi(target: number, step: ApproachStep, scale: ReadonlySet<number> | null): number {
  const direction = step.above ? 1 : -1
  if (!step.diatonic) {
    return target + direction
  }
  if (scale) {
    for (let distance = 1; distance < 12; distance++) {
      if (scale.has(pitchClass(target + direction * distance))) {
        return target + direction * distance
      }
    }
  }
  return target + 2 * direction
}

/**
 * Degree naming an approach note: the scale degree when the note belongs to the scale, otherwise
 * the letter next to the target (D# under E, Ab over G). C# under D and A# under B have no degree
 * in the app and are written Db and Bb.
 */
export function approachDegree(tonic: Tonic, target: Degree, targetMidi: number, midi: number, scale: readonly Degree[] | null): Degree {
  const offset = pitchClass(midi - tonicPitchClass(tonic))
  const inScale = scale?.find((d) => DEGREE_INFO[d].semitones === offset)
  if (inScale) {
    return inScale
  }
  const step = (DEGREE_INFO[target].step + (midi > targetMidi ? 1 : 6)) % 7
  const candidates = DEGREES.filter((d) => DEGREE_INFO[d].semitones === offset)
  return candidates.find((d) => DEGREE_INFO[d].step === step) ?? candidates[0]
}

/**
 * Places an approach note next to its target, in the target's position: inside the window (one
 * fret of stretch allowed), on the target's string if possible, as close as possible to its fret.
 * Falls back to a nearby fret outside the window; null when nothing is playable.
 */
export function placeApproach(board: Fretboard, position: Position, target: FretNote, midi: number, degree: Degree): FretNote | null {
  let best: FretNote | null = null
  let bestScore = Infinity
  for (const string of enabledStrings(board)) {
    const fret = midi - board.tuning[string]
    if (!isFretPlayable(board, fret)) {
      continue
    }
    const inWindow = fret === 0 ? position.lo <= 1 : fret >= position.lo - 1 && fret <= position.hi + 1
    const distance = Math.abs(fret - target.fret)
    if (!inWindow && distance > 4) {
      continue
    }
    const score = Math.abs(string - target.string) * 3 + distance + (inWindow ? 0 : 10)
    if (score < bestScore) {
      bestScore = score
      best = { string, fret, midi, degree, ext: fret !== 0 && (fret < position.lo || fret > position.hi), approach: true }
    }
  }
  return best
}

export interface EnclosurePlan {
  /** Forms played when the line arrives going up / going down (identical with direction "fixed"). */
  up: ApproachStep[]
  down: ApproachStep[]
  /** Longest form: the number of slots reserved for approaches when aligned. */
  length: number
  scale: ApproachScale
  /** Notes from one enclosed target to the next (approaches included), when regular. */
  groupSize: number | null
  /** Subdivision to use: the chosen one, or the one that puts every target on a beat. */
  subdivision: Subdivision
  aligned: boolean
  /** Why the targets cannot be aligned on the beats, when alignment is asked. */
  alignProblem: string | null
}

export function enclosurePlan(
  options: EnclosureOptions,
  degrees: readonly Degree[],
  subdivision: Subdivision,
  tsDen: number,
): EnclosurePlan {
  const spec = options.enabled ? parseEnclosure(options.spec) : []
  const forms =
    options.direction === 'fixed'
      ? { up: spec, down: spec }
      : options.direction === 'custom'
        ? { up: spec, down: options.enabled ? parseEnclosure(options.specDown) : [] }
        : { up: orientEnclosure(spec, true), down: orientEnclosure(spec, false) }
  const length = Math.max(forms.up.length, forms.down.length)
  const scale = approachScale(degrees, options.scale)
  const base = { ...forms, length, scale, groupSize: null, subdivision, aligned: false, alignProblem: null }
  if (length === 0) {
    return base
  }
  const groupSize = options.targets === 'all' ? length + 1 : options.targets === 'every' ? length + options.every : null
  if (!options.align) {
    return { ...base, groupSize }
  }
  if (groupSize === null) {
    return { ...base, alignProblem: 'Alignement sur les temps possible avec les cibles « toutes » ou « une sur N ».' }
  }
  const aligned = SUBDIVISIONS.find((s) => noteTicks(s) * groupSize === WHOLE_TICKS / tsDen)
  if (!aligned) {
    return {
      ...base,
      groupSize,
      alignProblem: 'Groupes de ' + groupSize + ' notes : aucune subdivision ne met chaque cible sur un temps.',
    }
  }
  return { ...base, groupSize, subdivision: aligned, aligned: true }
}

export interface EnclosureContext {
  board: Fretboard
  targets: TargetSet
  options: EnclosureOptions
  plan: EnclosurePlan
}

const scalePitches = (targets: TargetSet, plan: EnclosurePlan) => {
  const tonic = tonicPitchClass(targets.tonic)
  return plan.scale.degrees ? new Set(plan.scale.degrees.map((d) => pitchClass(tonic + DEGREE_INFO[d].semitones))) : null
}

/** Approach pitches of a form for a target; a step landing on the target or on the previous step is skipped. */
function approachPitches(target: number, form: readonly ApproachStep[], scale: ReadonlySet<number> | null): number[] {
  const pitches: number[] = []
  for (const step of form) {
    const midi = approachMidi(target, step, scale)
    // Two approach steps can land on the same note (D+ and C+ over E in C major)
    if (midi !== target && midi !== pitches[pitches.length - 1]) {
      pitches.push(midi)
    }
  }
  return pitches
}

/**
 * For each note step, whether the line arrives on it going up: compared with the previous note of
 * the same segment; the first note takes the direction the line leaves in; a repeated pitch keeps
 * the current direction.
 */
export function lineDirections(steps: readonly Step[]): Map<Step, boolean> {
  const directions = new Map<Step, boolean>()
  const segments: Extract<Step, { kind: 'note' }>[][] = [[]]
  for (const step of steps) {
    if (step.kind === 'gap') {
      segments.push([])
    } else if (step.kind === 'note') {
      segments[segments.length - 1].push(step)
    }
  }
  for (const notes of segments) {
    let ascending = notes.length > 1 ? notes[1].note.midi >= notes[0].note.midi : true
    notes.forEach((step, i) => {
      if (i > 0 && step.note.midi !== notes[i - 1].note.midi) {
        ascending = step.note.midi > notes[i - 1].note.midi
      }
      directions.set(step, ascending)
    })
  }
  return directions
}

/**
 * Inserts the approach notes before each target, with the form matching the direction of the line.
 * An approach repeating the note just played is skipped. With alignment, rests keep every target
 * on a beat: a pickup at the start of each segment, and a rest for each approach not played
 * (duplicate, shorter form, out of the neck).
 */
export function applyEnclosures(steps: readonly Step[], { board, targets, options, plan }: EnclosureContext): Step[] {
  if (plan.length === 0) {
    return [...steps]
  }
  const scale = scalePitches(targets, plan)
  const directions = lineDirections(steps)
  const rests = (count: number): Step[] => Array.from({ length: Math.max(0, count) }, () => ({ kind: 'rest' }))
  const out: Step[] = []
  let index = 0
  let previous: number | null = null
  for (const step of steps) {
    if (step.kind !== 'note') {
      out.push(step)
      if (step.kind === 'gap') {
        index = 0
        previous = null
      }
      continue
    }
    const target = step.note
    const isTarget =
      options.targets === 'all' ||
      (options.targets === 'reference' ? target.degree === targets.reference : index % Math.max(1, options.every) === 0)
    if (isTarget) {
      const form = directions.get(step) ? plan.up : plan.down
      const pitches = approachPitches(target.midi, form, scale)
      const notes = (pitches[0] === previous ? pitches.slice(1) : pitches)
        .map((midi) =>
          placeApproach(board, step.position, target, midi, approachDegree(targets.tonic, target.degree, target.midi, midi, plan.scale.degrees)),
        )
        .filter((n): n is FretNote => n !== null)
      if (plan.aligned) {
        out.push(...rests((index === 0 ? plan.groupSize! - plan.length : 0) + plan.length - notes.length))
      }
      out.push(...notes.map((note): Step => ({ kind: 'note', note, position: step.position })))
    }
    out.push(step)
    previous = target.midi
    index++
  }
  return out
}

/** The enclosure played on the reference degree, spelled in the key, rising and falling: "D B → C". */
export function enclosureExample(targets: TargetSet, plan: EnclosurePlan): { up: string; down: string } | null {
  if (plan.length === 0 || !targets.reference) {
    return null
  }
  const reference = targets.reference
  const target = 60 + pitchClass(tonicPitchClass(targets.tonic) + DEGREE_INFO[reference].semitones)
  const scale = scalePitches(targets, plan)
  const name = (degree: Degree) => spellDegree(targets.tonic, degree)
  const describe = (form: readonly ApproachStep[]) =>
    [
      ...approachPitches(target, form, scale).map((midi) => name(approachDegree(targets.tonic, reference, target, midi, plan.scale.degrees))),
      '→',
      name(reference),
    ].join(' ')
  return { up: describe(plan.up), down: describe(plan.down) }
}
