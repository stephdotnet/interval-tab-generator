import { findInstrument } from './instrument/presets'
import { MODE_LABELS, PATTERN_LABELS, SYSTEM_LABELS } from './labels'
import { SUBDIVISION_LABELS } from './rhythm/rhythm'
import type { Settings } from './settings'
import { findEntry } from './theory/library'
import { TONICS } from './theory/spelling'
import { settingsFromQuery, settingsToQuery } from './url'

/**
 * A saved exercise. The settings are kept as the app query string: the URL codec already
 * ignores invalid values and fills in defaults, so old presets stay readable.
 */
export interface Preset {
  id: string
  name: string
  query: string
  createdAt: number
  updatedAt: number
}

export const PRESETS_VERSION = 1

export const PRESET_SORTS = ['recent', 'name', 'key'] as const
export type PresetSort = (typeof PRESET_SORTS)[number]

export function createPreset(id: string, name: string, settings: Settings, now: number): Preset {
  return { id, name, query: settingsToQuery(settings), createdAt: now, updatedAt: now }
}

export function presetSettings(preset: Preset): Settings {
  return settingsFromQuery(preset.query)
}

/** True when the settings differ from the saved ones (compared through the URL codec). */
export function isPresetModified(preset: Preset, settings: Settings): boolean {
  return settingsToQuery(presetSettings(preset)) !== settingsToQuery(settings)
}

function toPreset(value: unknown): Preset | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }
  const v = value as Record<string, unknown>
  if (typeof v.id !== 'string' || !v.id || typeof v.name !== 'string' || typeof v.query !== 'string') {
    return null
  }
  const createdAt = typeof v.createdAt === 'number' ? v.createdAt : 0
  const updatedAt = typeof v.updatedAt === 'number' ? v.updatedAt : createdAt
  return { id: v.id, name: v.name.slice(0, 120), query: v.query, createdAt, updatedAt }
}

/** Reads stored or imported presets: `{ version, presets }` or a bare array. Invalid entries are dropped. */
export function parsePresets(raw: string | null): Preset[] {
  if (!raw) {
    return []
  }
  try {
    const data: unknown = JSON.parse(raw)
    const list = Array.isArray(data) ? data : (data as { presets?: unknown })?.presets
    return Array.isArray(list) ? list.map(toPreset).filter((p): p is Preset => p !== null) : []
  } catch {
    return []
  }
}

export function serializePresets(presets: readonly Preset[]): string {
  return JSON.stringify({ version: PRESETS_VERSION, presets })
}

/** Adds imported presets; for an id already known, the most recently updated version wins. */
export function mergePresets(current: readonly Preset[], incoming: readonly Preset[]): Preset[] {
  const byId = new Map(current.map((p) => [p.id, p]))
  for (const preset of incoming) {
    const known = byId.get(preset.id)
    if (!known || preset.updatedAt > known.updatedAt) {
      byId.set(preset.id, preset)
    }
  }
  return [...byId.values()]
}

/** "Cm7b5", "C dorien", or "C 1 2 #4" when the library has no name for the degrees. */
function scaleLabel(settings: Settings): string {
  const entry = findEntry(settings.degrees)
  if (!entry) {
    return settings.tonic + ' ' + settings.degrees.join(' ')
  }
  return settings.tonic + (entry.symbol ?? ' ' + entry.name[0].toLowerCase() + entry.name.slice(1))
}

function systemLabel(settings: Settings): string {
  const { system, npsPerString } = settings.fingering
  return system === 'nps' ? npsPerString + ' notes/corde' : SYSTEM_LABELS[system]
}

/** Name suggested when saving: "C dorien · Box · Best path". */
export function defaultPresetName(settings: Settings): string {
  return [scaleLabel(settings), systemLabel(settings), MODE_LABELS[settings.navigation.mode]].join(' · ')
}

/** Short descriptions shown on a preset card. */
export function presetTags(settings: Settings): string[] {
  const instrument = findInstrument(settings.instrument.presetId)
  return [
    scaleLabel(settings),
    ...(instrument && instrument.id !== 'guitar6' ? [instrument.label] : []),
    systemLabel(settings),
    MODE_LABELS[settings.navigation.mode],
    PATTERN_LABELS[settings.pattern.type],
    SUBDIVISION_LABELS[settings.rhythm.subdivision],
    settings.rhythm.tempo + ' BPM',
  ]
}

const simplify = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

/** Presets whose name or tags contain every word of the query. */
export function filterPresets(presets: readonly Preset[], query: string): Preset[] {
  const words = simplify(query).split(/\s+/).filter(Boolean)
  return presets.filter((p) => {
    const haystack = simplify([p.name, ...presetTags(presetSettings(p))].join(' '))
    return words.every((w) => haystack.includes(w))
  })
}

export function sortPresets(presets: readonly Preset[], sort: PresetSort): Preset[] {
  const byName = (a: Preset, b: Preset) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
  const tonicIndex = (p: Preset) => TONICS.indexOf(presetSettings(p).tonic)
  switch (sort) {
    case 'recent':
      return [...presets].sort((a, b) => b.updatedAt - a.updatedAt)
    case 'name':
      return [...presets].sort(byName)
    case 'key':
      return [...presets].sort((a, b) => tonicIndex(a) - tonicIndex(b) || byName(a, b))
  }
}
