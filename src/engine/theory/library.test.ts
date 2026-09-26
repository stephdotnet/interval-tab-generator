import { describe, expect, it } from 'vitest'
import { exerciseTitle } from '../exercise'
import { DEFAULT_SETTINGS } from '../settings'
import { isDegree, normalizeDegrees } from './degrees'
import { findEntry, LIBRARY, LIBRARY_ENTRIES, matchesEntry, searchLibrary } from './library'
import { spellDegree } from './spelling'

const spell = (id: string, tonic: 'C' | 'Eb' = 'C') =>
  LIBRARY_ENTRIES.find((e) => e.id === id)!.degrees.map((d) => spellDegree(tonic, d)).join(' ')

describe('library', () => {
  it('has valid, sorted degrees starting on the tonic', () => {
    for (const entry of LIBRARY_ENTRIES) {
      expect(entry.degrees.every(isDegree), entry.id).toBe(true)
      expect(entry.degrees, entry.id).toEqual(normalizeDegrees(entry.degrees))
      expect(entry.degrees[0], entry.id).toBe('1')
    }
  })

  it('has unique ids and no duplicate formula inside a category', () => {
    expect(new Set(LIBRARY_ENTRIES.map((e) => e.id)).size).toBe(LIBRARY_ENTRIES.length)
    for (const category of LIBRARY) {
      const formulas = category.entries.map((e) => e.degrees.join(' '))
      expect(new Set(formulas).size, category.id).toBe(formulas.length)
    }
  })

  it('never uses two degrees of the same pitch', () => {
    for (const entry of LIBRARY_ENTRIES) {
      const pitches = entry.degrees.map((d) => spellDegree('C', d))
      expect(new Set(pitches).size, entry.id).toBe(pitches.length)
    }
  })

  it('spells scales and chords correctly', () => {
    expect(spell('aug')).toBe('C E G#')
    expect(spell('dim7')).toBe('C Eb Gb Bbb')
    expect(spell('7s9')).toBe('C D# E G Bb')
    expect(spell('altered')).toBe('C Db D# E F# Ab Bb')
    expect(spell('dim-hw')).toBe('C Db D# E F# G A Bb')
    expect(spell('dorian', 'Eb')).toBe('Eb F Gb Ab Bb C Db')
    expect(spell('harmonic-minor')).toBe('C D Eb F G Ab B')
  })

  it('names degrees, preferring scales to extended chords', () => {
    expect(findEntry(['5', '1', 'b3'])?.id).toBe('min')
    expect(findEntry(['1', '2', '3', '5', '6'])?.id).toBe('penta-maj')
    expect(findEntry(['1', '2', '#4'])).toBeUndefined()
    expect(matchesEntry(LIBRARY_ENTRIES.find((e) => e.id === '69')!, ['1', '2', '3', '5', '6'])).toBe(true)
  })

  it('searches names, symbols, other names and formulas, ignoring accents and case', () => {
    const ids = (q: string) => searchLibrary(q).map((e) => e.id)
    expect(ids('dorien')).toEqual(expect.arrayContaining(['dorian', 'dorian-b2', 'dorian-s4']))
    expect(ids('m7b5')).toContain('m7b5')
    expect(ids('half diminished')).toEqual(expect.arrayContaining(['m7b5', 'locrian-2']))
    expect(ids('eolien')).toEqual(['aeolian'])
    expect(ids('b3 b5 bb7')).toContain('dim7')
    expect(ids('   ')).toEqual([])
  })

  it('titles the exercise with the library name', () => {
    const title = (degrees: string[]) => exerciseTitle({ ...DEFAULT_SETTINGS, degrees: degrees as never })
    expect(title(['1', 'b3', 'b5', 'b7'])).toBe('Cm7b5 (1 b3 b5 b7)')
    expect(title(['1', '3', '5'])).toBe('C majeur (1 3 5)')
    expect(title(['1', '2', 'b3', '4', '5', '6', 'b7'])).toBe('C dorien (1 2 b3 4 5 6 b7)')
    expect(title(['1', '2', '#4'])).toBe('C : 1 - 2 - #4')
  })
})
