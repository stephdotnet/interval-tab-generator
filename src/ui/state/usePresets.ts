import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createPreset,
  defaultPresetName,
  isPresetModified,
  mergePresets,
  parsePresets,
  presetSettings,
  serializePresets,
  type Preset,
} from '../../engine/presets'
import type { Settings } from '../../engine/settings'
import { settingsToQuery } from '../../engine/url'

const PRESETS_KEY = 'interval-tab:presets'
/** Preset loaded in this tab (session storage: each tab has its own). */
const CURRENT_KEY = 'interval-tab:current-preset'
const PROBE_KEY = 'interval-tab:probe'

// Storage can be missing, blocked (private mode, site data disabled) or full: the app works without it
function read(storage: () => Storage, key: string): string | null {
  try {
    return storage().getItem(key)
  } catch {
    return null
  }
}

function write(storage: () => Storage, key: string, value: string | null): boolean {
  try {
    if (value === null) {
      storage().removeItem(key)
    } else {
      storage().setItem(key, value)
    }
    return true
  } catch {
    return false
  }
}

const local = () => window.localStorage
const session = () => window.sessionStorage

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export interface PresetsApi {
  presets: Preset[]
  current: Preset | null
  /** The settings differ from the loaded preset. */
  modified: boolean
  /** False when the browser refuses to store: presets only live until the page is closed. */
  persistent: boolean
  /** Last deleted preset, until it is restored or forgotten. */
  removed: Preset | null
  save: (name: string) => void
  overwrite: (id: string) => void
  rename: (id: string, name: string) => void
  duplicate: (id: string) => void
  remove: (id: string) => void
  undoRemove: () => void
  forgetRemoved: () => void
  load: (id: string) => void
  exportJson: () => string
  /** Merges a presets file; null when the file holds no preset. */
  importJson: (text: string) => { added: number; updated: number } | null
}

export function usePresets(settings: Settings, replaceSettings: (settings: Settings) => void): PresetsApi {
  const [presets, setPresets] = useState(() => parsePresets(read(local, PRESETS_KEY)))
  const [currentId, setCurrentId] = useState(() => read(session, CURRENT_KEY))
  // Probed once: private modes and disabled site data refuse any write
  const [persistent] = useState(() => write(local, PROBE_KEY, '1') && write(local, PROBE_KEY, null))
  const [removed, setRemoved] = useState<Preset | null>(null)

  useEffect(() => {
    write(local, PRESETS_KEY, serializePresets(presets))
  }, [presets])

  useEffect(() => {
    write(session, CURRENT_KEY, currentId)
  }, [currentId])

  // Keep tabs in sync: another tab saved or deleted a preset
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === PRESETS_KEY) {
        setPresets(parsePresets(e.newValue))
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const current = presets.find((p) => p.id === currentId) ?? null
  const modified = useMemo(() => current !== null && isPresetModified(current, settings), [current, settings])

  const save = useCallback(
    (name: string) => {
      const preset = createPreset(newId(), name.trim() || defaultPresetName(settings), settings, Date.now())
      setPresets((list) => [preset, ...list])
      setCurrentId(preset.id)
    },
    [settings],
  )

  const overwrite = useCallback(
    (id: string) =>
      setPresets((list) =>
        list.map((p) => (p.id === id ? { ...p, query: settingsToQuery(settings), updatedAt: Date.now() } : p)),
      ),
    [settings],
  )

  const rename = useCallback((id: string, name: string) => {
    const trimmed = name.trim()
    if (trimmed) {
      setPresets((list) => list.map((p) => (p.id === id ? { ...p, name: trimmed, updatedAt: Date.now() } : p)))
    }
  }, [])

  const duplicate = useCallback((id: string) => {
    setPresets((list) => {
      const index = list.findIndex((p) => p.id === id)
      if (index < 0) {
        return list
      }
      const now = Date.now()
      const copy = { ...list[index], id: newId(), name: list[index].name + ' (copie)', createdAt: now, updatedAt: now }
      return [...list.slice(0, index + 1), copy, ...list.slice(index + 1)]
    })
  }, [])

  const remove = useCallback(
    (id: string) => {
      setRemoved(presets.find((p) => p.id === id) ?? null)
      setPresets((list) => list.filter((p) => p.id !== id))
      setCurrentId((currentId) => (currentId === id ? null : currentId))
    },
    [presets],
  )

  const undoRemove = useCallback(() => {
    if (removed) {
      setPresets((list) => mergePresets(list, [removed]))
      setRemoved(null)
    }
  }, [removed])

  const forgetRemoved = useCallback(() => setRemoved(null), [])

  const load = useCallback(
    (id: string) => {
      const preset = presets.find((p) => p.id === id)
      if (preset) {
        replaceSettings(presetSettings(preset))
        setCurrentId(id)
      }
    },
    [presets, replaceSettings],
  )

  const exportJson = useCallback(() => serializePresets(presets), [presets])

  const importJson = useCallback(
    (text: string) => {
      const incoming = parsePresets(text)
      if (incoming.length === 0) {
        return null
      }
      const merged = mergePresets(presets, incoming)
      const before = new Map(presets.map((p) => [p.id, p]))
      setPresets(merged)
      return {
        added: merged.filter((p) => !before.has(p.id)).length,
        updated: merged.filter((p) => before.has(p.id) && before.get(p.id) !== p).length,
      }
    },
    [presets],
  )

  return {
    presets,
    current,
    modified,
    persistent,
    removed,
    save,
    overwrite,
    rename,
    duplicate,
    remove,
    undoRemove,
    forgetRemoved,
    load,
    exportJson,
    importJson,
  }
}
