import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildExercise } from './engine/exercise'
import type { Settings } from './engine/settings'
import type { FretNote } from './engine/fingering/types'
import { clampIndex } from './engine/navigation/navigate'
import { useAlphaTab } from './player/useAlphaTab'
import { Fretboard } from './ui/Fretboard'
import { Icon } from './ui/Icon'
import { FingeringPanel } from './ui/panels/FingeringPanel'
import { InstrumentPanel } from './ui/panels/InstrumentPanel'
import { KeyPanel } from './ui/panels/KeyPanel'
import { PatternPanel } from './ui/panels/PatternPanel'
import { RhythmPanel } from './ui/panels/RhythmPanel'
import { PositionList } from './ui/PositionList'
import { PresetDrawer } from './ui/PresetDrawer'
import { usePresets } from './ui/state/usePresets'
import { useSettings } from './ui/state/useSettings'
import { TabView } from './ui/TabView'
import { Transport } from './ui/Transport'

export default function App() {
  const [settings, update] = useSettings()
  const exercise = useMemo(() => buildExercise(settings), [settings])
  const [playing, setPlaying] = useState<{ bar: number; beat: number } | null>(null)

  const replaceSettings = useCallback((next: Settings) => update((draft) => Object.assign(draft, next)), [update])
  const presets = usePresets(settings, replaceSettings)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const drawerButton = useRef<HTMLButtonElement>(null)
  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
    drawerButton.current?.focus()
  }, [])

  // "E" opens or closes "Mes exercices", unless the user is typing
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const typing =
        target.isContentEditable ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLInputElement && !['checkbox', 'radio', 'range', 'button'].includes(target.type))
      if (e.key.toLowerCase() === 'e' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        setDrawerOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const container = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const onBeat = useCallback((position: { bar: number; beat: number } | null) => setPlaying(position), [])
  const { status, playPause, stop } = useAlphaTab(container, scroller, {
    tex: exercise.tex,
    baseTempo: settings.rhythm.tempo,
    player: settings.player,
    onBeat,
  })

  const { positions } = exercise
  const selected =
    settings.navigation.mode === 'single' && positions.length
      ? positions[clampIndex(settings.navigation.positionIndex, positions.length)]
      : null
  const slot = playing ? (exercise.bars[playing.bar]?.[playing.beat] ?? null) : null
  const used = useMemo(
    () => exercise.steps.flatMap((s): FretNote[] => (s.kind === 'note' ? [s.note] : [])),
    [exercise.steps],
  )

  return (
    <div className="app">
      <header className="header">
        <div className="header-text">
          <h1>
            Tab d'intervalles <span>{exercise.title}</span>
          </h1>
          <p>Choisis une tonalité et des degrés : la tab se génère, se joue et se met en boucle.</p>
        </div>
        <div className="header-presets">
          <button
            ref={drawerButton}
            type="button"
            className="button presets-button"
            aria-haspopup="dialog"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <Icon name="folder" />
            Mes exercices
            <span className="count">{presets.presets.length}</span>
            <kbd>E</kbd>
          </button>
          {presets.current && (
            <span className="current-preset" title={presets.current.name}>
              {presets.current.name}
              {presets.modified && <span className="badge-dot"> · modifié</span>}
            </span>
          )}
        </div>
      </header>
      {drawerOpen && <PresetDrawer settings={settings} api={presets} onClose={closeDrawer} />}
      <div className="layout">
        <aside className="sidebar">
          <KeyPanel settings={settings} update={update} />
          <FingeringPanel settings={settings} update={update} exercise={exercise} />
          <PatternPanel settings={settings} update={update} />
          <RhythmPanel settings={settings} update={update} />
          <InstrumentPanel settings={settings} update={update} />
        </aside>
        <main className="main">
          <Transport settings={settings} update={update} status={status} onPlayPause={playPause} onStop={stop} />
          {exercise.problems.length > 0 && (
            <ul className="problems" role="alert">
              {exercise.problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
          <section className="card">
            <Fretboard
              board={exercise.board}
              targets={exercise.targets}
              labels={settings.display.labels === 'none' ? 'degree' : settings.display.labels}
              used={selected ? selected.notes : used}
              position={slot?.position ?? selected}
              active={slot?.note ?? null}
            />
            {positions.length > 0 && (
              <PositionList
                positions={positions}
                selected={selected ?? slot?.position ?? null}
                onSelect={(index) =>
                  update((s) => {
                    s.navigation.mode = 'single'
                    s.navigation.positionIndex = index
                  })
                }
              />
            )}
          </section>
          <TabView container={container} scroller={scroller} />
        </main>
      </div>
    </div>
  )
}
