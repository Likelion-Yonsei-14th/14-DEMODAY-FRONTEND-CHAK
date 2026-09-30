import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  History,
  LayoutGrid,
  LockKeyhole,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppBar, IconButton } from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import type { Message } from '@/types'
import {
  isToday,
  mergeSupportMessages,
} from './seededMessages'
import './EnvelopeStackPage.css'

const SCROLL_STEP = 112

export function EnvelopeStackPage() {
  const navigate = useNavigate()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const storedMessages = usePrototypeStore((state) => state.messages)
  const readMessageIds = usePrototypeStore((state) => state.readMessageIds)
  const [showHistory, setShowHistory] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [openingId, setOpeningId] = useState<string | null>(null)

  const allMessages = useMemo(
    () => mergeSupportMessages(storedMessages),
    [storedMessages],
  )
  const messages = useMemo(
    () =>
      showHistory
        ? allMessages
        : allMessages.filter((message) => isToday(message.createdAt)),
    [allMessages, showHistory],
  )

  useEffect(() => {
    setActiveIndex(0)
    scrollerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [showHistory])

  const activeMessage = messages[activeIndex]

  const openMessage = (message: Message, index: number) => {
    if (index !== activeIndex) {
      scrollerRef.current?.scrollTo({
        top: index * SCROLL_STEP,
        behavior: 'smooth',
      })
      return
    }

    if (openingId) return
    setOpeningId(message.id)

    window.setTimeout(() => {
      navigate(`/prototype/support/jisu/message/${message.id}`, {
        state: { from: 'cards' },
      })
    }, 720)
  }

  return (
    <AppShell
      surface="base"
      contentClassName="envelope-page-shell"
      appBar={
        <AppBar
          title="도착한 응원"
          subtitle={showHistory ? '지난 응원까지 보고 있어요' : '오늘 도착한 응원'}
          leading={
            <IconButton
              label="지수의 책상으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate('/prototype/support/jisu')}
            />
          }
          trailing={
            <IconButton
              label="책상 보기로 전환"
              icon={<LayoutGrid size={20} aria-hidden />}
              onClick={() => navigate('/prototype/support/jisu')}
            />
          }
        />
      }
    >
      <main className="envelope-page">
        <section className="envelope-page__heading">
          <div>
            <p className="supporter-flow__eyebrow">
              {showHistory ? 'ALL MAIL' : 'TODAY'}
            </p>
            <h2>
              {showHistory
                ? '지수에게 도착했던 응원들'
                : `오늘 ${messages.length}개의 응원이 도착했어요.`}
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
            className="envelope-stack__scroller"
            onScroll={(event) => {
              const next = Math.min(
                messages.length - 1,
                Math.max(
                  0,
                  Math.round(event.currentTarget.scrollTop / SCROLL_STEP),
                ),
              )
              setActiveIndex(next)
            }}
          >
            <div className="envelope-stack__sticky">
              <div className="envelope-stack__deck">
                {messages.map((message, index) => {
                  const delta = index - activeIndex
                  const isRead =
                    message.status === 'read' ||
                    readMessageIds.includes(message.id)
                  const active = delta === 0
                  const position = envelopePosition(index, activeIndex)

                  return (
                    <button
                      type="button"
                      key={message.id}
                      className={[
                        'message-envelope',
                        active ? 'message-envelope--active' : '',
                        openingId === message.id
                          ? 'message-envelope--opening'
                          : '',
                        isRead ? 'message-envelope--read' : '',
                      ].filter(Boolean).join(' ')}
                      style={{
                        '--envelope-color':
                          message.previewColor ?? '#F2E5DA',
                        '--envelope-y': `${position.y}px`,
                        '--envelope-scale': position.scale,
                        '--envelope-opacity': position.opacity,
                        zIndex: position.zIndex,
                      } as React.CSSProperties}
                      onClick={() => openMessage(message, index)}
                      aria-label={`${message.senderName}에게서 온 응원 봉투 열기`}
                    >
                      <span className="message-envelope__body">
                        <span className="message-envelope__flap" />
                        <span className="message-envelope__peek" />
                        <span className="message-envelope__meta">
                          <span className="message-envelope__from">
                            from. {message.senderName}
                          </span>
                          <span className="message-envelope__time">
                            {formatDateTime(message.createdAt)}
                          </span>
                        </span>
                        {message.visibility === 'private' && (
                          <span className="message-envelope__private" aria-label="비공개 응원">
                            <LockKeyhole size={13} aria-hidden />
                          </span>
                        )}
                        {!isRead && (
                          <span
                            className="message-envelope__unread"
                            aria-label="아직 열지 않은 응원"
                          />
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div
              className="envelope-stack__track"
              style={{
                height: `${Math.max(0, messages.length - 1) * SCROLL_STEP + 80}px`,
              }}
              aria-hidden
            />
          </div>
        ) : (
          <div className="envelope-page__empty">
            <span>✉</span>
            <strong>오늘은 아직 도착한 응원이 없어요.</strong>
            <p>지난 응원을 열어보거나 책상에서 기다려볼까요?</p>
          </div>
        )}

        <button
          type="button"
          className="envelope-history-toggle"
          onClick={() => setShowHistory((value) => !value)}
        >
          <History size={15} aria-hidden />
          {showHistory ? '오늘 온 응원만 보기' : '지난 응원도 보기'}
        </button>
      </main>
    </AppShell>
  )
}

function envelopePosition(index: number, activeIndex: number) {
  const delta = index - activeIndex

  if (delta < 0) {
    return {
      y: 18 + index * 24,
      scale: Math.max(0.88, 0.91 + index * 0.012),
      opacity: 1,
      zIndex: 20 + index,
    }
  }

  if (delta === 0) {
    return { y: 108, scale: 1, opacity: 1, zIndex: 100 }
  }

  const distance = Math.min(delta, 4)
  return {
    y: 134 + distance * 24,
    scale: Math.max(0.86, 0.97 - distance * 0.025),
    opacity: delta > 4 ? 0 : 1,
    zIndex: 90 - distance,
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
