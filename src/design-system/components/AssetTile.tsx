import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Check } from 'lucide-react'

type AssetTileProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  name: string
  thumbnail: ReactNode
  selected?: boolean
  badge?: string
}

export function AssetTile({
  name,
  thumbnail,
  selected = false,
  badge,
  className = '',
  ...props
}: AssetTileProps) {
  return (
    <button
      type="button"
      className={[
        'ds-asset-tile',
        selected ? 'ds-asset-tile--selected' : '',
        className,
      ].filter(Boolean).join(' ')}
      aria-pressed={selected}
      aria-label={name}
      {...props}
    >
      <span className="ds-asset-tile__visual">{thumbnail}</span>
      <span className="ds-asset-tile__meta">
        <span className="ds-asset-tile__name">{name}</span>
      </span>
      {badge && <span className="ds-asset-tile__badge">{badge}</span>}
      {selected && (
        <span className="ds-asset-tile__state">
          <Check size={14} aria-hidden />
        </span>
      )}
    </button>
  )
}
