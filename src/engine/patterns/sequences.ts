import type { Direction } from './types'

export const MOTIF_PRESETS = [
  { motif: '0 1 2', label: 'Groupes de 3' },
  { motif: '0 1 2 3', label: 'Groupes de 4' },
  { motif: '0 2', label: 'Sauts de 1 (tierces en gamme)' },
  { motif: '0 1 2 0', label: '1-2-3-1' },
  { motif: '0 2 1', label: '1-3-2' },
  { motif: '0 3', label: 'Sauts de 2' },
]

/** Parses "0 1 2" or "0,-1,2" into offsets. Falls back to [0] when nothing valid is found. */
export function parseMotif(motif: string): number[] {
  const offsets = motif
    .split(/[\s,;]+/)
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isInteger(n) && Math.abs(n) <= 24)
  return offsets.length ? offsets : [0]
}

function run<T>(items: readonly T[], offsets: number[], step: number): T[] {
  const min = Math.min(0, ...offsets)
  const max = Math.max(0, ...offsets)
  const out: T[] = []
  for (let i = -min; i + max < items.length; i += step) {
    for (const offset of offsets) {
      out.push(items[i + offset])
    }
  }
  return out
}

/** Moves a motif along the list: "0 1 2" on C D E F gives C D E, D E F. Descending uses the reversed list. */
export function sequence<T>(items: readonly T[], motif: string, step: number, direction: Direction): T[] {
  const offsets = parseMotif(motif)
  const safeStep = Math.max(1, Math.floor(step))
  const up = run(items, offsets, safeStep)
  const down = run([...items].reverse(), offsets, safeStep)
  switch (direction) {
    case 'up':
      return up
    case 'down':
      return down
    case 'upDown':
      return [...up, ...down]
    case 'downUp':
      return [...down, ...up]
  }
}
