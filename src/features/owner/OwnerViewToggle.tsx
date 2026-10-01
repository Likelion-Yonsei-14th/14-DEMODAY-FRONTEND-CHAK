import { LayoutGrid, Mail } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import './OwnerViewToggle.css'

type OwnerViewToggleProps = {
  mode: 'desk' | 'mail'
}

export function OwnerViewToggle({ mode }: OwnerViewToggleProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const go = (path: string) => navigate(`${path}${location.search}`)

  return (
    <div className="owner-view-toggle" role="group" aria-label="응원 보기 방식">
      <button
        type="button"
        className={mode === 'desk' ? 'owner-view-toggle__item owner-view-toggle__item--active' : 'owner-view-toggle__item'}
        aria-pressed={mode === 'desk'}
        onClick={() => go('/prototype/my/desk')}
      >
        <LayoutGrid size={15} aria-hidden />
        책상 보기
      </button>
      <button
        type="button"
        className={mode === 'mail' ? 'owner-view-toggle__item owner-view-toggle__item--active' : 'owner-view-toggle__item'}
        aria-pressed={mode === 'mail'}
        onClick={() => go('/prototype/my/desk/cards')}
      >
        <Mail size={15} aria-hidden />
        봉투 보기
      </button>
    </div>
  )
}
