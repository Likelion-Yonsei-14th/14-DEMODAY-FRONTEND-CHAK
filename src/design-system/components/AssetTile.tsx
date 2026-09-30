import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Check, LockKeyhole } from 'lucide-react'

type AssetTileProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  name: string
  thumbnail: ReactNode
  selected?: boolean
  restricted?: boolean
  badge?: string
  supportsLongCard?: boolean
}

export function AssetTile({
  name,
  thumbnail,
  selected = false,
  restricted = false,
  badge,
  supportsLongCard,
  className = '',
  ...props
}: AssetTileProps) {
  return (
    <button
      type="button"
      className={[
        'ds-asset-tile',
        selected ? 'ds-asset-tile--selected' : '',
        restricted ? 'ds-asset-tile--restricted' : '',
        className,
      ].filter(Boolean).join(' ')}
      aria-pressed={selected}
      aria-label={restricted ? `${name}, 긴 카드에서 사용 제한` : name}
      {...props}
    >
      <span className="ds-asset-tile__visual">{thumbnail}</span>
      <span className="ds-asset-tile__meta">
        <span className="ds-asset-tile__name">{name}</span>
        {supportsLongCard && <span className="ds-asset-tile__capability">LONG</span>}
      </span>
      {badge && <span className="ds-asset-tile__badge">{badge}</span>}
      {selected && !restricted && <span className="ds-asset-tile__state"><Check size={14} aria-hidden /></span>}
      {restricted && <span className="ds-asset-tile__state"><LockKeyhole size={14} aria-hidden /></span>}
    </button>
  )
}
