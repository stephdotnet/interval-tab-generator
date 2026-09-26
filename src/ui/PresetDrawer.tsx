import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import {
  defaultPresetName,
  filterPresets,
  isPresetModified,
  PRESET_SORTS,
  presetSettings,
  presetTags,
  sortPresets,
  type Preset,
  type PresetSort,
} from '../engine/presets'
import type { Settings } from '../engine/settings'
import { DEGREE_COLORS } from './colors'
import { Select } from './controls'
import { Icon } from './Icon'
import type { PresetsApi } from './state/usePresets'

const SORT_LABELS: Record<PresetSort, string> = { recent: 'Récents', name: 'Nom', key: 'Tonalité' }

const FOCUSABLE = 'button:not(:disabled), input:not(:disabled), select:not(:disabled), [href], [tabindex]:not([tabindex="-1"])'

interface Props {
  settings: Settings
  api: PresetsApi
  onClose: () => void
}

/** Side sheet listing the saved exercises. Mounted only while open. */
export function PresetDrawer({ settings, api, onClose }: Props) {
  const [name, setName] = useState(() => defaultPresetName(settings))
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<PresetSort>('recent')
  const [editing, setEditing] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const panel = useRef<HTMLElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const { removed, forgetRemoved } = api

  // The page behind must not scroll while the sheet is open
  useEffect(() => {
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
    }
  }, [])

  useEffect(() => {
    if (!removed) {
      return
    }
    const timer = window.setTimeout(forgetRemoved, 8000)
    return () => window.clearTimeout(timer)
  }, [removed, forgetRemoved])

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
      return
    }
    // Keep the focus inside the sheet
    if (e.key === 'Tab' && panel.current) {
      const focusable = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => !el.hidden && el.getClientRects().length > 0,
      )
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  const save = () => {
    api.save(name)
    setMessage('« ' + (name.trim() || defaultPresetName(settings)) + ' » enregistré')
  }

  const exportFile = () => {
    const url = URL.createObjectURL(new Blob([api.exportJson()], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'mes-exercices-' + new Date().toISOString().slice(0, 10) + '.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const importFile = async (file: File | undefined) => {
    if (!file) {
      return
    }
    const result = api.importJson(await file.text())
    if (result === null) {
      setMessage('Fichier non reconnu')
    } else if (result.added + result.updated === 0) {
      setMessage('Rien de nouveau dans ce fichier')
    } else {
      const added = result.added ? [result.added + (result.added > 1 ? ' ajoutés' : ' ajouté')] : []
      const updated = result.updated ? [result.updated + ' mis à jour'] : []
      setMessage([...added, ...updated].join(', '))
    }
    if (fileInput.current) {
      fileInput.current.value = ''
    }
  }

  const visible = sortPresets(filterPresets(api.presets, query), sort)

  return (
    <div className="drawer-layer" onKeyDown={onKeyDown}>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" ref={panel}>
        <header className="drawer-head">
          <h2 id="drawer-title">Mes exercices</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Fermer">
            <Icon name="x" />
          </button>
        </header>

        <div className="drawer-body">
          <form
            className="save-card"
            onSubmit={(e) => {
              e.preventDefault()
              save()
            }}
          >
            <label className="field-label" htmlFor="preset-name">
              Enregistrer l'exercice actuel
            </label>
            <div className="save-row">
              <input
                id="preset-name"
                className="text"
                value={name}
                maxLength={120}
                autoFocus
                onFocus={(e) => e.target.select()}
                onChange={(e) => setName(e.target.value)}
              />
              <button type="submit" className="button primary">
                <Icon name="save" />
                Enregistrer
              </button>
            </div>
            {api.current && api.modified && (
              <button type="button" className="button" onClick={() => api.overwrite(api.current!.id)}>
                <Icon name="refresh" />
                Mettre à jour « {api.current.name} »
              </button>
            )}
          </form>

          {api.presets.length > 0 && (
            <div className="save-row">
              <input
                type="search"
                className="text"
                value={query}
                placeholder="Rechercher..."
                aria-label="Rechercher un exercice"
                onChange={(e) => setQuery(e.target.value)}
              />
              <Select
                ariaLabel="Trier"
                value={sort}
                choices={PRESET_SORTS.map((s) => ({ value: s, label: SORT_LABELS[s] }))}
                onChange={setSort}
              />
            </div>
          )}

          {api.presets.length === 0 ? (
            <p className="drawer-empty">
              Aucun exercice enregistré. Règle un exercice, donne-lui un nom et enregistre-le : il sera gardé dans ce
              navigateur.
            </p>
          ) : visible.length === 0 ? (
            <p className="drawer-empty">Aucun exercice ne correspond à « {query} ».</p>
          ) : (
            <ul className="preset-cards">
              {visible.map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  current={preset.id === api.current?.id}
                  modified={preset.id === api.current?.id && isPresetModified(preset, settings)}
                  editing={editing === preset.id}
                  api={api}
                  onEdit={(on) => setEditing(on ? preset.id : null)}
                  onLoad={() => {
                    api.load(preset.id)
                    onClose()
                  }}
                />
              ))}
            </ul>
          )}
        </div>

        <footer className="drawer-foot">
          {removed ? (
            <span className="toast" role="status">
              « {removed.name} » supprimé
              <button type="button" className="link-button" onClick={api.undoRemove}>
                Annuler
              </button>
            </span>
          ) : (
            <span className="drawer-note" role="status">
              {!api.persistent
                ? 'Stockage indisponible : les exercices seront perdus à la fermeture.'
                : (message ?? 'Stockés dans ce navigateur')}
            </span>
          )}
          <span className="drawer-foot-actions">
            <button type="button" className="icon-button labelled" onClick={exportFile} disabled={!api.presets.length}>
              <Icon name="download" />
              Exporter
            </button>
            <button type="button" className="icon-button labelled" onClick={() => fileInput.current?.click()}>
              <Icon name="upload" />
              Importer
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => importFile(e.target.files?.[0])}
            />
          </span>
        </footer>
      </aside>
    </div>
  )
}

