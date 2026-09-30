import type { ButtonHTMLAttributes, ReactNode } from 'react'

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  icon: ReactNode
  size?: 'm' | 'l'
  variant?: 'ghost' | 'surface'
}

export function IconButton({
  label,
  icon,
  size = 'm',
  variant = 'ghost',
  className = '',
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={['ds-icon-button', `ds-icon-button--${size}`, `ds-icon-button--${variant}`, className]
        .filter(Boolean)
        .join(' ')}
      aria-label={label}
      {...props}
    >
      {icon}
    </button>
  )
}
