import { normalizeDegrees, type Degree } from './degrees'

export interface LibraryEntry {
  id: string
  name: string
  /** Chord symbol appended to the tonic (Cm7b5); absent for scales and intervals. */
  symbol?: string
  degrees: Degree[]
  /** Other names, used by the search (English names, synonyms). */
  aka?: string[]
}

export interface LibraryCategory {
  id: string
  label: string
  entries: LibraryEntry[]
}

type Row = [id: string, name: string, degrees: string, symbol?: string, aka?: string]

function category(id: string, label: string, rows: Row[]): LibraryCategory {
  return {
    id,
    label,
    entries: rows.map(([entryId, name, degrees, symbol, aka]) => ({
      id: entryId,
      name,
      degrees: degrees.split(' ') as Degree[],
      ...(symbol !== undefined && { symbol }),
      ...(aka && { aka: aka.split(',') }),
    })),
  }
}

export const LIBRARY: LibraryCategory[] = [
  category('intervals', 'Intervalles', [
    ['int-b2', 'Seconde mineure', '1 b2', undefined, 'demi-ton,minor second'],
    ['int-2', 'Seconde majeure', '1 2', undefined, 'ton,major second'],
    ['int-s2', 'Seconde augmentée', '1 #2', undefined, 'augmented second'],
    ['int-b3', 'Tierce mineure', '1 b3', undefined, 'minor third'],
    ['int-3', 'Tierce majeure', '1 3', undefined, 'major third'],
    ['int-4', 'Quarte juste', '1 4', undefined, 'perfect fourth'],
    ['int-s4', 'Quarte augmentée', '1 #4', undefined, 'triton,tritone'],
    ['int-b5', 'Quinte diminuée', '1 b5', undefined, 'triton,tritone'],
    ['int-5', 'Quinte juste', '1 5', undefined, 'perfect fifth,power chord'],
    ['int-s5', 'Quinte augmentée', '1 #5', undefined, 'augmented fifth'],
    ['int-b6', 'Sixte mineure', '1 b6', undefined, 'minor sixth'],
    ['int-6', 'Sixte majeure', '1 6', undefined, 'major sixth'],
    ['int-b7', 'Septième mineure', '1 b7', undefined, 'minor seventh'],
    ['int-7', 'Septième majeure', '1 7', undefined, 'major seventh'],
  ]),
  category('triads', 'Arpèges : triades', [
    ['maj', 'Majeur', '1 3 5', undefined, 'major'],
    ['min', 'Mineur', '1 b3 5', 'm', 'minor'],
    ['dim', 'Diminué', '1 b3 b5', 'dim', 'diminished'],
    ['aug', 'Augmenté', '1 3 #5', 'aug', 'augmented,+'],
    ['sus2', 'Suspendu 2', '1 2 5', 'sus2', 'sus'],
    ['sus4', 'Suspendu 4', '1 4 5', 'sus4', 'sus'],
    ['b5', 'Majeur quinte bémol', '1 3 b5', '(b5)', 'flat five'],
  ]),
  category('sevenths', 'Arpèges : 4 sons', [
    ['maj7', 'Septième majeure', '1 3 5 7', 'maj7', 'major seventh,delta'],
    ['dom7', 'Septième de dominante', '1 3 5 b7', '7', 'dominant'],
    ['m7', 'Mineur septième', '1 b3 5 b7', 'm7', 'minor seventh'],
    ['mmaj7', 'Mineur septième majeure', '1 b3 5 7', 'm(maj7)', 'minor major'],
    ['m7b5', 'Demi-diminué', '1 b3 b5 b7', 'm7b5', 'half diminished,ø'],
    ['dim7', 'Septième diminuée', '1 b3 b5 bb7', 'dim7', 'diminished seventh,°7'],
    ['maj7s5', 'Septième majeure quinte augmentée', '1 3 #5 7', 'maj7#5', 'augmented major'],
    ['7s5', 'Septième quinte augmentée', '1 3 #5 b7', '7#5', 'augmented seventh,7+'],
    ['7b5', 'Septième quinte bémol', '1 3 b5 b7', '7b5', 'flat five'],
    ['7sus4', 'Septième suspendue 4', '1 4 5 b7', '7sus4', 'sus'],
    ['6', 'Sixte majeure', '1 3 5 6', '6', 'major sixth'],
    ['m6', 'Mineur sixte', '1 b3 5 6', 'm6', 'minor sixth'],
    ['add9', 'Majeur add9', '1 2 3 5', 'add9', 'add 9'],
    ['madd9', 'Mineur add9', '1 2 b3 5', 'm(add9)', 'minor add 9'],
  ]),
  category('extended', 'Arpèges : enrichis', [
    ['maj9', 'Neuvième majeure', '1 2 3 5 7', 'maj9', 'major ninth'],
    ['9', 'Neuvième de dominante', '1 2 3 5 b7', '9', 'dominant ninth'],
    ['m9', 'Mineur neuvième', '1 2 b3 5 b7', 'm9', 'minor ninth'],
    ['7b9', 'Septième neuvième bémol', '1 b2 3 5 b7', '7b9', 'flat nine'],
    ['7s9', 'Septième neuvième augmentée', '1 #2 3 5 b7', '7#9', 'sharp nine,hendrix'],
    ['69', 'Six-neuf', '1 2 3 5 6', '6/9', 'six nine'],
    ['m69', 'Mineur six-neuf', '1 2 b3 5 6', 'm6/9', 'minor six nine'],
    ['m11', 'Mineur onzième', '1 2 b3 4 5 b7', 'm11', 'minor eleventh'],
    ['maj7s11', 'Septième majeure onzième augmentée', '1 3 #4 5 7', 'maj7#11', 'lydian chord'],
    ['13', 'Treizième de dominante', '1 2 3 5 6 b7', '13', 'dominant thirteenth'],
  ]),
  category('pentatonic', 'Pentatoniques et blues', [
    ['penta-maj', 'Pentatonique majeure', '1 2 3 5 6', undefined, 'major pentatonic'],
    ['penta-min', 'Pentatonique mineure', '1 b3 4 5 b7', undefined, 'minor pentatonic'],
    ['blues-min', 'Blues mineure', '1 b3 4 b5 5 b7', undefined, 'blues,minor blues'],
    ['blues-maj', 'Blues majeure', '1 2 b3 3 5 6', undefined, 'major blues'],
    ['penta-dom', 'Pentatonique dominante', '1 2 3 5 b7', undefined, 'dominant pentatonic'],
    ['egyptian', 'Égyptienne (suspendue)', '1 2 4 5 b7', undefined, 'egyptian,suspended pentatonic'],
    ['hirajoshi', 'Hirajoshi', '1 2 b3 5 b6', undefined, 'japanese'],
    ['in-sen', 'In-sen', '1 b2 4 5 b7', undefined, 'japanese'],
    ['kumoi', 'Kumoi', '1 2 b3 5 6', undefined, 'japanese'],
  ]),
  category('major-modes', 'Modes de la gamme majeure', [
    ['ionian', 'Ionien (gamme majeure)', '1 2 3 4 5 6 7', undefined, 'major,majeure,ionian'],
    ['dorian', 'Dorien', '1 2 b3 4 5 6 b7', undefined, 'dorian'],
    ['phrygian', 'Phrygien', '1 b2 b3 4 5 b6 b7', undefined, 'phrygian'],
    ['lydian', 'Lydien', '1 2 3 #4 5 6 7', undefined, 'lydian'],
    ['mixolydian', 'Mixolydien', '1 2 3 4 5 6 b7', undefined, 'mixolydian'],
    ['aeolian', 'Éolien (mineure naturelle)', '1 2 b3 4 5 b6 b7', undefined, 'aeolian,minor,natural minor'],
    ['locrian', 'Locrien', '1 b2 b3 4 b5 b6 b7', undefined, 'locrian'],
  ]),
  category('melodic-minor', 'Modes de la mineure mélodique', [
    ['melodic-minor', 'Mineure mélodique', '1 2 b3 4 5 6 7', undefined, 'melodic minor,jazz minor'],
    ['dorian-b2', 'Dorien b2', '1 b2 b3 4 5 6 b7', undefined, 'phrygian #6'],
    ['lydian-aug', 'Lydien augmenté', '1 2 3 #4 #5 6 7', undefined, 'lydian augmented'],
    ['lydian-dom', 'Lydien b7 (dominant)', '1 2 3 #4 5 6 b7', undefined, 'lydian dominant,acoustic,overtone'],
    ['mixo-b6', 'Mixolydien b6', '1 2 3 4 5 b6 b7', undefined, 'aeolian dominant,hindu'],
    ['locrian-2', 'Locrien #2 (demi-diminué)', '1 2 b3 4 b5 b6 b7', undefined, 'half diminished,aeolian b5'],
    ['altered', 'Altérée (super locrien)', '1 b2 #2 3 #4 b6 b7', undefined, 'altered,super locrian,alt'],
  ]),
  category('harmonic-minor', 'Modes de la mineure harmonique', [
    ['harmonic-minor', 'Mineure harmonique', '1 2 b3 4 5 b6 7', undefined, 'harmonic minor'],
    ['locrian-6', 'Locrien #6', '1 b2 b3 4 b5 6 b7', undefined, 'locrian natural 6'],
    ['ionian-s5', 'Ionien #5', '1 2 3 4 #5 6 7', undefined, 'ionian augmented'],
    ['dorian-s4', 'Dorien #4 (ukrainien)', '1 2 b3 #4 5 6 b7', undefined, 'ukrainian dorian,romanian'],
    ['phrygian-dom', 'Phrygien dominant', '1 b2 3 4 5 b6 b7', undefined, 'phrygian dominant,spanish,freygish'],
    ['lydian-s2', 'Lydien #2', '1 #2 3 #4 5 6 7', undefined, 'lydian sharp 2'],
    // The b4 of the ultralocrian is written 3: the degree set has no b4
    ['ultralocrian', 'Ultralocrien', '1 b2 b3 3 b5 b6 bb7', undefined, 'super locrian bb7'],
  ]),
  category('other', 'Autres gammes', [
    ['harmonic-major', 'Majeure harmonique', '1 2 3 4 5 b6 7', undefined, 'harmonic major'],
    ['double-harmonic', 'Double harmonique (byzantine)', '1 b2 3 4 5 b6 7', undefined, 'double harmonic,byzantine,arabic'],
    ['hungarian-minor', 'Mineure hongroise', '1 2 b3 #4 5 b6 7', undefined, 'hungarian minor,gypsy'],
    ['neapolitan-minor', 'Napolitaine mineure', '1 b2 b3 4 5 b6 7', undefined, 'neapolitan minor'],
    ['neapolitan-major', 'Napolitaine majeure', '1 b2 b3 4 5 6 7', undefined, 'neapolitan major'],
    ['whole-tone', 'Par tons', '1 2 3 #4 #5 b7', undefined, 'whole tone'],
    ['dim-wh', 'Diminuée ton / demi-ton', '1 2 b3 4 b5 #5 6 7', undefined, 'whole half,diminished,octatonic'],
    ['dim-hw', 'Diminuée demi-ton / ton', '1 b2 #2 3 #4 5 6 b7', undefined, 'half whole,dominant diminished,octatonic'],
    ['bebop-dom', 'Bebop dominante', '1 2 3 4 5 6 b7 7', undefined, 'bebop dominant'],
    ['bebop-maj', 'Bebop majeure', '1 2 3 4 5 #5 6 7', undefined, 'bebop major'],
    ['bebop-dorian', 'Bebop dorienne', '1 2 b3 3 4 5 6 b7', undefined, 'bebop minor,bebop dorian'],
    ['augmented', 'Augmentée (hexatonique)', '1 #2 3 5 #5 7', undefined, 'augmented scale,hexatonic'],
    ['prometheus', 'Prométhée', '1 2 3 #4 6 b7', undefined, 'prometheus,mystic'],
  ]),
]

