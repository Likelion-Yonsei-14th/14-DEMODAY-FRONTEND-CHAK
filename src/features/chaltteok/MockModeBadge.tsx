import { chaltteokMode } from '@/api/chaltteok'
import './chaltteok.css'

/** Dev builds only: a small tag saying 찰떡 runs on the local mock. */
export function MockModeBadge() {
  if (!import.meta.env.DEV || chaltteokMode !== 'mock') return null
  return (
    <span className="chaltteok-mock-badge" title="VITE_CHALTTEOK_API=mock">
      찰떡 mock
    </span>
  )
}
