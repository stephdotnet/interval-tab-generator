import type { Slot, Subdivision } from '../rhythm/rhythm'
import { barTicks, isTuplet, noteTicks, texDuration, WHOLE_TICKS } from '../rhythm/rhythm'
import { midiToName } from '../theory/pitch'
import { spellDegree, type Tonic } from '../theory/spelling'

export const LABEL_MODES = ['degree', 'note', 'none'] as const
export type LabelMode = (typeof LABEL_MODES)[number]

export const NOTATION_MODES = ['tab', 'scoreTab'] as const
export type NotationMode = (typeof NOTATION_MODES)[number]

export interface TexOptions {
  title: string
  tempo: number
  tsNum: number
  tsDen: number
  subdivision: Subdivision
  /** MIDI of each open string, lowest first. */
  tuning: number[]
  program: number
  tonic: Tonic
  labels: LabelMode
  notation: NotationMode
}

const quote = (text: string) => '"' + text.replace(/["\\]/g, '') + '"'

function beat(slot: Slot, o: TexOptions): string {
  if (!slot) {
    return 'r'
  }
  const { note } = slot
  // alphaTex numbers strings from the highest one
  const tex = note.fret + '.' + (o.tuning.length - note.string)
  if (o.labels === 'none') {
    return tex
  }
  return tex + ' {txt ' + quote(o.labels === 'degree' ? note.degree : spellDegree(o.tonic, note.degree)) + '}'
}

// Rest values from a whole to a 32nd, in ticks
const REST_TICKS = [192, 96, 48, 24, 12, 6]

/**
 * Rests completing a bar from `from` ticks: first the rest of the current tuplet group,
 * then the largest values aligned on the beat, as a musician would write them.
 */
function fillWithRests(from: number, o: TexOptions, duration: string): string[] {
  const end = barTicks(o)
  const note = noteTicks(o.subdivision)
  const out: string[] = []
  let position = from
  if (isTuplet(o.subdivision)) {
    const tupletRests: string[] = []
    while (position % (note * 3) !== 0 && position < end) {
      tupletRests.push('r')
      position += note
    }
    if (tupletRests.length) {
      out.push(duration + ' ' + tupletRests.join(' '))
    }
  }
  while (position < end) {
    const rest = REST_TICKS.find((t) => position % t === 0 && position + t <= end) ?? REST_TICKS[REST_TICKS.length - 1]
    out.push(':' + WHOLE_TICKS / rest + ' r')
    position += rest
  }
  return out
}

/**
 * Builds the alphaTex score of the exercise. Bar and beat indexes match the `bars` array for every
 * note; only the rests after the last note of a bar are merged.
 */
export function toAlphaTex(bars: readonly Slot[][], o: TexOptions): string {
  const perBar = bars[0]?.length ?? o.tsNum
  const content = bars.length ? bars : [Array<Slot>(perBar).fill(null)]
  const duration = ':' + texDuration(o.subdivision) + (isTuplet(o.subdivision) ? ' {tu 3}' : '')
  const header = [
    '\\title (' + quote(o.title) + ')',
    '\\tempo (' + o.tempo + ')',
    '\\ts (' + o.tsNum + ' ' + o.tsDen + ')',
    '\\track (' + quote('Exercice') + ')',
    '\\staff {' + (o.notation === 'tab' ? 'tabs' : 'score tabs') + '}',
    '\\tuning (' + [...o.tuning].reverse().map(midiToName).join(' ') + ')',
    '\\instrument (' + o.program + ')',
  ]
  const body = content
    .map((bar) => {
      const played = bar.slice(0, bar.findLastIndex((slot) => slot !== null) + 1)
      const notes = played.length ? [duration + ' ' + played.map((slot) => beat(slot, o)).join(' ')] : []
      return [...notes, ...fillWithRests(played.length * noteTicks(o.subdivision), o, duration)].join(' ')
    })
    .join(' |\n')
  return header.join('\n') + '\n' + body
}
