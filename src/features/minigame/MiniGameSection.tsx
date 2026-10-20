import type { ReactNode } from 'react'
import { Dices, PencilLine, Smartphone } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { GRADE_DRAW_PATH } from './gradeDraw/gradeDrawRoutes'
import { GUESS_GOD_PATH } from './guessGod/guessGodRoutes'
import { SNEAKY_PHONE_PATH } from './sneakyPhone/sneakyPhoneRoutes'
import { getCharacterSrc } from './studyType/studyTypeCharacters'
import { STUDY_TYPE_PATH } from './studyType/studyTypeRoutes'
import './MiniGameSection.css'

type MiniGame = {
  id: string
  path: string
  title: string
  summary: string
  icon: ReactNode
}

const MINI_GAMES: readonly MiniGame[] = [
  {
    id: 'study-type',
    path: STUDY_TYPE_PATH,
    title: '나의 수험생 유형은?',
    summary: '공부 성향 테스트',
    icon: <img src={getCharacterSrc('PSA')} alt="" />,
  },
  {
    id: 'guess-god',
    path: GUESS_GOD_PATH,
    title: '오늘의 찍신은 나야!',
    summary: '10문제 찍기 운 시험',
    icon: <PencilLine size={22} />,
  },
  {
    id: 'grade-draw',
    path: GRADE_DRAW_PATH,
    title: '수능 운빨 뽑기',
    summary: '과목별 등급 뽑기',
    icon: <Dices size={22} />,
  },
  {
    id: 'sneaky-phone',
    path: SNEAKY_PHONE_PATH,
    title: '선생님 몰래 폰 하기',
    summary: '30초 타이밍 게임',
    icon: <Smartphone size={22} />,
  },
]

/** Every mini game in one place, shown at the end of /home and /start. */
export function MiniGameSection() {
  const navigate = useNavigate()

  return (
    <section className="mini-games" aria-labelledby="mini-games-title">
      <div className="mini-games__head">
        <h2 id="mini-games-title">잠깐 쉬어 가기</h2>
        <span>미니게임</span>
      </div>
      <ul className="mini-games__grid">
        {MINI_GAMES.map((game) => (
          <li key={game.id}>
            <button
              type="button"
              className="mini-games__tile"
              onClick={() => navigate(game.path)}
            >
              <span className={`mini-games__icon mini-games__icon--${game.id}`} aria-hidden>
                {game.icon}
              </span>
              <strong>{game.title}</strong>
              <small>{game.summary}</small>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
