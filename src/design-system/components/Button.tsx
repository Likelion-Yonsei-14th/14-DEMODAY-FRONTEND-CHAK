import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'

export type ButtonVariant = 'primary' | 'brand' | 'secondary' | 'tertiary'
export type ButtonSize = 'm' | 'l'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'l',
  loading = false,
  fullWidth = false,
  leadingIcon,
  trailingIcon,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={['ds-button', `ds-button--${variant}`, `ds-button--${size}`, fullWidth ? 'ds-button--full' : '', className]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <LoaderCircle className="ds-button__spinner" size={18} aria-hidden /> : leadingIcon}
      <span>{children}</span>
      {!loading && trailingIcon}
    </button>
  )
}
