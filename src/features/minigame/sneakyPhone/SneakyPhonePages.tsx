import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { ArrowLeft, House, RotateCcw, Smartphone, Trophy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppBar, Button, IconButton } from '@/design-system'
import {
  createSneakyPhoneRound,
  fetchSneakyPhoneLeaderboard,
  submitSneakyPhoneRound,
  type SneakyPhoneGrade,
} from '@/api/minigames'
import { AppShell } from '@/layout/AppShell'
import { MinigameLeaderboard } from '../MinigameLeaderboard'
import {
  advanceTo,
  createGame,
  getResult,
  loadBestScore,
  saveBestScore,
  secondsLeft,
  wholePoints,
  setPhone,
  SURVIVAL_BONUS,
  type SneakyPhoneResult,
  type SneakyPhoneState,
  type TeacherPhase,
} from './sneakyPhoneEngine'
import { SNEAKY_PHONE_PATH, SNEAKY_PHONE_PLAY_PATH } from './sneakyPhoneRoutes'
import { SneakyPhoneScene } from './SneakyPhoneScene'
import './SneakyPhone.css'

/** Where "back to the service" goes: the entry route picks /home or /start. */
const SERVICE_HOME = '/'

const PHASE_STATUS: Record<TeacherPhase, string> = {
  board: '선생님이 칠판을 보고 있어요',
  warning: '선생님이 돌아보려고 해요!',
  watching: '선생님이 보고 있어요',
  returning: '선생님이 칠판으로 돌아가는 중',
}

const formatSeconds = (ms: number) => `${(ms / 1000).toFixed(1)}초`

/** 3, 2, 1 before every round, so it never starts the instant the page opens. */
const COUNTDOWN_FROM = 3
const COUNTDOWN_STEP_MS = 1_000

function ServiceHomeButton() {
  const navigate = useNavigate()
  return (
    <IconButton
      label="홈 화면으로 돌아가기"
      icon={<House size={20} aria-hidden />}
      onClick={() => navigate(SERVICE_HOME)}
    />
  )
}

export function SneakyPhoneIntroPage() {
  const navigate = useNavigate()
  const [best] = useState(loadBestScore)

  return (
    <AppShell
      surface="base"
      contentClassName="sneaky-shell"
      appBar={<AppBar title="미니게임" leading={<ServiceHomeButton />} />}
    >
      <div className="sneaky-intro">
        <div className="sneaky-intro__art" aria-hidden>
          <Smartphone size={44} />
        </div>

        <header className="sneaky-intro__header">
          <span className="sneaky-tag">야자 시간 타이밍 게임</span>
          <h1>선생님 몰래 폰 하기</h1>
          <p>선생님이 칠판을 볼 때만 몰래 폰을 사용하세요!</p>
          <p className="sneaky-intro__control">누르고 있으면 폰 사용, 손을 떼면 숨기기</p>
        </header>

        <section className="sneaky-section" aria-labelledby="sneaky-rules-title">
          <h2 id="sneaky-rules-title">점수 규칙</h2>
          <ul className="sneaky-rules">
            <li>폰을 쓰는 동안 1초에 100점, 숨기지 않고 오래 쓸수록 점수가 더 빨리 올라가요.</li>
            <li>선생님이 고개를 돌리려 하면 바로 숨기세요. 돌아보는 순간 폰이 보이면 들켜요.</li>
            <li>30초를 버티면 생존 보너스 +{SURVIVAL_BONUS}점!</li>
            <li>들켜도 그때까지 모은 점수는 남아요.</li>
          </ul>
        </section>

        {best > 0 && (
          <p className="sneaky-intro__best">
            <Trophy size={16} aria-hidden /> 내 최고 점수 <strong>{best.toLocaleString('ko-KR')}점</strong>
          </p>
        )}

        <MinigameLeaderboard title="몰폰 랭킹" load={fetchSneakyPhoneLeaderboard} />

        <div className="sneaky-intro__actions">
          <Button variant="brand" fullWidth onClick={() => navigate(SNEAKY_PHONE_PLAY_PATH)}>
            게임 시작
          </Button>
          <Button variant="tertiary" fullWidth onClick={() => navigate(SERVICE_HOME)}>
            홈 화면으로 돌아가기
          </Button>
        </div>
      </div>
    </AppShell>
  )
}

/**
 * Owns one round at a time. A single requestAnimationFrame loop advances the
 * engine on real elapsed time; input events advance it to their own
 * timestamp first, so neither frame rate nor event timing shifts the result.
 */
