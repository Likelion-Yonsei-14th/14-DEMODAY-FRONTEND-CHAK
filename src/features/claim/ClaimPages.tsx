import { useMemo, type ReactNode } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  Heart,
  MoonStar,
  UsersRound,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  AppBar,
  Button,
  ChoiceCard,
  IconButton,
} from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import { DeskObjectLayer } from '@/features/desk/DeskObjectLayer'
import { DeskScene } from '@/features/desk/DeskScene'
import {
  DEFAULT_CAPSULE_UNLOCK_AT,
  formatReadMode,
  joinDateTime,
  splitDateTime,
} from '@/features/desk/readModeUtils'
import {
  mergeSupportMessages,
  seededDeskObjects,
} from '@/features/supporter/seededMessages'
import { usePrototypeStore } from '@/store/prototypeStore'
import type { ReadMode } from '@/types'
import './ClaimFlow.css'

export function ClaimIntroPage() {
  const navigate = useNavigate()
  const desk = usePrototypeStore((state) => state.currentDesk)
  const storedMessages = usePrototypeStore((state) => state.messages)
  const beginClaim = usePrototypeStore((state) => state.beginClaim)

  const messages = useMemo(
    () => mergeSupportMessages(storedMessages),
    [storedMessages],
  )
  const objects = useMemo(
    () => [...seededDeskObjects, ...desk.objects],
    [desk.objects],
  )
  const alreadyClaimed = desk.claimStatus === 'claimed'

  const next = () => {
    if (alreadyClaimed) {
      navigate('/prototype/my/desk')
      return
    }

    beginClaim()
    navigate('/prototype/claim/backlog')
  }

  return (
    <ClaimShell
      title="응원 책상 받기"
      back={() => navigate('/prototype')}
      action={
        <Button variant="brand" fullWidth onClick={next}>
          {alreadyClaimed ? '내 책상 보기' : '내 응원 책상 받기'}
        </Button>
      }
    >
      <section className="claim-flow__heading">
        <h1>
          {alreadyClaimed ? (
            <>
              이미 받은
              <br />
              응원 책상이에요.
            </>
          ) : (
            <>
              친구들이 {desk.displayName}님을 위해
              <br />
              응원 책상을 만들었어요.
            </>
          )}
        </h1>
      </section>

      <div className="claim-flow__scene-wrap">
        <DeskScene ownerName={desk.displayName} />
        <DeskObjectLayer
          objects={objects}
          messages={messages}
        />
      </div>

      {!alreadyClaimed && (
        <div className="claim-flow__count">
          <strong>{objects.length}개의 응원이 모여 있어요.</strong>
        </div>
      )}
    </ClaimShell>
  )
}

export function ClaimBacklogPage() {
  const navigate = useNavigate()
  const desk = usePrototypeStore((state) => state.currentDesk)
  const storedMessages = usePrototypeStore((state) => state.messages)
  const setDeferred = usePrototypeStore(
    (state) => state.setClaimBacklogDeferred,
  )

  const messages = useMemo(
    () => mergeSupportMessages(storedMessages),
    [storedMessages],
  )
  const objects = useMemo(
    () => [...seededDeskObjects, ...desk.objects],
    [desk.objects],
  )
  const supporterCount = useMemo(
    () =>
      new Set(
        messages
          .filter((message) =>
            objects.some(
              (object) => object.messageId === message.id,
            ),
          )
          .map((message) => message.senderName),
      ).size,
    [messages, objects],
  )

  const continueWith = (deferred: boolean) => {
    setDeferred(deferred)
    navigate('/prototype/claim/read-mode')
  }

  return (
    <ClaimShell
      title="응원 책상 받기"
      back={() => navigate('/prototype/claim')}
      action={
        <div className="claim-flow__backlog-actions">
          <Button
            variant="brand"
            fullWidth
            onClick={() => continueWith(false)}
          >
            지금 만나보기
          </Button>
          <Button
            variant="tertiary"
            fullWidth
            onClick={() => continueWith(true)}
          >
            나중에 보기
          </Button>
        </div>
      }
    >
      <section className="claim-flow__heading">
        <h1>
          친구들이 먼저
          <br />
          기다리고 있었어요.
        </h1>
        <p>
          이 응원 책상이 {desk.displayName}님 것이 되기 전부터
          도착한 응원이에요.
        </p>
      </section>

      <div className="claim-flow__backlog-summary">
        <div>
          <span className="claim-flow__backlog-icon" aria-hidden>
            <Heart size={19} />
          </span>
          <strong>{objects.length}</strong>
          <span>도착한 응원</span>
        </div>
        <div>
          <span className="claim-flow__backlog-icon" aria-hidden>
            <UsersRound size={19} />
          </span>
          <strong>{supporterCount}</strong>
          <span>마음을 남긴 친구</span>
        </div>
      </div>
    </ClaimShell>
  )
}

