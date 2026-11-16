import { ChevronRight, Ticket } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DISCOUNTS_PATH } from '@/features/discounts/discountRoutes'
import { TodayPollCard } from './TodayPollCard'
import './poll.css'

/** 첫 화면·홈·시작 화면에서 미니게임 위에 놓는 묶음: 오늘의 질문과 수험표 할인 모음 바로가기. */
export function SuneungCorner() {
  const navigate = useNavigate()
  return (
    <div className="suneung-corner">
      <TodayPollCard />
      <button type="button" className="suneung-corner__discounts" onClick={() => navigate(DISCOUNTS_PATH)}>
        <Ticket size={20} aria-hidden />
        <span>
          <strong>수험표 할인 모음</strong>
          <small>수능 끝나고 수험표로 받는 혜택</small>
        </span>
        <ChevronRight size={18} aria-hidden />
      </button>
    </div>
  )
}
