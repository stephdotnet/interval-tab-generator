import { AlphaTabApi, LayoutMode, LogLevel, NotationElement, PlayerMode, synth } from '@coderline/alphatab'
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { PlayerSettings } from '../engine/settings'
import { rampedTempo } from './tempoRamp'

export interface PlayerStatus {
  /** Soundfont loaded, playback possible. */
  ready: boolean
  /** Soundfont loading progress, 0 to 1. */
  loading: number
  playing: boolean
  /** Tempo actually played (differs from the base tempo while ramping). */
  bpm: number
  loops: number
}

interface Options {
  tex: string
  baseTempo: number
  player: PlayerSettings
  /** Called with the bar and beat index being played, or null when playback stops. */
  onBeat: (position: { bar: number; beat: number } | null) => void
}

export function useAlphaTab(
  container: RefObject<HTMLDivElement | null>,
  scroller: RefObject<HTMLDivElement | null>,
  { tex, baseTempo, player, onBeat }: Options,
) {
  const apiRef = useRef<AlphaTabApi | null>(null)
  const [status, setStatus] = useState<PlayerStatus>({ ready: false, loading: 0, playing: false, bpm: baseTempo, loops: 0 })
  // Latest values for the alphaTab event handlers, which are registered once
  const latest = useRef({ onBeat, baseTempo, player, loops: 0 })
  useEffect(() => {
    Object.assign(latest.current, { onBeat, baseTempo, player })
  })

  const resetRamp = useCallback(() => {
    latest.current.loops = 0
    if (apiRef.current) {
      apiRef.current.playbackSpeed = 1
    }
    setStatus((s) => ({ ...s, loops: 0, bpm: latest.current.baseTempo }))
  }, [])

  useEffect(() => {
    const api = new AlphaTabApi(container.current!, {
      core: { logLevel: LogLevel.Warning, fontDirectory: import.meta.env.BASE_URL + 'font/' },
      display: { layoutMode: LayoutMode.Page, scale: 1, padding: [16, 16, 16, 16], justifyLastSystem: true },
      notation: {
        elements: new Map([
          [NotationElement.EffectDynamics, false],
          [NotationElement.TrackNames, false],
        ]),
      },
      player: {
        playerMode: PlayerMode.EnabledSynthesizer,
        enableCursor: true,
        enableAnimatedBeatCursor: true,
        enableUserInteraction: true,
        soundFont: import.meta.env.BASE_URL + 'soundfont/sonivox.sf2',
        scrollElement: scroller.current ?? undefined,
      },
    })
    api.soundFontLoad.on((e) => setStatus((s) => ({ ...s, loading: e.total ? e.loaded / e.total : 0 })))
    api.playerReady.on(() => setStatus((s) => ({ ...s, ready: true, loading: 1 })))
    api.playerStateChanged.on((e) => {
      setStatus((s) => ({ ...s, playing: e.state === synth.PlayerState.Playing }))
      if (e.stopped) {
        latest.current.onBeat(null)
      }
    })
    api.playedBeatChanged.on((beat) => latest.current.onBeat({ bar: beat.voice.bar.index, beat: beat.index }))

    // While looping, alphaSynth signals "finished" at the end of every loop
    api.playerFinished.on(() => {
      if (!api.isLooping) {
        return
      }
      const { player, baseTempo } = latest.current
      const loops = ++latest.current.loops
      const bpm = rampedTempo(baseTempo, loops, {
        enabled: player.ramp,
        step: player.rampStep,
        every: player.rampEvery,
        max: player.rampMax,
      })
      api.playbackSpeed = bpm / baseTempo
      setStatus((s) => ({ ...s, loops, bpm }))
    })
    apiRef.current = api
    return () => {
      api.destroy()
      apiRef.current = null
    }
  }, [container, scroller])

  useEffect(() => {
    apiRef.current?.tex(tex)
    resetRamp()
  }, [tex, resetRamp])

  useEffect(() => {
    const api = apiRef.current
    if (!api) {
      return
    }
    api.isLooping = player.loop
    api.metronomeVolume = player.metronome ? 1 : 0
    api.countInVolume = player.countIn ? 1 : 0
  }, [player.loop, player.metronome, player.countIn, status.ready])

  const playPause = useCallback(() => apiRef.current?.playPause(), [])
  const stop = useCallback(() => {
    apiRef.current?.stop()
    resetRamp()
  }, [resetRamp])

  return { status, playPause, stop }
}
