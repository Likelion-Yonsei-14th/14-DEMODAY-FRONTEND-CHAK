import { useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  MoonStar,
  Share2,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  AppBar,
  Button,
  ChoiceCard,
  IconButton,
  TextField,
  useFeedback,
} from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import {
  DEFAULT_CAPSULE_UNLOCK_AT,
  formatReadMode,
  joinDateTime,
  splitDateTime,
} from '@/features/desk/readModeUtils'
import { usePrototypeStore } from '@/store/prototypeStore'
import { buildPrototypeShareUrl } from '@/prototype/shareUrl'
import type { ReadMode } from '@/types'
import './DeskCreation.css'

export function DeskCreateWhoPage() {
  const navigate = useNavigate()
  const currentUser = usePrototypeStore((state) => state.currentUser)
  const draft = usePrototypeStore((state) => state.deskCreationDraft)
  const setDraft = usePrototypeStore((state) => state.setDeskCreationDraft)

  const next = () => {
    if (!draft.createdFor) return

    if (draft.createdFor === 'self') {
      setDraft({ recipientDisplayName: currentUser.displayName })
      navigate('/prototype/create/read-mode')
      return
    }

    navigate('/prototype/create/recipient')
  }

  return (
    <CreationShell
      title="응원 책상 만들기"
      back={() => navigate('/start')}
      action={
        <Button
          variant="brand"
          fullWidth
          disabled={!draft.createdFor}
          onClick={next}
        >
          다음
        </Button>
      }
    >
      <CreationHeading
        title={<>누구를 위한<br />응원 책상인가요?</>}
      />

      <div className="desk-create__choices">
        <ChoiceCard
          title="내 응원 책상이에요"
          description="내가 받을 응원을 모을게요."
          icon={<UserRound size={22} aria-hidden />}
          selected={draft.createdFor === 'self'}
          onClick={() =>
            setDraft({
              createdFor: 'self',
              recipientDisplayName: currentUser.displayName,
            })
          }
        />
        <ChoiceCard
          title="친구나 지인을 위한 책상이에요"
          description="응원을 모아 책상의 주인에게 전해줄게요."
          icon={<UsersRound size={22} aria-hidden />}
          selected={draft.createdFor === 'other'}
          onClick={() =>
            setDraft({
              createdFor: 'other',
              recipientDisplayName:
                draft.createdFor === 'other'
                  ? draft.recipientDisplayName
                  : '',
            })
          }
        />
      </div>
    </CreationShell>
  )
}

export function DeskCreateRecipientPage() {
  const navigate = useNavigate()
  const draft = usePrototypeStore((state) => state.deskCreationDraft)
  const setDraft = usePrototypeStore((state) => state.setDeskCreationDraft)

  const name = draft.recipientDisplayName
  const valid = name.trim().length > 0

  return (
    <CreationShell
      title="응원 책상 만들기"
      back={() => navigate('/prototype/create')}
      action={
        <Button
          variant="brand"
          fullWidth
          disabled={!valid}
          onClick={() => navigate('/prototype/create/read-mode')}
        >
          다음
        </Button>
      }
    >
      <CreationHeading
        title={<>누구의 응원 책상인가요?</>}
      />

      <TextField
        id="desk-recipient-name"
        label="이름 또는 닉네임"
        value={name}
        maxLength={12}
        autoFocus
        placeholder="예: 지수"
        onChange={(event) =>
          setDraft({ recipientDisplayName: event.target.value })
        }
      />
    </CreationShell>
  )
}

