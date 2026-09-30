import { LockKeyhole } from 'lucide-react'
import type { ReactNode } from 'react'

export type TabItem = {
  id: string
  label: string
  icon?: ReactNode
  restricted?: boolean
}

type TabsProps = {
  items: TabItem[]
  value: string
  onChange: (id: string) => void
  onRestricted?: (item: TabItem) => void
  ariaLabel?: string
}

export function Tabs({ items, value, onChange, onRestricted, ariaLabel = '탭' }: TabsProps) {
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
              item.restricted ? 'ds-tab--restricted' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => item.restricted ? onRestricted?.(item) : onChange(item.id)}
          >
            <span className="ds-tab__icon">{item.restricted ? <LockKeyhole size={16} aria-hidden /> : item.icon}</span>
            <span>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