function PresetCard({
  preset,
  current,
  modified,
  editing,
  api,
  onEdit,
  onLoad,
}: {
  preset: Preset
  current: boolean
  modified: boolean
  editing: boolean
  api: PresetsApi
  onEdit: (on: boolean) => void
  onLoad: () => void
}) {
  const settings = presetSettings(preset)
  return (
    <li className={'preset-card' + (current ? ' current' : '')}>
      {editing ? (
        <form
          className="preset-rename"
          onSubmit={(e) => {
            e.preventDefault()
            api.rename(preset.id, new FormData(e.currentTarget).get('name') as string)
            onEdit(false)
          }}
        >
          <input
            name="name"
            className="text"
            defaultValue={preset.name}
            maxLength={120}
            autoFocus
            aria-label="Nouveau nom"
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation()
                onEdit(false)
              }
            }}
          />
          <button type="submit" className="icon-button" aria-label="Valider le nom">
            <Icon name="check" />
          </button>
        </form>
      ) : (
        <button type="button" className="preset-load" onClick={onLoad} title="Charger cet exercice">
          <strong>{preset.name}</strong>
          <span className="preset-degrees" aria-hidden="true">
            {settings.degrees.map((d) => (
              <i key={d} style={{ background: DEGREE_COLORS[d] }}>
                {d}
              </i>
            ))}
          </span>
          <span className="preset-tags">
            {presetTags(settings).map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </span>
        </button>
      )}
      <div className="preset-actions">
        {modified && (
          <button type="button" className="badge-button" onClick={() => api.overwrite(preset.id)} title="Enregistrer les réglages actuels dans cet exercice">
            modifié · mettre à jour
          </button>
        )}
        <span className="preset-icons">
          <button type="button" className="icon-button" onClick={() => onEdit(!editing)} aria-label={'Renommer ' + preset.name}>
            <Icon name="edit" />
          </button>
          <button type="button" className="icon-button" onClick={() => api.duplicate(preset.id)} aria-label={'Dupliquer ' + preset.name}>
            <Icon name="copy" />
          </button>
          <button type="button" className="icon-button" onClick={() => api.remove(preset.id)} aria-label={'Supprimer ' + preset.name}>
            <Icon name="trash" />
          </button>
        </span>
      </div>
    </li>
  )
}
