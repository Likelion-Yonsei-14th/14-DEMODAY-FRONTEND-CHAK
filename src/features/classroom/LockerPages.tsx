import {
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  ArrowLeft,
  Eye,
  LockKeyhole,
  Move,
} from 'lucide-react'
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import {
  AppBar,
  Button,
  IconButton,
  useFeedback,
} from '@/design-system'
import { getComposerBackground } from '@/features/composer/backgroundAssets'
import { getFirstCardPage } from '@/features/composer/messagePages'
import {
  formatUnlockAt,
  getMessageAvailability,
} from '@/features/desk/dailyAvailability'
import { useReadModeNow } from '@/features/desk/useReadModeNow'
import { DeskObjectVisual } from '@/features/desk/DeskObjectLayer'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import type {
  DeskObjectType,
  DeskPlacement,
} from '@/types'
import {
  deskObjectLabels,
  deskObjectToneOptions,
  resolveDeskObjectType,
  selectableDeskObjectTypes,
} from '@/features/supporter/supporterFlow'
import { ClassroomLockerScene } from './LockerScene'
import '@/features/supporter/supporterFlow.css'
import './Classroom.css'

export function ClassroomLockerPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { classroomId, lockerId } = useParams()
  const { showToast } = useFeedback()
  const classroom = usePrototypeStore((state) => state.classroom)
  const member = usePrototypeStore((state) => state.classroomMember)
  const allMessages = usePrototypeStore((state) => state.messages)
  const readMessageIds = usePrototypeStore((state) => state.readMessageIds)
  const [open, setOpen] = useState(false)

  const locker = classroom.lockers.find(
    (item) => item.id === lockerId,
  )

  if (!member) {
    return (
      <Navigate
        to={`/prototype/classroom/${classroomId ?? classroom.id}/join`}
        replace
      />
    )
  }

  if (!locker) {
    return (
      <Navigate
        to={`/prototype/classroom/${classroomId ?? classroom.id}/map`}
        replace
      />
    )
  }

  const owner = member.lockerId === locker.id
  const messages = allMessages.filter((message) =>
    locker.messageIds.includes(message.id),
  )
  const readMode = {
    type: 'daily' as const,
    unlockTime: classroom.dailyUnlockTime,
  }
  const now = useReadModeNow(readMode, location.search)
  const availabilityById = new Map(
    messages.map((message) => [
      message.id,
      getMessageAvailability(
        readMode,
        message.createdAt,
        now,
      ),
    ]),
  )
  const lockedMessageIds = owner
    ? messages
        .filter(
          (message) =>
            !availabilityById.get(message.id)?.available,
        )
        .map((message) => message.id)
    : []

  const openMessage = (messageId: string) => {
    const message = messages.find((item) => item.id === messageId)
    if (!message) return

    if (!owner && message.visibility === 'private') {
      showToast(
        `${locker.studentName}님만 볼 수 있는 응원이에요.`,
      )
      return
    }

    const availability = availabilityById.get(messageId)
    if (owner && availability && !availability.available) {
      if (availability.unlockAt) {
        showToast(
          `${formatUnlockAt(availability.unlockAt, now)}에 열 수 있어요.`,
        )
      }
      return
    }

    navigate(
      `/prototype/classroom/${classroomId ?? classroom.id}/locker/${locker.id}/message/${messageId}${location.search}`,
      {
        state: {
          from: 'classroom-locker',
          lockerId: locker.id,
        },
      },
    )
  }

  const unreadCount = owner
    ? messages.filter(
        (message) =>
          availabilityById.get(message.id)?.available &&
          message.status !== 'read' &&
          !readMessageIds.includes(message.id),
      ).length
    : 0

  return (
    <AppShell
      surface="base"
      contentClassName="classroom-locker-shell"
      appBar={
        <AppBar
          title={`${locker.studentName}의 사물함`}
          subtitle={
            owner
              ? unreadCount > 0
                ? `새 응원 ${unreadCount}개`
                : `매일 오후 ${formatHour(classroom.dailyUnlockTime)}에 열려요`
              : '응원을 남길 수 있어요'
          }
          leading={
            <IconButton
              label="교실로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() =>
                navigate(
                  `/prototype/classroom/${classroomId ?? classroom.id}/map`,
                )
              }
            />
          }
        />
      }
      fixedAction={
        open ? (
          <Button
            variant="brand"
            fullWidth
            onClick={() => {
              usePrototypeStore
                .getState()
                .resetComposerDraft()
              navigate(
                `/prototype/classroom/${classroomId ?? classroom.id}/locker/${locker.id}/compose`,
              )
            }}
          >
            {locker.studentName}님에게 응원 남기기
          </Button>
        ) : undefined
      }
    >
      <main className="classroom-locker-page">
        {!open && (
          <p className="classroom-locker-page__hint">
            사물함 문을 눌러 열어보세요.
          </p>
        )}

        <ClassroomLockerScene
          locker={locker}
          messages={messages}
          open={open}
          owner={owner}
          readMessageIds={readMessageIds}
          lockedMessageIds={lockedMessageIds}
          onToggle={() => setOpen((value) => !value)}
          onObjectClick={open ? openMessage : undefined}
        />

        {open && locker.objects.length === 0 && (
          <p className="classroom-locker-page__empty">
            아직 놓인 응원이 없어요.
          </p>
        )}

        {open && owner && lockedMessageIds.length > 0 && (
          <p className="classroom-locker-page__daily-note">
            오늘 받은 응원은 오후 {formatHour(classroom.dailyUnlockTime)}에 열려요.
          </p>
        )}
      </main>
    </AppShell>
  )
}

