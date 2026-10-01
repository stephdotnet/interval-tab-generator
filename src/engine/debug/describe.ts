import { buildExercise } from '../exercise'
import type { FretNote } from '../fingering/types'
import { FINGERING_SYSTEMS } from '../fingering/types'
import { COST_PRESET_IDS } from '../navigation/cost'
import type { Settings } from '../settings'

/** "string:fret" with strings numbered like a tab (1 = highest string). */
function tabRef(note: FretNote, strings: number): string {
  const ref = strings - note.string + ':' + note.fret
  return note.approach ? '(' + ref + ')' : ref
}

/** Text dump of an exercise: positions and the notes of each bar, to inspect the engine output. */
export function describeExercise(settings: Settings): string {
  const exercise = buildExercise(settings)
  const strings = exercise.board.tuning.length
  const lines = [exercise.title]
  exercise.problems.forEach((p) => lines.push('! ' + p))
  lines.push('', 'Positions (' + exercise.positions.length + ')')
  exercise.positions.forEach((p, i) =>
    lines.push('  ' + i + ' ' + p.label.padEnd(26) + p.notes.map((n) => tabRef(n, strings)).join(' ')),
  )
  lines.push('', 'Mesures (' + exercise.bars.length + ')')
  exercise.bars.forEach((bar, i) =>
    lines.push('  ' + String(i + 1).padStart(3) + ' | ' + bar.map((s) => (s ? tabRef(s.note, strings) : '-')).join(' ')),
  )
  return lines.join('\n')
}

/** Best path of every system with every cost preset, one line each, to tune the cost model. */
export function compareBestPaths(settings: Settings): string {
  const lines: string[] = []
  for (const system of FINGERING_SYSTEMS) {
    for (const preset of COST_PRESET_IDS) {
      const exercise = buildExercise({
        ...settings,
        fingering: { ...settings.fingering, system },
        navigation: { ...settings.navigation, mode: 'bestPath', costPreset: preset },
      })
      const strings = exercise.board.tuning.length
      const path = exercise.problems.length
        ? '! ' + exercise.problems.join(' ')
        : exercise.steps.map((s) => (s.kind === 'note' ? tabRef(s.note, strings) : s.kind === 'rest' ? '-' : '|')).join(' ')
      lines.push(system.padEnd(6) + preset.padEnd(9) + path)
    }
  }
  return lines.join('\n')
}
