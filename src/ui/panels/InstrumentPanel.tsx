import { defaultProgram, findInstrument, INSTRUMENTS, SOUNDS } from '../../engine/instrument/presets'
import { parseNote } from '../../engine/theory/pitch'
import { CUSTOM_TUNING, MAX_FRET, type Settings } from '../../engine/settings'
import { Chip, Field, NumberInput, Panel, Select, Toggle } from '../controls'
import type { UpdateSettings } from '../state/useSettings'

export function InstrumentPanel({ settings, update }: { settings: Settings; update: UpdateSettings }) {
  const { instrument } = settings
  const preset = findInstrument(instrument.presetId) ?? INSTRUMENTS[0]
  const tuningLabel =
    instrument.tuningId === CUSTOM_TUNING
      ? 'Perso'
      : (preset.tunings.find((t) => t.id === instrument.tuningId)?.label ?? '')

  const selectInstrument = (id: string) =>
    update((s) => {
      const next = findInstrument(id)!
      s.instrument.presetId = id
      s.instrument.tuningId = next.tunings[0].id
      s.instrument.tuning = next.tunings[0].notes
      s.instrument.maxFret = Math.min(s.instrument.maxFret, next.frets)
      s.instrument.disabledStrings = []
      s.instrument.program = defaultProgram(next.kind)
    })

  const selectTuning = (id: string) =>
    update((s) => {
      s.instrument.tuningId = id
      const tuning = preset.tunings.find((t) => t.id === id)
      if (tuning) {
        s.instrument.tuning = tuning.notes
      }
    })

  const setStringNote = (index: number, value: string) =>
    update((s) => {
      s.instrument.tuningId = CUSTOM_TUNING
      s.instrument.tuning = s.instrument.tuning.map((n, i) => (i === index ? value : n))
    })

  const toggleString = (index: number) =>
    update((s) => {
      const off = s.instrument.disabledStrings
      s.instrument.disabledStrings = off.includes(index) ? off.filter((i) => i !== index) : [...off, index]
    })

  return (
    <Panel title="Instrument" summary={preset.label + ' · ' + tuningLabel}>
      <Field label="Instrument">
        <Select
          value={instrument.presetId}
          choices={INSTRUMENTS.map((i) => ({ value: i.id, label: i.label }))}
          onChange={selectInstrument}
        />
      </Field>
      <Field label="Accordage">
        <Select
          value={instrument.tuningId}
          choices={[
            ...preset.tunings.map((t) => ({ value: t.id, label: t.label })),
            { value: CUSTOM_TUNING, label: 'Personnalisé' },
          ]}
          onChange={selectTuning}
        />
      </Field>
      <Field label="Cordes" hint="Grave à gauche. Modifier une note passe en accordage perso ; décocher une corde l'exclut.">
        <div className="strings">
          {instrument.tuning.map((note, i) => (
            <div key={i} className="string-cell">
              <input
                className={'string-note' + (parseNote(note) === null ? ' invalid' : '')}
                value={note}
                aria-label={'Corde ' + (instrument.tuning.length - i)}
                onChange={(e) => setStringNote(i, e.target.value)}
              />
              <input
                type="checkbox"
                checked={!instrument.disabledStrings.includes(i)}
                aria-label={'Utiliser la corde ' + (instrument.tuning.length - i)}
                onChange={() => toggleString(i)}
              />
            </div>
          ))}
        </div>
      </Field>
      <div className="row">
        <Field label="Case min">
          <NumberInput
            value={instrument.minFret}
            min={0}
            max={MAX_FRET}
            onChange={(v) => update((s) => (s.instrument.minFret = v))}
          />
        </Field>
        <Field label="Case max">
          <NumberInput
            value={instrument.maxFret}
            min={4}
            max={MAX_FRET}
            onChange={(v) => update((s) => (s.instrument.maxFret = v))}
          />
        </Field>
      </div>
      <Toggle
        label="Cordes à vide"
        checked={instrument.allowOpen}
        onChange={(v) => update((s) => (s.instrument.allowOpen = v))}
      />
      <Field label="Son">
        <div className="chips">
          {SOUNDS.map((sound) => (
            <Chip
              key={sound.program}
              active={sound.program === instrument.program}
              onClick={() => update((s) => (s.instrument.program = sound.program))}
            >
              {sound.label}
            </Chip>
          ))}
        </div>
      </Field>
    </Panel>
  )
}
