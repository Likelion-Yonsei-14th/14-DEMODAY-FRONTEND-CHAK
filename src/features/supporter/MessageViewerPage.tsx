import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
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

  const messages = useMemo(
    () => mergeSupportMessages(storedMessages),
    [storedMessages],
  )
  const message = messages.find((item) => item.id === messageId)
  const state = location.state as ReaderLocationState | null
  const pages = message ? getMessagePages(message) : []

  useEffect(() => {
    if (messageId) markMessageRead(messageId)
  }, [markMessageRead, messageId])

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
            <strong>
              {activePageIndex + 1} / {pages.length}
            </strong>
          )}
        </div>

        <div
          ref={pageScrollerRef}
          className="message-viewer__pages"
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
          {pages.map((page) => (
            <div
              key={page.id}
              className="message-viewer__page-slide"
            >
              <OriginalMessageRenderer
                message={message}
                page={page}
              />
            </div>
          ))}
        </div>

        {pages.length > 1 && (
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
                aria-selected={activePageIndex === index}
                role="tab"
                onClick={() => {
                  const scroller = pageScrollerRef.current
                  if (!scroller) return
                  scroller.scrollTo({
                    left: index * scroller.clientWidth,
                    behavior: 'smooth',
                  })
                }}
              />
            ))}
          </div>
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