export function DeskCreateReadModePage() {
  const navigate = useNavigate()
  const draft = usePrototypeStore((state) => state.deskCreationDraft)
  const setDraft = usePrototypeStore((state) => state.setDeskCreationDraft)
  const createDesk = usePrototypeStore((state) => state.createDeskFromDraft)

  const daily = draft.readMode.type === 'daily'
  const dailyTime =
    draft.readMode.type === 'daily'
      ? draft.readMode.unlockTime
      : '22:00'
  const capsule =
    draft.readMode.type === 'time-capsule'
      ? splitDateTime(draft.readMode.unlockAt)
      : splitDateTime(DEFAULT_CAPSULE_UNLOCK_AT)

  const setMode = (type: ReadMode['type']) => {
    if (type === 'daily') {
      setDraft({
        readMode: {
          type: 'daily',
          unlockTime: dailyTime,
        },
      })
      return
    }

    setDraft({
      readMode: {
        type: 'time-capsule',
        unlockAt: joinDateTime(capsule.date, capsule.time),
      },
    })
  }

  const finish = () => {
    createDesk()
    navigate('/prototype/create/complete', { replace: true })
  }

  const backPath =
    draft.createdFor === 'other'
      ? '/prototype/create/recipient'
      : '/prototype/create'

  return (
    <CreationShell
      title="응원 책상 만들기"
      back={() => navigate(backPath)}
      action={
        <Button variant="brand" fullWidth onClick={finish}>
          책상 만들기
        </Button>
      }
    >
      <CreationHeading
        title={<>응원을 언제<br />열어볼까요?</>}
      />

      <div className="desk-create__mode-list">
        <ChoiceCard
          title="하루를 마무리하며"
          description="매일 정해진 시간에 그날의 응원을 열어봐요."
          icon={<MoonStar size={22} aria-hidden />}
          selected={daily}
          onClick={() => setMode('daily')}
        />

        {daily && (
          <div className="desk-create__mode-setting">
            <label className="desk-create__field-label" htmlFor="daily-time">
              응원을 열 시간
            </label>
            <input
              id="daily-time"
              className="desk-create__native-input"
              type="time"
              value={dailyTime}
              onChange={(event) =>
                setDraft({
                  readMode: {
                    type: 'daily',
                    unlockTime: event.target.value,
                  },
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
          onClick={() => setMode('time-capsule')}
        />

        {!daily && (
          <div className="desk-create__mode-setting desk-create__mode-setting--split">
            <label className="desk-create__field">
              <span className="desk-create__field-label">응원을 열 날짜</span>
              <input
                className="desk-create__native-input"
                type="date"
                value={capsule.date}
                onChange={(event) =>
                  setDraft({
                    readMode: {
                      type: 'time-capsule',
                      unlockAt: joinDateTime(
                        event.target.value,
                        capsule.time,
                      ),
                    },
                  })
                }
              />
            </label>
            <label className="desk-create__field">
              <span className="desk-create__field-label">시간</span>
              <input
                className="desk-create__native-input"
                type="time"
                value={capsule.time}
                onChange={(event) =>
                  setDraft({
                    readMode: {
                      type: 'time-capsule',
                      unlockAt: joinDateTime(
                        capsule.date,
                        event.target.value,
                      ),
                    },
                  })
                }
              />
            </label>
          </div>
        )}
      </div>
    </CreationShell>
  )
}

export function DeskCreateCompletePage() {
  const navigate = useNavigate()
  const { showToast } = useFeedback()
  const desk = usePrototypeStore((state) => state.currentDesk)
  const selfCreated = desk.createdFor !== 'other'
  const [sharing, setSharing] = useState(false)

  const share = async (kind: 'owner' | 'support') => {
    if (sharing) return
    setSharing(true)

    const url =
      kind === 'owner'
        ? buildPrototypeShareUrl('/prototype/claim')
        : buildPrototypeShareUrl('/prototype/support/jisu')
    const title =
      kind === 'owner'
        ? `${desk.displayName}님의 응원 책상`
        : `${desk.displayName}님에게 응원을 남겨주세요`
    const text =
      kind === 'owner'
        ? '친구들이 응원 책상을 만들어두었어요.'
        : `${desk.displayName}님의 책상에 응원 하나 남겨주세요.`

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url })
      } else {
        await navigator.clipboard.writeText(url)
        showToast('링크를 복사했어요.')
      }
    } catch {
      // 공유 시트를 닫은 경우에는 별도 오류를 노출하지 않습니다.
    } finally {
      setSharing(false)
    }
  }

  return (
    <AppShell
      surface="base"
      contentClassName="desk-create-shell"
      fixedAction={
        selfCreated ? (
          <Button
            variant="brand"
            fullWidth
            onClick={() => navigate('/prototype/my/desk')}
          >
            내 책상 보기
          </Button>
        ) : (
          <Button
            variant="brand"
            fullWidth
            onClick={() => navigate('/prototype/support/jisu')}
          >
            {desk.displayName}님의 책상 보기
          </Button>
        )
      }
    >
      <main className="desk-create desk-create--complete">
        <div className="desk-create__complete-mark" aria-hidden>
          <span>✓</span>
        </div>

        <CreationHeading
          title={
            selfCreated ? (
              <>내 응원 책상이<br />만들어졌어요.</>
            ) : (
              <>{desk.displayName}님의 응원 책상이<br />만들어졌어요.</>
            )
          }
        />

        <div className="desk-create__summary">
          <span>응원 열기</span>
          <strong>{formatReadMode(desk.readMode)}</strong>
        </div>

        <div className="desk-create__complete-actions">
          {selfCreated ? (
            <Button
              variant="secondary"
              fullWidth
              leadingIcon={<Share2 size={18} aria-hidden />}
              onClick={() => share('support')}
            >
              친구에게 응원 링크 보내기
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                fullWidth
                leadingIcon={<Share2 size={18} aria-hidden />}
                onClick={() => share('owner')}
              >
                책상 주인에게 보내기
              </Button>
              <Button
                variant="secondary"
                fullWidth
                leadingIcon={<Share2 size={18} aria-hidden />}
                onClick={() => share('support')}
              >
                친구들에게 응원 링크 보내기
              </Button>
              <Button
                variant="tertiary"
                fullWidth
                onClick={() => navigate('/prototype/manage')}
              >
                만든 공간 관리하기
              </Button>
            </>
          )}
        </div>
      </main>
    </AppShell>
  )
}

function CreationShell({
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
      contentClassName="desk-create-shell"
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
      <main className="desk-create">{children}</main>
    </AppShell>
  )
}

function CreationHeading({
  title,
}: {
  title: ReactNode
}) {
  return (
    <section className="desk-create__heading">
      <h1>{title}</h1>
    </section>
  )
}

