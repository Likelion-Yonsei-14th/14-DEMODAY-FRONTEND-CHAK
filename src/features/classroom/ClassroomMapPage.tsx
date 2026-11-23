import { useState } from 'react'
import {
  ArrowLeft,
  MessageCircleMore,
  Settings,
  Sparkles,
} from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  AppBar,
  BottomSheet,
  Button,
  IconButton,
  useFeedback,
} from '@/design-system'
import { shareOrCopyLink } from '@/lib/shareLink'
import { buildPrototypeShareUrl } from '@/prototype/shareUrl'
import { getCsatDdayLabel } from '@/features/csat/csatSchedule'
import { AppShell } from '@/layout/AppShell'
import { useHomePath } from '@/app/homePath'
import { usePrototypeStore } from '@/store/prototypeStore'
import { getTodaysBoardQuotes } from './boardQuotes'
import { classroomZoneLabels } from './classroomCabinet'
import { ClassroomScene } from './ClassroomScene'
import { getLockerPaint } from './lockerDecor'
import { LockerMiniDoor } from './LockerScene'
import './Classroom.css'

export function ClassroomMapPage() {
  const navigate = useNavigate()
  const { classroomId } = useParams()
  const classroom = usePrototypeStore((state) => state.classroom)
  const member = usePrototypeStore((state) => state.classroomMember)
  const [camera, setCamera] = useState(1)
  const [allLockersOpen, setAllLockersOpen] = useState(false)
  const lockerDecor = usePrototypeStore((state) => state.lockerDecor)
  const { showToast } = useFeedback()
  const homePath = useHomePath()
  const wrappedAvailable =
    getCsatDdayLabel() === '수능이 끝났어요'

  if (!member) {
    return (
      <Navigate
        to={`/classroom/${classroomId ?? classroom.id}/join`}
        replace
      />
    )
  }

  const id = classroomId ?? classroom.id

  // Keep my locker in the bank even when the class is bigger than the bank.
  const otherLockers = classroom.lockers.filter(
    (locker) => locker.id !== member.lockerId,
  )
  const myLocker = classroom.lockers.find(
    (locker) => locker.id === member.lockerId,
  )
  const orderedLockers = [...(myLocker ? [myLocker] : []), ...otherLockers]

  const inviteFriends = async () => {
    const url = buildPrototypeShareUrl(`/classroom/${id}/join`)
    await shareOrCopyLink(
      {
        title: `${classroom.name}에 들어와!`,
        text: '이름만 적으면 내 사물함이 생겨요.',
        url,
      },
      showToast,
      '초대 링크를 복사했어요.',
    )
  }

  return (
    <AppShell
      surface="transparent"
      contentClassName="classroom-map-shell"
      appBar={
        <AppBar
          title={classroom.name}
          subtitle={`${member.displayName} · ${classroomZoneLabels[camera]}`}
          transparent
          leading={
            <IconButton
              label="홈으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate(homePath)}
            />
          }
          trailing={
            <div className="classroom-map__app-actions">
              {wrappedAvailable && (
                <IconButton
                  label="우리의 수능 기록"
                  icon={<Sparkles size={20} aria-hidden />}
                  onClick={() =>
                    navigate(
                      `/classroom/${id}/wrapped`,
                    )
                  }
                />
              )}
              <IconButton
                label="우리 공간 설정"
                icon={<Settings size={20} aria-hidden />}
                onClick={() =>
                  navigate(
                    `/classroom/${id}/settings`,
                  )
                }
              />
            </div>
          }
        />
      }
    >
      <main className="classroom-map">
        <p className="classroom-map__hint">
          좌우로 둘러보고, 가까이 있는 공간을 눌러보세요.
        </p>

        <ClassroomScene
          ariaLabel="응원 교실"
          camera={camera}
          onCameraChange={setCamera}
          lockers={orderedLockers.map((locker) => {
            const paint = lockerDecor[locker.id]?.outside
            return {
              id: locker.id,
              name: locker.studentName,
              mine: locker.id === member.lockerId,
              paintSwatch: paint ? getLockerPaint(paint).swatch : undefined,
            }
          })}
          onLockerClick={(lockerId) =>
            navigate(`/classroom/${id}/locker/${lockerId}`)
          }
          emptyLockerLabel="빈 사물함 · 친구 초대하기"
          onEmptyLockerClick={inviteFriends}
          onShowAllLockers={() => setAllLockersOpen(true)}
          blackboard={
            <button
              type="button"
              className="classroom-map__blackboard"
              aria-label="칠판 보기"
              onClick={() =>
                navigate(
                  `/classroom/${id}/blackboard`,
                )
              }
            >
              {/* Like a real board: today's date and the D-day in the corner */}
              <span className="classroom-map__chalk-date">
                {new Intl.DateTimeFormat('ko-KR', {
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short',
                }).format(new Date())}
                <br />
                {getCsatDdayLabel().replace('수능까지 ', '수능 ')}
              </span>
              <span className="classroom-map__chalk">
                <span className="classroom-map__chalk-title">
                  수능까지 같이 가자!
                </span>
                {classroom.blackboardEntries
                  .slice(-3)
                  .map((entry) => (
                    <span
                      key={entry.id}
                      className="classroom-map__chalk-note"
                    >
                      {entry.text || '✦'}
                    </span>
                  ))}
              </span>
              {/* Today's curated quotes, taped to the board as paper notes */}
              <span className="classroom-map__notes">
                {getTodaysBoardQuotes().map((quote, index) => (
                  <span
                    key={quote.id}
                    className="classroom-map__note"
                    style={{
                      '--note-color': quote.paper,
                      '--note-tilt': `${index % 2 ? 3 : -3}deg`,
                    } as React.CSSProperties}
                  >
                    {quote.text}
                  </span>
                ))}
              </span>
              <span className="classroom-map__interaction">
                <MessageCircleMore size={15} aria-hidden />
                칠판 보기
              </span>
            </button>
          }
        />

        <BottomSheet
          open={allLockersOpen}
          onClose={() => setAllLockersOpen(false)}
          title={`${classroom.name} 사물함`}
          description={`${classroom.lockers.length}명이 함께하고 있어요. 친구가 들어오면 사물함이 하나씩 늘어나요.`}
        >
          <div className="classroom-lockers-sheet">
            <div className="classroom-lockers-sheet__grid">
              {orderedLockers.map((locker) => (
                <button
                  type="button"
                  key={locker.id}
                  className="classroom-lockers-sheet__item"
                  onClick={() =>
                    navigate(`/classroom/${id}/locker/${locker.id}`)
                  }
                >
                  <LockerMiniDoor
                    studentName={locker.studentName}
                    active={locker.id === member.lockerId}
                    paint={lockerDecor[locker.id]?.outside}
                  />
                  <span>
                    {locker.studentName}
                    {locker.id === member.lockerId ? ' (나)' : ''}
                  </span>
                </button>
              ))}
            </div>
            <Button variant="secondary" fullWidth onClick={inviteFriends}>
              친구 초대하기
            </Button>
          </div>
        </BottomSheet>
      </main>
    </AppShell>
  )
}
