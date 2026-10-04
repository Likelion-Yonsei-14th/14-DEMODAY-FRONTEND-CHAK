import type { ReactNode } from 'react'

export type BottomNavigationItem = {
  id: string
  label: string
  icon: ReactNode
}

type BottomNavigationProps = {
  items: BottomNavigationItem[]
  value: string
  onChange: (id: string) => void
}

export function BottomNavigation({ items, value, onChange }: BottomNavigationProps) {
  return (
    <nav className="ds-bottom-nav" aria-label="하단 탐색">
      {items.map((item) => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            type="button"
            className={['ds-bottom-nav__item', active ? 'ds-bottom-nav__item--active' : ''].filter(Boolean).join(' ')}
            aria-current={active ? 'page' : undefined}
            onClick={() => onChange(item.id)}
          >
            <span className="ds-bottom-nav__icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
