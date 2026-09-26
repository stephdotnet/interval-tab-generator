import { DEGREES, normalizeDegrees, type Degree } from '../../engine/theory/degrees'
import { findEntry } from '../../engine/theory/library'
import { spellDegree, TONICS } from '../../engine/theory/spelling'
import type { Settings } from '../../engine/settings'
import { DEGREE_COLORS } from '../colors'
import { Chip, Field, Panel } from '../controls'
import type { UpdateSettings } from '../state/useSettings'
import { LibraryPicker } from './LibraryPicker'

export function KeyPanel({ settings, update }: { settings: Settings; update: UpdateSettings }) {
  const { tonic, degrees } = settings
  const toggle = (degree: Degree) =>
    update((s) => {
      s.degrees = s.degrees.includes(degree)
        ? s.degrees.filter((d) => d !== degree)
        : normalizeDegrees([...s.degrees, degree])
    })

  return (
    <Panel title="Tonalité et intervalles" summary={tonic + ' ' + (findEntry(degrees)?.name ?? degrees.join(' '))} open>
      <Field label="Tonique">
        <div className="chips tonic-grid">
          {TONICS.map((t) => (
            <Chip key={t} active={t === tonic} onClick={() => update((s) => (s.tonic = t))}>
              {t}
            </Chip>
          ))}
        </div>
      </Field>
      <Field label="Gammes et arpèges">
        <LibraryPicker tonic={tonic} degrees={degrees} onPick={(picked) => update((s) => (s.degrees = picked))} />
      </Field>
      <Field label="Degrés" hint="Ajuste la sélection degré par degré. Le nom de la note suit la tonalité (b3 en C = Eb).">
        <div className="chips degree-grid">
          {DEGREES.map((d) => (
            <Chip
              key={d}
              active={degrees.includes(d)}
              onClick={() => toggle(d)}
              className="degree-chip"
              title={spellDegree(tonic, d)}
            >
              <span className="degree-dot" style={{ background: DEGREE_COLORS[d] }} />
              <strong>{d}</strong>
              <small>{spellDegree(tonic, d)}</small>
            </Chip>
          ))}
        </div>
      </Field>
    </Panel>
  )
}
