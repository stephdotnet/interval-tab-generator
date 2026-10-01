import {
  APPROACH_SCALE_AUTO,
  APPROACH_SCALE_CHROMATIC,
  approachScale,
  ENCLOSURE_PRESETS,
  enclosureExample,
  type EnclosureDirection,
  type EnclosureTargets,
} from '../../engine/enclosures'
import type { Exercise } from '../../engine/exercise'
import type { Settings } from '../../engine/settings'
import { SUBDIVISION_LABELS } from '../../engine/rhythm/rhythm'
import { LIBRARY } from '../../engine/theory/library'
import { Field, NumberInput, Panel, Segmented, Select, Toggle } from '../controls'
import type { UpdateSettings } from '../state/useSettings'

const DIRECTION_LABELS: Record<EnclosureDirection, string> = {
  line: 'Orientée',
  fixed: 'Forme fixe',
  custom: 'Deux formes',
}

const TARGET_LABELS: Record<EnclosureTargets, string> = {
  all: 'Toutes les notes',
  reference: 'Tonique seulement',
  every: 'Une sur N',
}

// Scales that make sense as a source of diatonic neighbors
const SCALE_CATEGORIES = ['major-modes', 'melodic-minor', 'harmonic-minor', 'pentatonic', 'other']

export function EnclosurePanel({ settings, update, exercise }: { settings: Settings; update: UpdateSettings; exercise: Exercise }) {
  const { enclosure } = settings
  const plan = exercise.enclosure
  const reference = settings.degrees[0] ?? '1'
  const example = enclosureExample(exercise.targets, plan)

  return (
    <Panel
      title="Enclosures"
      summary={enclosure.enabled ? enclosure.spec + ' · ' + TARGET_LABELS[enclosure.targets].toLowerCase() : 'Désactivées'}
    >
      <Toggle
        label="Approcher chaque cible par des notes voisines"
        checked={enclosure.enabled}
        onChange={(v) => update((s) => (s.enclosure.enabled = v))}
      />
      {enclosure.enabled && (
        <>
          <Field label="Selon le sens de la ligne">
            <Segmented<EnclosureDirection>
              value={enclosure.direction}
              choices={(['line', 'fixed', 'custom'] as const).map((d) => ({ value: d, label: DIRECTION_LABELS[d] }))}
              onChange={(v) => update((s) => (s.enclosure.direction = v))}
            />
          </Field>
          <Field
            label={enclosure.direction === 'custom' ? 'Forme en montant' : 'Forme'}
            hint={
              'Par rapport à la cible, dans l\'ordre joué : D diatonique, C chromatique, + au-dessus, - en dessous.' +
              (enclosure.direction === 'line'
                ? ' La forme est orientée selon la ligne : la dernière approche arrive du côté d\'où vient la ligne.'
                : '')
            }
          >
            <Select
              value={ENCLOSURE_PRESETS.some((p) => p.spec === enclosure.spec) ? enclosure.spec : ''}
              choices={[
                ...ENCLOSURE_PRESETS.map((p) => ({ value: p.spec, label: p.family + ' · ' + p.label })),
                { value: '', label: 'Perso', disabled: true },
              ]}
              onChange={(v) => update((s) => (s.enclosure.spec = v))}
            />
            <input
              className="text"
              value={enclosure.spec}
              aria-label="Forme personnalisée"
              onChange={(e) => update((s) => (s.enclosure.spec = e.target.value))}
            />
          </Field>
          {enclosure.direction === 'custom' && (
            <Field label="Forme en descendant">
              <input
                className="text"
                value={enclosure.specDown}
                aria-label="Forme en descendant"
                onChange={(e) => update((s) => (s.enclosure.specDown = e.target.value))}
              />
            </Field>
          )}
          {example && (
            <p className="enclosure-example">
              Sur la note {reference} :{' '}
              {example.up === example.down ? (
                <strong>{example.up}</strong>
              ) : (
                <>
                  en montant <strong>{example.up}</strong>, en descendant <strong>{example.down}</strong>
                </>
              )}
            </p>
          )}

          <Field label="Cibles">
            <Segmented<EnclosureTargets>
              value={enclosure.targets}
              choices={(['all', 'reference', 'every'] as const).map((t) => ({
                value: t,
                label: t === 'reference' ? 'Degré ' + reference : TARGET_LABELS[t],
              }))}
              onChange={(v) => update((s) => (s.enclosure.targets = v))}
            />
          </Field>
          {enclosure.targets === 'every' && (
            <Field label="Une cible toutes les N notes" hint="3 pour ne viser que la 1re note de chaque triade d'une séquence 0 2 4.">
              <NumberInput value={enclosure.every} min={1} max={16} onChange={(v) => update((s) => (s.enclosure.every = v))} />
            </Field>
          )}

          <Field label="Gamme des approches diatoniques">
            <Select
              value={enclosure.scale}
              choices={[
                { value: APPROACH_SCALE_AUTO, label: 'Auto (' + approachScale(exercise.targets.degrees, APPROACH_SCALE_AUTO).name + ')' },
                { value: APPROACH_SCALE_CHROMATIC, label: 'Aucune (D = un ton)' },
                ...LIBRARY.filter((c) => SCALE_CATEGORIES.includes(c.id)).flatMap((c) =>
                  c.entries.map((e) => ({ value: e.id, label: e.name })),
                ),
              ]}
              onChange={(v) => update((s) => (s.enclosure.scale = v))}
            />
          </Field>

          <Toggle
            label="Cibles sur les temps"
            checked={enclosure.align}
            onChange={(v) => update((s) => (s.enclosure.align = v))}
          />
          {enclosure.align && (
            <p className="field-hint">
              {plan.aligned
                ? 'Subdivision : ' + SUBDIVISION_LABELS[plan.subdivision].toLowerCase() + ', avec une levée au début.'
                : plan.alignProblem}
            </p>
          )}
          <Toggle
            label="Notes d'approche en notes fantômes (entre parenthèses, jouées plus doucement)"
            checked={enclosure.ghost}
            onChange={(v) => update((s) => (s.enclosure.ghost = v))}
          />
        </>
      )}
    </Panel>
  )
}
