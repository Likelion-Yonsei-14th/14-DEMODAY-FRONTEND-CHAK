import type { ReactNode } from 'react'

export type TabItem = {
  id: string
  label: string
  icon?: ReactNode
}

type TabsProps = {
  items: TabItem[]
  value: string
  onChange: (id: string) => void
  ariaLabel?: string
}

export function Tabs({
  items,
  value,
  onChange,
  ariaLabel = '탭',
}: TabsProps) {
  return (
    <div className="ds-tabs" role="tablist" aria-label={ariaLabel}>
      {items.map((item) => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={[
              'ds-tab',
              active ? 'ds-tab--active' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => onChange(item.id)}
          >
            <span className="ds-tab__icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