function useSneakyPhoneGame() {
  const [state, setState] = useState<SneakyPhoneState>(() => createGame())
  const [best, setBest] = useState(loadBestScore)
  const [record, setRecord] = useState<{ result: SneakyPhoneResult; isNewBest: boolean } | null>(null)
  /** What the server said about this round; null when it could not be reached. */
  const [grade, setGrade] = useState<SneakyPhoneGrade | null>(null)
  const [checking, setChecking] = useState(false)
  /** Round id issued when the round starts, spent once when it ends. */
  const roundId = useRef<string | null>(null)
  const roundToken = useRef(0)
  const stateRef = useRef(state)
  const startedAt = useRef(0)
  const frame = useRef<number | undefined>(undefined)
  const bestRef = useRef(best)
  const [countdown, setCountdown] = useState<number | null>(COUNTDOWN_FROM)
  const countdownTimers = useRef<number[]>([])
  /** True only once the countdown is over and the clock is running. */
  const running = useRef(false)

  const stopTimers = useCallback(() => {
    if (frame.current !== undefined) cancelAnimationFrame(frame.current)
    frame.current = undefined
    countdownTimers.current.forEach((timer) => window.clearTimeout(timer))
    countdownTimers.current = []
  }, [])

  const commit = useCallback((next: SneakyPhoneState) => {
    const previous = stateRef.current
    stateRef.current = next
    setState(next)
    if (previous.status === 'playing' && next.status !== 'playing') {
      running.current = false
      if (frame.current !== undefined) cancelAnimationFrame(frame.current)
      frame.current = undefined
      const result = getResult(next)!
      // Kept in memory too, so a "new best" still shows when storage is blocked.
      const isNewBest = result.finalScore > bestRef.current
      if (isNewBest) {
        saveBestScore(result.finalScore)
        bestRef.current = result.finalScore
        setBest(result.finalScore)
      }
      setRecord({ result, isNewBest })

      const id = roundId.current
      roundId.current = null
      if (id) {
        const token = roundToken.current
        setChecking(true)
        submitSneakyPhoneRound(id, result)
          .then((next) => {
            if (roundToken.current === token) setGrade(next)
          })
          .catch(() => {
            // The score still counts on this device; it just is not ranked.
          })
          .finally(() => {
            if (roundToken.current === token) setChecking(false)
          })
      }
    }
  }, [])

  const tick = useCallback(() => {
    commit(advanceTo(stateRef.current, performance.now() - startedAt.current))
    if (stateRef.current.status === 'playing') frame.current = requestAnimationFrame(tick)
  }, [commit])

  /** Resets everything, counts 3-2-1, then starts the clock from zero. */
  const start = useCallback(() => {
    stopTimers()
    running.current = false
    const fresh = createGame()
    stateRef.current = fresh
    setState(fresh)
    setRecord(null)
    setGrade(null)
    setChecking(false)
    setCountdown(COUNTDOWN_FROM)

    // Asked for at the start so the server can tell the game really took 30 seconds.
    roundId.current = null
    const token = (roundToken.current += 1)
    createSneakyPhoneRound()
      .then((round) => {
        if (roundToken.current === token) roundId.current = round.roundId
      })
      .catch(() => {})

    for (let step = 1; step <= COUNTDOWN_FROM; step += 1) {
      const timer = window.setTimeout(() => {
        if (step < COUNTDOWN_FROM) {
          setCountdown(COUNTDOWN_FROM - step)
          return
        }
        setCountdown(null)
        running.current = true
        startedAt.current = performance.now()
        frame.current = requestAnimationFrame(tick)
      }, step * COUNTDOWN_STEP_MS)
      countdownTimers.current.push(timer)
    }
  }, [stopTimers, tick])

  const holdPhone = useCallback(
    (using: boolean) => {
      if (!running.current || stateRef.current.status !== 'playing') return
      commit(setPhone(stateRef.current, using, performance.now() - startedAt.current))
    },
    [commit],
  )

  useEffect(() => {
    start()
    return () => {
      running.current = false
      stopTimers()
    }
  }, [start, stopTimers])

  // Anything that pulls attention away hides the phone.
  useEffect(() => {
    const hide = () => holdPhone(false)
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') hide()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return
      event.preventDefault()
      if (!event.repeat) holdPhone(true)
    }
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return
      event.preventDefault()
      holdPhone(false)
    }
    window.addEventListener('blur', hide)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('blur', hide)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [holdPhone])

  return { state, best, record, grade, checking, countdown, start, holdPhone }
}

