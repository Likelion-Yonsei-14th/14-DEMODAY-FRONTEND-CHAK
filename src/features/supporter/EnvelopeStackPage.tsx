import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  History,
  LockKeyhole,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AppBar, IconButton, useFeedback } from '@/design-system'
import { getComposerBackground } from '@/features/composer/backgroundAssets'
import { getMessagePages } from '@/features/composer/messagePages'
import { AppShell } from '@/layout/AppShell'
import { OwnerViewToggle } from '@/features/owner/OwnerViewToggle'
import { usePrototypeStore } from '@/store/prototypeStore'
import {
  formatUnlockAt,
  getMessageAvailability,
  isSameCalendarDate,
  resolvePreviewReadMode,
} from '@/features/desk/dailyAvailability'
import { useReadModeNow } from '@/features/desk/useReadModeNow'
import type { Message } from '@/types'
import { isStickerMessage } from './deskStickers'
import { createEnvelopeTheme } from './envelopeTheme'
import { mergeSupportMessages } from './seededMessages'
import './EnvelopeStackPage.css'

const SCROLL_STEP = 130
const OPEN_DURATION = 1120

export function EnvelopeStackPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useFeedback()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const settleTimeoutRef = useRef<number | null>(null)
  const currentDesk = usePrototypeStore((state) => state.currentDesk)
  const ownerSettings = usePrototypeStore((state) => state.ownerSettings)
  const storedMessages = usePrototypeStore((state) => state.messages)
  const readMessageIds = usePrototypeStore((state) => state.readMessageIds)
  // Basket messages reopen only from the basket, one ad per view.
  const basketMessageIds = usePrototypeStore(
    (state) => state.basketMessageIds,
  )
  const [showHistory, setShowHistory] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [openingId, setOpeningId] = useState<string | null>(null)

  const allMessages = useMemo(
    () =>
      mergeSupportMessages(storedMessages).filter(
        (message) =>
          // Stickers have no card to open, so they stay on the desk only.
          !isStickerMessage(message) &&
          !basketMessageIds.includes(message.id) &&
          !ownerSettings.blockedSupporters.includes(
            message.senderName,
          ),
      ),
    [basketMessageIds, ownerSettings.blockedSupporters, storedMessages],
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
        allMessages.map((message) => [
          message.id,
          getMessageAvailability(
            readMode,
            message.createdAt,
            now,
          ),
        ]),
      ),
    [allMessages, now, readMode],
  )
  const messages = useMemo(
    () => {
      if (readMode.type === 'time-capsule') {
        return allMessages
      }

      return showHistory
        ? allMessages
        : allMessages.filter((message) => {
            const unlockAt =
              availabilityById.get(message.id)?.unlockAt

            return Boolean(
              unlockAt && isSameCalendarDate(unlockAt, now),
            )
          })
    },
    [
      allMessages,
      availabilityById,
      now,
      readMode.type,
      showHistory,
    ],
  )

  useEffect(() => {
    if (settleTimeoutRef.current !== null) {
      window.clearTimeout(settleTimeoutRef.current)
    }
    setActiveIndex(0)
    scrollerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [readMode.type, showHistory])

  useEffect(
    () => () => {
      if (settleTimeoutRef.current !== null) {
        window.clearTimeout(settleTimeoutRef.current)
      }
    },
    [],
  )

  const activeMessage = messages[activeIndex]

  const openMessage = (message: Message, index: number) => {
    if (openingId) return

    if (index !== activeIndex) {
      scrollerRef.current?.scrollTo({
        top: index * SCROLL_STEP,
        behavior: 'smooth',
      })
      return
    }

    const availability = availabilityById.get(message.id)
    if (availability && !availability.available) {
      if (availability.unlockAt) {
        showToast(
          `${formatUnlockAt(availability.unlockAt, now)}에 열 수 있어요.`,
        )
      }
      return
    }

    setOpeningId(message.id)

    window.setTimeout(() => {
      navigate(
        `/prototype/my/message/${message.id}${location.search}`,
        {
          state: { from: 'owner-cards', openedFromEnvelope: true },
        },
      )
    }, OPEN_DURATION)
  }

  return (
    <AppShell
      surface="base"
      contentClassName="envelope-page-shell"
      appBar={
        <AppBar
          title="내 응원"
          subtitle={
            readMode.type === 'time-capsule'
              ? '모아둔 응원'
              : showHistory
                ? '지난 응원까지 보고 있어요'
                : '오늘의 응원'
          }
          leading={
            <IconButton
              label="내 책상으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate(`/prototype/my/desk${location.search}`)}
            />
          }

        />
      }
    >
      <main className="envelope-page">
        <section className="envelope-page__toolbar">
          <OwnerViewToggle mode="mail" />
        </section>
        <section className="envelope-page__heading">
          <div>
            <h2>
              {readMode.type === 'time-capsule'
                ? `모아둔 응원 ${messages.length}개`
                : showHistory
                  ? '내게 도착했던 응원들'
                  : `오늘의 응원 ${messages.length}개`}
            </h2>
          </div>
          {activeMessage && (
            <span className="envelope-page__position">
              {activeIndex + 1} / {messages.length}
            </span>
          )}
        </section>

        {messages.length > 0 ? (
          <div
            ref={scrollerRef}
            className={[
              'envelope-stack__scroller',
              openingId ? 'envelope-stack__scroller--opening' : '',
            ].filter(Boolean).join(' ')}
            onScroll={(event) => {
              if (openingId) return

              const scroller = event.currentTarget
              const next = Math.min(
                messages.length - 1,
                Math.max(
                  0,
                  Math.round(scroller.scrollTop / SCROLL_STEP),
                ),
              )
              setActiveIndex(next)

              // There is no native scroll-snap here (see the CSS for why),
              // so settle the raw scroll position onto the card it
              // resolved to once the gesture stops, instead of leaving it
              // wherever a fling happened to land.
              if (settleTimeoutRef.current !== null) {
                window.clearTimeout(settleTimeoutRef.current)
              }
              settleTimeoutRef.current = window.setTimeout(() => {
                scroller.scrollTo({
                  top: next * SCROLL_STEP,
                  behavior: 'smooth',
                })
              }, 120)
            }}
          >
            <div className="envelope-stack__sticky">
              <div
                className={[
                  'envelope-stack__deck',
                  openingId ? 'envelope-stack__deck--opening' : '',
                ].filter(Boolean).join(' ')}
              >
                {messages.map((message, index) => {
                  const delta = index - activeIndex
                  const isRead =
                    message.status === 'read' ||
                    readMessageIds.includes(message.id)
                  const availability = availabilityById.get(message.id)
                  const locked = Boolean(
                    availability && !availability.available,
                  )
                  const active = delta === 0
                  const isOpening = openingId === message.id
                  const position = envelopePosition(index, activeIndex)
                  const theme = createEnvelopeTheme(
                    message.id,
                    message.previewColor,
                  )
                  const pages = getMessagePages(message)
                  const firstPage = pages[0]!
                  const cardBackground = getComposerBackground(
                    firstPage.backgroundAssetId,
                  )
                  const backgroundPhoto = firstPage.photoElements.find(
                    (photo) => photo.role === 'background',
                  )
                  const floatingPhoto = firstPage.photoElements.find(
                    (photo) => photo.role === 'floating',
                  )

                  return (
                    <button
                      type="button"
                      key={message.id}
                      className={[
                        'message-envelope',
                        active ? 'message-envelope--active' : '',
                        isOpening ? 'message-envelope--opening' : '',
                        openingId && !isOpening
                          ? 'message-envelope--deemphasized'
                          : '',
                        isRead ? 'message-envelope--read' : '',
                        locked ? 'message-envelope--locked' : '',
                        `message-envelope--pattern-${theme.pattern}`,
                      ].filter(Boolean).join(' ')}
                      style={{
                        '--envelope-color': theme.baseColor,
                        '--envelope-flap-color': theme.flapColor,
                        '--envelope-pocket-color': theme.pocketColor,
                        '--envelope-side-color': theme.sideColor,
                        '--envelope-pattern-color': theme.patternColor,
                        '--envelope-ink-color': theme.inkColor,
                        '--message-card-color': cardBackground.tone,
                        '--envelope-y': `${position.y}px`,
                        '--envelope-x': `${position.x}px`,
                        '--envelope-rotate': `${position.rotate}deg`,
                        '--envelope-scale': position.scale,
                        '--envelope-opacity': position.opacity,
                        zIndex: position.zIndex,
                      } as React.CSSProperties}
                      onClick={() => openMessage(message, index)}
                      aria-label={
                        locked
                          ? `아직 열리지 않은 ${message.senderName}님의 응원 봉투`
                          : `${message.senderName}에게서 온 응원 봉투 열기`
                      }
                    >
                      <span className="message-envelope__shadow" />
                      <span className="message-envelope__body">
                        <span className="message-envelope__back" />
                        <span
                          className="message-envelope__pattern"
                          aria-hidden
                        />

                        <span
                          className="message-envelope__peek"
                          aria-hidden
                        >
                          {backgroundPhoto ? (
                            <img
                              className="message-envelope__peek-art message-envelope__peek-art--photo"
                              src={backgroundPhoto.src}
                              alt=""
                              draggable={false}
                              style={{
                                objectPosition:
                                  `${backgroundPhoto.x ?? 50}% ${backgroundPhoto.y ?? 50}%`,
                                transform:
                                  `scale(${backgroundPhoto.scale ?? 1})`,
                              }}
                            />
                          ) : cardBackground.kind === 'image' &&
                            cardBackground.source ? (
                            <img
                              className="message-envelope__peek-art"
                              src={cardBackground.source}
                              alt=""
                              draggable={false}
                            />
                          ) : null}
                          {floatingPhoto && (
                            <span
                              className={[
                                'message-envelope__peek-floating',
                                `message-envelope__peek-floating--${floatingPhoto.frame ?? 'white'}`,
                              ].join(' ')}
                              style={{
                                aspectRatio:
                                  (floatingPhoto.frame ?? 'white') === 'polaroid'
                                    ? '4 / 3.8'
                                    : String(floatingPhoto.aspectRatio ?? 4 / 3),
                                transform:
                                  `rotate(${floatingPhoto.rotation ?? -3}deg)`,
                              }}
                            >
                              <img
                                src={floatingPhoto.src}
                                alt=""
                                draggable={false}
                                style={{
                                  objectFit:
                                    floatingPhoto.hasTransparency ||
                                    (floatingPhoto.frame ?? 'white') === 'plain'
                                      ? 'contain'
                                      : 'cover',
                                }}
                              />
                            </span>
                          )}
                          <span className="message-envelope__peek-surface">
                            <span className="message-envelope__peek-line" />
                            <span className="message-envelope__peek-line" />
                          </span>
                          {pages.length > 1 && (
                            <span className="message-envelope__peek-pages">
                              {pages.length}장
                            </span>
                          )}
                        </span>

                        <span className="message-envelope__side-fold message-envelope__side-fold--left" />
                        <span className="message-envelope__side-fold message-envelope__side-fold--right" />
                        <span className="message-envelope__front" />
                        <span className="message-envelope__flap">
                          <span className="message-envelope__flap-inner" />
                        </span>

                        <span className="message-envelope__meta">
                          <span className="message-envelope__from">
                            보낸 이 · {message.senderName}
                          </span>
                          <span className="message-envelope__time">
                            {formatDateTime(message.createdAt)}
                          </span>
                        </span>

                        {!isRead && !locked && (
                          <span
                            className="message-envelope__new"
                            aria-label="아직 열지 않은 응원"
                          >
                            새 응원
                          </span>
                        )}

                        {locked && (
                          <span
                            className="message-envelope__locked"
                            aria-label={
                              availability?.unlockAt
                                ? `${formatUnlockAt(availability.unlockAt, now)}에 열려요`
                                : '아직 열 수 없는 응원'
                            }
                          >
                            <LockKeyhole size={11} aria-hidden />
                            {availability?.unlockAt
                              ? `${formatUnlockAt(availability.unlockAt, now)}에 열려요`
                              : '아직 잠김'}
                          </span>
                        )}

                        {message.visibility === 'private' && (
                          <span
                            className="message-envelope__private"
                            aria-label="나만 보는 응원"
                          >
                            <LockKeyhole size={13} aria-hidden />
                          </span>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="envelope-stack__track" aria-hidden>
              {messages.map((message) => (
                <span
                  className="envelope-stack__snap"
                  key={message.id}
                  style={{ height: `${SCROLL_STEP}px` }}
                />
              ))}
              <span className="envelope-stack__track-tail" />
            </div>
          </div>
        ) : (
          <div className="envelope-page__empty">
            <span>✉</span>
            <strong>오늘은 아직 도착한 응원이 없어요.</strong>
            <p>지난 응원을 열어보거나 책상에서 기다려볼까요?</p>
          </div>
        )}

        {readMode.type === 'daily' && (
          <button
            type="button"
            className="envelope-history-toggle"
            disabled={Boolean(openingId)}
            onClick={() => setShowHistory((value) => !value)}
          >
            <History size={15} aria-hidden />
            {showHistory ? '오늘의 응원만 보기' : '지난 응원도 보기'}
          </button>
        )}
      </main>
    </AppShell>
  )
}

function envelopePosition(index: number, activeIndex: number) {
  const delta = index - activeIndex

  if (delta < 0) {
    const distance = Math.min(Math.abs(delta), 5)

    return {
      y: 38 + (index % 5) * 24,
      x: ((index % 3) - 1) * 2.4,
      rotate: ((index % 3) - 1) * 0.75,
      scale: Math.max(0.84, 0.95 - distance * 0.02),
      opacity: distance > 5 ? 0 : 1,
      zIndex: 32 + index,
    }
  }

  if (delta === 0) {
    return {
      y: 126,
      x: 0,
      rotate: 0,
      scale: 1,
      opacity: 1,
      zIndex: 130,
    }
  }

  const distance = Math.min(delta, 5)

  return {
    y: 156 + distance * 27,
    x: ((index % 3) - 1) * 2.8,
    rotate: ((index % 3) - 1) * 0.7,
    scale: Math.max(0.84, 0.98 - distance * 0.025),
    opacity: delta > 5 ? 0 : 1,
    zIndex: 118 - distance,
  }
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}
