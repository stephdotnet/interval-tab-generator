import type { ReactNode } from 'react'

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  )
}

export interface Choice<T> {
  value: T
  label: string
  disabled?: boolean
  title?: string
}

export function Segmented<T extends string | number>({
  value,
  choices,
  onChange,
}: {
  value: T
  choices: Choice<T>[]
  onChange: (value: T) => void
}) {
  return (
    <div className="segmented" role="radiogroup">
      {choices.map((c) => (
        <button
          key={String(c.value)}
          type="button"
          role="radio"
          aria-checked={c.value === value}
          className={c.value === value ? 'active' : ''}
          disabled={c.disabled}
          title={c.title}
          onClick={() => onChange(c.value)}
        >
          {c.label}
        </button>
      ))}
    </div>
  )
}

export function Chip({
  active,
  onClick,
  children,
  title,
  className,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  title?: string
  className?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={'chip' + (active ? ' active' : '') + (className ? ' ' + className : '')}
      title={title}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

export function NumberInput({
  value,
  min,
  max,
  step = 1,
  onChange,
  ariaLabel,
}: {
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  ariaLabel?: string
}) {
  return (
    <input
      className="number"
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      aria-label={ariaLabel}
      onChange={(e) => {
        const v = Number(e.target.value)
        if (e.target.value !== '' && Number.isFinite(v)) {
          onChange(Math.min(max, Math.max(min, v)))
        }
      }}
    />
  )
}

export function Select<T extends string | number>({
  value,
  choices,
  onChange,
  ariaLabel,
  disabled,
}: {
  value: T
  choices: Choice<T>[]
  onChange: (value: T) => void
  ariaLabel?: string
  disabled?: boolean
}) {
  return (
    <select
      value={String(value)}
      aria-label={ariaLabel}
      disabled={disabled}
      onChange={(e) => {
        const choice = choices.find((c) => String(c.value) === e.target.value)
        if (choice) {
          onChange(choice.value)
        }
      }}
    >
      {choices.map((c) => (
        <option key={String(c.value)} value={String(c.value)} disabled={c.disabled}>
          {c.label}
        </option>
      ))}
    </select>
  )
}

export function Panel({ title, summary, children, open }: { title: string; summary?: string; children: ReactNode; open?: boolean }) {
  return (
    <details className="panel" open={open}>
      <summary>
        <span className="panel-title">{title}</span>
        {summary && <span className="panel-summary">{summary}</span>}
      </summary>
      <div className="panel-body">{children}</div>
    </details>
  )
}