export function ClassroomLockerPlacementPage() {
  const navigate = useNavigate()
  const { classroomId, lockerId } = useParams()
  const sceneRef = useRef<HTMLDivElement>(null)
  const classroom = usePrototypeStore((state) => state.classroom)
  const draft = usePrototypeStore((state) => state.composerDraft)
  const allMessages = usePrototypeStore((state) => state.messages)
  const placeMessage = usePrototypeStore(
    (state) => state.placeComposerMessageInLocker,
  )
  const locker = classroom.lockers.find(
    (item) => item.id === lockerId,
  )

  const recommendedObjectType = useMemo(
    () => resolveDeskObjectType(draft),
    [draft],
  )
  const [objectType, setObjectType] = useState<DeskObjectType>(
    recommendedObjectType,
  )
  const firstPage = getFirstCardPage(draft)
  const cardPreviewColor =
    getComposerBackground(firstPage.backgroundAssetId).tone
  const [objectColor, setObjectColor] = useState(cardPreviewColor)
  const [placement, setPlacement] = useState<DeskPlacement>(() =>
    lockerPlacement(locker?.objects.length ?? 0),
  )
  const [dragging, setDragging] = useState(false)
  const [placing, setPlacing] = useState(false)

  if (!locker) {
    return (
      <Navigate
        to={`/prototype/classroom/${classroomId ?? classroom.id}/map`}
        replace
      />
    )
  }

  const messages = allMessages.filter((message) =>
    locker.messageIds.includes(message.id),
  )
  const toneChoices = [
    { id: 'card', label: '카드 색', color: cardPreviewColor },
    ...deskObjectToneOptions.filter(
      (tone) => tone.color !== cardPreviewColor,
    ),
  ]

  const handlePointerDown: React.PointerEventHandler<HTMLButtonElement> = (
    event,
  ) => {
    event.preventDefault()
    setDragging(true)

    const update = (clientX: number, clientY: number) => {
      const scene = sceneRef.current
      if (!scene) return

      const rect = scene.getBoundingClientRect()
      setPlacement((current) =>
        clampLockerPlacement({
          ...current,
          x: ((clientX - rect.left) / rect.width) * 100,
          y: ((clientY - rect.top) / rect.height) * 100,
        }),
      )
    }

    update(event.clientX, event.clientY)

    const onMove = (moveEvent: PointerEvent) => {
      update(moveEvent.clientX, moveEvent.clientY)
    }
    const onUp = () => {
      setDragging(false)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp, { once: true })
  }

  const finish = () => {
    if (placing) return
    setPlacing(true)

    window.setTimeout(() => {
      placeMessage(
        locker.id,
        placement,
        objectType,
        objectColor,
      )
      navigate(
        `/prototype/classroom/${classroomId ?? classroom.id}/locker/${locker.id}/complete`,
        { replace: true },
      )
    }, 420)
  }

  return (
    <AppShell
      surface="base"
      contentClassName="classroom-locker-placement-shell"
      appBar={
        <AppBar
          title="사물함에 놓기"
          leading={
            <IconButton
              label="응원 만들기로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() =>
                navigate(
                  `/prototype/classroom/${classroomId ?? classroom.id}/locker/${locker.id}/compose`,
                )
              }
            />
          }
        />
      }
      fixedAction={
        <Button
          variant="brand"
          fullWidth
          loading={placing}
          onClick={finish}
        >
          이대로 놓고 가기
        </Button>
      }
    >
      <main className="classroom-locker-placement">
        <section className="classroom-locker-placement__heading">
          <h1>
            {locker.studentName}님의 사물함에
            <br />
            내 응원을 놓아주세요.
          </h1>
        </section>

        <section
          className="placement-object-picker"
          aria-label="사물함에 놓을 형태"
        >
          {selectableDeskObjectTypes.map((type) => (
            <button
              type="button"
              key={type}
              className={[
                'placement-object-option',
                objectType === type
                  ? 'placement-object-option--selected'
                  : '',
              ].filter(Boolean).join(' ')}
              aria-pressed={objectType === type}
              onClick={() => setObjectType(type)}
            >
              <span
                className={[
                  'placement-object-option__preview',
                  `desk-object--${type}`,
                ].join(' ')}
                style={{
                  '--desk-object-color': objectColor,
                } as React.CSSProperties}
                aria-hidden
              >
                <DeskObjectVisual type={type} />
              </span>
              <span>{deskObjectLabels[type]}</span>
            </button>
          ))}
        </section>

        <section className="placement-object-tone-picker" aria-label="색상">
          <span className="placement-object-tone-picker__label">
            색상
          </span>
          <div className="placement-object-tone-picker__options">
            {toneChoices.map((tone) => (
              <button
                type="button"
                key={tone.id}
                className={[
                  'placement-object-tone',
                  objectColor === tone.color
                    ? 'placement-object-tone--selected'
                    : '',
                ].filter(Boolean).join(' ')}
                style={{
                  '--object-tone': tone.color,
                } as React.CSSProperties}
                aria-label={tone.label}
                aria-pressed={objectColor === tone.color}
                onClick={() => setObjectColor(tone.color)}
              />
            ))}
          </div>
        </section>

        <div
          ref={sceneRef}
          className="classroom-locker-placement__scene"
        >
          <ClassroomLockerScene
            locker={locker}
            messages={messages}
            open
            draftObject={{
              representationType: objectType,
              placement,
              previewColor: objectColor,
              dragging,
              onPointerDown: handlePointerDown,
            }}
          />
        </div>

        <div className="placement-preview__notice placement-preview__notice--valid">
          <Move size={16} aria-hidden />
          <span>응원을 끌어서 사물함 안 원하는 자리에 놓아보세요.</span>
        </div>

        <section className="placement-preview__summary">
          <div className="placement-preview__summary-row">
            <span>형태</span>
            <strong>{deskObjectLabels[objectType]}</strong>
          </div>
          <div className="placement-preview__summary-row">
            <span>공개 범위</span>
            <strong className="placement-preview__visibility">
              {draft.visibility === 'private' ? (
                <LockKeyhole size={15} aria-hidden />
              ) : (
                <Eye size={15} aria-hidden />
              )}
              {draft.visibility === 'private'
                ? `${locker.studentName}님만 보기`
                : '함께 보기'}
            </strong>
          </div>
        </section>
      </main>
    </AppShell>
  )
}

