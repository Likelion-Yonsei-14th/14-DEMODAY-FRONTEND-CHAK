import { ChevronRight, PencilLine } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { GUESS_GOD_PATH } from './guessGodRoutes'
import './GuessGod.css'

/** Small door into the mini game, placed on existing screens. */
export function GuessGodEntryCard() {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      className="guess-god-entry"
      onClick={() => navigate(GUESS_GOD_PATH)}
    >
      <span className="guess-god-entry__icon" aria-hidden>
        <PencilLine size={22} />
      </span>
      <span className="guess-god-entry__text">
        <small>잠깐 쉬어 가는 미니게임</small>
        <strong>오늘의 찍신은 나야!</strong>
      </span>
      <ChevronRight size={18} aria-hidden />
    </button>
  )
}
