import { toAlphaTex } from './export/alphatex'
import { STRATEGIES } from './fingering/registry'
import type { FingeringContext, Position } from './fingering/types'
import type { Fretboard } from './instrument/fretboard'
import { parseTuning } from './instrument/tuning'
import { navigate, type Step } from './navigation/navigate'
import { layoutBars, notesPerBar, rhythmError, type Slot } from './rhythm/rhythm'
import { DEFAULT_SETTINGS, effectiveWeights, type Settings } from './settings'
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
  /** Why the exercise is empty or incomplete. */
  problems: string[]
}

export function exerciseTitle(settings: Settings): string {
  return settings.tonic + ' : ' + (settings.degrees.join(' - ') || '?')
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

  const steps = navigate(
    positions,
    { ...settings.navigation, weights: effectiveWeights(settings.navigation) },
    settings.pattern,
    targets.reference,
  )
  const rhythmProblem = rhythmError(settings.rhythm)
  if (rhythmProblem) {
    problems.push(rhythmProblem)
  }
  const bars = rhythmProblem ? [] : layoutBars(steps, notesPerBar(settings.rhythm), settings.navigation.gap)
  const title = exerciseTitle(settings)
  const tex = toAlphaTex(bars, {
    title,
    tempo: settings.rhythm.tempo,
    tsNum: settings.rhythm.tsNum,
    tsDen: settings.rhythm.tsDen,
    subdivision: settings.rhythm.subdivision,
    tuning: board.tuning,
    program: settings.instrument.program,
    tonic: settings.tonic,
    labels: settings.display.labels,
    notation: settings.display.notation,
  })
  return { board, targets, positions, steps, bars, tex, title, problems }
}
