import { useMemo, useState } from 'react'
import { ArrowLeft, Settings, Share2 } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Button,
  IconButton,
  useFeedback,
} from '@/design-system'
import { isDeskFull } from '@/features/supporter/supporterFlow'
import { DeskBasketSheet } from './DeskBasketSheet'
import { ASK_FOR_CHEERS_LABEL, shareMyDeskLink } from './shareMyDesk'
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
  const basketMessageIds = usePrototypeStore(
    (state) => state.basketMessageIds,
  )
  const moveToBasket = usePrototypeStore((state) => state.moveToBasket)
  const [basketOpen, setBasketOpen] = useState(false)

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
  const allObjects = useMemo(
    () => [...seededDeskObjects, ...currentDesk.objects],
    [currentDesk.objects],
  )
  const objects = useMemo(
    () =>
      allObjects.filter(
        (object) => !basketMessageIds.includes(object.messageId),
      ),
    [allObjects, basketMessageIds],
  )
  const basketObjects = useMemo(
    () =>
      basketMessageIds
        .map((messageId) =>
          allObjects.find((object) => object.messageId === messageId),
        )
        .filter((object) => object !== undefined)
        .reverse(),
    [allObjects, basketMessageIds],
  )
  // ?desk=full previews the full-desk prompt without placing ~30 objects.
  const deskFull = useMemo(
    () =>
      isDeskFull(objects) ||
      new URLSearchParams(location.search).get('desk') === 'full',
    [location.search, objects],
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

  // Like compacting a long chat: everything already read goes in the basket
  // in one go; unread or not-yet-open cheers stay on the desk.
  const tidyableMessageIds = objects
    .map((object) => object.messageId)
    .filter(
      (messageId) =>
        !lockedMessageIdSet.has(messageId) &&
        (readMessageIds.includes(messageId) ||
          messages.find((message) => message.id === messageId)?.status ===
            'read'),
    )

  const tidyDesk = () => {
    if (tidyableMessageIds.length === 0) {
      showToast('아직 안 읽은 응원만 남아 있어요.')
      return
    }
    moveToBasket(tidyableMessageIds)
    showToast(`읽은 응원 ${tidyableMessageIds.length}개를 바구니에 넣었어요.`)
  }

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
          <button
            type="button"
            className="owner-desk__ask"
            aria-label={ASK_FOR_CHEERS_LABEL}
            onClick={() => shareMyDeskLink(showToast)}
          >
            <Share2 size={15} aria-hidden />
            응원 부탁
          </button>
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

        {allObjects.length === 0 && (
          <section className="owner-desk__quiet">
            <p>아직 책상이 조용해요. 친구에게 응원을 부탁해 볼까요?</p>
            <Button
              variant="brand"
              size="m"
              fullWidth
              leadingIcon={<Share2 size={17} aria-hidden />}
              onClick={() => shareMyDeskLink(showToast)}
            >
              {ASK_FOR_CHEERS_LABEL}
            </Button>
          </section>
        )}

        {deskFull && (
          <section className="owner-desk__full">
            <div>
              <strong>책상이 꽉 찼어요.</strong>
              <span>읽은 응원을 바구니에 넣으면 새 자리가 생겨요.</span>
            </div>
            <Button variant="secondary" size="m" onClick={tidyDesk}>
              정리하기
            </Button>
          </section>
        )}

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
          <button
            type="button"
            className="owner-desk__basket"
            aria-label={`바구니 열기, ${basketObjects.length}개 들어 있어요`}
            onClick={() => setBasketOpen(true)}
          >
            <img src="/assets/desk/living-box.webp" alt="" draggable={false} />
            {basketObjects.length > 0 && (
              <span className="owner-desk__basket-count">
                {basketObjects.length}
              </span>
            )}
          </button>
        </div>

        <DeskBasketSheet
          open={basketOpen}
          objects={basketObjects}
          messages={messages}
          tidyableCount={tidyableMessageIds.length}
          onTidy={tidyDesk}
          onClose={() => setBasketOpen(false)}
          onOpenMessage={(messageId) => {
            setBasketOpen(false)
            navigate(`/prototype/my/message/${messageId}${location.search}`, {
              state: { from: 'owner-desk' },
            })
          }}
        />

      </main>
    </AppShell>
  )
}
