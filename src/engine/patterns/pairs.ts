import type { Degree } from '../theory/degrees'
import type { PairOrder, PairPlacement, PitchItem } from './types'

/**
 * Pairs each note with the reference degree (the tonic when selected) within an octave:
 * C-D, C-E... for every reference note of the list.
 */
export function pairs<T extends PitchItem>(
  items: readonly T[],
  reference: Degree | null,
  order: PairOrder,
  placement: PairPlacement,
): T[] {
  const isReference = (item: T) => item.degree === reference
  const references = items.filter(isReference)
  const others = items.filter((item) => !isReference(item))
  if (references.length === 0 || others.length === 0) {
    return [...items]
  }
  const out: T[] = []
  for (const ref of references) {
    const above = others.filter((x) => x.midi > ref.midi && x.midi - ref.midi < 12)
    const below = others.filter((x) => x.midi < ref.midi && ref.midi - x.midi < 12).reverse()
    const partners = placement === 'above' ? above : placement === 'below' ? below : [...above, ...below]
    for (const partner of partners) {
      out.push(...(order === 'refFirst' ? [ref, partner] : [partner, ref]))
    }
  }
  return out
}
