import { useState } from 'react'
import type { Degree } from '../../engine/theory/degrees'
import { categoryOf, findEntry, LIBRARY, matchesEntry, searchLibrary, type LibraryEntry } from '../../engine/theory/library'
import { spellDegree, type Tonic } from '../../engine/theory/spelling'
import { Select } from '../controls'

interface Props {
  tonic: Tonic
  degrees: Degree[]
  onPick: (degrees: Degree[]) => void
}

export function LibraryPicker({ tonic, degrees, onPick }: Props) {
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState(() => {
    const entry = findEntry(degrees)
    return entry ? categoryOf(entry).id : LIBRARY[0].id
  })
  const results = searchLibrary(query)
  const searching = query.trim() !== ''

  const item = (entry: LibraryEntry) => (
    <button
      key={entry.id}
      type="button"
      aria-pressed={matchesEntry(entry, degrees)}
      className={'library-item' + (matchesEntry(entry, degrees) ? ' active' : '')}
      title={entry.degrees.map((d) => spellDegree(tonic, d)).join(' ')}
      onClick={() => onPick(entry.degrees)}
    >
      <strong>{entry.symbol !== undefined ? tonic + entry.symbol : entry.name}</strong>
      <small>
        {entry.symbol !== undefined && entry.name + ' · '}
        {entry.degrees.join(' ')}
      </small>
    </button>
  )

  return (
    <div className="library">
      <div className="library-bar">
        <input
          type="search"
          className="text"
          value={query}
          placeholder="Rechercher : dorien, m7b5, blues..."
          aria-label="Rechercher une gamme ou un arpège"
          onChange={(e) => setQuery(e.target.value)}
        />
        {!searching && (
          <Select
            ariaLabel="Famille"
            value={categoryId}
            choices={LIBRARY.map((c) => ({ value: c.id, label: c.label + ' (' + c.entries.length + ')' }))}
            onChange={setCategoryId}
          />
        )}
      </div>
      {searching ? (
        results.length ? (
          LIBRARY.filter((c) => c.entries.some((e) => results.includes(e))).map((c) => (
            <div key={c.id} className="library-group">
              <span className="library-group-label">{c.label}</span>
              <div className="library-list">{c.entries.filter((e) => results.includes(e)).map(item)}</div>
            </div>
          ))
        ) : (
          <p className="field-hint">Aucun résultat.</p>
        )
      ) : (
        <div className="library-list">{LIBRARY.find((c) => c.id === categoryId)!.entries.map(item)}</div>
      )}
    </div>
  )
}
