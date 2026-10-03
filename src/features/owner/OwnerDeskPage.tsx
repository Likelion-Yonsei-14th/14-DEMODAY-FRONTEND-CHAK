import { useMemo, useState } from 'react'
import { ArrowLeft, Settings } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Button,
  IconButton,
  useFeedback,
} from '@/design-system'
import { DeskObjectLayer } from '@/features/desk/DeskObjectLayer'
import { DeskScene } from '@/features/desk/DeskScene'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import {
  formatUnlockAt,
  resolvePreviewReadMode,
} from '@/features/desk/dailyAvailability'
import { getSupportMessageAvailability } from '@/features/supporter/deskStickers'
import { useReadModeNow } from '@/features/desk/useReadModeNow'
import {
  mergeSupportMessages,
  seededDeskObjects,
} from '@/features/supporter/seededMessages'
import { getCsatDdayLabel } from '@/features/csat/csatSchedule'
import { OwnerViewToggle } from './OwnerViewToggle'
import './OwnerDeskPage.css'

export function OwnerDeskPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useFeedback()
  const currentDesk = usePrototypeStore((state) => state.currentDesk)
  const storedMessages = usePrototypeStore((state) => state.messages)
  const ownerSettings = usePrototypeStore((state) => state.ownerSettings)
  const claimBacklogDeferred = usePrototypeStore(
    (state) => state.claimBacklogDeferred,
  )
  const clearClaimBacklogDeferred = usePrototypeStore(
    (state) => state.clearClaimBacklogDeferred,
  )
  const readMessageIds = usePrototypeStore((state) => state.readMessageIds)
  const [openingMessageId, setOpeningMessageId] = useState<string | null>(null)

  const messages = useMemo(
    () =>
      mergeSupportMessages(storedMessages).filter(
        (message) =>
          !ownerSettings.blockedSupporters.includes(
            message.senderName,
          ),
      ),
    [ownerSettings.blockedSupporters, storedMessages],
  )
  const objects = useMemo(
    () => [...seededDeskObjects, ...currentDesk.objects],
    [currentDesk.objects],
  )
  const readMode = useMemo(
    () =>
      resolvePreviewReadMode(
        currentDesk.readMode,
        location.search,
      ),
    [currentDesk.readMode, location.search],
  )
  const now = useReadModeNow(
    readMode,
    location.search,
  )
  const availabilityById = useMemo(
    () =>
      new Map(
        messages.map((message) => [
          message.id,
          getSupportMessageAvailability(
            readMode,
            message,
            now,
          ),
        ]),
      ),
    [messages, now, readMode],
  )
  const lockedMessageIds = useMemo(
    () =>
      messages
        .filter(
          (message) =>
            !availabilityById.get(message.id)?.available,
        )
        .map((message) => message.id),
    [availabilityById, messages],
  )
  const lockedMessageIdSet = useMemo(
    () => new Set(lockedMessageIds),
    [lockedMessageIds],
  )
  const nextUnlockAt = useMemo(
    () =>
      messages
        .map(
          (message) =>
            availabilityById.get(message.id)?.unlockAt ?? null,
        )
        .filter(
          (unlockAt): unlockAt is Date =>
            Boolean(unlockAt && unlockAt.getTime() > now.getTime()),
        )
        .sort((a, b) => a.getTime() - b.getTime())[0] ?? null,
    [availabilityById, messages, now],
  )
  const nextUnlockLabel = nextUnlockAt
    ? formatUnlockAt(nextUnlockAt, now)
    : null
  const unreadCount = useMemo(() => {
    const messageById = new Map(
      messages.map((message) => [message.id, message]),
    )

    return objects.filter((object) => {
      const message = messageById.get(object.messageId)
      return (
        message &&
        !lockedMessageIdSet.has(object.messageId) &&
        message.status !== 'read' &&
        !readMessageIds.includes(object.messageId)
      )
    }).length
  }, [
    lockedMessageIdSet,
    messages,
    objects,
    readMessageIds,
  ])

  const openObject = (messageId: string) => {
    if (openingMessageId) return

    const availability = availabilityById.get(messageId)
    if (availability && !availability.available) {
      if (availability.unlockAt) {
        showToast(
          `${formatUnlockAt(availability.unlockAt, now)}에 열 수 있어요.`,
        )
      }
      return
    }

    setOpeningMessageId(messageId)

    window.setTimeout(() => {
      navigate(
        `/prototype/my/message/${messageId}${location.search}`,
        {
          state: { from: 'owner-desk' },
        },
      )
    }, 360)
  }

  return (
    <AppShell
      surface="transparent"
      contentClassName="owner-desk-shell"
      appBar={
        <AppBar
          title="내 책상"
          subtitle={getCsatDdayLabel()}
          transparent
          leading={
            <IconButton
              label="프로토타입 목록으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate('/prototype')}
            />
          }
          trailing={
            <IconButton
              label="응원 책상 설정"
              icon={<Settings size={20} aria-hidden />}
              onClick={() => navigate('/prototype/my/settings')}
            />
          }
        />
      }
    >
      <main className="owner-desk">
        <section className="owner-desk__toolbar">
          <OwnerViewToggle mode="desk" />
        </section>

        <section className="owner-desk__intro">
          <h2>
            {unreadCount > 0 ? (
              <>
                아직 열어보지 않은 응원이
                <br />
                {unreadCount}개 있어요.
              </>
            ) : nextUnlockLabel ? (
              readMode.type === 'time-capsule' ? (
                <>
                  모아둔 응원은
                  <br />
                  {nextUnlockLabel}에 열려요.
                </>
              ) : nextUnlockLabel.startsWith('오늘 ') ? (
                <>
                  오늘의 응원은
                  <br />
                  {nextUnlockLabel.replace('오늘 ', '')}에 열려요.
                </>
              ) : (
                <>
                  다음 응원은
                  <br />
                  {nextUnlockLabel}에 열려요.
                </>
              )
            ) : (
              <>
                친구들이 남긴 응원을
                <br />
                모두 열어봤어요.
              </>
            )}
          </h2>
        </section>

        {claimBacklogDeferred && (
          <section className="owner-desk__backlog">
            <div>
              <strong>먼저 와 있던 응원이 기다리고 있어요.</strong>
              <span>준비됐을 때 천천히 열어보세요.</span>
            </div>
            <Button
              variant="secondary"
              size="m"
              onClick={() => {
                clearClaimBacklogDeferred()
                navigate('/prototype/my/desk/cards')
              }}
            >
              보기
            </Button>
          </section>
        )}

        <div
          className={[
            'owner-desk__scene-wrap',
            openingMessageId ? 'owner-desk__scene-wrap--opening' : '',
          ].filter(Boolean).join(' ')}
        >
          <DeskScene ownerName={currentDesk.displayName} />
          <DeskObjectLayer
            objects={objects}
            messages={messages}
            onObjectClick={openObject}
            openingMessageId={openingMessageId}
            readMessageIds={readMessageIds}
            lockedMessageIds={lockedMessageIds}
            respectObjectLocks={false}
          />
        </div>

      </main>
    </AppShell>
  )
}
