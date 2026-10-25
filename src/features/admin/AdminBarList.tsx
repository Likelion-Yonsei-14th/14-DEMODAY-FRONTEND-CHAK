import { formatNumber } from './adminFormat'

export type BarRow = { label: string; value: number; sub?: string; /** 알 수 없음처럼 따로 구분해 보여 줄 줄 */ muted?: boolean }

/** 가로 막대 목록. 가장 큰 값을 100%로 맞춘다. */
export function BarList({ rows }: { rows: BarRow[] }) {
  const max = Math.max(1, ...rows.map((row) => row.value))
  return (
    <ul className="admin-bars">
      {rows.map((row) => (
        <li key={row.label} className={row.muted ? 'is-muted' : undefined}>
          <span className="admin-bars__label">{row.label}</span>
          <span className="admin-bars__track">
            <span className="admin-bars__fill" style={{ width: `${(row.value / max) * 100}%` }} />
          </span>
          <span className="admin-bars__value">
            {formatNumber(row.value)}
            {row.sub && <small> {row.sub}</small>}
          </span>
        </li>
      ))}
    </ul>
  )
}
