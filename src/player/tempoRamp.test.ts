import { describe, expect, it } from 'vitest'
import { rampedTempo } from './tempoRamp'

describe('rampedTempo', () => {
  const ramp = { enabled: true, step: 5, every: 2, max: 100 }

  it('adds a step every N loops up to the max', () => {
    expect(rampedTempo(80, 0, ramp)).toBe(80)
    expect(rampedTempo(80, 1, ramp)).toBe(80)
    expect(rampedTempo(80, 2, ramp)).toBe(85)
    expect(rampedTempo(80, 7, ramp)).toBe(95)
    expect(rampedTempo(80, 50, ramp)).toBe(100)
  })

  it('keeps the base tempo when disabled or when the max is lower', () => {
    expect(rampedTempo(80, 10, { ...ramp, enabled: false })).toBe(80)
    expect(rampedTempo(120, 10, ramp)).toBe(120)
  })
})
