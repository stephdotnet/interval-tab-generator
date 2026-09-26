import type { Degree } from '../theory/degrees'
import { ascDesc } from './ascDesc'
import { pairs } from './pairs'
import { randomPick } from './random'
import { sequence } from './sequences'
import type { PatternOptions, PitchItem } from './types'

/** Keeps the notes between the first and the last reference note (or from the only one). */
function trimToReference<T extends PitchItem>(items: readonly T[], reference: Degree | null): T[] {
  const first = items.findIndex((i) => i.degree === reference)
  if (first < 0) {
    return [...items]
  }
  const last = items.findLastIndex((i) => i.degree === reference)
  return items.slice(first, last > first ? last + 1 : undefined)
}

function once<T extends PitchItem>(items: T[], options: PatternOptions, reference: Degree | null): T[] {
  switch (options.type) {
    case 'ascDesc':
      return ascDesc(items, options.direction, options.repeatTurn)
    case 'sequence':
      return sequence(items, options.motif, options.step, options.direction)
    case 'random':
      return randomPick(items, {
        count: options.randomCount,
        seed: options.seed,
        noRepeat: options.noRepeat,
        maxLeap: options.maxLeap,
      })
    case 'pairs':
      return pairs(items, reference, options.pairOrder, options.pairPlacement)
  }
}

/**
 * Orders the notes of a position (sorted by pitch) into the sequence to play.
 * When a round trip is repeated, the note shared by two rounds is played once.
 */
export function applyPattern<T extends PitchItem>(
  items: readonly T[],
  options: PatternOptions,
  reference: Degree | null,
): T[] {
  const base = options.fromRoot ? trimToReference(items, reference) : [...items]
  const round = once(base, options, reference)
  const roundTrip = options.type === 'ascDesc' && (options.direction === 'upDown' || options.direction === 'downUp')
  const out: T[] = []
  for (let r = 0; r < Math.max(1, options.repeats); r++) {
    const skipFirst = roundTrip && r > 0 && !options.repeatTurn && round.length > 1
    out.push(...(skipFirst ? round.slice(1) : round))
  }
  return out
}
