import { DEGREE_INFO, normalizeDegrees, type Degree } from './degrees'
import { pitchClass } from './pitch'
import { tonicPitchClass, type Tonic } from './spelling'

export interface TargetSet {
  tonic: Tonic
  degrees: Degree[]
  /** Pitch class -> degree. When two degrees share a pitch class (#4 / b5), the first one wins. */
  byPitchClass: Map<number, Degree>
  /** Degree used as the anchor of interval pairs: the tonic if selected, otherwise the lowest degree. */
  reference: Degree | null
}

export function buildTargets(tonic: Tonic, degrees: readonly Degree[]): TargetSet {
  const normalized = normalizeDegrees(degrees)
  const byPitchClass = new Map<number, Degree>()
  for (const degree of normalized) {
    const pc = pitchClass(tonicPitchClass(tonic) + DEGREE_INFO[degree].semitones)
    if (!byPitchClass.has(pc)) {
      byPitchClass.set(pc, degree)
    }
  }
  return {
    tonic,
    degrees: normalized,
    byPitchClass,
    reference: normalized[0] ?? null,
  }
}

export function degreeOf(targets: TargetSet, midi: number): Degree | undefined {
  return targets.byPitchClass.get(pitchClass(midi))
}
