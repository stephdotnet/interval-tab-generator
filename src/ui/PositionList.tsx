import type { Position } from '../engine/fingering/types'

export function PositionList({
  positions,
  selected,
  onSelect,
}: {
  positions: Position[]
  selected: Position | null
  onSelect: (index: number) => void
}) {
  return (
    <div className="positions" role="listbox" aria-label="Positions">
      {positions.map((p, i) => (
        <button
          key={p.id}
          type="button"
          role="option"
          aria-selected={p === selected}
          className={'position' + (p === selected ? ' active' : '')}
          onClick={() => onSelect(i)}
          title="Travailler cette position seule"
        >
          <span>{p.label}</span>
          <small>{p.notes.length} notes</small>
        </button>
      ))}
    </div>
  )
}