export function SneakyPhonePlayPage() {
  const navigate = useNavigate()
  const { state, best, record, grade, checking, countdown, start, holdPhone } = useSneakyPhoneGame()
  const counting = countdown !== null
  const playing = state.status === 'playing' && !counting
  const score = wholePoints(state.score)

  const pressStart = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    // Touch pointers are captured to the button by default; releasing the
    // capture lets sliding a finger off the button count as letting go.
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    holdPhone(true)
  }
  const pressEnd = () => holdPhone(false)

  return (
    <AppShell
      surface="base"
      contentClassName="sneaky-shell sneaky-shell--play"
      appBar={
        <AppBar
          title="선생님 몰래 폰 하기"
          leading={
            <IconButton
              label="게임 첫 화면으로"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate(SNEAKY_PHONE_PATH)}
            />
          }
          trailing={<ServiceHomeButton />}
        />
      }
    >
      <div className="sneaky-play">
        <dl className="sneaky-hud">
          <div>
            <dt>남은 시간</dt>
            <dd className={secondsLeft(state) <= 5 && playing ? 'is-urgent' : ''}>{secondsLeft(state)}초</dd>
          </div>
          <div>
            <dt>점수</dt>
            <dd>{score.toLocaleString('ko-KR')}</dd>
          </div>
          <div>
            <dt>최고</dt>
            <dd>{best.toLocaleString('ko-KR')}</dd>
          </div>
        </dl>

        <SneakyPhoneScene
          phase={state.phase}
          using={state.using}
          status={state.status}
          countdown={countdown}
        />

        <p className="sneaky-sr-only" role="status" aria-live="assertive">
          {playing ? PHASE_STATUS[state.phase] : ''}
        </p>

        {record ? (
          <ResultPanel
            result={record.result}
            isNewBest={record.isNewBest}
            grade={grade}
            checking={checking}
            onRetry={start}
            onExit={() => navigate(SNEAKY_PHONE_PATH)}
          />
        ) : (
          <div className="sneaky-controls">
            <p className={['sneaky-controls__state', state.using ? 'is-on' : ''].filter(Boolean).join(' ')}>
              {counting ? '곧 시작해요' : state.using ? '폰 사용 중' : '폰 숨김'}
            </p>
            <button
              type="button"
              className={['sneaky-hold', state.using ? 'is-pressed' : ''].filter(Boolean).join(' ')}
              aria-pressed={state.using}
              aria-describedby="sneaky-hold-hint"
              disabled={counting}
              onPointerDown={pressStart}
              onPointerUp={pressEnd}
              onPointerLeave={pressEnd}
              onPointerCancel={pressEnd}
              onLostPointerCapture={pressEnd}
              onContextMenu={(event) => event.preventDefault()}
            >
              <Smartphone size={26} aria-hidden />
              몰래 폰 하기
            </button>
            <p id="sneaky-hold-hint" className="sneaky-controls__hint">
              누르고 있는 동안 폰 사용 · 손을 떼면 숨기기 (PC는 스페이스바도 돼요)
            </p>
          </div>
        )}

        {record && !checking && (
          <MinigameLeaderboard title="몰폰 랭킹" load={fetchSneakyPhoneLeaderboard} />
        )}
      </div>
    </AppShell>
  )
}

function ResultPanel({
  result,
  isNewBest,
  grade,
  checking,
  onRetry,
  onExit,
}: {
  result: SneakyPhoneResult
  isNewBest: boolean
  grade: SneakyPhoneGrade | null
  checking: boolean
  onRetry: () => void
  onExit: () => void
}) {
  const survived = result.status === 'survived'

  return (
    <section
      className={`sneaky-result sneaky-result--${result.status}`}
      aria-labelledby="sneaky-result-title"
    >
      <h2 id="sneaky-result-title">{survived ? '몰폰 성공!' : '선생님께 들켰다!'}</h2>
      {isNewBest && <p className="sneaky-result__best">최고 점수 갱신!</p>}
      <p className="sneaky-result__score">
        <strong>{result.finalScore.toLocaleString('ko-KR')}</strong>점
      </p>
      <dl className="sneaky-result__stats">
        {survived && (
          <>
            <div>
              <dt>기본 획득 점수</dt>
              <dd>{result.baseScore.toLocaleString('ko-KR')}점</dd>
            </div>
            <div>
              <dt>생존 보너스</dt>
              <dd>+{result.bonus.toLocaleString('ko-KR')}점</dd>
            </div>
          </>
        )}
        <div>
          <dt>휴대폰 총 사용 시간</dt>
          <dd>{formatSeconds(result.totalPhoneMs)}</dd>
        </div>
        {!survived && (
          <div>
            <dt>버틴 시간</dt>
            <dd>{formatSeconds(result.endedAt)}</dd>
          </div>
        )}
      </dl>
      {checking && (
        <p className="sneaky-result__rank" role="status">
          기록을 올리는 중이에요…
        </p>
      )}
      {grade?.ranked && grade.rank && (
        <p className="sneaky-result__rank">
          오늘 <strong>{grade.rank.daily}위</strong> · 전체 <strong>{grade.rank.overall}위</strong>
        </p>
      )}
      <div className="sneaky-result__actions">
        <Button
          autoFocus
          variant="brand"
          fullWidth
          leadingIcon={<RotateCcw size={18} aria-hidden />}
          onClick={onRetry}
        >
          다시 도전하기
        </Button>
        <Button variant="tertiary" fullWidth onClick={onExit}>
          게임 첫 화면으로
        </Button>
      </div>
    </section>
  )
}
