import { useMemo } from 'react'
import { LogIn, UserRound, UsersRound } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ChoiceCard } from '@/design-system'
import {
  getCsatDateLabel,
  getCsatDdayLabel,
} from '@/features/csat/csatSchedule'
import { DeskObjectLayer } from '@/features/desk/DeskObjectLayer'
import { DeskScene } from '@/features/desk/DeskScene'
import {
  mergeSupportMessages,
  seededDeskObjects,
} from '@/features/supporter/seededMessages'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import './StartPage.css'

export function StartPage() {
  const navigate = useNavigate()
  const resetDeskCreationDraft = usePrototypeStore(
    (state) => state.resetDeskCreationDraft,
  )
  const authSession = usePrototypeStore((state) => state.authSession)

  const messages = useMemo(
    () => mergeSupportMessages([]),
    [],
  )

  // /start is the new-signup landing; a returning, already-logged-in
  // visitor should land on the two-door /home instead (see LoginPage).
  if (authSession.status === 'authenticated') {
    return <Navigate to="/home" replace />
  }

  const startPersonal = () => {
    resetDeskCreationDraft()
    navigate('/prototype/create')
  }

  return (
    <AppShell
      surface="transparent"
      contentClassName="start-page-shell"
    >
      <main className="start-page">
        <header className="start-page__header">
          <span className="start-page__header-meta">
            <span className="start-page__dday">
              {getCsatDdayLabel()}
            </span>
            <span className="start-page__date">
              {getCsatDateLabel()} 수능
            </span>
          </span>
          <button
            type="button"
            className="start-page__account"
            onClick={() => navigate('/auth/login')}
          >
            <LogIn size={15} aria-hidden />
            로그인
          </button>
        </header>

        <section className="start-page__hero">
          <h1>
            수능 전까지,
            <br />
            친구들의 마음을 모아두세요.
          </h1>
          <p>
            링크 하나로 응원을 모으고, 정해둔 시간에 꺼내볼 수 있어요.
          </p>
        </section>

        <div className="start-page__scene" aria-hidden>
          <DeskScene ownerName="수험생" />
          <DeskObjectLayer
            objects={seededDeskObjects}
            messages={messages}
            respectObjectLocks={false}
            showUnreadState={false}
          />
        </div>

        <section className="start-page__choices" aria-label="응원을 모으는 방법">
          <ChoiceCard
            title="한 사람에게 마음을 모아줄래요"
            description="나 또는 친구 한 명의 응원 책상을 만들고, 링크로 응원을 모아요."
            icon={<UserRound size={22} aria-hidden />}
            onClick={startPersonal}
          />
          <ChoiceCard
            title="우리끼리 서로 응원할래요"
            description="우리 반 교실에서 칠판을 채우고, 각자 사물함에 응원을 남겨요."
            icon={<UsersRound size={22} aria-hidden />}
            onClick={() => navigate('/prototype/classroom/create')}
          />
        </section>
      </main>
    </AppShell>
  )
}
