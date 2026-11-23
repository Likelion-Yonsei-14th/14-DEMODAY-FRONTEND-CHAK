import { useEffect, useState } from 'react'
import { ChevronRight, Gift, LogIn, Mail, Plus, ScrollText, Sparkles, Star, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { fetchMyDesk } from '@/api/desks'
import { getCsatDdayLabel } from '@/features/csat/csatSchedule'
import { AdBanner } from '@/features/ads/AdBanner'
import { MiniGameSection } from '@/features/minigame/MiniGameSection'
import { DiscountsShortcut } from '@/features/discounts/DiscountsShortcut'
import { ChatShortcut } from '@/features/chat/ChatShortcut'
import { RecapShortcut } from '@/features/recap/RecapShortcut'
import { isRecapOpen, RECAP_OPENS_LABEL } from '@/features/recap/recapSchedule'
import { isClassroomAvailable, isRollingPaperReleased } from '@/lib/featureFlags'
import { isRollingPaperSeason } from '@/features/rollingPaper/rollingPaper'
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
  const currentUser = usePrototypeStore((state) => state.currentUser)
  const desk = usePrototypeStore((state) => state.currentDesk)
  const authSession = usePrototypeStore((state) => state.authSession)
  const resetDeskCreationDraft = usePrototypeStore((state) => state.resetDeskCreationDraft)
  const serverCheck = isApiEnabled && authSession.status === 'authenticated'
  const { check: deskCheck, retry: retryDeskCheck } = useServerDeskCheck(serverCheck)

  const hasDesk = serverCheck ? deskCheck === 'has' : desk.claimStatus === 'claimed'
  // The server hasn't said yet (or couldn't): don't show a desk or offer to make one.
  const deskUnsure = serverCheck && (deskCheck === 'unknown' || deskCheck === 'failed')

  const classroomOpen = isClassroomAvailable()
  // After the exam the rolling paper takes the desk's place as the main door.
  // Only once released (VITE_ROLLING_PAPER=on): test mode (/prototype) never changes the home and start screens.
  const rollingPaperFirst = isRollingPaperReleased() && isRollingPaperSeason()
  const rollingPaperClass = usePrototypeStore((state) => state.rollingPaperClass)
  const rollingPaperMember = usePrototypeStore((state) => state.rollingPaperMember)

  const startDesk = () => {
    resetDeskCreationDraft()
    navigate('/create')
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
          {rollingPaperFirst && (
            <button
              type="button"
              className="home-page__door home-page__door--rolling"
              onClick={() => navigate('/rolling-paper')}
            >
              <span className="home-page__door-label">
                {rollingPaperMember ? <ScrollText size={14} aria-hidden /> : <Plus size={14} aria-hidden />}
              </span>
              <strong>
                연말 롤링페이퍼
              </strong>
              <span>
                {rollingPaperMember
                  ? rollingPaperClass.kind === 'personal'
                    ? rollingPaperClass.name
                    : `${rollingPaperClass.name} 롤링페이퍼`
                  : '반 친구들과, 또는 나 혼자 링크로 받아요'}
              </span>
              <ChevronRight size={20} aria-hidden />
            </button>
          )}

          <button
            type="button"
            className="home-page__door home-page__door--desk"
            disabled={serverCheck && deskCheck === 'unknown'}
            onClick={deskUnsure ? retryDeskCheck : hasDesk ? () => navigate('/my/desk') : startDesk}
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

          {/* Until the rolling paper opens, the recap keeps its big door. */}
          {!rollingPaperFirst && (
            <button
              type="button"
              className="home-page__door home-page__door--recap"
              onClick={() => navigate('/recap')}
            >
              <span className="home-page__door-label">
                <Sparkles size={14} aria-hidden />
              </span>
              <strong>나의 수능 리캡</strong>
              <span>{isRecapOpen() ? '한 해 동안 애쓴 나를 돌아봐요' : `${RECAP_OPENS_LABEL}, 시험이 끝나면 열려요`}</span>
              <ChevronRight size={20} aria-hidden />
            </button>
          )}
        </div>

        {/* 앱을 열자마자 첫 화면 안에 보이도록 큰 문 바로 아래. */}
        <AdBanner />

        <nav className="home-page__shortcuts" aria-label="바로가기">
          <button type="button" className="home-page__shortcut" onClick={() => navigate('/letters')}>
            <Mail size={20} aria-hidden />
            내가 쓴 편지
          </button>
          <button type="button" className="home-page__shortcut" onClick={() => navigate('/favorite-desks')}>
            <Star size={20} aria-hidden />
            즐겨찾는 책상
          </button>
          {isApiEnabled && (
            <button type="button" className="home-page__shortcut" onClick={() => navigate('/friend-desks')}>
              <Gift size={20} aria-hidden />
              만들어 준 책상
            </button>
          )}
        </nav>

        <button
          type="button"
          className="home-page__new ds-hit-area"
          onClick={() => navigate('/start')}
        >
          <Plus size={15} aria-hidden />
          {classroomOpen ? '새 책상이나 반 만들기' : '새 책상 만들기'}
        </button>

        <DiscountsShortcut />

        <ChatShortcut />

        {rollingPaperFirst && <RecapShortcut />}

        <MiniGameSection />
      </main>
    </AppShell>
  )
}
