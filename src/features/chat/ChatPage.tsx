import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowUp, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { askChat, type ChatDiscount, type ChatSource, type ChatTurn } from '@/api/chat'
import { AppBar, IconButton } from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import { DISCOUNTS_PATH } from '@/features/discounts/discountRoutes'
import './chat.css'

const MAX_QUESTION = 500
const SUGGESTIONS = ['수능 성적은 언제 나와?', '정시 원서 접수는 언제 시작해?', '수험표로 받을 수 있는 혜택 알려줘', '수능 이후 입시 일정은 어떻게 돼?']
const GREETING = '수능 보느라 정말 고생 많았어요! 수능 일정, 성적, 정시, 수험표 혜택처럼 궁금한 걸 편하게 물어봐 주세요.'

type Message = ChatTurn & { discounts?: ChatDiscount[]; sources?: ChatSource[]; error?: boolean }

function errorText(error: unknown): string {
  if (error instanceof ApiError && error.code === 'TOO_MANY_CHATS') return '질문이 너무 많아요. 잠시 쉬었다가 다시 물어봐 주세요.'
  if (error instanceof ApiError && error.code === 'CHAT_NOT_AVAILABLE') return '도우미가 잠시 쉬고 있어요. 조금 뒤에 다시 물어봐 주세요.'
  return '답을 가져오지 못했어요. 잠시 후 다시 시도해 주세요.'
}

/**
 * 답 아래 혜택 한 줄. 혜택함처럼 이미지가 있으면 함께 보여 준다.
 * 제휴 매장 이미지는 글씨까지 담긴 배너 시안(3:1)이라 이미지만, 일반 혜택은 사진 아래에 혜택 글을 단다.
 * 이미지를 못 불러오면 글만 남긴다.
 */
function DiscountItem({
  discount: d,
  withImage,
  onOpen,
}: {
  discount: ChatDiscount
  withImage: boolean
  onOpen: () => void
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const image = withImage && d.imageUrl && !imageFailed ? d.imageUrl : null
  const meta = [d.sponsored ? '제휴' : null, d.area, d.endDate ? `~${d.endDate.slice(5).replace('-', '.')}` : null]
    .filter(Boolean)
    .join(' · ')

  if (image && d.sponsored) {
    return (
      <button type="button" className="chat__banner" onClick={onOpen}>
        <img
          src={image}
          alt={`${d.brand} ${d.benefit ?? ''}`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
        />
        <em>제휴</em>
      </button>
    )
  }

  return (
    <button type="button" className={image ? 'chat__discount has-image' : 'chat__discount'} onClick={onOpen}>
      {image && (
        <img src={image} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setImageFailed(true)} />
      )}
      <strong>{d.brand}</strong>
      <span>{d.benefit}</span>
      <small>{meta}</small>
    </button>
  )
}

/** 수능 도우미 챗봇. 수능·입시·수험생 혜택 이야기만 하고, 착 혜택과 공식 사이트를 함께 보여 준다. */
export function ChatPage() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' })
  }, [messages, busy])

  const send = async (text: string) => {
    const question = text.trim().slice(0, MAX_QUESTION)
    if (!question || busy) return
    const next: Message[] = [...messages, { role: 'user', content: question }]
    setMessages(next)
    setDraft('')
    setBusy(true)
    try {
      const history: ChatTurn[] = next.filter((m) => !m.error).map(({ role, content }) => ({ role, content }))
      const reply = await askChat(history.slice(-6))
      setMessages([...next, { role: 'assistant', content: reply.answer, discounts: reply.discounts, sources: reply.sources }])
    } catch (error) {
      setMessages([...next, { role: 'assistant', content: errorText(error), error: true }])
    } finally {
      setBusy(false)
    }
  }

  // 같은 배너(이미지)는 이 대화에서 한 번만. 앞 답에서 이미 보인 혜택은 다음 답에서 글로만 보인다.
  const imageIds: Set<number>[] = []
  const shownImages = new Set<number>()
  for (const m of messages) {
    const ids = new Set<number>()
    for (const d of m.discounts ?? []) {
      if (d.imageUrl && !shownImages.has(d.id)) ids.add(d.id)
    }
    ids.forEach((id) => shownImages.add(id))
    imageIds.push(ids)
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    void send(draft)
  }

  return (
    <AppShell
      surface="base"
      contentClassName="chat-shell"
      appBar={
        <AppBar
          title="수능 도우미"
          leading={
            <IconButton
              label="뒤로 가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
            />
          }
        />
      }
    >
      <main className="chat">
        <ol className="chat__log" aria-live="polite">
          <li className="chat__bubble chat__bubble--bot">
            <p>{GREETING}</p>
            {messages.length === 0 && (
              <div className="chat__suggestions">
                {SUGGESTIONS.map((question) => (
                  <button key={question} type="button" className="chat__suggestion" onClick={() => void send(question)}>
                    {question}
                  </button>
                ))}
              </div>
            )}
          </li>
          {messages.map((m, i) => (
            <li
              key={i}
              className={`chat__bubble chat__bubble--${m.role === 'user' ? 'me' : 'bot'}${m.error ? ' is-error' : ''}`}
            >
              <p>{m.content}</p>
              {m.discounts && m.discounts.length > 0 && (
                <div className="chat__discounts">
                  <span className="chat__label">착 혜택함</span>
                  {m.discounts.map((d) => (
                    <DiscountItem
                      key={d.id}
                      discount={d}
                      withImage={imageIds[i]?.has(d.id) ?? false}
                      onOpen={() => navigate(`${DISCOUNTS_PATH}?q=${encodeURIComponent(d.brand)}`)}
                    />
                  ))}
                </div>
              )}
              {m.sources && m.sources.length > 0 && (
                <div className="chat__sources">
                  <span className="chat__label">공식 자료</span>
                  <ol>
                    {m.sources.map((s) => (
                      <li key={s.url}>
                        <a href={s.url} target="_blank" rel="noopener noreferrer">
                          {s.title || s.hostname}
                          <ExternalLink size={12} aria-hidden />
                        </a>
                        <small>{s.hostname}</small>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </li>
          ))}
          {busy && (
            <li className="chat__bubble chat__bubble--bot chat__typing" aria-label="답을 찾는 중">
              <span />
              <span />
              <span />
            </li>
          )}
        </ol>
        <div ref={endRef} />

        <form className="chat__composer" onSubmit={onSubmit}>
          <p className="chat__notice">AI 답변이라 틀릴 수 있어요. 중요한 일정은 공식 사이트에서 꼭 확인해 주세요.</p>
          <div className="chat__input">
            <textarea
              value={draft}
              maxLength={MAX_QUESTION}
              rows={1}
              placeholder="수능·입시·수험표 혜택을 물어보세요"
              aria-label="질문"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  void send(draft)
                }
              }}
            />
            <button type="submit" aria-label="보내기" disabled={busy || !draft.trim()}>
              <ArrowUp size={18} aria-hidden />
            </button>
          </div>
        </form>
      </main>
    </AppShell>
  )
}
