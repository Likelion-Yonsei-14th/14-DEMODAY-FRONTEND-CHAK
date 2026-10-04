import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { CheckCircle2 } from 'lucide-react'

type ChoiceCardProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  title: string
  description?: string
  selected?: boolean
  icon?: ReactNode
}

export function ChoiceCard({
  title,
  description,
  selected = false,
  icon,
  className = '',
  ...props
}: ChoiceCardProps) {
  return (
    <button
      type="button"
      className={['ds-choice-card', selected ? 'ds-choice-card--selected' : '', className].filter(Boolean).join(' ')}
      aria-pressed={selected}
      {...props}
    >
      {icon && <span className="ds-choice-card__icon">{icon}</span>}
      <span className="ds-choice-card__body">
        <strong>{title}</strong>
        {description && <span>{description}</span>}
      </span>
      {selected && <CheckCircle2 className="ds-choice-card__check" size={20} aria-hidden />}
    </button>
  )
}
