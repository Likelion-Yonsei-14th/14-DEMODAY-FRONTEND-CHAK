import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { AppBar, Button, IconButton } from '@/design-system'
import { getMessagePages } from '@/features/composer/messagePages'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import { OriginalMessageRenderer } from './OriginalMessageRenderer'
import { mergeSupportMessages } from './seededMessages'
import './MessageViewerPage.css'

type ReaderLocationState = {
  from?: 'owner-desk' | 'owner-cards' | 'desk' | 'cards'
}

export function MessageViewerPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { messageId } = useParams()
  const storedMessages = usePrototypeStore((state) => state.messages)
  const markMessageRead = usePrototypeStore((state) => state.markMessageRead)
  const pageScrollerRef = useRef<HTMLDivElement>(null)
  const [activePageIndex, setActivePageIndex] = useState(0)
  const [hasPaged, setHasPaged] = useState(false)

  const messages = useMemo(
    () => mergeSupportMessages(storedMessages),
    [storedMessages],
  )
  const message = messages.find((item) => item.id === messageId)
  const state = location.state as ReaderLocationState | null
  const pages = message ? getMessagePages(message) : []
  const lastPageIndex = Math.max(0, pages.length - 1)

  useEffect(() => {
    if (messageId) markMessageRead(messageId)
  }, [markMessageRead, messageId])

  useEffect(() => {
    setActivePageIndex(0)
    setHasPaged(false)

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
      setHasPaged((current) => current || nextIndex > 0)
    },
    [pages.length],
  )

  const back = () => {
    navigate(
      state?.from === 'owner-desk' || state?.from === 'desk'
        ? '/prototype/my/desk'
        : '/prototype/my/desk/cards',
    )
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

  const canGoPrevious = activePageIndex > 0
  const canGoNext = activePageIndex < lastPageIndex
  const pageHint =
    activePageIndex === lastPageIndex
      ? '마지막 카드예요.'
      : activePageIndex === 0 && !hasPaged
        ? '옆으로 넘기거나 화살표로 다음 카드를 볼 수 있어요.'
        : '다음 카드가 이어져 있어요.'

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
              label="응원 목록으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={back}
            />
          }
          trailing={
            <IconButton
              label="응원 더보기"
              icon={<MoreHorizontal size={21} aria-hidden />}
              onClick={() => undefined}
            />
          }
        />
      }
    >
      <main className="message-viewer">
        <section className="message-viewer__meta">
          <span>from. {message.senderName}</span>
          <span>
            {message.visibility === 'private' ? '나만 보는 응원' : '함께 보는 응원'}
          </span>
        </section>

        <div className="message-viewer__page-meta">
          <span>친구가 꾸민 모습 그대로</span>
          {pages.length > 1 && (
            <strong aria-live="polite" aria-atomic="true">
              {activePageIndex + 1} / {pages.length}
            </strong>
          )}
        </div>

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
            if (nextIndex > 0) setHasPaged(true)
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

            <p
              className={[
                'message-viewer__page-hint',
                activePageIndex === lastPageIndex
                  ? 'message-viewer__page-hint--complete'
                  : '',
              ].filter(Boolean).join(' ')}
              aria-live="polite"
            >
              {pageHint}
            </p>
          </>
        )}
      </main>
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
