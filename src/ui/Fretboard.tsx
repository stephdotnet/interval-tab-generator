import type { LabelMode } from '../engine/export/alphatex'
import type { FretNote, Position } from '../engine/fingering/types'
import { isFretPlayable, type Fretboard as Board } from '../engine/instrument/fretboard'
import { midiToName } from '../engine/theory/pitch'
import { spellDegree } from '../engine/theory/spelling'
import { degreeOf, type TargetSet } from '../engine/theory/targets'
import { DEGREE_COLORS } from './colors'

const FRET_W = 46
const STRING_H = 24
const LEFT = 64
const TOP = 18
const INLAYS = [3, 5, 7, 9, 15, 17, 19, 21]

interface Props {
  board: Board
  targets: TargetSet
  labels: LabelMode
  /** Notes played by the exercise. */
  used: FretNote[]
  /** Position to frame (selected or being played). */
  position: Position | null
  /** Note being played. */
  active: FretNote | null
}

const key = (n: { string: number; fret: number }) => n.string + ':' + n.fret

export function Fretboard({ board, targets, labels, used, position, active }: Props) {
  const strings = board.tuning.length
  const frets = board.maxFret
  const width = LEFT + (frets + 0.5) * FRET_W
  const height = TOP * 2 + (strings - 1) * STRING_H + 14
  const y = (string: number) => TOP + (strings - 1 - string) * STRING_H
  const x = (fret: number) => (fret === 0 ? LEFT - FRET_W * 0.45 : LEFT + (fret - 0.5) * FRET_W)
  const windowStart = position && (position.lo === 0 ? LEFT - FRET_W * 0.9 : LEFT + (position.lo - 1) * FRET_W)
  const usedKeys = new Set(used.map(key))
  const label = (midi: number) => {
    const degree = degreeOf(targets, midi)!
    return labels === 'note' ? spellDegree(targets.tonic, degree) : degree
  }

  // Every location of the target pitches, faded when not used by the exercise
  const locations: { string: number; fret: number; midi: number }[] = []
  for (let string = 0; string < strings; string++) {
    for (let fret = 0; fret <= frets; fret++) {
      const midi = board.tuning[string] + fret
      if (degreeOf(targets, midi) && (fret > 0 || board.allowOpen)) {
        locations.push({ string, fret, midi })
      }
    }
  }

  return (
    <div className="fretboard" role="img" aria-label="Manche avec les notes de l'exercice">
      <svg viewBox={'0 0 ' + width + ' ' + height} width={width} height={height}>
        {position && windowStart !== null && (
          <rect
            className="fb-window"
            x={windowStart}
            y={TOP - 12}
            width={LEFT + position.hi * FRET_W - windowStart}
            height={(strings - 1) * STRING_H + 24}
            rx={8}
          />
        )}
        {INLAYS.filter((f) => f <= frets).map((f) => (
          <circle key={f} className="fb-inlay" cx={x(f)} cy={TOP + ((strings - 1) * STRING_H) / 2} r={4} />
        ))}
        {[12, 24]
          .filter((f) => f <= frets)
          .map((f) => (
            <g key={f} className="fb-inlay">
              <circle cx={x(f)} cy={TOP + STRING_H * 0.5} r={4} />
              <circle cx={x(f)} cy={TOP + (strings - 1.5) * STRING_H} r={4} />
            </g>
          ))}
        <line className="fb-nut" x1={LEFT} x2={LEFT} y1={TOP} y2={y(0)} />
        {Array.from({ length: frets }, (_, i) => i + 1).map((f) => (
          <g key={f}>
            <line
              className={'fb-fret' + (isFretPlayable(board, f) ? '' : ' off')}
              x1={LEFT + f * FRET_W}
              x2={LEFT + f * FRET_W}
              y1={TOP}
              y2={y(0)}
            />
            <text className="fb-fret-number" x={x(f)} y={height - 4}>
              {f}
            </text>
          </g>
        ))}
        {board.tuning.map((midi, s) => (
          <g key={s} className={board.disabledStrings.includes(s) ? 'fb-string off' : 'fb-string'}>
            <line x1={LEFT} x2={width} y1={y(s)} y2={y(s)} strokeWidth={1 + (strings - 1 - s) * 0.25} />
            <text className="fb-string-name" x={10} y={y(s) + 4}>
              {midiToName(midi).replace(/-?\d+$/, '')}
            </text>
          </g>
        ))}
        {locations.map((l) => {
          const isUsed = usedKeys.has(key(l))
          const degree = degreeOf(targets, l.midi)!
          const isActive = active !== null && key(active) === key(l)
          return (
            <g key={key(l)} className={'fb-note' + (isUsed ? ' used' : '') + (isActive ? ' active' : '')}>
              {isActive && <circle className="fb-halo" cx={x(l.fret)} cy={y(l.string)} r={15} />}
              <circle
                cx={x(l.fret)}
                cy={y(l.string)}
                r={isUsed ? 10 : 6}
                fill={isUsed ? DEGREE_COLORS[degree] : 'transparent'}
                stroke={DEGREE_COLORS[degree]}
              />
              {isUsed && labels !== 'none' && (
                <text x={x(l.fret)} y={y(l.string) + 3.5}>
                  {label(l.midi)}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
