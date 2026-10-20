import { ChevronRight, Dices } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { GRADE_DRAW_PATH } from './gradeDrawRoutes'
import './GradeDraw.css'

/** Small door into the mini game, placed on existing screens. */
export function GradeDrawEntryCard({ className = '' }: { className?: string }) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      className={['grade-draw-entry', className].filter(Boolean).join(' ')}
      onClick={() => navigate(GRADE_DRAW_PATH)}
    >
      <span className="grade-draw-entry__icon" aria-hidden>
        <Dices size={22} />
      </span>
      <span className="grade-draw-entry__text">
        <small>잠깐 쉬어 가는 미니게임</small>
        <strong>수능 운빨 뽑기</strong>
      </span>
      <ChevronRight size={18} aria-hidden />
    </button>
  )
}
