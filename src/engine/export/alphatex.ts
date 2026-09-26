import type { Slot, Subdivision } from '../rhythm/rhythm'
import { isTuplet, texDuration } from '../rhythm/rhythm'
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

/** Builds the alphaTex score of the exercise. Bar and beat indexes match the `bars` array. */
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
  // A bar of silence is written with one rest per beat rather than one per note
  const restBar = ':' + o.tsDen + ' ' + Array(o.tsNum).fill('r').join(' ')
  const body = content
    .map((bar) => (bar.every((slot) => !slot) ? restBar : duration + ' ' + bar.map((slot) => beat(slot, o)).join(' ')))
    .join(' |\n')
  return header.join('\n') + '\n' + body
}
