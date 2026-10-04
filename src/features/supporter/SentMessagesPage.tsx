import {
  ArrowLeft,
  LockKeyhole,
  Trash2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  AppBar,
  Button,
  IconButton,
} from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import './SentMessagesPage.css'

export function SentMessagesPage() {
  const navigate = useNavigate()
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

  const ownMessages = identity
    ? messages
        .filter((message) => message.senderName === identity)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime(),
        )
    : []

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
                navigate('/prototype/support/jisu')
              }
            />
          }
        />
      }
      fixedAction={
        identity ? (
          <Button
            variant="brand"
            fullWidth
            onClick={() => {
              usePrototypeStore
                .getState()
                .resetComposerDraft()
              navigate('/prototype/support/jisu/compose')
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
            <h1>아직 남긴 응원이 없어요.</h1>
          </section>
        ) : (
          <div className="sent-messages__list">
            {ownMessages.map((message) => {
              const read =
                message.status === 'read' ||
                readMessageIds.includes(message.id)
              const publicMessage =
                message.visibility === 'public'
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
                          : `${currentDesk.displayName}님만 보기`}
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
                    {message.kind === 'sticker' ? '스티커를 붙였어요.' : message.textElements[0]?.text ||
                      message.pages?.[0]
                        ?.textElements[0]?.text ||
                      '마음을 담아 남긴 응원'}
                  </p>

                  {deletable && (
                    <button
                      type="button"
                      className="sent-message-card__delete"
                      onClick={() =>
                        deleteOwnPublicMessage(message.id)
                      }
                    >
                      <Trash2 size={14} aria-hidden />
                      삭제
                    </button>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </main>
    </AppShell>
  )
}
