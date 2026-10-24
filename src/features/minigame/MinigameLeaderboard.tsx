import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Leaderboard, LeaderboardPeriod } from '@/api/minigames'
import { Button } from '@/design-system'
import { usePrototypeStore } from '@/store/prototypeStore'
import { MinigameNicknameForm } from './MinigameNicknameForm'
import './MinigameLeaderboard.css'

const PERIODS: ReadonlyArray<{ id: LeaderboardPeriod; label: string }> = [
  { id: 'daily', label: '오늘' },
  { id: 'overall', label: '전체' },
]

type Props = {
  title: string
  load: (period: LeaderboardPeriod) => Promise<Leaderboard>
  /** 점수 뒤에 붙는 말(예: 점). */
  unit?: string
  /** 점수 분포에서 강조할 내 점수(찍신). */
  highlightScore?: number | null
}

/** 로그인 회원의 최고 점수 랭킹. 미니게임 화면에서만 보여 준다. */
export function MinigameLeaderboard({ title, load, unit = '점', highlightScore = null }: Props) {
  const navigate = useNavigate()
  const signedIn = usePrototypeStore((state) => state.authSession.status === 'authenticated')
  const [period, setPeriod] = useState<LeaderboardPeriod>('daily')
  const [board, setBoard] = useState<Leaderboard | null>(null)
  const [failed, setFailed] = useState(false)
  const [editing, setEditing] = useState(false)

  const fetchBoard = useCallback(() => {
    let cancelled = false
    setFailed(false)
    setBoard(null)
    load(period)
      .then((next) => {
        if (!cancelled) setBoard(next)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [load, period])

  useEffect(() => fetchBoard(), [fetchBoard])

  const inTop = board?.entries.some((entry) => entry.me) ?? false

  return (
    <section className="minigame-board" aria-labelledby="minigame-board-title">
      <header className="minigame-board__head">
        <h2 id="minigame-board-title">{title}</h2>
        <div className="minigame-board__tabs" role="tablist" aria-label="랭킹 기간">
          {PERIODS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.id === period}
              onClick={() => setPeriod(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {failed ? (
        <div className="minigame-board__empty" role="alert">
          <p>랭킹을 불러오지 못했어요.</p>
          <Button size="m" variant="secondary" onClick={fetchBoard}>
            다시 불러오기
          </Button>
        </div>
      ) : !board ? (
        <p className="minigame-board__empty" role="status">
          불러오는 중이에요…
        </p>
      ) : (
        <>
          {board.distribution && board.totalRounds ? (
            <ScoreDistribution counts={board.distribution} highlight={highlightScore} />
          ) : null}

          {board.entries.length === 0 ? (
            <p className="minigame-board__empty">아직 기록이 없어요. 첫 번째 주인공이 되어 보세요!</p>
          ) : (
            <ol className="minigame-board__list">
              {board.entries.map((entry) => (
                <li
                  key={`${entry.rank}-${entry.nickname}-${entry.score}-${entry.me}`}
                  className={entry.me ? 'is-me' : undefined}
                >
                  <span className="minigame-board__rank">{entry.rank}</span>
                  <span className="minigame-board__name">
                    {entry.nickname}
                    {entry.me && <em> (나)</em>}
                  </span>
                  <span className="minigame-board__score">
                    {entry.score.toLocaleString('ko-KR')}
                    {unit}
                  </span>
                </li>
              ))}
            </ol>
          )}

          {board.me && !inTop && (
            <p className="minigame-board__mine">
              내 순위 <strong>{board.me.rank}위</strong> · {board.me.score.toLocaleString('ko-KR')}
              {unit}
            </p>
          )}
        </>
      )}

      {signedIn ? (
        <div className="minigame-board__nickname">
          {editing ? (
            <MinigameNicknameForm />
          ) : (
            <Button size="m" variant="tertiary" onClick={() => setEditing(true)}>
              랭킹 닉네임 바꾸기
            </Button>
          )}
        </div>
      ) : (
        <div className="minigame-board__login">
          <p>로그인하면 내 기록이 랭킹에 올라가요.</p>
          <Button size="m" variant="secondary" onClick={() => navigate('/auth/login')}>
            로그인하기
          </Button>
        </div>
      )}
    </section>
  )
}

/** 점수별 사람 수 막대. highlight 점수 칸을 강조한다. */
function ScoreDistribution({ counts, highlight }: { counts: number[]; highlight: number | null }) {
  const total = counts.reduce((sum, count) => sum + count, 0)
  const max = Math.max(...counts, 1)
  return (
    <figure className="minigame-board__figure">
      <div
        className="minigame-board__dist"
        role="img"
        aria-label={`점수별 분포: ${counts.map((count, score) => `${score}점 ${count}명`).join(', ')}`}
      >
        {counts.map((count, score) => (
          <div key={score} className={score === highlight ? 'is-mine' : undefined}>
            <span className="minigame-board__bar" style={{ height: `${Math.max(4, (count / max) * 100)}%` }} />
            <span className="minigame-board__tick">{score}</span>
          </div>
        ))}
      </div>
      <figcaption>전체 {total.toLocaleString('ko-KR')}판</figcaption>
    </figure>
  )
}
