import type { LabelMode, NotationMode } from '../../engine/export/alphatex'
import { rhythmError, SUBDIVISION_LABELS, SUBDIVISIONS, TIME_DENOMINATORS } from '../../engine/rhythm/rhythm'
import type { Exercise } from '../../engine/exercise'
import type { Settings } from '../../engine/settings'
import { Field, Panel, Segmented, Select } from '../controls'
import type { UpdateSettings } from '../state/useSettings'

export function RhythmPanel({ settings, update, exercise }: { settings: Settings; update: UpdateSettings; exercise: Exercise }) {
  const { rhythm, display } = settings
  const imposed = exercise.enclosure.aligned
  return (
    <Panel
      title="Rythme et affichage"
      summary={SUBDIVISION_LABELS[exercise.subdivision] + ' · ' + rhythm.tsNum + '/' + rhythm.tsDen}
    >
      <Field
        label="Subdivision"
        hint={imposed ? 'Imposée par les enclosures pour garder chaque cible sur un temps.' : undefined}
      >
        <Select
          value={exercise.subdivision}
          disabled={imposed}
          choices={SUBDIVISIONS.map((sub) => ({
            value: sub,
            label: SUBDIVISION_LABELS[sub],
            disabled: rhythmError({ ...rhythm, subdivision: sub }) !== null,
          }))}
          onChange={(v) => update((s) => (s.rhythm.subdivision = v))}
        />
      </Field>
      <Field label="Mesure">
        <div className="row tight">
          <Select
            ariaLabel="Temps par mesure"
            value={rhythm.tsNum}
            choices={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: String(i + 1) }))}
            onChange={(v) => update((s) => (s.rhythm.tsNum = v))}
          />
          <span>/</span>
          <Select
            ariaLabel="Unité de temps"
            value={rhythm.tsDen}
            choices={TIME_DENOMINATORS.map((d) => ({ value: d, label: String(d) }))}
            onChange={(v) => update((s) => (s.rhythm.tsDen = v))}
          />
        </div>
      </Field>
      <Field label="Au-dessus des notes">
        <Segmented<LabelMode>
          value={display.labels}
          choices={[
            { value: 'degree', label: 'Degrés' },
            { value: 'note', label: 'Notes' },
            { value: 'none', label: 'Rien' },
          ]}
          onChange={(v) => update((s) => (s.display.labels = v))}
        />
      </Field>
      <Field label="Partition">
        <Segmented<NotationMode>
          value={display.notation}
          choices={[
            { value: 'tab', label: 'Tab seule' },
            { value: 'scoreTab', label: 'Portée + tab' },
          ]}
          onChange={(v) => update((s) => (s.display.notation = v))}
        />
      </Field>
    </Panel>
  )
}
