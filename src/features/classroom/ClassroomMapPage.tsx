import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
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
import { buildPrototypeShareUrl } from '@/prototype/shareUrl'
import { getCsatDdayLabel } from '@/features/csat/csatSchedule'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import { LockerMiniDoor } from './LockerScene'
import { useDeskDaypart } from '@/features/desk/useDeskDaypart'
import './Classroom.css'

/** classroom-day/night.webp are 1344 × 576. */
const CLASSROOM_PHOTO_RATIO = 1344 / 576

/** Lockers drawn in the bank on the map; empty seats fill it up to the minimum. */
const MAP_LOCKER_MIN = 6
const MAP_LOCKER_MAX = 8

const zoneLabels = ['칠판', '교실', '사물함'] as const

export function ClassroomMapPage() {
  const navigate = useNavigate()
  const { classroomId } = useParams()
  const classroom = usePrototypeStore((state) => state.classroom)
  const member = usePrototypeStore((state) => state.classroomMember)
  const [camera, setCamera] = useState(1)
  const [allLockersOpen, setAllLockersOpen] = useState(false)
  const { showToast } = useFeedback()
  const daypart = useDeskDaypart()
  const viewportRef = useRef<HTMLElement>(null)
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })

  // The world keeps the photo's aspect ratio; the three camera stops are its
  // left edge, centre and right edge.
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      setViewportSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [])

  const worldWidth = Math.max(
    viewportSize.height * CLASSROOM_PHOTO_RATIO,
    viewportSize.width,
  )
  const cameraOffset =
    (camera * Math.max(0, worldWidth - viewportSize.width)) / 2
  const wrappedAvailable =
    getCsatDdayLabel() === '수능이 끝났어요'

  if (!member) {
    return (
      <Navigate
        to={`/prototype/classroom/${classroomId ?? classroom.id}/join`}
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
  const bankLockers = [
    ...(myLocker ? [myLocker] : []),
    ...otherLockers,
  ].slice(0, MAP_LOCKER_MAX)
  const emptySeats = Math.max(0, MAP_LOCKER_MIN - bankLockers.length)
  const hiddenLockerCount = classroom.lockers.length - bankLockers.length

  const inviteFriends = async () => {
    const url = buildPrototypeShareUrl(`/prototype/classroom/${id}/join`)
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${classroom.name}에 들어와!`,
          text: '이름만 적으면 내 사물함이 생겨요.',
          url,
        })
      } else {
        await navigator.clipboard.writeText(url)
        showToast('초대 링크를 복사했어요.')
      }
    } catch {
      // The share sheet was dismissed.
    }
  }

  return (
    <AppShell
      surface="transparent"
      contentClassName="classroom-map-shell"
      appBar={
        <AppBar
          title={classroom.name}
          subtitle={`${member.displayName} · ${zoneLabels[camera]}`}
          transparent
          leading={
            <IconButton
              label="처음으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate('/start')}
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
                      `/prototype/classroom/${id}/wrapped`,
                    )
                  }
                />
              )}
              <IconButton
                label="우리 공간 설정"
                icon={<Settings size={20} aria-hidden />}
                onClick={() =>
                  navigate(
                    `/prototype/classroom/${id}/settings`,
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

        <section
          ref={viewportRef}
          className={`classroom-map__viewport classroom-map__viewport--${daypart}`}
          aria-label="응원 교실"
        >
          <div
            className="classroom-map__world"
            style={{
              width: worldWidth || undefined,
              transform: `translateX(-${cameraOffset}px)`,
            }}
          >
            <div className="classroom-map__photo classroom-map__photo--day" />
            <div className="classroom-map__photo classroom-map__photo--night" />

            {/* Overlays use the photo's own coordinates (% of the world) */}
            <button
              type="button"
              className="classroom-map__blackboard"
              aria-label="칠판 보기"
              onClick={() =>
                navigate(
                  `/prototype/classroom/${id}/blackboard`,
                )
              }
            >
              <span className="classroom-map__chalk">
                <span className="classroom-map__chalk-title">
                  수능까지 같이 가자!
                </span>
                {classroom.blackboardEntries
                  .slice(-4)
                  .map((entry) => (
                    <span
                      key={entry.id}
                      className="classroom-map__chalk-note"
                    >
                      {entry.text || '✦'}
                    </span>
                  ))}
              </span>
              <span className="classroom-map__interaction">
                <MessageCircleMore size={15} aria-hidden />
                칠판 보기
              </span>
            </button>

            <div className="classroom-map__banner">
              오늘 한 만큼이면 충분해
            </div>

            <div
              className="classroom-map__lockers"
              style={{
                '--locker-count': bankLockers.length + emptySeats,
              } as React.CSSProperties}
            >
              {bankLockers.map((locker) => (
                <button
                  type="button"
                  key={locker.id}
                  className="classroom-map__locker-button"
                  aria-label={`${locker.studentName}의 사물함`}
                  onClick={() =>
                    navigate(
                      `/prototype/classroom/${id}/locker/${locker.id}`,
                    )
                  }
                >
                  <LockerMiniDoor
                    studentName={locker.studentName}
                    active={locker.id === member.lockerId}
                  />
                  {locker.id === member.lockerId && (
                    <span className="classroom-map__mine">
                      내 사물함
                    </span>
                  )}
                </button>
              ))}
              {Array.from({ length: emptySeats }, (_, index) => (
                <button
                  type="button"
                  key={`empty-${index}`}
                  className="classroom-map__locker-button classroom-map__locker-button--empty"
                  aria-label="빈 사물함 · 친구 초대하기"
                  onClick={inviteFriends}
                >
                  <LockerMiniDoor studentName="" />
                </button>
              ))}
            </div>

            <button
              type="button"
              className="classroom-map__all-lockers"
              onClick={() => setAllLockersOpen(true)}
            >
              <LayoutGrid size={14} aria-hidden />
              사물함 전체 보기
              {hiddenLockerCount > 0 && ` (+${hiddenLockerCount})`}
            </button>
          </div>

          <button
            type="button"
            className="classroom-map__move classroom-map__move--left"
            aria-label="교실 왼쪽으로 이동"
            disabled={camera === 0}
            onClick={() => setCamera((value) => Math.max(0, value - 1))}
          >
            <ChevronLeft size={24} aria-hidden />
          </button>

          <button
            type="button"
            className="classroom-map__move classroom-map__move--right"
            aria-label="교실 오른쪽으로 이동"
            disabled={camera === 2}
            onClick={() => setCamera((value) => Math.min(2, value + 1))}
          >
            <ChevronRight size={24} aria-hidden />
          </button>
        </section>

        <BottomSheet
          open={allLockersOpen}
          onClose={() => setAllLockersOpen(false)}
          title={`${classroom.name} 사물함`}
          description={`${classroom.lockers.length}명이 함께하고 있어요. 친구가 들어오면 사물함이 하나씩 늘어나요.`}
        >
          <div className="classroom-lockers-sheet">
            <div className="classroom-lockers-sheet__grid">
              {[...(myLocker ? [myLocker] : []), ...otherLockers].map((locker) => (
                <button
                  type="button"
                  key={locker.id}
                  className="classroom-lockers-sheet__item"
                  onClick={() =>
                    navigate(`/prototype/classroom/${id}/locker/${locker.id}`)
                  }
                >
                  <LockerMiniDoor
                    studentName={locker.studentName}
                    active={locker.id === member.lockerId}
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

        <div className="classroom-map__position" aria-hidden>
          {zoneLabels.map((label, index) => (
            <span
              key={label}
              className={
                index === camera
                  ? 'classroom-map__position-dot classroom-map__position-dot--active'
                  : 'classroom-map__position-dot'
              }
            />
          ))}
        </div>
      </main>
    </AppShell>
  )
}
