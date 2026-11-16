import { ArrowLeft, ChevronRight, Ticket } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppBar, Button, IconButton } from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import { PollCard } from './PollCard'
import { sortForDisplay } from './pollResults'
import { usePolls } from './usePolls'
import { DISCOUNTS_PATH } from '@/features/discounts/discountRoutes'
import './poll.css'

/** 수능 여론: 하루 몇 개씩 열리는 질문을 고르고, 다른 수험생들의 답을 전국·지역별로 본다. */
export function PollPage() {
  const navigate = useNavigate()
  const { polls, state, replace, reload } = usePolls()
  const sorted = sortForDisplay(polls)

  return (
    <AppShell
      surface="base"
      contentClassName="poll-page-shell"
      appBar={
        <AppBar
          title="수능 여론"
          leading={
            <IconButton
              label="뒤로 가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
            />
          }
        />
      }
    >
      <main className="poll-page">
        <header className="poll-page__intro">
          <h1>다른 수험생들은 어떻게 생각할까?</h1>
          <p>하나 고르면 전국과 지역별 답이 보여요. 로그인 없이 질문마다 한 번씩 고를 수 있어요.</p>
        </header>

        {state === 'loading' && <p className="poll-page__status">질문을 불러오는 중이에요</p>}
        {state === 'failed' && (
          <div className="poll-page__status">
            <p>질문을 불러오지 못했어요.</p>
            <Button variant="secondary" onClick={() => reload()}>
              다시 시도
            </Button>
          </div>
        )}
        {state === 'ready' && sorted.length === 0 && <p className="poll-page__status">지금은 열린 질문이 없어요. 곧 새 질문이 열려요.</p>}

        <div className="poll-page__list">
          {sorted.map((poll) => (
            <PollCard key={poll.id} poll={poll} onChange={replace} />
          ))}
        </div>

        <button type="button" className="poll-page__link" onClick={() => navigate(DISCOUNTS_PATH)}>
          <Ticket size={18} aria-hidden />
          <span>
            <strong>수험표 할인 모음</strong>
            <small>수능 끝나고 수험표로 받을 수 있는 혜택</small>
          </span>
          <ChevronRight size={18} aria-hidden />
        </button>
        <p className="poll-page__fine">재미로 보는 참여형 투표예요. 한 사람이 여러 기기로 고를 수 있어 실제 여론과 다를 수 있어요.</p>
      </main>
    </AppShell>
  )
}
