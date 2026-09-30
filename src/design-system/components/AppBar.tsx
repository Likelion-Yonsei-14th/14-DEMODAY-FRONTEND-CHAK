import type { ReactNode } from 'react'

type AppBarProps = {
  title?: string
  leading?: ReactNode
  trailing?: ReactNode
  subtitle?: string
  transparent?: boolean
}

export function AppBar({
  title,
  leading,
  trailing,
  subtitle,
  transparent = false,
}: AppBarProps) {
  return (
    <header className={['ds-app-bar', transparent ? 'ds-app-bar--transparent' : ''].filter(Boolean).join(' ')}>
      <div className="ds-app-bar__side ds-app-bar__side--leading">{leading}</div>
      <div className="ds-app-bar__title-wrap">
        {title && <h1 className="ds-app-bar__title">{title}</h1>}
        {subtitle && <p className="ds-app-bar__subtitle">{subtitle}</p>}
      </div>
      <div className="ds-app-bar__side ds-app-bar__side--trailing">{trailing}</div>
    </header>
  )
}
