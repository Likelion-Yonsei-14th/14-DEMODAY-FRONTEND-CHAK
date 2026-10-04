import type { InputHTMLAttributes, ReactNode } from 'react'

type NativeSelectionProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode
  helper?: string
}

export function Checkbox({ label, helper, className = '', ...props }: NativeSelectionProps) {
  return (
    <label className={['ds-selection', className].filter(Boolean).join(' ')}>
      <input className="ds-selection__native" type="checkbox" {...props} />
      <span className="ds-selection__indicator ds-selection__indicator--checkbox" aria-hidden />
      <span className="ds-selection__copy">
        <span className="ds-selection__label">{label}</span>
        {helper && <span className="ds-selection__helper">{helper}</span>}
      </span>
    </label>
  )
}

export function Radio({ label, helper, className = '', ...props }: NativeSelectionProps) {
  return (
    <label className={['ds-selection', className].filter(Boolean).join(' ')}>
      <input className="ds-selection__native" type="radio" {...props} />
      <span className="ds-selection__indicator ds-selection__indicator--radio" aria-hidden />
      <span className="ds-selection__copy">
        <span className="ds-selection__label">{label}</span>
        {helper && <span className="ds-selection__helper">{helper}</span>}
      </span>
    </label>
  )
}
