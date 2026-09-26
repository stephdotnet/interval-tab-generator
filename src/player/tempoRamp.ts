export interface RampOptions {
  enabled: boolean
  step: number
  every: number
  max: number
}

/** Tempo to play after `loops` completed loops. */
export function rampedTempo(base: number, loops: number, ramp: RampOptions): number {
  if (!ramp.enabled || ramp.every <= 0) {
    return base
  }
  return Math.max(base, Math.min(ramp.max, base + Math.floor(loops / ramp.every) * ramp.step))
}
