import { applyEnclosures, enclosurePlan, type EnclosurePlan } from './enclosures'
import { toAlphaTex } from './export/alphatex'
import { STRATEGIES } from './fingering/registry'
import type { FingeringContext, Position } from './fingering/types'
import type { Fretboard } from './instrument/fretboard'
import { parseTuning } from './instrument/tuning'
import { navigate, type Step } from './navigation/navigate'
import { layoutBars, notesPerBar, rhythmError, type Slot, type Subdivision } from './rhythm/rhythm'
import { DEFAULT_SETTINGS, effectiveWeights, type Settings } from './settings'
import { findEntry } from './theory/library'
import { buildTargets, type TargetSet } from './theory/targets'

export interface Exercise {
  board: Fretboard
  targets: TargetSet
  positions: Position[]
  steps: Step[]
  /** bars[bar][beat], matching the beats of the alphaTex score. */
  bars: Slot[][]
  tex: string
  title: string
  enclosure: EnclosurePlan
  /** Subdivision actually used (the enclosure alignment may impose one). */
  subdivision: Subdivision
  /** Why the exercise is empty or incomplete. */
  problems: string[]
}

/** "Cm7b5 (1 b3 b5 b7)", "C dorien (1 2 b3 ...)" when the library knows the degrees, else "C : 1 - 2 - #4". */
export function exerciseTitle(settings: Settings): string {
  const entry = findEntry(settings.degrees)
  if (!entry) {
    return settings.tonic + ' : ' + (settings.degrees.join(' - ') || '?')
  }
  const name = entry.symbol ?? ' ' + entry.name[0].toLowerCase() + entry.name.slice(1)
  return settings.tonic + name + ' (' + entry.degrees.join(' ') + ')'
}

export function buildExercise(settings: Settings): Exercise {
  const problems: string[] = []
  const tuning = parseTuning(settings.instrument.tuning)
  if (!tuning) {
    problems.push('Accordage invalide, accordage standard utilisé.')
  }
  const board: Fretboard = {
    tuning: tuning ?? parseTuning(DEFAULT_SETTINGS.instrument.tuning)!,
    minFret: settings.instrument.minFret,
    maxFret: settings.instrument.maxFret,
    allowOpen: settings.instrument.allowOpen,
    disabledStrings: settings.instrument.disabledStrings,
  }
  const targets = buildTargets(settings.tonic, settings.degrees)
  const ctx: FingeringContext = { board, targets, options: settings.fingering }
  const strategy = STRATEGIES[settings.fingering.system]
  const unavailable = strategy.unavailableReason(ctx)

  let positions: Position[] = []
  if (targets.degrees.length === 0) {
    problems.push('Choisis au moins un degré.')
  } else if (unavailable) {
    problems.push(unavailable)
  } else {
    positions = strategy.listPositions(ctx)
    if (positions.length === 0) {
      problems.push('Aucune position trouvée avec ces réglages (plage de cases, cordes, formes).')
    }
  }

  const enclosure = enclosurePlan(settings.enclosure, targets.degrees, settings.rhythm.subdivision, settings.rhythm.tsDen)
  const rhythm = { ...settings.rhythm, subdivision: enclosure.subdivision }
  const steps = applyEnclosures(
    navigate(positions, { ...settings.navigation, weights: effectiveWeights(settings.navigation) }, settings.pattern, targets.reference),
    { board, targets, options: settings.enclosure, plan: enclosure },
  )
  const rhythmProblem = rhythmError(rhythm)
  if (rhythmProblem) {
    problems.push(rhythmProblem)
  }
  const bars = rhythmProblem ? [] : layoutBars(steps, notesPerBar(rhythm), settings.navigation.gap)
  const title = exerciseTitle(settings)
  const tex = toAlphaTex(bars, {
    title,
    tempo: settings.rhythm.tempo,
    tsNum: settings.rhythm.tsNum,
    tsDen: settings.rhythm.tsDen,
    subdivision: rhythm.subdivision,
    tuning: board.tuning,
    program: settings.instrument.program,
    tonic: settings.tonic,
    labels: settings.display.labels,
    notation: settings.display.notation,
    ghostApproaches: settings.enclosure.ghost,
  })
  return { board, targets, positions, steps, bars, tex, title, problems, enclosure, subdivision: rhythm.subdivision }
}
