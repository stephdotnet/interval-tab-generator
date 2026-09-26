import { MOTIF_PRESETS } from '../../engine/patterns/sequences'
import type { Direction, PairOrder, PairPlacement, PatternType } from '../../engine/patterns/types'
import type { Settings } from '../../engine/settings'
import { Field, NumberInput, Panel, Segmented, Select, Toggle } from '../controls'
import type { UpdateSettings } from '../state/useSettings'

const TYPE_LABELS: Record<PatternType, string> = {
  ascDesc: 'Montée / descente',
  sequence: 'Séquences',
  random: 'Aléatoire',
  pairs: 'Paires',
}

const DIRECTION_LABELS: Record<Direction, string> = {
  up: 'Montée',
  down: 'Descente',
  upDown: 'Aller-retour',
  downUp: 'Retour-aller',
}

export function PatternPanel({ settings, update }: { settings: Settings; update: UpdateSettings }) {
  const { pattern } = settings
  const reference = settings.degrees[0] ?? '1'
  const direction = (
    <Field label="Sens">
      <Segmented
        value={pattern.direction}
        choices={(Object.keys(DIRECTION_LABELS) as Direction[]).map((d) => ({ value: d, label: DIRECTION_LABELS[d] }))}
        onChange={(v) => update((s) => (s.pattern.direction = v))}
      />
    </Field>
  )

  return (
    <Panel title="Motif" summary={TYPE_LABELS[pattern.type]} open>
      <Field label="Type">
        <Segmented
          value={pattern.type}
          choices={(Object.keys(TYPE_LABELS) as PatternType[]).map((t) => ({ value: t, label: TYPE_LABELS[t] }))}
          onChange={(v) => update((s) => (s.pattern.type = v))}
        />
      </Field>

      {pattern.type === 'ascDesc' && (
        <>
          {direction}
          <Toggle
            label="Doubler la note du demi-tour"
            checked={pattern.repeatTurn}
            onChange={(v) => update((s) => (s.pattern.repeatTurn = v))}
          />
        </>
      )}

      {pattern.type === 'sequence' && (
        <>
          <Field label="Motif" hint="Décalages dans la liste des notes : « 0 1 2 » = groupes de 3, « 0 2 » = sauts.">
            <div className="row">
              <Select
                value={MOTIF_PRESETS.some((p) => p.motif === pattern.motif) ? pattern.motif : ''}
                choices={[
                  ...MOTIF_PRESETS.map((p) => ({ value: p.motif, label: p.label })),
                  { value: '', label: 'Perso', disabled: true },
                ]}
                onChange={(v) => update((s) => (s.pattern.motif = v))}
              />
              <input
                className="text"
                value={pattern.motif}
                aria-label="Motif personnalisé"
                onChange={(e) => update((s) => (s.pattern.motif = e.target.value))}
              />
            </div>
          </Field>
          <Field label="Pas (décalage entre deux groupes)">
            <NumberInput value={pattern.step} min={1} max={8} onChange={(v) => update((s) => (s.pattern.step = v))} />
          </Field>
          {direction}
        </>
      )}

      {pattern.type === 'random' && (
        <>
          <div className="row">
            <Field label="Nombre de notes">
              <NumberInput
                value={pattern.randomCount}
                min={1}
                max={256}
                onChange={(v) => update((s) => (s.pattern.randomCount = v))}
              />
            </Field>
            <Field label="Graine">
              <div className="row tight">
                <NumberInput value={pattern.seed} min={0} max={999999} onChange={(v) => update((s) => (s.pattern.seed = v))} />
                <button
                  type="button"
                  className="button"
                  onClick={() => update((s) => (s.pattern.seed = Math.floor(Math.random() * 999999)))}
                >
                  Nouveau tirage
                </button>
              </div>
            </Field>
          </div>
          <Toggle
            label="Pas deux fois la même note"
            checked={pattern.noRepeat}
            onChange={(v) => update((s) => (s.pattern.noRepeat = v))}
          />
          <Field label="Saut max (en notes, 0 = libre)">
            <NumberInput value={pattern.maxLeap} min={0} max={24} onChange={(v) => update((s) => (s.pattern.maxLeap = v))} />
          </Field>
        </>
      )}

      {pattern.type === 'pairs' && (
        <>
          <Field label="Ordre" hint={'Chaque note est jouée avec le degré ' + reference + ' le plus proche.'}>
            <Segmented<PairOrder>
              value={pattern.pairOrder}
              choices={[
                { value: 'refFirst', label: reference + ' puis intervalle' },
                { value: 'degreeFirst', label: 'Intervalle puis ' + reference },
              ]}
              onChange={(v) => update((s) => (s.pattern.pairOrder = v))}
            />
          </Field>
          <Field label="Intervalle">
            <Segmented<PairPlacement>
              value={pattern.pairPlacement}
              choices={[
                { value: 'above', label: 'Au-dessus' },
                { value: 'below', label: 'En dessous' },
                { value: 'both', label: 'Les deux' },
              ]}
              onChange={(v) => update((s) => (s.pattern.pairPlacement = v))}
            />
          </Field>
        </>
      )}

      <div className="row">
        <Field label="Répétitions">
          <NumberInput value={pattern.repeats} min={1} max={16} onChange={(v) => update((s) => (s.pattern.repeats = v))} />
        </Field>
      </div>
      <Toggle
        label={'Commencer et finir sur le degré ' + reference}
        checked={pattern.fromRoot}
        onChange={(v) => update((s) => (s.pattern.fromRoot = v))}
      />
    </Panel>
  )
}
