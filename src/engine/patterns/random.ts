/** Small seeded PRNG so that a seed always gives the same exercise. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface RandomOptions {
  count: number
  seed: number
  noRepeat: boolean
  maxLeap: number
}

export function randomPick<T>(items: readonly T[], { count, seed, noRepeat, maxLeap }: RandomOptions): T[] {
  if (items.length === 0) {
    return []
  }
  const rng = mulberry32(seed)
  const indexes = items.map((_, i) => i)
  const out: T[] = []
  let previous = -1
  for (let k = 0; k < count; k++) {
    const allowed = indexes.filter(
      (i) =>
        (!noRepeat || i !== previous || items.length === 1) &&
        (maxLeap <= 0 || previous < 0 || Math.abs(i - previous) <= maxLeap),
    )
    const candidates = allowed.length ? allowed : indexes
    previous = candidates[Math.floor(rng() * candidates.length)]
    out.push(items[previous])
  }
  return out
}
