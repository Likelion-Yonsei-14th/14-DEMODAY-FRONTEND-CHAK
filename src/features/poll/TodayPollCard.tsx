import { useState } from 'react'
import { ChevronRight, Vote } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PollCard } from './PollCard'
import { opensLabel, sortForDisplay } from './pollResults'
import { POLL_PATH } from './pollShare'
import { usePolls } from './usePolls'
import './poll.css'

/**
 * 첫 화면·홈에 놓는 "오늘의 질문". 아직 안 고른 열린 질문을 하나 보여 주고 바로 고르게 한다.
 * 다 골랐으면 방금 고른 질문의 결과를, 열린 질문이 없으면 곧 열릴 질문을 예고한다. 불러오지 못하면 아무것도 그리지 않는다.
 */
export function TodayPollCard() {
  const navigate = useNavigate()
  const { polls, state, replace } = usePolls()
  // 방금 고른 질문은 결과를 보여 주며 그대로 둔다. 다음 질문으로는 버튼을 눌러 넘어간다.
  const [shownId, setShownId] = useState<number | null>(null)
  if (state !== 'ready' || polls.length === 0) return null

  const sorted = sortForDisplay(polls)
  const open = sorted.filter((poll) => poll.status === 'open')
  const unanswered = open.filter((poll) => poll.myOptionId === null)
  const next = open.find((poll) => poll.id === shownId) ?? unanswered[0] ?? open[0]
  const upcoming = sorted.find((poll) => poll.status === 'upcoming')
  const remaining = unanswered.filter((poll) => poll.id !== next?.id)

  return (
    <section className="today-poll" aria-labelledby="today-poll-title">
      <div className="today-poll__head">
        <h2 id="today-poll-title">
          <Vote size={18} aria-hidden /> 오늘의 수험생 투표
        </h2>
        <button type="button" onClick={() => navigate(POLL_PATH)}>
          {remaining.length > 0 ? `질문 ${remaining.length}개 더` : '전체 보기'} <ChevronRight size={15} aria-hidden />
        </button>
      </div>
      {next ? (
        <>
          <PollCard
            poll={next}
            onChange={(voted) => {
              setShownId(voted.id)
              replace(voted)
            }}
            compact
          />
          {next.results && remaining[0] && (
            <button type="button" className="today-poll__next" onClick={() => setShownId(remaining[0]!.id)}>
              다음 질문: {remaining[0].question} <ChevronRight size={15} aria-hidden />
            </button>
          )}
        </>
      ) : upcoming ? (
        <button type="button" className="today-poll__teaser" onClick={() => navigate(POLL_PATH)}>
          <strong>{upcoming.question}</strong>
          <span>{opensLabel(upcoming.opensAt)}</span>
        </button>
      ) : null}
    </section>
  )
}
