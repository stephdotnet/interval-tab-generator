import { DEGREES, normalizeDegrees, type Degree } from '../../engine/theory/degrees'
import { spellDegree, TONICS } from '../../engine/theory/spelling'
import type { Settings } from '../../engine/settings'
import { DEGREE_COLORS } from '../colors'
import { Chip, Field, Panel } from '../controls'
import type { UpdateSettings } from '../state/useSettings'

const PRESETS: { label: string; degrees: Degree[] }[] = [
  { label: '1 - 2', degrees: ['1', '2'] },
  { label: '1 - 3', degrees: ['1', '3'] },
  { label: '1 - 5', degrees: ['1', '5'] },
  { label: 'Majeur (1 3 5)', degrees: ['1', '3', '5'] },
  { label: 'Mineur (1 b3 5)', degrees: ['1', 'b3', '5'] },
  { label: '7e de dominante', degrees: ['1', '3', '5', 'b7'] },
  { label: 'Maj7', degrees: ['1', '3', '5', '7'] },
  { label: 'm7', degrees: ['1', 'b3', '5', 'b7'] },
  { label: 'Penta mineure', degrees: ['1', 'b3', '4', '5', 'b7'] },
  { label: 'Penta majeure', degrees: ['1', '2', '3', '5', '6'] },
  { label: 'Gamme majeure', degrees: ['1', '2', '3', '4', '5', '6', '7'] },
  { label: 'Mineure naturelle', degrees: ['1', '2', 'b3', '4', '5', 'b6', 'b7'] },
]

const same = (a: Degree[], b: Degree[]) => a.length === b.length && a.every((d, i) => d === b[i])

export function KeyPanel({ settings, update }: { settings: Settings; update: UpdateSettings }) {
  const { tonic, degrees } = settings
  const toggle = (degree: Degree) =>
    update((s) => {
      s.degrees = s.degrees.includes(degree)
        ? s.degrees.filter((d) => d !== degree)
        : normalizeDegrees([...s.degrees, degree])
    })

  return (
    <Panel title="Tonalité et intervalles" summary={tonic + ' : ' + degrees.join(' ')} open>
      <Field label="Tonique">
        <div className="chips tonic-grid">
          {TONICS.map((t) => (
            <Chip key={t} active={t === tonic} onClick={() => update((s) => (s.tonic = t))}>
              {t}
            </Chip>
          ))}
        </div>
      </Field>
      <Field label="Degrés" hint="Le nom de la note suit la tonalité (b3 en C = Eb).">
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
      <Field label="Raccourcis">
        <div className="chips">
          {PRESETS.map((p) => (
            <Chip key={p.label} active={same(p.degrees, degrees)} onClick={() => update((s) => (s.degrees = p.degrees))}>
              {p.label}
            </Chip>
          ))}
        </div>
      </Field>
    </Panel>
  )
}
