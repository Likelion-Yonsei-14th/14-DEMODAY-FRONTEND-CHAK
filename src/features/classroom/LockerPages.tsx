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
  BottomSheet,
  Button,
  IconButton,
  useFeedback,
} from '@/design-system'
import { getComposerBackground } from '@/features/composer/backgroundAssets'
import { getFirstCardPage } from '@/features/composer/messagePages'
import { formatUnlockAt } from '@/features/desk/dailyAvailability'
import {
  getDeskSticker,
  getSupportMessageAvailability,
  type DeskSticker,
} from '@/features/supporter/deskStickers'
import { ObjectChoiceSheet } from '@/features/supporter/ObjectChoiceSheet'
import { lockerStickers } from './lockerStickers'
import {
  UNIVERSITY_CHARM_PRICE,
  charmUniversities,
  getUniversity,
  universityCharmId,
  universityCharmShapes,
  type UniversityCharmShape,
} from './universities'
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
  const publicHiddenMessageIds = usePrototypeStore(
    (state) => state.publicHiddenMessageIds,
  )
  const publicBlockedSupporters = usePrototypeStore(
    (state) => state.publicBlockedSupporters,
  )
  const readMessageIds = usePrototypeStore((state) => state.readMessageIds)
  const [open, setOpen] = useState(false)
  const [choiceOpen, setChoiceOpen] = useState(false)

  const locker = classroom.lockers.find(
    (item) => item.id === lockerId,
  )
  const readMode = {
    type: 'daily' as const,
    unlockTime: classroom.dailyUnlockTime ?? '22:00',
  }
  const now = useReadModeNow(readMode, location.search)

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
  const lockerMessages = allMessages.filter((message) =>
    locker.messageIds.includes(message.id),
  )
  const messages = owner
    ? lockerMessages
    : lockerMessages.filter(
        (message) =>
          !publicHiddenMessageIds.includes(message.id) &&
          !publicBlockedSupporters.includes(message.senderName),
      )
  const visibleMessageIds = new Set(
    messages.map((message) => message.id),
  )
  const visibleLocker = owner
    ? locker
    : {
        ...locker,
        objects: locker.objects.filter((object) =>
          visibleMessageIds.has(object.messageId),
        ),
      }
  const availabilityById = new Map(
    messages.map((message) => [
      message.id,
      // Stickers skip the daily unlock, the same as on a desk
      getSupportMessageAvailability(readMode, message, now),
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
            onClick={() => setChoiceOpen(true)}
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
          locker={visibleLocker}
          messages={messages}
          open={open}
          owner={owner}
          readMessageIds={readMessageIds}
          lockedMessageIds={lockedMessageIds}
          onToggle={() => setOpen((value) => !value)}
          onObjectClick={open ? openMessage : undefined}
        />

        <ObjectChoiceSheet
          open={choiceOpen}
          recipientName={locker.studentName}
          placeLabel="사물함"
          types={['letter', 'charm', 'sticker']}
          charmPreviewAssetId={universityCharmId('yonsei', 'jersey')}
          descriptions={{
            charm: `대학 굿즈 아크릴 키링에 응원을 담아요. 하나에 ${UNIVERSITY_CHARM_PRICE}원이에요.`,
          }}
          onClose={() => setChoiceOpen(false)}
          onChoose={(choice) => {
            const store = usePrototypeStore.getState()
            const lockerPath = `/prototype/classroom/${classroomId ?? classroom.id}/locker/${locker.id}`
            setChoiceOpen(false)
            store.setSupporterObjectChoice(choice)
            if (choice === 'sticker') {
              store.setStickerDraft({ stickerId: lockerStickers[0]!.id })
              navigate(`${lockerPath}/sticker`)
              return
            }
            store.resetComposerDraft()
            navigate(`${lockerPath}/compose`)
          }}
        />

        {open && visibleLocker.objects.length === 0 && (
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
  const placeSticker = usePrototypeStore(
    (state) => state.placeStickerInLocker,
  )
  const objectChoice = usePrototypeStore(
    (state) => state.supporterObjectChoice,
  )
  const stickerId = usePrototypeStore(
    (state) => state.stickerDraft.stickerId,
  )
  const stickerMode = objectChoice === 'sticker'
  const sticker = getDeskSticker(stickerId)
  // Locker charms are university goods: acrylic only, always paid
  const charmMode = objectChoice === 'charm'
  const [schoolId, setSchoolId] = useState(charmUniversities[0]!.id)
  const [charmShape, setCharmShape] = useState<UniversityCharmShape>('jersey')
  const [paymentOpen, setPaymentOpen] = useState(false)
  const school = getUniversity(schoolId)
  const charmAssetId = universityCharmId(schoolId, charmShape)
  const charmLabel = `${school.name} ${
    universityCharmShapes.find((item) => item.id === charmShape)?.label ?? ''
  } 키링`
  const locker = classroom.lockers.find(
    (item) => item.id === lockerId,
  )

  const recommendedObjectType = useMemo(
    () => resolveDeskObjectType(draft),
    [draft],
  )
  // Chose "편지" up front: start as a letter, other shapes stay one tap away
  const [objectType, setObjectType] = useState<DeskObjectType>(
    objectChoice === 'letter' || objectChoice === 'charm'
      ? objectChoice
      : recommendedObjectType,
  )
  const firstPage = getFirstCardPage(draft)
  const cardPreviewColor =
    getComposerBackground(firstPage.backgroundAssetId).tone
  const [objectColor, setObjectColor] = useState(cardPreviewColor)
  const [placement, setPlacement] = useState<DeskPlacement>(() =>
    stickerMode
      ? stickerLockerPlacement(sticker)
      : lockerPlacement(locker?.objects.length ?? 0),
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
      // Placement is relative to the locker's interior, not the whole scene
      const scene =
        sceneRef.current?.querySelector<HTMLElement>('.locker-v2__object-zone') ??
        sceneRef.current
      if (!scene) return

      const rect = scene.getBoundingClientRect()
      setPlacement((current) =>
        clampLockerPlacement(
          {
            ...current,
            x: ((clientX - rect.left) / rect.width) * 100,
            y: ((clientY - rect.top) / rect.height) * 100,
          },
          stickerMode ? sticker.shape : undefined,
        ),
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

  const finish = (paid = false) => {
    if (placing) return
    if (charmMode && !paid) {
      setPaymentOpen(true)
      return
    }
    setPlacing(true)

    window.setTimeout(() => {
      if (stickerMode) {
        placeSticker(locker.id, placement)
      } else {
        placeMessage(
          locker.id,
          placement,
          charmMode ? 'charm' : objectType,
          objectColor,
          charmMode ? { assetId: charmAssetId, material: 'acrylic' } : undefined,
        )
      }
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
              label={stickerMode ? '스티커 고르기로 돌아가기' : '응원 만들기로 돌아가기'}
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() =>
                navigate(
                  `/prototype/classroom/${classroomId ?? classroom.id}/locker/${locker.id}/${stickerMode ? 'sticker' : 'compose'}`,
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
          onClick={() => finish()}
        >
          {stickerMode
            ? '이대로 붙이고 가기'
            : charmMode
              ? `${UNIVERSITY_CHARM_PRICE}원 결제하고 놓기`
              : '이대로 놓고 가기'}
        </Button>
      }
    >
      <main className="classroom-locker-placement">
        <section className="classroom-locker-placement__heading">
          <h1>
            {locker.studentName}님의 사물함에
            <br />
            {stickerMode
              ? '스티커를 붙여주세요.'
              : charmMode
                ? '대학 굿즈 부적을 걸어주세요.'
                : '내 응원을 놓아주세요.'}
          </h1>
        </section>

        {charmMode && (
          <section className="university-charm-picker" aria-label="대학 굿즈 부적">
            <div className="university-charm-picker__label">
              <strong>학교</strong>
              <span>아크릴 키링 · {UNIVERSITY_CHARM_PRICE}원</span>
            </div>
            <div className="university-charm-picker__schools" role="list">
              {charmUniversities.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={[
                    'university-charm-picker__school',
                    item.id === schoolId
                      ? 'university-charm-picker__school--selected'
                      : '',
                  ].filter(Boolean).join(' ')}
                  style={{ '--school-color': item.color } as React.CSSProperties}
                  aria-pressed={item.id === schoolId}
                  onClick={() => setSchoolId(item.id)}
                >
                  {item.name.replace('대학교', '대')}
                </button>
              ))}
            </div>
            <div className="university-charm-picker__label">
              <strong>모양</strong>
            </div>
            <div className="placement-object-picker university-charm-picker__shapes">
              {universityCharmShapes.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={[
                    'placement-object-option',
                    charmShape === item.id
                      ? 'placement-object-option--selected'
                      : '',
                  ].filter(Boolean).join(' ')}
                  aria-pressed={charmShape === item.id}
                  onClick={() => setCharmShape(item.id)}
                >
                  <span
                    className="placement-object-option__preview desk-object--charm"
                    aria-hidden
                  >
                    <DeskObjectVisual
                      type="charm"
                      assetId={universityCharmId(schoolId, item.id)}
                    />
                  </span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {!stickerMode && !charmMode && (
        <>
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
        </>
        )}

        <div
          ref={sceneRef}
          className="classroom-locker-placement__scene"
        >
          <ClassroomLockerScene
            locker={locker}
            messages={messages}
            open
            draftObject={{
              representationType: stickerMode
                ? 'sticker'
                : charmMode
                  ? 'charm'
                  : objectType,
              assetId: stickerMode
                ? sticker.id
                : charmMode
                  ? charmAssetId
                  : undefined,
              placement,
              previewColor: objectColor,
              dragging,
              onPointerDown: handlePointerDown,
            }}
          />
        </div>

        <div className="placement-preview__notice placement-preview__notice--valid">
          <Move size={16} aria-hidden />
          <span>
            {stickerMode
              ? '스티커를 끌어서 원하는 자리에 붙여보세요.'
              : '응원을 끌어서 사물함 안 원하는 자리에 놓아보세요.'}
          </span>
        </div>

        <section className="placement-preview__summary">
          <div className="placement-preview__summary-row">
            <span>{stickerMode ? '스티커' : '형태'}</span>
            <strong>
              {stickerMode
                ? sticker.name
                : charmMode
                  ? charmLabel
                  : deskObjectLabels[objectType]}
            </strong>
          </div>
          {charmMode && (
            <div className="placement-preview__summary-row">
              <span>가격</span>
              <strong>{UNIVERSITY_CHARM_PRICE}원 · 아크릴</strong>
            </div>
          )}
          {stickerMode && sticker.price ? (
            <div className="placement-preview__summary-row">
              <span>결제</span>
              <strong>{sticker.price}원 결제 완료</strong>
            </div>
          ) : null}
          <div className="placement-preview__summary-row">
            <span>{stickerMode ? '보낸 사람' : '공개 범위'}</span>
            <strong className="placement-preview__visibility">
              {stickerMode ? (
                <LockKeyhole size={15} aria-hidden />
              ) : draft.visibility === 'private' ? (
                <LockKeyhole size={15} aria-hidden />
              ) : (
                <Eye size={15} aria-hidden />
              )}
              {stickerMode || draft.visibility === 'private'
                ? `${locker.studentName}님만 보기`
                : '함께 보기'}
            </strong>
          </div>
        </section>
      </main>

      <BottomSheet
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        title="이대로 결제하고 놓을까요?"
        description="대학 굿즈 부적은 아크릴 키링으로만 만들어요."
      >
        <div className="charm-payment">
          <div className="charm-payment__row">
            <span>{charmLabel} · 아크릴</span>
            <strong>{UNIVERSITY_CHARM_PRICE}원</strong>
          </div>
          <div className="charm-payment__row charm-payment__row--total">
            <span>합계</span>
            <strong>{UNIVERSITY_CHARM_PRICE}원</strong>
          </div>
          <p className="charm-payment__note">
            프로토타입이라 실제 결제는 되지 않아요.
          </p>
          <Button
            variant="brand"
            fullWidth
            onClick={() => {
              setPaymentOpen(false)
              finish(true)
            }}
          >
            {UNIVERSITY_CHARM_PRICE}원 결제하기
          </Button>
        </div>
      </BottomSheet>
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

/** Garlands and pennants hang from the top of the compartment. */
function stickerLockerPlacement(sticker: DeskSticker): DeskPlacement {
  if (sticker.shape === 'garland') return { x: 50, y: 7, rotation: 0, scale: 1 }
  if (sticker.shape === 'pennant') return { x: 50, y: 16, rotation: -5, scale: 1 }
  return { x: 50, y: 42, rotation: -4, scale: 1 }
}

function clampLockerPlacement(
  placement: DeskPlacement,
  stickerShape?: DeskSticker['shape'],
): DeskPlacement {
  // Wide pieces span most of the compartment, so they only slide vertically
  const [minX, maxX, minY] =
    stickerShape === 'garland'
      ? [48, 52, 5]
      : stickerShape === 'pennant'
        ? [40, 60, 6]
        : stickerShape
          ? [18, 82, 6]
          : [24, 76, 28]
  return {
    ...placement,
    x: Math.min(maxX, Math.max(minX, placement.x)),
    y: Math.min(stickerShape ? 88 : 75, Math.max(minY, placement.y)),
  }
}

function formatHour(value: string) {
  const [hourString = '22'] = value.split(':')
  const hour = Number(hourString)
  return hour % 12 || 12
}
