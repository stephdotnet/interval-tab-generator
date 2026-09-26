import type { Settings } from '../engine/settings'
import type { PlayerStatus } from '../player/useAlphaTab'
import { NumberInput, Toggle } from './controls'
import type { UpdateSettings } from './state/useSettings'

export function Transport({
  settings,
  update,
  status,
  onPlayPause,
  onStop,
}: {
  settings: Settings
  update: UpdateSettings
  status: PlayerStatus
  onPlayPause: () => void
  onStop: () => void
}) {
  const { player, rhythm } = settings
  const ramping = player.ramp && status.bpm !== rhythm.tempo
  return (
    <div className="transport">
      <div className="transport-main">
        <button
          type="button"
          className="play"
          disabled={!status.ready}
          onClick={onPlayPause}
          aria-label={status.playing ? 'Pause' : 'Lecture'}
          title={status.ready ? 'Lecture / pause' : 'Chargement du son...'}
        >
          {status.playing ? (
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" /></svg>
          )}
        </button>
        <button type="button" className="stop" disabled={!status.ready} onClick={onStop} aria-label="Stop" title="Stop">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="1.5" /></svg>
        </button>
        <label className="tempo">
          <span>Tempo</span>
          <input
            type="range"
            min={30}
            max={240}
            value={rhythm.tempo}
            onChange={(e) => update((s) => (s.rhythm.tempo = Number(e.target.value)))}
          />
          <NumberInput value={rhythm.tempo} min={20} max={300} ariaLabel="Tempo" onChange={(v) => update((s) => (s.rhythm.tempo = v))} />
          <span className="unit">BPM</span>
        </label>
        {ramping && (
          <span className="badge" title={'Tours joués : ' + status.loops}>
            {Math.round(status.bpm)} BPM
          </span>
        )}
        {!status.ready && (
          <span className="loading">
            Chargement du son {Math.round(status.loading * 100)} %
          </span>
        )}
      </div>
      <div className="transport-options">
        <Toggle label="Boucle" checked={player.loop} onChange={(v) => update((s) => (s.player.loop = v))} />
        <Toggle label="Métronome" checked={player.metronome} onChange={(v) => update((s) => (s.player.metronome = v))} />
        <Toggle label="Décompte" checked={player.countIn} onChange={(v) => update((s) => (s.player.countIn = v))} />
        <Toggle label="Accélérer" checked={player.ramp} onChange={(v) => update((s) => (s.player.ramp = v))} />
        {player.ramp && (
          <span className="ramp">
            +
            <NumberInput value={player.rampStep} min={1} max={50} ariaLabel="BPM ajoutés" onChange={(v) => update((s) => (s.player.rampStep = v))} />
            BPM tous les
            <NumberInput value={player.rampEvery} min={1} max={32} ariaLabel="Tours" onChange={(v) => update((s) => (s.player.rampEvery = v))} />
            tours, jusqu'à
            <NumberInput value={player.rampMax} min={20} max={300} ariaLabel="Tempo max" onChange={(v) => update((s) => (s.player.rampMax = v))} />
            {!player.loop && <em> (active la boucle)</em>}
          </span>
        )}
      </div>
    </div>
  )
}
