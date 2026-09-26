import { boxStrategy } from './box'
import { cagedStrategy } from './caged'
import { npsStrategy } from './nps'
import type { FingeringStrategy, FingeringSystem } from './types'

export const STRATEGIES: Record<FingeringSystem, FingeringStrategy> = {
  box: boxStrategy,
  caged: cagedStrategy,
  nps: npsStrategy,
}
