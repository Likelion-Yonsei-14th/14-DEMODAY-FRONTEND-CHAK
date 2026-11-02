import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ChevronRight, Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppBar, Button, IconButton } from '@/design-system'
import { useFeedback } from '@/design-system/overlays'
import { fetchRepliesToMe, fetchSentMessages } from '@/api/community'
import { isApiEnabled } from '@/api/config'
import { cardPreviewText, replyFromApi } from '@/api/mappers'
import type { ApiSentMessage } from '@/api/types'
import { AppShell } from '@/layout/AppShell'
import { DEFAULT_SUPPORTER_TOKEN, supporterPath } from '@/prototype/supporterRoute'
import { usePrototypeStore } from '@/store/prototypeStore'
import type { MessageReply } from '@/types'
import './MyLettersPage.css'

const PAGE_SIZE = 10

/** Replies already shown on this page, kept per browser since the server doesn't track it. */
const SEEN_REPLIES_KEY = 'chak:my-letters:seen-replies'

function loadSeenReplies(): Set<string> {
  try {
    const raw = window.localStorage.getItem(SEEN_REPLIES_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function saveSeenReplies(ids: Set<string>) {
  try {
    window.localStorage.setItem(SEEN_REPLIES_KEY, JSON.stringify([...ids]))
  } catch {
    // Without storage every reply just shows as new again next time.
  }
}

/** One letter I left, on whichever desk it went to. */
type LetterItem = {
  id: string
  isSticker: boolean
  isPublic: boolean
  read: boolean
  text: string
  createdAt: string
  deskName: string | null
  /** Link to the desk it was left on; null once that desk is gone. */
  supporterToken: string | null
}

const fromServer = (message: ApiSentMessage): LetterItem => ({
  id: String(message.messageId),
  isSticker: message.kind === 'STICKER',
  isPublic: message.visibility === 'PUBLIC',
  read: message.status === 'READ',
  text: cardPreviewText(message.card),
  createdAt: message.createdAt,
  deskName: message.deskName,
  supporterToken: message.supporterToken,
})

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' }).format(new Date(iso))

/** Every letter I sent and every reply to them, across all desks, from the backend. */
function useServerLetters() {
  const { showToast } = useFeedback()
  const [items, setItems] = useState<LetterItem[]>([])
  const [replies, setReplies] = useState<MessageReply[]>([])
  const [hasNext, setHasNext] = useState(false)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(isApiEnabled)

  const load = useCallback(
    (target: number) => {
      setLoading(true)
      fetchSentMessages(target, PAGE_SIZE)
        .then((slice) => {
          setItems((previous) => [...(target === 0 ? [] : previous), ...slice.content.map(fromServer)])
          setHasNext(slice.hasNext)
          setPage(target)
        })
        .catch(() => showToast('내가 쓴 편지를 불러오지 못했어요.'))
        .finally(() => setLoading(false))
    },
    [showToast],
  )

  useEffect(() => {
    if (!isApiEnabled) return
    load(0)
    fetchRepliesToMe()
      .then((list) => setReplies(list.map(replyFromApi)))
      .catch(() => undefined)
  }, [load])

  return { items, replies, hasNext, loading, loadMore: () => load(page + 1) }
}

/**
 * Every letter I left on anyone's desk, with the owner's reply right under it,
 * so checking for replies doesn't mean opening each friend's desk link.
 */
export function MyLettersPage() {
  const navigate = useNavigate()
  const identity = usePrototypeStore((state) => state.supporterIdentityName)
  const currentDesk = usePrototypeStore((state) => state.currentDesk)
  const messages = usePrototypeStore((state) => state.messages)
  const readMessageIds = usePrototypeStore((state) => state.readMessageIds)
  const localReplies = usePrototypeStore((state) => state.messageReplies)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const server = useServerLetters()

  // The offline prototype only knows the one sample desk.
  const localItems = useMemo<LetterItem[]>(
    () =>
      identity
        ? messages
            .filter((message) => message.senderName === identity)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((message) => ({
              id: message.id,
              isSticker: message.kind === 'sticker',
              isPublic: message.visibility === 'public',
              read: message.status === 'read' || readMessageIds.includes(message.id),
              text: message.textElements[0]?.text || message.pages?.[0]?.textElements[0]?.text || '',
              createdAt: message.createdAt,
              deskName: currentDesk.displayName,
              supporterToken: DEFAULT_SUPPORTER_TOKEN,
            }))
        : [],
    [currentDesk.displayName, identity, messages, readMessageIds],
  )

  const letters = isApiEnabled ? server.items : localItems.slice(0, visibleCount)
  const hasNext = isApiEnabled ? server.hasNext : localItems.length > visibleCount
  const replies = isApiEnabled ? server.replies : localReplies

  // What was seen before this visit, so a new reply stays marked until the next one.
  const [seenBefore] = useState(loadSeenReplies)
  useEffect(() => {
    if (replies.length === 0) return
    saveSeenReplies(new Set([...seenBefore, ...replies.map((reply) => reply.id)]))
  }, [replies, seenBefore])

  // A daily reply answers several letters at once, so it shows under each of them.
  const repliesByLetter = useMemo(() => {
    const map = new Map<string, MessageReply[]>()
    for (const reply of replies) {
      for (const id of reply.targetMessageIds) map.set(id, [...(map.get(id) ?? []), reply])
    }
    return map
  }, [replies])

  return (
    <AppShell
      surface="base"
      contentClassName="my-letters-shell"
      appBar={
        <AppBar
          title="내가 쓴 편지"
          leading={
            <IconButton
              label="홈으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate('/home')}
            />
          }
        />
      }
    >
      <main className="my-letters">
        {letters.length === 0 ? (
          <section className="my-letters__empty">
            <span className="my-letters__icon" aria-hidden>
              <Mail size={21} />
            </span>
            <h1>{server.loading ? '불러오고 있어요...' : '아직 쓴 편지가 없어요.'}</h1>
            {!server.loading && <p>친구의 책상 링크에서 응원을 남기면 여기에 모여요.</p>}
          </section>
        ) : (
          <div className="my-letters__list">
            {letters.map((letter) => {
              const letterReplies = repliesByLetter.get(letter.id) ?? []
              const hasNewReply = letterReplies.some((reply) => !seenBefore.has(reply.id))
              const deskToken = letter.supporterToken
              return (
                <article className="my-letter-card" key={letter.id}>
                  <header>
                    <div>
                      <strong>{letter.deskName ? `${letter.deskName}님의 책상` : '사라진 책상'}</strong>
                      <time>{formatDate(letter.createdAt)}</time>
                    </div>
                    {letterReplies.length > 0 ? (
                      <span className="my-letter-card__status my-letter-card__status--replied">
                        {hasNewReply && <span className="my-letter-card__new" role="img" aria-label="새 답장" />}
                        답장
                      </span>
                    ) : (
                      letter.isPublic && (
                        <span className="my-letter-card__status">{letter.read ? '열어봄' : '아직 열기 전'}</span>
                      )
                    )}
                  </header>

                  <p className="my-letter-card__text">
                    {letter.isSticker ? '스티커를 붙였어요.' : letter.text || '마음을 담아 남긴 응원'}
                  </p>

                  {letterReplies.map((reply) => (
                    <div className="my-letter-card__reply" key={reply.id}>
                      <span>{reply.ownerName}님의 답장</span>
                      <p>{reply.text}</p>
                      <time>{formatDate(reply.createdAt)}</time>
                    </div>
                  ))}

                  {deskToken && (
                    <button
                      type="button"
                      className="my-letter-card__desk"
                      onClick={() => navigate(supporterPath(deskToken))}
                    >
                      책상 가기
                      <ChevronRight size={14} aria-hidden />
                    </button>
                  )}
                </article>
              )
            })}

            {hasNext && (
              <Button
                variant="secondary"
                fullWidth
                onClick={() =>
                  isApiEnabled ? server.loadMore() : setVisibleCount((count) => count + PAGE_SIZE)
                }
              >
                더 보기
              </Button>
            )}
          </div>
        )}
      </main>
    </AppShell>
  )
}