export function ClaimReadModePage() {
  const navigate = useNavigate()
  const readMode = usePrototypeStore((state) => state.claimReadMode)
  const setReadMode = usePrototypeStore((state) => state.setClaimReadMode)
  const completeClaim = usePrototypeStore((state) => state.completeClaim)

  const daily = readMode.type === 'daily'
  const dailyTime =
    readMode.type === 'daily'
      ? readMode.unlockTime
      : '22:00'
  const capsule =
    readMode.type === 'time-capsule'
      ? splitDateTime(readMode.unlockAt)
      : splitDateTime(DEFAULT_CAPSULE_UNLOCK_AT)

  const selectMode = (type: ReadMode['type']) => {
    if (type === 'daily') {
      setReadMode({
        type: 'daily',
        unlockTime: dailyTime,
      })
      return
    }

    setReadMode({
      type: 'time-capsule',
      unlockAt: joinDateTime(capsule.date, capsule.time),
    })
  }

  const finish = () => {
    completeClaim()
    navigate('/prototype/claim/complete', { replace: true })
  }

  return (
    <ClaimShell
      title="응원 책상 받기"
      back={() => navigate('/prototype/claim/backlog')}
      action={
        <Button variant="brand" fullWidth onClick={finish}>
          이대로 시작하기
        </Button>
      }
    >
      <section className="claim-flow__heading">
        <h1>
          응원을 언제
          <br />
          열어볼까요?
        </h1>
      </section>

      <div className="claim-flow__mode-list">
        <ChoiceCard
          title="하루를 마무리하며"
          description="매일 정해진 시간에 그날의 응원을 열어봐요."
          icon={<MoonStar size={22} aria-hidden />}
          selected={daily}
          onClick={() => selectMode('daily')}
        />

        {daily && (
          <div className="claim-flow__mode-setting">
            <label className="claim-flow__field-label" htmlFor="claim-daily-time">
              응원을 열 시간
            </label>
            <input
              id="claim-daily-time"
              className="claim-flow__native-input"
              type="time"
              value={dailyTime}
              onChange={(event) =>
                setReadMode({
                  type: 'daily',
                  unlockTime: event.target.value,
                })
              }
            />
          </div>
        )}

        <ChoiceCard
          title="한 번에 열어보기"
          description="정해둔 날까지 응원을 모아두고 한 번에 열어봐요."
          icon={<CalendarDays size={22} aria-hidden />}
          selected={!daily}
          onClick={() => selectMode('time-capsule')}
        />

        {!daily && (
          <div className="claim-flow__mode-setting claim-flow__mode-setting--split">
            <label className="claim-flow__field">
              <span className="claim-flow__field-label">응원을 열 날짜</span>
              <input
                className="claim-flow__native-input"
                type="date"
                value={capsule.date}
                onChange={(event) =>
                  setReadMode({
                    type: 'time-capsule',
                    unlockAt: joinDateTime(
                      event.target.value,
                      capsule.time,
                    ),
                  })
                }
              />
            </label>
            <label className="claim-flow__field">
              <span className="claim-flow__field-label">시간</span>
              <input
                className="claim-flow__native-input"
                type="time"
                value={capsule.time}
                onChange={(event) =>
                  setReadMode({
                    type: 'time-capsule',
                    unlockAt: joinDateTime(
                      capsule.date,
                      event.target.value,
                    ),
                  })
                }
              />
            </label>
          </div>
        )}
      </div>
    </ClaimShell>
  )
}

export function ClaimCompletePage() {
  const navigate = useNavigate()
  const desk = usePrototypeStore((state) => state.currentDesk)

  return (
    <AppShell
      surface="base"
      contentClassName="claim-flow-shell"
      fixedAction={
        <Button
          variant="brand"
          fullWidth
          onClick={() => navigate('/prototype/my/desk', { replace: true })}
        >
          내 책상 보기
        </Button>
      }
    >
      <main className="claim-flow claim-flow--complete">
        <div className="claim-flow__complete-mark" aria-hidden>
          <span>✓</span>
        </div>

        <section className="claim-flow__heading">
          <h1>
            이제 내 응원 책상이에요.
          </h1>
        </section>

        <div className="claim-flow__current-setting">
          <span>응원 열기</span>
          <strong>{formatReadMode(desk.readMode)}</strong>
        </div>
      </main>
    </AppShell>
  )
}

function ClaimShell({
  title,
  back,
  action,
  children,
}: {
  title: string
  back: () => void
  action: ReactNode
  children: ReactNode
}) {
  return (
    <AppShell
      surface="base"
      contentClassName="claim-flow-shell"
      appBar={
        <AppBar
          title={title}
          leading={
            <IconButton
              label="이전으로"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={back}
            />
          }
        />
      }
      fixedAction={action}
    >
      <main className="claim-flow">{children}</main>
    </AppShell>
  )
}
