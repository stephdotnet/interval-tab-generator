import { describe, expect, it } from 'vitest'
import {
  createPreset,
  defaultPresetName,
  filterPresets,
  isPresetModified,
  mergePresets,
  parsePresets,
  presetSettings,
  presetTags,
  serializePresets,
  sortPresets,
  type Preset,
} from './presets'
import { DEFAULT_SETTINGS, type Settings } from './settings'

const settings = (patch: (s: Settings) => void): Settings => {
  const s = structuredClone(DEFAULT_SETTINGS)
  patch(s)
  return s
}

const dorian = settings((s) => {
  s.degrees = ['1', '2', 'b3', '4', '5', '6', 'b7']
  s.navigation.mode = 'bestPath'
})

describe('presets', () => {
  it('stores the settings as a query string and reads them back', () => {
    const preset = createPreset('a', 'Dorien', dorian, 1000)
    expect(preset).toMatchObject({ id: 'a', name: 'Dorien', createdAt: 1000, updatedAt: 1000 })
    expect(presetSettings(preset)).toEqual(dorian)
  })

  it('detects modified settings', () => {
    const preset = createPreset('a', 'Dorien', dorian, 1000)
    expect(isPresetModified(preset, dorian)).toBe(false)
    expect(isPresetModified(preset, { ...dorian, tonic: 'D' })).toBe(true)
  })

  it('round-trips through storage and drops invalid entries', () => {
    const presets = [createPreset('a', 'A', dorian, 1), createPreset('b', 'B', DEFAULT_SETTINGS, 2)]
    expect(parsePresets(serializePresets(presets))).toEqual(presets)
    expect(parsePresets(JSON.stringify([{ id: 'x', name: 'X', query: '' }, { id: 1 }, null, 'nope']))).toEqual([
      { id: 'x', name: 'X', query: '', createdAt: 0, updatedAt: 0 },
    ])
    expect(parsePresets('not json')).toEqual([])
    expect(parsePresets(null)).toEqual([])
    expect(parsePresets('{"version":1}')).toEqual([])
  })

  it('merges imports, the most recent version of a preset winning', () => {
    const old: Preset = { id: 'a', name: 'Old', query: '', createdAt: 1, updatedAt: 1 }
    const fresh: Preset = { ...old, name: 'Fresh', updatedAt: 5 }
    const other: Preset = { id: 'b', name: 'B', query: '', createdAt: 2, updatedAt: 2 }
    expect(mergePresets([old], [fresh, other]).map((p) => p.name)).toEqual(['Fresh', 'B'])
    expect(mergePresets([fresh], [old]).map((p) => p.name)).toEqual(['Fresh'])
  })

  it('suggests a name and describes the settings', () => {
    expect(defaultPresetName(dorian)).toBe('C dorien · Box · Best path')
    expect(defaultPresetName(settings((s) => (s.degrees = ['1', '2', '#4'])))).toBe('C 1 2 #4 · Box · Une position')
    const bass = settings((s) => {
      s.tonic = 'E'
      s.degrees = ['1', 'b3', 'b5', 'b7']
      s.instrument.presetId = 'bass4'
      s.fingering.system = 'nps'
      s.rhythm.tempo = 96
    })
    expect(defaultPresetName(bass)).toBe('Em7b5 · 3 notes/corde · Une position')
    expect(presetTags(bass)).toEqual([
      'Em7b5',
      'Basse 4 cordes',
      '3 notes/corde',
      'Une position',
      'Montée / descente',
      'Croches',
      '96 BPM',
    ])
  })

  it('filters on name and tags, sorts by date, name or key', () => {
    const a = createPreset('a', 'Échauffement', dorian, 3)
    const b = createPreset('b', 'basse', settings((s) => (s.tonic = 'A')), 1)
    const c = createPreset('c', 'Arpèges', settings((s) => (s.tonic = 'D')), 2)
    expect(filterPresets([a, b, c], 'echauf').map((p) => p.id)).toEqual(['a'])
    expect(filterPresets([a, b, c], 'dorien best').map((p) => p.id)).toEqual(['a'])
    expect(filterPresets([a, b, c], '').map((p) => p.id)).toEqual(['a', 'b', 'c'])
    expect(sortPresets([a, b, c], 'recent').map((p) => p.id)).toEqual(['a', 'c', 'b'])
    expect(sortPresets([a, b, c], 'name').map((p) => p.id)).toEqual(['c', 'b', 'a'])
    expect(sortPresets([a, b, c], 'key').map((p) => p.id)).toEqual(['a', 'c', 'b'])
  })
})
