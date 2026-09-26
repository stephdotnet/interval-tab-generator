import type { FingeringSystem } from './fingering/types'
import type { NavigationMode } from './navigation/navigate'
import type { PatternType } from './patterns/types'

export const SYSTEM_LABELS: Record<FingeringSystem, string> = {
  box: 'Box',
  caged: 'CAGED',
  nps: 'N notes / corde',
}

export const MODE_LABELS: Record<NavigationMode, string> = {
  single: 'Une position',
  all: 'Toutes',
  bestPath: 'Best path',
}

export const PATTERN_LABELS: Record<PatternType, string> = {
  ascDesc: 'Montée / descente',
  sequence: 'Séquences',
  random: 'Aléatoire',
  pairs: 'Paires',
}
