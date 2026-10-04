import { useMemo, useState, type FormEvent } from 'react'
import {
  ArrowLeft,
  MessageCircleMore,
} from 'lucide-react'
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import {
  AppBar,
  Button,
  IconButton,
} from '@/design-system'
import {
  getMessageAvailability,
  isSameCalendarDate,
} from '@/features/desk/dailyAvailability'
import { resolvePreviewReadMode } from '@/features/desk/dailyAvailability'
import { isStickerMessage } from '@/features/supporter/deskStickers'
import {
  mergeSupportMessages,
} from '@/features/supporter/seededMessages'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import type { Message } from '@/types'
import './ReplyPages.css'

export function MessageReplyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    classroomId,
    lockerId,
    messageId,
  } = useParams()
  const currentDesk = usePrototypeStore((state) => state.currentDesk)
  const classroom = usePrototypeStore((state) => state.classroom)
  const storedMessages = usePrototypeStore((state) => state.messages)
  const sendMessageReply = usePrototypeStore(
    (state) => state.sendMessageReply,
  )
  const messageReplies = usePrototypeStore(
    (state) => state.messageReplies,
  )
  const [text, setText] = useState('')

  const classroomLocker = classroom.lockers.find(
    (locker) => locker.id === lockerId,
  )
  const classroomMode = Boolean(classroomId && classroomLocker)
  const messages = useMemo(
    () =>
      classroomMode
        ? storedMessages.filter((message) =>
            classroomLocker?.messageIds.includes(message.id),
          )
        : mergeSupportMessages(storedMessages),
    [
      classroomLocker?.messageIds,
      classroomMode,
      storedMessages,
    ],
  )
  const sourceMessage = messages.find(
    (message) => message.id === messageId,
  )

  const scope =
    new URLSearchParams(location.search).get('scope') === 'daily'
      ? 'daily'
      : 'single'
  const ownerName =
    classroomLocker?.studentName ?? currentDesk.displayName
  const readMode = classroomMode
    ? {
        type: 'daily' as const,
        unlockTime: classroom.dailyUnlockTime,
      }
    : resolvePreviewReadMode(currentDesk.readMode, location.search)

  const targets = useMemo(
    () =>
      sourceMessage
        ? getReplyTargets(
            messages,
            sourceMessage,
            scope,
            readMode,
          )
        : [],
    [messages, readMode, scope, sourceMessage],
  )

  const alreadyReplied = messageReplies.some(
    (reply) =>
      messageId &&
      reply.targetMessageIds.includes(messageId),
  )

  if (!sourceMessage) {
    return <Navigate to="/prototype/my/desk" replace />
  }

  if (alreadyReplied) {
    return (
      <Navigate
        to={readerPath(
          classroomId,
          lockerId,
          sourceMessage.id,
        )}
        replace
      />
    )
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!text.trim() || targets.length === 0) return

    sendMessageReply({
      scope,
      sourceMessageId: sourceMessage.id,
      targetMessageIds: targets.map((target) => target.id),
      targetSenderNames: targets.map(
        (target) => target.senderName,
      ),
      ownerName,
      text: text.trim(),
    })

    navigate(
      readerPath(
        classroomId,
        lockerId,
        sourceMessage.id,
      ),
      {
        replace: true,
        state: {
          from: classroomMode
            ? 'classroom-locker'
            : 'owner-desk',
          lockerId,
        },
      },
    )
  }

  return (
    <AppShell
      surface="base"
      contentClassName="reply-page-shell"
      appBar={
        <AppBar
          title="답장 보내기"
          leading={
            <IconButton
              label="응원으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() =>
                navigate(
                  readerPath(
                    classroomId,
                    lockerId,
                    sourceMessage.id,
                  ),
                  {
                    state: {
                      from: classroomMode
                        ? 'classroom-locker'
                        : 'owner-desk',
                      lockerId,
                    },
                  },
                )
              }
            />
          }
        />
      }
      fixedAction={
        <Button
          variant="brand"
          fullWidth
          disabled={!text.trim()}
          onClick={() => {
            const form = document.querySelector<HTMLFormElement>(
              '.reply-compose',
            )
            form?.requestSubmit()
          }}
        >
          답장 보내기
        </Button>
      }
    >
      <main className="reply-page">
        <section className="reply-page__heading">
          <span className="reply-page__icon" aria-hidden>
            <MessageCircleMore size={21} />
          </span>
          <h1>
            {scope === 'daily'
              ? '오늘 응원해준 친구들에게'
              : `${sourceMessage.senderName}님에게`}
            <br />
            마음을 전해보세요.
          </h1>
          {scope === 'daily' && (
            <p>
              {targets.length}명에게 같은 답장을 한 번씩 보내요.
            </p>
          )}
        </section>

        {scope === 'single' && (
          <section className="reply-page__source">
            <span>{sourceMessage.senderName}님의 응원</span>
            <p>{messagePreview(sourceMessage)}</p>
          </section>
        )}

        <form className="reply-compose" onSubmit={submit}>
          <label>
            <span>답장</span>
            <textarea
              autoFocus
              maxLength={240}
              value={text}
              placeholder="고마웠던 마음을 편하게 남겨보세요."
              onChange={(event) => setText(event.target.value)}
            />
          </label>
          <small>{text.length}/240</small>
        </form>
      </main>
    </AppShell>
  )
}

