import { useMemo, useState } from 'react'
import { LogIn, ScrollText, UserRound, UsersRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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
import { ComingSoonDialog, CLASSROOM_NOTICE } from '@/features/common/ComingSoon'
import { MiniGameSection } from '@/features/minigame/MiniGameSection'
import { DiscountsShortcut } from '@/features/discounts/DiscountsShortcut'
import { ChatShortcut } from '@/features/chat/ChatShortcut'
import { isClassroomAvailable, isRollingPaperAvailable } from '@/lib/featureFlags'
import { isRollingPaperSeason } from '@/features/rollingPaper/rollingPaper'
import { RollingPaperPreview } from '@/features/rollingPaper/RollingPaperPreview'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import './StartPage.css'

export function StartPage() {
  const navigate = useNavigate()
  const resetDeskCreationDraft = usePrototypeStore(
    (state) => state.resetDeskCreationDraft,
  )
  const authSession = usePrototypeStore((state) => state.authSession)
  const [classroomNotice, setClassroomNotice] = useState(false)
  // After the exam the rolling paper takes the desk's place as the main thing to make.
  const rollingPaperFirst = isRollingPaperAvailable() && isRollingPaperSeason()

  const messages = useMemo(
    () => mergeSupportMessages([]),
    [],
  )

  const startPersonal = () => {
    resetDeskCreationDraft()
    navigate('/create')
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
            className="start-page__account ds-hit-area"
            onClick={() =>
              navigate(
                authSession.status === 'authenticated'
                  ? '/account'
                  : '/auth/login',
              )
            }
          >
            <LogIn size={15} aria-hidden />
            {authSession.status === 'authenticated'
              ? '내 계정'
              : '로그인'}
          </button>
        </header>

        {rollingPaperFirst ? (
          <>
            <section className="start-page__hero">
              <h1>
                졸업 전에 같이 채우는
                <br />
                우리 반 롤링페이퍼
              </h1>
              <p>
                반을 만들어 링크를 보내면, 친구들이 서로의 롤링페이퍼에 한마디씩 남겨요.
              </p>
            </section>

            <div className="start-page__paper">
              <RollingPaperPreview />
            </div>
          </>
        ) : (
          <>
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
          </>
        )}

        <section className="start-page__choices" aria-label="응원을 모으는 방법">
          {rollingPaperFirst && (
            <ChoiceCard
              title="우리 반 롤링페이퍼 만들기"
              description="반 이름을 정하고, 내 사물함에 롤링페이퍼를 걸어요."
              icon={<ScrollText size={22} aria-hidden />}
              onClick={() => navigate('/rolling-paper')}
            />
          )}
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
            onClick={() => (isClassroomAvailable() ? navigate('/classroom/create') : setClassroomNotice(true))}
          />
        </section>

        <DiscountsShortcut />

        <ChatShortcut />
        <MiniGameSection />
      </main>
      <ComingSoonDialog
        open={classroomNotice}
        onClose={() => setClassroomNotice(false)}
        title={CLASSROOM_NOTICE.title}
        description={CLASSROOM_NOTICE.description}
      />
    </AppShell>
  )
}
