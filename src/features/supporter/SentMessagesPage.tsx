import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  LockKeyhole,
  Trash2,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AppBar,
  Button,
  IconButton,
} from '@/design-system'
import { deleteSentMessage, fetchSentMessages } from '@/api/community'
import { isApiEnabled } from '@/api/config'
import { cardPreviewText } from '@/api/mappers'
import type { ApiSentMessage } from '@/api/types'
import { useFeedback } from '@/design-system/overlays'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import { DEFAULT_SUPPORTER_TOKEN, supporterPath } from '@/prototype/supporterRoute'
import './SentMessagesPage.css'

/**
 * Matches the backend's page/size list shape (`content` + `hasNext`) one
 * page at a time, even though this still reads the full local array -
 * swapping this for a real paginated fetch later only touches this hook.
 */
const PAGE_SIZE = 10

/** What one card in the list needs, whether it came from local state or the backend. */
type SentItem = {
  id: string
  isSticker: boolean
  isPublic: boolean
  read: boolean
  text: string
  createdAt: string
  /** Name of the desk it was left on. */
  deskName: string | null
}

const fromServer = (message: ApiSentMessage): SentItem => ({
  id: String(message.messageId),
  isSticker: message.kind === 'STICKER',
  isPublic: message.visibility === 'PUBLIC',
  read: message.status === 'READ',
  text: cardPreviewText(message.card),
  createdAt: message.createdAt,
  deskName: message.deskName,
})

/** The sender's own letters from the backend, loaded a page at a time. */
function useServerSentMessages() {
  const { showToast } = useFeedback()
  const [items, setItems] = useState<SentItem[]>([])
  const [hasNext, setHasNext] = useState(false)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(isApiEnabled)

  const load = useCallback(
    (target: number) => {
      setLoading(true)
      fetchSentMessages(target, PAGE_SIZE)
        .then((slice) => {
          setItems((previous) => [
            ...(target === 0 ? [] : previous),
            ...slice.content.map(fromServer),
          ])
          setHasNext(slice.hasNext)
          setPage(target)
        })
        .catch(() => showToast('보낸 응원을 불러오지 못했어요.'))
        .finally(() => setLoading(false))
    },
    [showToast],
  )

  useEffect(() => {
    if (isApiEnabled) load(0)
  }, [load])

  const remove = async (id: string) => {
    try {
      await deleteSentMessage(Number(id))
      setItems((previous) => previous.filter((item) => item.id !== id))
    } catch {
      showToast('삭제하지 못했어요. 이미 열어본 응원은 삭제할 수 없어요.')
    }
  }

  return { items, hasNext, loading, loadMore: () => load(page + 1), remove }
}

export function SentMessagesPage() {
  const navigate = useNavigate()
  const { supporterToken = DEFAULT_SUPPORTER_TOKEN } = useParams()
  const identity = usePrototypeStore(
    (state) => state.supporterIdentityName,
  )
  const currentDesk = usePrototypeStore((state) => state.currentDesk)
  const messages = usePrototypeStore((state) => state.messages)
  const readMessageIds = usePrototypeStore(
    (state) => state.readMessageIds,
  )
  const deleteOwnPublicMessage = usePrototypeStore(
    (state) => state.deleteOwnPublicMessage,
  )
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const server = useServerSentMessages()

  const localItems = useMemo<SentItem[]>(
    () =>
      identity
        ? messages
            .filter((message) => message.senderName === identity)
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            )
            .map((message) => ({
              id: message.id,
              isSticker: message.kind === 'sticker',
              isPublic: message.visibility === 'public',
              read:
                message.status === 'read' ||
                readMessageIds.includes(message.id),
              text:
                message.textElements[0]?.text ||
                message.pages?.[0]?.textElements[0]?.text ||
                '',
              createdAt: message.createdAt,
              deskName: currentDesk.displayName,
            }))
        : [],
    [currentDesk.displayName, identity, messages, readMessageIds],
  )

  const ownMessages = isApiEnabled ? server.items : localItems
  const page = isApiEnabled
    ? { content: server.items, hasNext: server.hasNext }
    : {
        content: localItems.slice(0, visibleCount),
        hasNext: localItems.length > visibleCount,
      }
  const canWriteMore = isApiEnabled || Boolean(identity)

  return (
    <AppShell
      surface="base"
      contentClassName="sent-messages-shell"
      appBar={
        <AppBar
          title="내가 남긴 응원"
          leading={
            <IconButton
              label="책상으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() =>
                navigate(supporterPath(supporterToken))
              }
            />
          }
        />
      }
      fixedAction={
        canWriteMore ? (
          <Button
            variant="brand"
            fullWidth
            onClick={() => {
              usePrototypeStore
                .getState()
                .resetComposerDraft()
              navigate(supporterPath(supporterToken, '/compose'))
            }}
          >
            응원 하나 더 쓰기
          </Button>
        ) : undefined
      }
    >
      <main className="sent-messages">
        {ownMessages.length === 0 ? (
          <section className="sent-messages__empty">
            <h1>{server.loading ? '불러오고 있어요...' : '아직 남긴 응원이 없어요.'}</h1>
          </section>
        ) : (
          <div className="sent-messages__list">
            {page.content.map((message) => {
              const read = message.read
              const publicMessage = message.isPublic
              const deletable = publicMessage && !read

              return (
                <article
                  className="sent-message-card"
                  key={message.id}
                >
                  <header>
                    <div>
                      <span
                        className={[
                          'sent-message-card__visibility',
                          publicMessage
                            ? ''
                            : 'sent-message-card__visibility--private',
                        ].filter(Boolean).join(' ')}
                      >
                        {!publicMessage && (
                          <LockKeyhole
                            size={12}
                            aria-hidden
                          />
                        )}
                        {publicMessage
                          ? '함께 보기'
                          : `${message.deskName ?? currentDesk.displayName}님만 보기`}
                      </span>
                      <time>
                        {new Intl.DateTimeFormat('ko-KR', {
                          month: 'long',
                          day: 'numeric',
                        }).format(
                          new Date(message.createdAt),
                        )}
                      </time>
                    </div>
                    {publicMessage && (
                      <span className="sent-message-card__status">
                        {read ? '열어봄' : '아직 열기 전'}
                      </span>
                    )}
                  </header>

                  <p>
                    {message.isSticker
                      ? '스티커를 붙였어요.'
                      : message.text || '마음을 담아 남긴 응원'}
                  </p>

                  {deletable && (
                    <button
                      type="button"
                      className="sent-message-card__delete"
                      onClick={() =>
                        isApiEnabled
                          ? server.remove(message.id)
                          : deleteOwnPublicMessage(message.id)
                      }
                    >
                      <Trash2 size={14} aria-hidden />
                      삭제
                    </button>
                  )}
                </article>
              )
            })}

            {page.hasNext && (
              <Button
                variant="secondary"
                fullWidth
                onClick={() =>
                  isApiEnabled
                    ? server.loadMore()
                    : setVisibleCount((count) => count + PAGE_SIZE)
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