export function ClassroomLockerCompletePage() {
  const navigate = useNavigate()
  const { classroomId, lockerId } = useParams()
  const classroom = usePrototypeStore((state) => state.classroom)
  const locker = classroom.lockers.find(
    (item) => item.id === lockerId,
  )

  if (!locker) {
    return (
      <Navigate
        to={`/prototype/classroom/${classroomId ?? classroom.id}/map`}
        replace
      />
    )
  }

  return (
    <AppShell
      surface="base"
      contentClassName="classroom-locker-complete-shell"
      fixedAction={
        <Button
          variant="brand"
          fullWidth
          onClick={() =>
            navigate(
              `/prototype/classroom/${classroomId ?? classroom.id}/locker/${locker.id}`,
              { replace: true },
            )
          }
        >
          {locker.studentName}님의 사물함으로 돌아가기
        </Button>
      }
    >
      <main className="classroom-locker-complete">
        <span className="classroom-form__complete-mark" aria-hidden>
          ✓
        </span>
        <h1>
          응원이 {locker.studentName}님의
          <br />
          사물함에 놓였어요.
        </h1>
        <p>
          오늘의 응원 시간까지 사물함 안에서 기다리고 있어요.
        </p>

        <Button
          variant="secondary"
          fullWidth
          onClick={() =>
            navigate(
              `/prototype/classroom/${classroomId ?? classroom.id}/map`,
            )
          }
        >
          교실 더 둘러보기
        </Button>
      </main>
    </AppShell>
  )
}

function lockerPlacement(index: number): DeskPlacement {
  const presets: DeskPlacement[] = [
    { x: 36, y: 39, rotation: -3, scale: .92 },
    { x: 60, y: 47, rotation: 3, scale: .94 },
    { x: 42, y: 62, rotation: 2, scale: .9 },
    { x: 67, y: 68, rotation: -2, scale: .9 },
  ]

  return presets[index % presets.length] ?? presets[0]!
}

function clampLockerPlacement(
  placement: DeskPlacement,
): DeskPlacement {
  return {
    ...placement,
    x: Math.min(76, Math.max(24, placement.x)),
    y: Math.min(75, Math.max(28, placement.y)),
  }
}

function formatHour(value: string) {
  const [hourString = '22'] = value.split(':')
  const hour = Number(hourString)
  return hour % 12 || 12
}