export function SupporterRepliesPage() {
  const navigate = useNavigate()
  const currentDesk = usePrototypeStore((state) => state.currentDesk)
  const identity = usePrototypeStore(
    (state) => state.supporterIdentityName,
  )
  const replies = usePrototypeStore((state) => state.messageReplies)
  const storedMessages = usePrototypeStore((state) => state.messages)

  const messages = useMemo(
    () => mergeSupportMessages(storedMessages),
    [storedMessages],
  )
  const received = useMemo(
    () =>
      identity
        ? replies
            .filter((reply) =>
              reply.targetSenderNames.includes(identity),
            )
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            )
        : [],
    [identity, replies],
  )

  return (
    <AppShell
      surface="base"
      contentClassName="reply-page-shell"
      appBar={
        <AppBar
          title="받은 답장"
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
            {currentDesk.displayName}님에게 응원 하나 더 쓰기
          </Button>
        ) : undefined
      }
    >
      <main className="reply-page reply-page--received">
        {received.length === 0 ? (
          <section className="reply-empty">
            <span className="reply-page__icon" aria-hidden>
              <MessageCircleMore size={21} />
            </span>
            <h1>아직 받은 답장이 없어요.</h1>
          </section>
        ) : (
          received.map((reply) => {
            const source = reply.targetMessageIds
              .map((id) =>
                messages.find((message) => message.id === id),
              )
              .find(
                (message) =>
                  message?.senderName === identity,
              )

            return (
              <article className="received-reply" key={reply.id}>
                {source && (
                  <div className="received-reply__mine">
                    <span>내가 쓴 응원</span>
                    <p>{messagePreview(source)}</p>
                  </div>
                )}
                <div className="received-reply__answer">
                  <span>{reply.ownerName}님의 답장</span>
                  <p>{reply.text}</p>
                </div>
                <time>
                  {new Intl.DateTimeFormat('ko-KR', {
                    month: 'long',
                    day: 'numeric',
                  }).format(new Date(reply.createdAt))}
                </time>
              </article>
            )
          })
        )}
      </main>
    </AppShell>
  )
}

function getReplyTargets(
  messages: Message[],
  source: Message,
  scope: 'single' | 'daily',
  readMode:
    | { type: 'daily'; unlockTime: string }
    | { type: 'time-capsule'; unlockAt: string },
) {
  if (scope === 'single') {
    return [source]
  }

  const sourceUnlockAt = getMessageAvailability(
    readMode,
    source.createdAt,
  ).unlockAt

  if (!sourceUnlockAt) return [source]

  const bySender = new Map<string, Message>()

  messages.forEach((message) => {
    if (isStickerMessage(message)) return

    const unlockAt = getMessageAvailability(
      readMode,
      message.createdAt,
    ).unlockAt

    if (
      unlockAt &&
      isSameCalendarDate(unlockAt, sourceUnlockAt) &&
      !bySender.has(message.senderName)
    ) {
      bySender.set(message.senderName, message)
    }
  })

  return [...bySender.values()]
}

function readerPath(
  classroomId: string | undefined,
  lockerId: string | undefined,
  messageId: string,
) {
  if (classroomId && lockerId) {
    return `/prototype/classroom/${classroomId}/locker/${lockerId}/message/${messageId}`
  }

  return `/prototype/my/message/${messageId}`
}

function messagePreview(message: Message) {
  return (
    message.textElements[0]?.text ??
    message.pages?.[0]?.textElements[0]?.text ??
    '마음을 담아 남긴 응원'
  )
}
