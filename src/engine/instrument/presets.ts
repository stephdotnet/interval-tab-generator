export interface TuningPreset {
  id: string
  label: string
  /** Lowest string first. */
  notes: string[]
}

export interface InstrumentPreset {
  id: string
  label: string
  kind: 'guitar' | 'bass'
  frets: number
  tunings: TuningPreset[]
}

export const INSTRUMENTS: InstrumentPreset[] = [
  {
    id: 'guitar6',
    label: 'Guitare 6 cordes',
    kind: 'guitar',
    frets: 22,
    tunings: [
      { id: 'standard', label: 'Standard (EADGBE)', notes: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'] },
      { id: 'eb', label: 'Demi-ton plus bas (Eb)', notes: ['Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4'] },
      { id: 'dstd', label: 'Un ton plus bas (D)', notes: ['D2', 'G2', 'C3', 'F3', 'A3', 'D4'] },
      { id: 'dropd', label: 'Drop D', notes: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'] },
      { id: 'dropc', label: 'Drop C', notes: ['C2', 'G2', 'C3', 'F3', 'A3', 'D4'] },
      { id: 'dadgad', label: 'DADGAD', notes: ['D2', 'A2', 'D3', 'G3', 'A3', 'D4'] },
      { id: 'openg', label: 'Open G', notes: ['D2', 'G2', 'D3', 'G3', 'B3', 'D4'] },
      { id: 'opend', label: 'Open D', notes: ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'] },
      { id: 'opene', label: 'Open E', notes: ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4'] },
    ],
  },
  {
    id: 'guitar7',
    label: 'Guitare 7 cordes',
    kind: 'guitar',
    frets: 24,
    tunings: [
      { id: 'standard', label: 'Standard (BEADGBE)', notes: ['B1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4'] },
      { id: 'dropa', label: 'Drop A', notes: ['A1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4'] },
    ],
  },
  {
    id: 'guitar8',
    label: 'Guitare 8 cordes',
    kind: 'guitar',
    frets: 24,
    tunings: [
      { id: 'standard', label: 'Standard (F#BEADGBE)', notes: ['F#1', 'B1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4'] },
      { id: 'drope', label: 'Drop E', notes: ['E1', 'B1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4'] },
    ],
  },
  {
    id: 'bass4',
    label: 'Basse 4 cordes',
    kind: 'bass',
    frets: 20,
    tunings: [
      { id: 'standard', label: 'Standard (EADG)', notes: ['E1', 'A1', 'D2', 'G2'] },
      { id: 'dropd', label: 'Drop D', notes: ['D1', 'A1', 'D2', 'G2'] },
      { id: 'eb', label: 'Demi-ton plus bas (Eb)', notes: ['Eb1', 'Ab1', 'Db2', 'Gb2'] },
    ],
  },
  {
    id: 'bass5',
    label: 'Basse 5 cordes',
    kind: 'bass',
    frets: 24,
    tunings: [
      { id: 'standard', label: 'Standard (BEADG)', notes: ['B0', 'E1', 'A1', 'D2', 'G2'] },
      { id: 'high-c', label: 'EADGC', notes: ['E1', 'A1', 'D2', 'G2', 'C3'] },
    ],
  },
]

export interface SoundPreset {
  program: number
  label: string
}

/** General MIDI programs available in the SONiVOX soundfont. */
export const SOUNDS: SoundPreset[] = [
  { program: 24, label: 'Guitare nylon' },
  { program: 25, label: 'Guitare folk' },
  { program: 26, label: 'Guitare jazz' },
  { program: 27, label: 'Guitare électrique clean' },
  { program: 29, label: 'Guitare overdrive' },
  { program: 30, label: 'Guitare distortion' },
  { program: 33, label: 'Basse aux doigts' },
  { program: 34, label: 'Basse au médiator' },
  { program: 35, label: 'Basse fretless' },
]

export function findInstrument(id: string): InstrumentPreset | undefined {
  return INSTRUMENTS.find((i) => i.id === id)
}

export function defaultProgram(kind: InstrumentPreset['kind']): number {
  return kind === 'bass' ? 33 : 25
}
