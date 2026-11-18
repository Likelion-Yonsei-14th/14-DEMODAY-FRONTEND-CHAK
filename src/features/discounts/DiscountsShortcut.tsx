import { ChevronRight, Ticket } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DISCOUNTS_PATH } from './discountRoutes'
import './discountsShortcut.css'

/** 첫 화면·홈·시작 화면에서 미니게임 위에 놓는 수험표 할인 모음 바로가기. */
export function DiscountsShortcut() {
  const navigate = useNavigate()
  return (
    <button type="button" className="discounts-shortcut" onClick={() => navigate(DISCOUNTS_PATH)}>
      <Ticket size={20} aria-hidden />
      <span>
        <strong>수험표 할인 모음</strong>
        <small>수능 끝나고 수험표로 받는 혜택</small>
      </span>
      <ChevronRight size={18} aria-hidden />
    </button>
  )
}
