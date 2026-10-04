import { ChevronRight, Plus, UserRound, UsersRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useFeedback } from '@/design-system'
import { getCsatDdayLabel } from '@/features/csat/csatSchedule'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import './StartPage.css'

/**
 * Where a returning user lands after logging in: always two doors, one to
 * their own desk and one to their class. A door they don't have yet says
 * so instead of sending them somewhere empty. New sign-ups go to /start.
 */
export function HomePage() {
  const navigate = useNavigate()
  const { showToast } = useFeedback()
  const currentUser = usePrototypeStore((state) => state.currentUser)
  const desk = usePrototypeStore((state) => state.currentDesk)
  const classroom = usePrototypeStore((state) => state.classroom)
  const member = usePrototypeStore((state) => state.classroomMember)

  const hasDesk = desk.claimStatus === 'claimed'
  const hasClass = Boolean(member)

  return (
    <AppShell surface="base" contentClassName="home-page-shell">
      <main className="home-page">
        <header className="home-page__header">
          <span className="start-page__dday">{getCsatDdayLabel()}</span>
          <h1>
            {currentUser.displayName}님,
            <br />
            어디로 갈까요?
          </h1>
        </header>

        <div className="home-page__doors">
          <button
            type="button"
            className={[
              'home-page__door',
              'home-page__door--desk',
              hasDesk ? '' : 'home-page__door--empty',
            ].filter(Boolean).join(' ')}
            onClick={() =>
              hasDesk
                ? navigate('/prototype/my/desk')
                : showToast('아직 내 책상이 만들어지지 않았어요.')
            }
          >
            <span className="home-page__door-label">
              <UserRound size={14} aria-hidden />
            </span>
            <strong>내 책상 가기</strong>
            <span>
              {hasDesk ? '친구들이 남긴 응원을 확인해요' : '아직 만든 책상이 없어요'}
            </span>
            <ChevronRight size={20} aria-hidden />
          </button>

          <button
            type="button"
            className={[
              'home-page__door',
              'home-page__door--class',
              hasClass ? '' : 'home-page__door--empty',
            ].filter(Boolean).join(' ')}
            onClick={() =>
              hasClass
                ? navigate(`/prototype/classroom/${classroom.id}/map`)
                : showToast('아직 반이 생성되지 않았어요.')
            }
          >
            <span className="home-page__door-label">
              <UsersRound size={14} aria-hidden />
            </span>
            <strong>우리 반 가기</strong>
            <span>{hasClass ? classroom.name : '아직 참여한 반이 없어요'}</span>
            <ChevronRight size={20} aria-hidden />
          </button>
        </div>

        <button
          type="button"
          className="home-page__new"
          onClick={() => navigate('/start')}
        >
          <Plus size={15} aria-hidden />
          새 책상이나 반 만들기
        </button>
      </main>
    </AppShell>
  )
}
