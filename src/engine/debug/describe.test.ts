import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '../settings'
import { compareBestPaths, describeExercise } from './describe'

describe('debug output', () => {
  it('describes positions and bars with tab string numbers', () => {
    const text = describeExercise(DEFAULT_SETTINGS)
    expect(text.split('\n')[0]).toBe('C majeur (1 3 5)')
    // Box 1-4: C on the A string fret 3 is string 5 in tab numbering
    expect(text).toMatch(/0 Cases 1-4\s+.* 5:3 /)
    expect(text).toMatch(/Mesures \(\d+\)/)
  })

  it('compares every system with every preset', () => {
    expect(compareBestPaths(DEFAULT_SETTINGS).split('\n')).toHaveLength(9)
  })
})
