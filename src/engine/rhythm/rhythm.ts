import type { FretNote, Position } from '../fingering/types'
import type { GapMode, Step } from '../navigation/navigate'

export const SUBDIVISIONS = ['4', '8', '8t', '16', '16t'] as const
export type Subdivision = (typeof SUBDIVISIONS)[number]

export const SUBDIVISION_LABELS: Record<Subdivision, string> = {
  '4': 'Noires',
  '8': 'Croches',
  '8t': 'Triolets de croches',
  '16': 'Doubles croches',
  '16t': 'Sextolets (triolets de doubles)',
}

export const TIME_DENOMINATORS = [4, 8] as const
export type TimeDenominator = (typeof TIME_DENOMINATORS)[number]

export interface RhythmOptions {
  subdivision: Subdivision
  tsNum: number
  tsDen: TimeDenominator
  tempo: number
}

/** Ticks in a whole note: a quarter is 48, so that triplets are whole numbers too. */
export const WHOLE_TICKS = 192

const TICKS: Record<Subdivision, number> = { '4': 48, '8': 24, '8t': 16, '16': 12, '16t': 8 }

export function noteTicks(subdivision: Subdivision): number {
  return TICKS[subdivision]
}

export function isTuplet(subdivision: Subdivision): boolean {
  return subdivision.endsWith('t')
}

/** alphaTex duration value of a subdivision. */
export function texDuration(subdivision: Subdivision): number {
  return Number(subdivision.replace('t', ''))
}

export function barTicks(r: { tsNum: number; tsDen: number }): number {
  return r.tsNum * (WHOLE_TICKS / r.tsDen)
}

export function notesPerBar(r: RhythmOptions): number {
  return barTicks(r) / TICKS[r.subdivision]
}

export function rhythmError(r: RhythmOptions): string | null {
  const perBar = notesPerBar(r)
  if (!Number.isInteger(perBar) || (isTuplet(r.subdivision) && perBar % 3 !== 0)) {
    return SUBDIVISION_LABELS[r.subdivision] + ' : ne remplit pas exactement une mesure en ' + r.tsNum + '/' + r.tsDen + '.'
  }
  return null
}

export type Slot = { note: FretNote; position: Position } | null

/**
 * Cuts the steps into bars of `perBar` notes, padding with rests. A rest step takes one slot. A gap
 * starts a new bar, and adds a full bar of rest with the "restBar" mode.
 */
export function layoutBars(steps: readonly Step[], perBar: number, gap: GapMode): Slot[][] {
  const bars: Slot[][] = []
  let current: Slot[] = []
  const flush = () => {
    if (current.length > 0) {
      bars.push([...current, ...Array<Slot>(perBar - current.length).fill(null)])
      current = []
    }
  }
  for (const step of steps) {
    if (step.kind === 'gap') {
      flush()
      if (gap === 'restBar') {
        bars.push(Array<Slot>(perBar).fill(null))
      }
      continue
    }
    current.push(step.kind === 'rest' ? null : { note: step.note, position: step.position })
    if (current.length === perBar) {
      flush()
    }
  }
  flush()
  return bars
}
