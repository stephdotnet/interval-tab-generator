import { describe, expect, it } from 'vitest'
import { normalizeDegrees } from './degrees'
import { midiToName, parseNote, pitchClass } from './pitch'
import { spellDegree, tonicPitchClass } from './spelling'

describe('pitch', () => {
  it('parses note names to MIDI', () => {
    expect(parseNote('C4')).toBe(60)
    expect(parseNote('E2')).toBe(40)
    expect(parseNote('Eb4')).toBe(63)
    expect(parseNote('F#3')).toBe(54)
    expect(parseNote('B0')).toBe(23)
    expect(parseNote('Cb4')).toBe(59)
    expect(parseNote('H2')).toBeNull()
    expect(parseNote('E')).toBeNull()
  })

  it('formats MIDI to names', () => {
    expect(midiToName(40)).toBe('E2')
    expect(midiToName(63)).toBe('D#4')
    expect(midiToName(23)).toBe('B0')
  })

  it('computes pitch classes for negative values', () => {
    expect(pitchClass(-1)).toBe(11)
    expect(pitchClass(61)).toBe(1)
  })
})

describe('spelling', () => {
  it('gets the tonic pitch class', () => {
    expect(tonicPitchClass('C')).toBe(0)
    expect(tonicPitchClass('Db')).toBe(1)
    expect(tonicPitchClass('F#')).toBe(6)
    expect(tonicPitchClass('B')).toBe(11)
  })

  it('spells degrees in C', () => {
    expect(spellDegree('C', '1')).toBe('C')
    expect(spellDegree('C', '2')).toBe('D')
    expect(spellDegree('C', 'b3')).toBe('Eb')
    expect(spellDegree('C', '#4')).toBe('F#')
    expect(spellDegree('C', 'b5')).toBe('Gb')
    expect(spellDegree('C', 'b7')).toBe('Bb')
  })

  it('spells degrees in sharp and flat keys', () => {
    expect(spellDegree('F#', '7')).toBe('E#')
    expect(spellDegree('F#', '3')).toBe('A#')
    expect(spellDegree('Eb', 'b3')).toBe('Gb')
    expect(spellDegree('Db', 'b6')).toBe('Bbb')
    expect(spellDegree('B', '3')).toBe('D#')
    expect(spellDegree('Ab', '4')).toBe('Db')
  })

  it('normalizes degree lists', () => {
    expect(normalizeDegrees(['5', '1', '5', 'b3'])).toEqual(['1', 'b3', '5'])
  })
})
