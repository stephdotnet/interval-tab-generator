import type { Exercise } from '../../engine/exercise'
import { STRATEGIES } from '../../engine/fingering/registry'
import { CAGED_SHAPES, FINGERING_SYSTEMS, type FingeringSystem } from '../../engine/fingering/types'
import { COST_PRESET_IDS, COST_PRESETS, type CostWeights } from '../../engine/navigation/cost'
import type { GapMode, NavigationMode } from '../../engine/navigation/navigate'
import { effectiveWeights, type Settings } from '../../engine/settings'
import { Chip, Field, NumberInput, Panel, Segmented, Select, Toggle } from '../controls'
import type { UpdateSettings } from '../state/useSettings'

const SYSTEM_LABELS: Record<FingeringSystem, string> = {
  box: 'Box',
  caged: 'CAGED',
  nps: 'N notes / corde',
}

const MODE_LABELS: Record<NavigationMode, string> = {
  single: 'Une position',
  all: 'Toutes',
  bestPath: 'Best path',
}

const GAP_LABELS: Record<GapMode, string> = {
  none: 'Enchaîner sans pause',
  newBar: 'Nouvelle mesure à chaque position',
  restBar: 'Une mesure de silence entre les positions',
}

const WEIGHT_FIELDS: { key: keyof CostWeights; label: string; max: number; step: number }[] = [
  { key: 'shift', label: 'Déplacement (par case)', max: 5, step: 0.1 },
  { key: 'jump', label: 'Grand saut (par case²)', max: 3, step: 0.1 },
  { key: 'positionChange', label: 'Changement de position', max: 10, step: 0.5 },
  { key: 'stringChange', label: 'Changement de corde', max: 5, step: 0.1 },
  { key: 'stringSkip', label: 'Corde sautée', max: 5, step: 0.1 },
  { key: 'backtrack', label: 'Retour en arrière de corde', max: 5, step: 0.1 },
  { key: 'extension', label: 'Extension de doigt', max: 5, step: 0.1 },
  { key: 'open', label: 'Corde à vide (négatif = préférer)', max: 3, step: 0.1 },
  { key: 'highFret', label: 'Hauteur sur le manche', max: 0.5, step: 0.01 },
  { key: 'maxRun', label: 'Notes max par corde (0 = libre)', max: 8, step: 1 },
  { key: 'runPenalty', label: 'Pénalité au-delà', max: 10, step: 0.5 },
]

export function FingeringPanel({
  settings,
  update,
  exercise,
}: {
  settings: Settings
  update: UpdateSettings
  exercise: Exercise
}) {
  const { fingering, navigation } = settings
  const ctx = { board: exercise.board, targets: exercise.targets, options: fingering }
  const weights = effectiveWeights(navigation)
  const showStretches = fingering.system === 'box' || fingering.system === 'caged'

  const setWeight = (key: keyof CostWeights, value: number) =>
    update((s) => {
      s.navigation.weights = { ...effectiveWeights(s.navigation), [key]: value }
      s.navigation.costPreset = 'custom'
    })

  return (
    <Panel
      title="Doigté"
      summary={SYSTEM_LABELS[fingering.system] + ' · ' + MODE_LABELS[navigation.mode]}
      open
    >
      <Field label="Système">
        <Segmented
          value={fingering.system}
          choices={FINGERING_SYSTEMS.map((id) => {
            const reason = STRATEGIES[id].unavailableReason(ctx)
            return { value: id, label: SYSTEM_LABELS[id], disabled: reason !== null, title: reason ?? STRATEGIES[id].label }
          })}
          onChange={(v) => update((s) => (s.fingering.system = v))}
        />
      </Field>

      {fingering.system === 'box' && (
        <Field label="Largeur de la box" hint="Nombre de cases couvertes par les 4 doigts.">
          <Segmented
            value={fingering.boxWidth}
            choices={[3, 4, 5, 6].map((w) => ({ value: w, label: w + ' cases' }))}
            onChange={(v) => update((s) => (s.fingering.boxWidth = v))}
          />
        </Field>
      )}

      {fingering.system === 'caged' && (
        <Field label="Formes">
          <div className="chips">
            {CAGED_SHAPES.map((shape) => (
              <Chip
                key={shape}
                active={fingering.cagedShapes.includes(shape)}
                onClick={() =>
                  update((s) => {
                    const shapes = s.fingering.cagedShapes
                    s.fingering.cagedShapes = shapes.includes(shape)
                      ? shapes.filter((x) => x !== shape)
                      : CAGED_SHAPES.filter((x) => x === shape || shapes.includes(x))
                  })
                }
              >
                {shape}
              </Chip>
            ))}
          </div>
        </Field>
      )}

      {showStretches && (
        <div className="row">
          <Toggle
            label="Extension index (case -1)"
            checked={fingering.extLow}
            onChange={(v) => update((s) => (s.fingering.extLow = v))}
          />
          <Toggle
            label="Extension auriculaire (case +1)"
            checked={fingering.extHigh}
            onChange={(v) => update((s) => (s.fingering.extHigh = v))}
          />
        </div>
      )}

      {fingering.system === 'nps' && (
        <div className="row">
          <Field label="Notes par corde">
            <Segmented
              value={fingering.npsPerString}
              choices={[1, 2, 3, 4].map((n) => ({ value: n, label: String(n) }))}
              onChange={(v) => update((s) => (s.fingering.npsPerString = v))}
            />
          </Field>
          <Field label="Écart max (cases)">
            <NumberInput
              value={fingering.npsMaxSpan}
              min={2}
              max={8}
              onChange={(v) => update((s) => (s.fingering.npsMaxSpan = v))}
            />
          </Field>
        </div>
      )}

      <Field label="Enchaînement">
        <Segmented
          value={navigation.mode}
          choices={(['single', 'all', 'bestPath'] as const).map((m) => ({ value: m, label: MODE_LABELS[m] }))}
          onChange={(v) => update((s) => (s.navigation.mode = v))}
        />
      </Field>

      {navigation.mode === 'all' && (
        <Field label="Entre deux positions">
          <Select
            value={navigation.gap}
            choices={(Object.keys(GAP_LABELS) as GapMode[]).map((g) => ({ value: g, label: GAP_LABELS[g] }))}
            onChange={(v) => update((s) => (s.navigation.gap = v))}
          />
        </Field>
      )}

      {navigation.mode === 'bestPath' && (
        <>
          <Field label="Style de chemin" hint="Le motif est joué sur toute la plage de cases, l'algorithme choisit les positions.">
            <Segmented
                  value={navigation.costPreset}
              choices={[
                ...COST_PRESET_IDS.map((id) => ({ value: id as string, label: COST_PRESETS[id].label })),
                { value: 'custom', label: 'Perso' },
              ]}
              onChange={(v) =>
                update((s) => {
                  if (v === 'custom') {
                    s.navigation.weights = effectiveWeights(s.navigation)
                    s.navigation.costPreset = 'custom'
                  } else {
                    s.navigation.costPreset = v as keyof typeof COST_PRESETS
                  }
                })
              }
            />
          </Field>
          <details className="advanced">
            <summary>Réglages fins du coût</summary>
            {WEIGHT_FIELDS.map((f) => (
              <label key={f.key} className="slider">
                <span>{f.label}</span>
                <input
                  type="range"
                  min={f.key === 'open' ? -3 : 0}
                  max={f.max}
                  step={f.step}
                  value={weights[f.key]}
                  onChange={(e) => setWeight(f.key, Number(e.target.value))}
                />
                <output>{weights[f.key]}</output>
              </label>
            ))}
          </details>
        </>
      )}
    </Panel>
  )
}