export const LIBRARY_ENTRIES: LibraryEntry[] = LIBRARY.flatMap((c) => c.entries)

const sameDegrees = (a: readonly Degree[], b: readonly Degree[]) =>
  a.length === b.length && a.every((d, i) => d === b[i])

export function matchesEntry(entry: LibraryEntry, degrees: readonly Degree[]): boolean {
  return sameDegrees(entry.degrees, normalizeDegrees(degrees))
}

// Some formulas have several names (1 2 3 5 6 = major pentatonic = 6/9): scales win over rich chords
const NAMING_PRIORITY = ['intervals', 'triads', 'sevenths', 'pentatonic', 'major-modes', 'melodic-minor', 'harmonic-minor', 'other', 'extended']

/** Name of the given degrees if the library has it, scales being preferred to extended chords. */
export function findEntry(degrees: readonly Degree[]): LibraryEntry | undefined {
  return NAMING_PRIORITY.flatMap((id) => LIBRARY.find((c) => c.id === id)!.entries).find((e) =>
    matchesEntry(e, degrees),
  )
}

export function categoryOf(entry: LibraryEntry): LibraryCategory {
  return LIBRARY.find((c) => c.entries.includes(entry))!
}

const simplify = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

/** Entries whose name, symbol, other names or degrees contain every word of the query. */
export function searchLibrary(query: string): LibraryEntry[] {
  const words = simplify(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) {
    return []
  }
  return LIBRARY_ENTRIES.filter((e) => {
    const haystack = simplify([e.name, e.symbol ?? '', ...(e.aka ?? []), e.degrees.join(' ')].join(' '))
    return words.every((w) => haystack.includes(w))
  })
}
