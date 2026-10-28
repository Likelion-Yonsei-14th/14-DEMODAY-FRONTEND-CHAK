import { useEffect, useState } from 'react'
import { ChevronRight, LogIn, Plus, UserRound, UsersRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { fetchMyDesk } from '@/api/desks'
import { useFeedback } from '@/design-system'
import { getCsatDdayLabel } from '@/features/csat/csatSchedule'
import { ComingSoonDialog, CLASSROOM_NOTICE } from '@/features/common/ComingSoon'
import { MiniGameSection } from '@/features/minigame/MiniGameSection'
import { isClassroomAvailable } from '@/lib/featureFlags'
import { AppShell } from '@/layout/AppShell'
import { isApiEnabled } from '@/api/config'
import { usePrototypeStore } from '@/store/prototypeStore'
import './StartPage.css'

type DeskCheck = 'unknown' | 'has' | 'none' | 'failed'

/**
 * With a backend the store's desk is only a placeholder until a desk screen
 * loads it, so ask the server whether this account has one. 'unknown' until
 * it answers and 'failed' when the check itself fails, so the placeholder is
 * never taken for this account's desk.
 */
function useServerDeskCheck(enabled: boolean) {
  const [check, setCheck] = useState<DeskCheck>('unknown')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    fetchMyDesk().then(
      () => {
        if (!cancelled) setCheck('has')
      },
      (reason: unknown) => {
        if (cancelled) return
        setCheck(reason instanceof ApiError && reason.code === 'DESK_NOT_FOUND' ? 'none' : 'failed')
      },
    )
    return () => {
      cancelled = true
    }
  }, [enabled, attempt])

  const retry = () => {
    setCheck('unknown')
    setAttempt((count) => count + 1)
  }

  return { check, retry }
}

/**
 * Where a returning user lands after logging in: always two doors, one to
 * their own desk and one to their class. Without a desk yet, the desk door
 * starts making one; a class door they don't have says so. New sign-ups
 * without a desk go to /start.
 */
export function HomePage() {
  const navigate = useNavigate()
  const { showToast } = useFeedback()
  const currentUser = usePrototypeStore((state) => state.currentUser)
  const desk = usePrototypeStore((state) => state.currentDesk)
  const classroom = usePrototypeStore((state) => state.classroom)
  const member = usePrototypeStore((state) => state.classroomMember)
  const authSession = usePrototypeStore((state) => state.authSession)
  const resetDeskCreationDraft = usePrototypeStore((state) => state.resetDeskCreationDraft)
  const serverCheck = isApiEnabled && authSession.status === 'authenticated'
  const { check: deskCheck, retry: retryDeskCheck } = useServerDeskCheck(serverCheck)

  const hasDesk = serverCheck ? deskCheck === 'has' : desk.claimStatus === 'claimed'
  // The server hasn't said yet (or couldn't): don't show a desk or offer to make one.
  const deskUnsure = serverCheck && (deskCheck === 'unknown' || deskCheck === 'failed')
  const hasClass = Boolean(member)

  const classroomOpen = isClassroomAvailable()
  const [classroomNotice, setClassroomNotice] = useState(false)

  const startDesk = () => {
    resetDeskCreationDraft()
    navigate('/prototype/create')
  }

  return (
    <AppShell surface="base" contentClassName="home-page-shell">
      <main className="home-page">
        <header className="home-page__header">
          <div className="home-page__top">
            <span className="start-page__dday">{getCsatDdayLabel()}</span>
            <button
              type="button"
              className="start-page__account ds-hit-area"
              onClick={() =>
                authSession.status === 'authenticated'
                  ? navigate('/account', { state: { from: '/home' } })
                  : navigate('/auth/login')
              }
            >
              <LogIn size={15} aria-hidden />
              내 계정
            </button>
          </div>
          <h1>
            {currentUser.displayName}님,
            <br />
            어디로 갈까요?
          </h1>
        </header>

        <div className="home-page__doors">
          <button
            type="button"
            className="home-page__door home-page__door--desk"
            disabled={serverCheck && deskCheck === 'unknown'}
            onClick={deskUnsure ? retryDeskCheck : hasDesk ? () => navigate('/prototype/my/desk') : startDesk}
          >
            <span className="home-page__door-label">
              {deskUnsure || hasDesk ? <UserRound size={14} aria-hidden /> : <Plus size={14} aria-hidden />}
            </span>
            <strong>
              {deskUnsure ? '내 책상 확인하는 중' : hasDesk ? '내 책상 가기' : '내 책상 만들기'}
            </strong>
            <span>
              {deskCheck === 'failed'
                ? '불러오지 못했어요. 눌러서 다시 시도해요'
                : deskUnsure
                  ? '잠시만 기다려 주세요'
                  : hasDesk
                    ? '친구들이 남긴 응원을 확인해요'
                    : '링크 하나로 친구들의 응원을 모아요'}
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
            onClick={() => {
              if (!classroomOpen) {
                setClassroomNotice(true)
              } else if (hasClass) {
                navigate(`/prototype/classroom/${classroom.id}/map`)
              } else {
                showToast('아직 반이 생성되지 않았어요.')
              }
            }}
          >
            <span className="home-page__door-label">
              <UsersRound size={14} aria-hidden />
            </span>
            <strong>우리 반 가기</strong>
            <span>{!classroomOpen ? '곧 열려요' : hasClass ? classroom.name : '아직 참여한 반이 없어요'}</span>
            <ChevronRight size={20} aria-hidden />
          </button>
        </div>

        <button
          type="button"
          className="home-page__new ds-hit-area"
          onClick={() => navigate('/start')}
        >
          <Plus size={15} aria-hidden />
          {classroomOpen ? '새 책상이나 반 만들기' : '새 책상 만들기'}
        </button>
        {isApiEnabled && (
          <button type="button" className="home-page__new ds-hit-area" onClick={() => navigate('/friend-desks')}>
            친구에게 만들어 준 책상
          </button>
        )}

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
