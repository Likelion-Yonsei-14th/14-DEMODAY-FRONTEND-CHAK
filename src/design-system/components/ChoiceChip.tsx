import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Check } from 'lucide-react'

type ChoiceChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean
  leadingIcon?: ReactNode
}

export function ChoiceChip({ selected = false, leadingIcon, children, className = '', ...props }: ChoiceChipProps) {
  return (
    <button
      type="button"
      className={['ds-chip', selected ? 'ds-chip--selected' : '', className].filter(Boolean).join(' ')}
      aria-pressed={selected}
      {...props}
    >
      {selected ? <Check size={16} aria-hidden /> : leadingIcon}
      <span>{children}</span>
    </button>
  )
}
