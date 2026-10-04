import {
  ArrowLeft,
  MessageCircleHeart,
  Share2,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import {
  Navigate,
  useNavigate,
  useParams,
} from 'react-router-dom'
import {
  AppBar,
  Button,
  IconButton,
  useFeedback,
} from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import type { Message } from '@/types'
import './ClassWrappedPages.css'

const STOP_WORDS = new Set([
  '우리',
  '진짜',
  '바로',
  '하는',
  '있어',
  '거다',
  '가자',
  '보자',
  '해요',
  '그리고',
])

export function ClassWrappedPage() {
  const navigate = useNavigate()
  const { classroomId } = useParams()
  const classroom = usePrototypeStore((state) => state.classroom)
  const messages = usePrototypeStore((state) => state.messages)

  if (
    classroomId &&
    classroomId !== classroom.id
  ) {
    return <Navigate to="/prototype/classroom" replace />
  }

  const record = buildClassRecord(classroom, messages)

  return (
    <AppShell
      surface="base"
      contentClassName="class-wrapped-shell"
      appBar={
        <AppBar
          title="우리의 수능 기록"
          subtitle={classroom.name}
          leading={
            <IconButton
              label="교실로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() =>
                navigate(
                  `/prototype/classroom/${classroom.id}/map`,
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
          leadingIcon={<Share2 size={18} aria-hidden />}
          onClick={() =>
            navigate(
              `/prototype/classroom/${classroom.id}/wrapped/share`,
            )
          }
        >
          우리 기록 한 장으로 보기
        </Button>
      }
    >
      <main className="class-wrapped">
        <section className="class-wrapped__heading">
          <span className="class-wrapped__mark" aria-hidden>
            <Sparkles size={22} />
          </span>
          <p>수능까지 함께 남긴 마음</p>
          <h1>
            {classroom.name},
            <br />
            우리도 여기까지 왔어요.
          </h1>
        </section>

        <div className="class-wrapped__stats">
          <ClassStat
            icon={<UsersRound size={18} />}
            value={record.members}
            unit="명"
            label="함께한 친구"
          />
          <ClassStat
            icon={<MessageCircleHeart size={18} />}
            value={record.totalEncouragements}
            unit="개"
            label="모인 응원"
          />
          <ClassStat
            icon={<Sparkles size={18} />}
            value={record.boardEntries}
            unit="개"
            label="칠판에 남긴 흔적"
          />
        </div>

        <section className="class-wrapped__section">
          <span>우리 공간에 자주 남은 말</span>
          <div className="class-wrapped__keywords">
            {record.keywords.length > 0 ? (
              record.keywords.map((keyword) => (
                <strong key={keyword}>#{keyword}</strong>
              ))
            ) : (
              <strong>#같이</strong>
            )}
          </div>
        </section>

        <section className="class-wrapped__section">
          <span>칠판과 공개 응원에 자주 남은 이모지</span>
          <div className="class-wrapped__emojis">
            {record.emojis.length > 0
              ? record.emojis.map((emoji) => (
                  <strong key={emoji}>{emoji}</strong>
                ))
              : (
                <>
                  <strong>🍀</strong>
                  <strong>❤️</strong>
                </>
              )}
          </div>
        </section>

        <section className="class-wrapped__privacy">
          <strong>서로를 비교하는 기록은 만들지 않아요.</strong>
          <p>
            개인 사물함의 비공개 내용은 분석하거나 공유하지 않아요.
          </p>
        </section>

        <button
          type="button"
          className="class-wrapped__board-link"
          onClick={() =>
            navigate(
              `/prototype/classroom/${classroom.id}/blackboard`,
            )
          }
        >
          수능 전 우리가 채운 칠판 다시 보기
        </button>
      </main>
    </AppShell>
  )
}

export function ClassWrappedSharePage() {
  const navigate = useNavigate()
  const { showToast } = useFeedback()
  const { classroomId } = useParams()
  const classroom = usePrototypeStore((state) => state.classroom)
  const messages = usePrototypeStore((state) => state.messages)

  if (
    classroomId &&
    classroomId !== classroom.id
  ) {
    return <Navigate to="/prototype/classroom" replace />
  }

  const record = buildClassRecord(classroom, messages)

  const share = async () => {
    const text = [
      classroom.name,
      `${record.members}명이 함께 ${record.totalEncouragements}개의 응원을 남겼어요.`,
      record.keywords.length > 0
        ? `우리에게 자주 남은 말: ${record.keywords.join(', ')}`
        : null,
    ].filter(Boolean).join('\n')

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${classroom.name} 수능 응원 기록`,
          text,
        })
        return
      }

      await navigator.clipboard.writeText(text)
      showToast('우리 반 기록을 복사했어요.')
    } catch {
      // 공유 시트를 닫은 경우에는 별도 오류를 노출하지 않습니다.
    }
  }

  return (
    <AppShell
      surface="base"
      contentClassName="class-wrapped-shell"
      appBar={
        <AppBar
          title="우리 기록 공유하기"
          leading={
            <IconButton
              label="우리 기록으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() =>
                navigate(
                  `/prototype/classroom/${classroom.id}/wrapped`,
                )
              }
            />
          }
        />
      }
    >
      <main className="class-wrapped class-wrapped--share">
        <section className="class-wrapped-share-card">
          <span>2027학년도 수능</span>
          <h1>{classroom.name}</h1>
          <p>우리도 여기까지 왔어요.</p>

          <div className="class-wrapped-share-card__stats">
            <span>
              <strong>{record.members}</strong>
              함께한 친구
            </span>
            <span>
              <strong>{record.totalEncouragements}</strong>
              모인 응원
            </span>
            <span>
              <strong>{record.boardEntries}</strong>
              칠판 흔적
            </span>
          </div>

          {record.keywords.length > 0 && (
            <div className="class-wrapped-share-card__keywords">
              {record.keywords.slice(0, 3).map((keyword) => (
                <span key={keyword}>#{keyword}</span>
              ))}
            </div>
          )}

          <small>
            개인 메시지와 이름은 공유 이미지에 포함하지 않아요.
          </small>
        </section>

        <Button
          variant="brand"
          fullWidth
          leadingIcon={<Share2 size={18} aria-hidden />}
          onClick={share}
        >
          이 기록 공유하기
        </Button>
      </main>
    </AppShell>
  )
}

function ClassStat({
  icon,
  value,
  unit,
  label,
}: {
  icon: React.ReactNode
  value: number
  unit: string
  label: string
}) {
  return (
    <div className="class-wrapped-stat">
      <span aria-hidden>{icon}</span>
      <strong>
        {value}
        <small>{unit}</small>
      </strong>
      <p>{label}</p>
    </div>
  )
}

function buildClassRecord(
  classroom: ReturnType<typeof usePrototypeStore.getState>['classroom'],
  messages: Message[],
) {
  const lockerMessageIds = new Set(
    classroom.lockers.flatMap((locker) => locker.messageIds),
  )
  const lockerMessages = messages.filter((message) =>
    lockerMessageIds.has(message.id),
  )
  const publicLockerMessages = lockerMessages.filter(
    (message) => message.visibility === 'public',
  )
  const publicText = [
    ...classroom.blackboardEntries.map((entry) => entry.text),
    ...publicLockerMessages.map((message) =>
      messageText(message),
    ),
  ].join(' ')

  return {
    members: classroom.lockers.length,
    boardEntries: classroom.blackboardEntries.length,
    lockerMessages: lockerMessages.length,
    totalEncouragements:
      classroom.blackboardEntries.length + lockerMessages.length,
    keywords: extractKeywords(publicText),
    emojis: extractEmojis(publicText),
  }
}

function messageText(message: Message) {
  return [
    ...message.textElements.map((element) => element.text),
    ...(message.pages ?? []).flatMap((page) =>
      page.textElements.map((element) => element.text),
    ),
  ].join(' ')
}

function extractKeywords(value: string) {
  const counts = new Map<string, number>()

  value
    .replace(/[^가-힣A-Za-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(
      (word) =>
        word.length >= 2 &&
        !STOP_WORDS.has(word),
    )
    .forEach((word) => {
      counts.set(word, (counts.get(word) ?? 0) + 1)
    })

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([word]) => word)
}

function extractEmojis(value: string) {
  const matches =
    value.match(/\p{Extended_Pictographic}/gu) ?? []
  const counts = new Map<string, number>()

  matches.forEach((emoji) => {
    counts.set(emoji, (counts.get(emoji) ?? 0) + 1)
  })

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([emoji]) => emoji)
}
