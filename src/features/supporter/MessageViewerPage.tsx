import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
  MessageCircleReply,
  MoreHorizontal,
} from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  AppBar,
  BottomSheet,
  Button,
  IconButton,
  useFeedback,
} from '@/design-system'
import { getMessagePages } from '@/features/composer/messagePages'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import {
  formatUnlockAt,
  resolvePreviewReadMode,
} from '@/features/desk/dailyAvailability'
import { useReadModeNow } from '@/features/desk/useReadModeNow'
import { OriginalMessageRenderer } from './OriginalMessageRenderer'
import { mergeSupportMessages } from './seededMessages'
import {
  getDeskSticker,
  getSupportMessageAvailability,
} from './deskStickers'
import './MessageViewerPage.css'

type ReaderLocationState = {
  from?:
    | 'owner-desk'
    | 'owner-cards'
    | 'desk'
    | 'cards'
    | 'support-desk'
    | 'classroom-locker'
  lockerId?: string
}

export function MessageViewerPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useFeedback()
  const { messageId, classroomId, lockerId } = useParams()
  const currentDesk = usePrototypeStore((state) => state.currentDesk)
  const classroom = usePrototypeStore((state) => state.classroom)
  const classroomMember = usePrototypeStore(
    (state) => state.classroomMember,
  )
  const storedMessages = usePrototypeStore((state) => state.messages)
  const messageReplies = usePrototypeStore((state) => state.messageReplies)
  const messageReactions = usePrototypeStore(
    (state) => state.messageReactions,
  )
  const reactToMessage = usePrototypeStore(
    (state) => state.reactToMessage,
  )
  const hidePublicMessage = usePrototypeStore(
    (state) => state.hidePublicMessage,
  )
  const blockPublicSupporter = usePrototypeStore(
    (state) => state.blockPublicSupporter,
  )
  const reportMessage = usePrototypeStore(
    (state) => state.reportMessage,
  )
  const markMessageRead = usePrototypeStore((state) => state.markMessageRead)
  const pageScrollerRef = useRef<HTMLDivElement>(null)
  const [activePageIndex, setActivePageIndex] = useState(0)
  const [replyOptionsOpen, setReplyOptionsOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  const messages = useMemo(
    () => mergeSupportMessages(storedMessages),
    [storedMessages],
  )
  const message = messages.find((item) => item.id === messageId)
  const state = location.state as ReaderLocationState | null
  const supporterView =
    state?.from === 'support-desk' ||
    location.pathname.startsWith('/prototype/support/')
  const classroomLocker = classroom.lockers.find(
    (locker) => locker.id === lockerId,
  )
  const classroomView = Boolean(
    classroomLocker &&
      location.pathname.startsWith('/prototype/classroom/'),
  )
  const classroomOwner = Boolean(
    classroomView &&
      classroomMember?.lockerId === classroomLocker?.id,
  )
  const readMode = useMemo(
    () =>
      classroomView
        ? {
            type: 'daily' as const,
            unlockTime: classroom.dailyUnlockTime,
          }
        : resolvePreviewReadMode(
            currentDesk.readMode,
            location.search,
          ),
    [
      classroom.dailyUnlockTime,
      classroomView,
      currentDesk.readMode,
      location.search,
    ],
  )
  const now = useReadModeNow(
    readMode,
    location.search,
  )
  const availability = message
    ? getSupportMessageAvailability(
        readMode,
        message,
        now,
      )
    : null
  const pages = message ? getMessagePages(message) : []
  const lastPageIndex = Math.max(0, pages.length - 1)
  const ownerCanRespond =
    !supporterView &&
    (!classroomView || classroomOwner) &&
    Boolean(availability?.available)
  const publicVisitor =
    (supporterView || (classroomView && !classroomOwner)) &&
    message?.visibility === 'public'
  const existingReply = messageId
    ? messageReplies.find((reply) =>
        reply.targetMessageIds.includes(messageId),
      )
    : undefined
  const selectedReaction = messageId
    ? messageReactions[messageId]
    : undefined

  useEffect(() => {
    const reachedReadPoint =
      pages.length <= 1 ||
      activePageIndex === lastPageIndex

    if (
      !supporterView &&
      (!classroomView || classroomOwner) &&
      messageId &&
      availability?.available &&
      reachedReadPoint
    ) {
      markMessageRead(messageId)
    }
  }, [
    activePageIndex,
    availability?.available,
    lastPageIndex,
    markMessageRead,
    messageId,
    pages.length,
    supporterView,
    classroomOwner,
    classroomView,
  ])

  useEffect(() => {
    setActivePageIndex(0)

    const scroller = pageScrollerRef.current
    if (!scroller) return

    scroller.scrollTo({
      left: 0,
      behavior: 'auto',
    })
  }, [messageId])

  useEffect(() => {
    const scroller = pageScrollerRef.current
    if (
      !scroller ||
      pages.length <= 1 ||
      typeof ResizeObserver === 'undefined'
    ) {
      return
    }

    const keepActivePageAligned = () => {
      scroller.scrollTo({
        left: activePageIndex * scroller.clientWidth,
        behavior: 'auto',
      })
    }

    const observer = new ResizeObserver(keepActivePageAligned)
    observer.observe(scroller)

    return () => observer.disconnect()
  }, [activePageIndex, pages.length])

  const scrollToPage = useCallback(
    (
      index: number,
      behavior: ScrollBehavior = getPreferredScrollBehavior(),
    ) => {
      const scroller = pageScrollerRef.current
      if (!scroller || pages.length === 0) return

      const nextIndex = Math.min(
        pages.length - 1,
        Math.max(0, index),
      )

      scroller.scrollTo({
        left: nextIndex * scroller.clientWidth,
        behavior,
      })
      setActivePageIndex(nextIndex)
    },
    [pages.length],
  )

  const back = () => {
    if (classroomView && classroomLocker) {
      navigate(
        `/prototype/classroom/${classroomId ?? classroom.id}/locker/${classroomLocker.id}`,
      )
      return
    }

    if (supporterView) {
      navigate('/prototype/support/jisu')
      return
    }

    const path =
      state?.from === 'owner-desk' || state?.from === 'desk'
        ? '/prototype/my/desk'
        : '/prototype/my/desk/cards'

    navigate(`${path}${location.search}`)
  }

  if (!message) {
    return (
      <AppShell
        surface="base"
        contentClassName="message-viewer-shell"
        appBar={
          <AppBar
            title="응원 열기"
            leading={
              <IconButton
                label="돌아가기"
                icon={<ArrowLeft size={21} aria-hidden />}
                onClick={back}
              />
            }
          />
        }
      >
        <div className="message-viewer__missing">
          <strong>이 응원을 찾지 못했어요.</strong>
          <Button variant="secondary" onClick={back}>
            돌아가기
          </Button>
        </div>
      </AppShell>
    )
  }

  if (
    classroomView &&
    !classroomOwner &&
    message?.visibility === 'private'
  ) {
    return (
      <AppShell
        surface="base"
        contentClassName="message-viewer-shell"
        appBar={
          <AppBar
            title="응원 보기"
            leading={
              <IconButton
                label="사물함으로 돌아가기"
                icon={<ArrowLeft size={21} aria-hidden />}
                onClick={back}
              />
            }
          />
        }
      >
        <main className="message-viewer__locked">
          <span className="message-viewer__locked-icon" aria-hidden>
            <LockKeyhole size={23} />
          </span>
          <h2>
            {classroomLocker?.studentName ?? '사물함 주인'}님만 볼 수 있는 응원이에요.
          </h2>
          <Button variant="secondary" onClick={back}>
            사물함으로 돌아가기
          </Button>
        </main>
      </AppShell>
    )
  }

  if (supporterView && message?.visibility === 'private') {
    return (
      <AppShell
        surface="base"
        contentClassName="message-viewer-shell"
        appBar={
          <AppBar
            title="응원 보기"
            leading={
              <IconButton
                label="책상으로 돌아가기"
                icon={<ArrowLeft size={21} aria-hidden />}
                onClick={back}
              />
            }
          />
        }
      >
        <main className="message-viewer__locked">
          <span className="message-viewer__locked-icon" aria-hidden>
            <LockKeyhole size={23} />
          </span>
          <h2>{currentDesk?.displayName ?? '책상 주인'}님만 볼 수 있는 응원이에요.</h2>
          <Button variant="secondary" onClick={back}>
            책상으로 돌아가기
          </Button>
        </main>
      </AppShell>
    )
  }

  if (
    !supporterView &&
    (!classroomView || classroomOwner) &&
    availability &&
    !availability.available
  ) {
    const unlockLabel = availability.unlockAt
      ? formatUnlockAt(availability.unlockAt, now)
      : null

    return (
      <AppShell
        surface="base"
        contentClassName="message-viewer-shell"
        appBar={
          <AppBar
            title="응원 열기"
            leading={
              <IconButton
                label="내 책상으로 돌아가기"
                icon={<ArrowLeft size={21} aria-hidden />}
                onClick={back}
              />
            }
          />
        }
      >
        <main className="message-viewer__locked">
          <span className="message-viewer__locked-icon" aria-hidden>
            <LockKeyhole size={23} />
          </span>
          <h2>
            {unlockLabel
              ? `${unlockLabel}에 열 수 있어요.`
              : '아직 열리지 않은 응원이에요.'}
          </h2>
          <Button variant="secondary" onClick={back}>
            내 책상으로 돌아가기
          </Button>
        </main>
      </AppShell>
    )
  }

  if (message.kind === 'sticker') {
    const sticker = getDeskSticker(message.stickerId)
    const givenAt = new Intl.DateTimeFormat('ko-KR', {
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(message.createdAt))

    return (
      <AppShell
        surface="base"
        contentClassName="message-viewer-shell"
        appBar={
          <AppBar
            title="받은 스티커"
            leading={
              <IconButton
                label="내 책상으로 돌아가기"
                icon={<ArrowLeft size={21} aria-hidden />}
                onClick={back}
              />
            }
          />
        }
      >
        <main className="message-viewer__sticker">
          <img
            className="message-viewer__sticker-image"
            src={sticker.source}
            alt={sticker.name}
          />
          <h2>
            {message.senderName}님이
            <br />
            {givenAt}에 붙인 스티커예요.
          </h2>
          <Button variant="secondary" onClick={back}>
            내 책상으로 돌아가기
          </Button>
        </main>
      </AppShell>
    )
  }

  const canGoPrevious = activePageIndex > 0
  const canGoNext = activePageIndex < lastPageIndex

  return (
    <AppShell
      surface="base"
      contentClassName="message-viewer-shell"
      appBar={
        <AppBar
          title={`${message.senderName}의 응원`}
          subtitle={formatReaderDate(message.createdAt)}
          leading={
            <IconButton
              label={
                classroomView
                  ? '사물함으로 돌아가기'
                  : supporterView
                    ? '책상으로 돌아가기'
                    : state?.from === 'owner-desk' || state?.from === 'desk'
                    ? '내 책상으로 돌아가기'
                    : '응원 목록으로 돌아가기'
              }
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={back}
            />
          }
          trailing={
            publicVisitor ? (
              <IconButton
                label="응원 옵션"
                icon={<MoreHorizontal size={21} aria-hidden />}
                onClick={() => setMoreOpen(true)}
              />
            ) : undefined
          }
        />
      }
    >
      <main className="message-viewer">
        <div
          ref={pageScrollerRef}
          className="message-viewer__pages"
          role="region"
          aria-roledescription="carousel"
          aria-label={`${message.senderName}의 응원 카드 ${pages.length}장`}
          tabIndex={pages.length > 1 ? 0 : -1}
          onKeyDown={(event) => {
            if (pages.length <= 1) return

            if (event.key === 'ArrowRight') {
              event.preventDefault()
              scrollToPage(activePageIndex + 1)
            }

            if (event.key === 'ArrowLeft') {
              event.preventDefault()
              scrollToPage(activePageIndex - 1)
            }

            if (event.key === 'Home') {
              event.preventDefault()
              scrollToPage(0)
            }

            if (event.key === 'End') {
              event.preventDefault()
              scrollToPage(lastPageIndex)
            }
          }}
          onScroll={(event) => {
            const width = event.currentTarget.clientWidth
            if (width <= 0) return

            const nextIndex = Math.min(
              pages.length - 1,
              Math.max(
                0,
                Math.round(event.currentTarget.scrollLeft / width),
              ),
            )

            setActivePageIndex(nextIndex)
          }}
        >
          {pages.map((page, index) => (
            <div
              id={`message-viewer-page-${index}`}
              key={page.id}
              className="message-viewer__page-slide"
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} / ${pages.length} 카드`}
            >
              <OriginalMessageRenderer
                message={message}
                page={page}
              />
            </div>
          ))}
        </div>

        {pages.length > 1 && (
          <>
            <nav
              className="message-viewer__page-navigation"
              aria-label="응원 카드 페이지 이동"
            >
              <button
                type="button"
                className="message-viewer__page-nav-button"
                aria-label="이전 카드"
                disabled={!canGoPrevious}
                onClick={() => scrollToPage(activePageIndex - 1)}
              >
                <ChevronLeft size={18} aria-hidden />
              </button>

              <div
                className="message-viewer__page-dots"
                role="tablist"
                aria-label="응원 카드 페이지"
              >
                {pages.map((page, index) => (
                  <button
                    type="button"
                    key={page.id}
                    className={[
                      'message-viewer__page-dot',
                      activePageIndex === index
                        ? 'message-viewer__page-dot--active'
                        : '',
                    ].filter(Boolean).join(' ')}
                    aria-label={`${index + 1}번째 카드 보기`}
                    aria-controls={`message-viewer-page-${index}`}
                    aria-selected={activePageIndex === index}
                    role="tab"
                    tabIndex={activePageIndex === index ? 0 : -1}
                    onClick={() => scrollToPage(index)}
                  />
                ))}
              </div>

              <button
                type="button"
                className="message-viewer__page-nav-button"
                aria-label="다음 카드"
                disabled={!canGoNext}
                onClick={() => scrollToPage(activePageIndex + 1)}
              >
                <ChevronRight size={18} aria-hidden />
              </button>
            </nav>
          </>
        )}

        {activePageIndex === lastPageIndex &&
          (ownerCanRespond || publicVisitor) && (
            <section className="message-viewer__responses">
              <div
                className="message-viewer__reactions"
                aria-label="응원에 반응 남기기"
              >
                {[
                  ['heart', '❤️', '좋아요'],
                  ['teary', '🥹', '뭉클해요'],
                  ['clap', '👏', '박수쳐요'],
                ].map(([reaction, emoji, label]) => (
                  <button
                    type="button"
                    key={reaction}
                    className={[
                      'message-viewer__reaction',
                      selectedReaction === reaction
                        ? 'message-viewer__reaction--selected'
                        : '',
                    ].filter(Boolean).join(' ')}
                    aria-label={label}
                    aria-pressed={selectedReaction === reaction}
                    onClick={() =>
                      messageId &&
                      reactToMessage(
                        messageId,
                        reaction as 'heart' | 'teary' | 'clap',
                      )
                    }
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {ownerCanRespond && (
                existingReply ? (
                  <p className="message-viewer__reply-sent">
                    답장을 보냈어요.
                  </p>
                ) : (
                  <Button
                    variant="secondary"
                    fullWidth
                    leadingIcon={
                      <MessageCircleReply size={17} aria-hidden />
                    }
                    onClick={() => setReplyOptionsOpen(true)}
                  >
                    답장 보내기
                  </Button>
                )
              )}
            </section>
          )}
      </main>

      <BottomSheet
        open={replyOptionsOpen}
        onClose={() => setReplyOptionsOpen(false)}
        title="어떻게 답장할까요?"
      >
        <div className="message-viewer__reply-options">
          <button
            type="button"
            onClick={() => {
              setReplyOptionsOpen(false)
              navigate(
                classroomView
                  ? `/prototype/classroom/${classroomId}/locker/${lockerId}/message/${message.id}/reply?scope=single`
                  : `/prototype/my/message/${message.id}/reply?scope=single`,
              )
            }}
          >
            <strong>이 응원에 답장</strong>
            <span>{message.senderName}님에게만 보내요.</span>
          </button>

          {readMode.type === 'daily' && (
            <button
              type="button"
              onClick={() => {
                setReplyOptionsOpen(false)
                navigate(
                  classroomView
                    ? `/prototype/classroom/${classroomId}/locker/${lockerId}/message/${message.id}/reply?scope=daily`
                    : `/prototype/my/message/${message.id}/reply?scope=daily`,
                )
              }}
            >
              <strong>오늘의 응원에 한 번에 답장</strong>
              <span>오늘 응원해준 친구들에게 같은 답장을 보내요.</span>
            </button>
          )}
        </div>
      </BottomSheet>

      <BottomSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title="응원 옵션"
      >
        <div className="message-viewer__more-options">
          <button
            type="button"
            onClick={() => {
              hidePublicMessage(message.id)
              setMoreOpen(false)
              showToast('이 응원을 숨겼어요.')
              back()
            }}
          >
            이 응원 숨기기
          </button>
          <button
            type="button"
            onClick={() => {
              reportMessage(message.id)
              setMoreOpen(false)
              showToast('신고를 접수했어요.')
              back()
            }}
          >
            신고하기
          </button>
          <button
            type="button"
            onClick={() => {
              blockPublicSupporter(message.senderName)
              setMoreOpen(false)
              showToast(`${message.senderName}님의 응원을 숨겼어요.`)
              back()
            }}
          >
            {message.senderName}님 숨기기
          </button>
        </div>
      </BottomSheet>
    </AppShell>
  )
}

function formatReaderDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function getPreferredScrollBehavior(): ScrollBehavior {
  if (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return 'auto'
  }

  return 'smooth'
}
