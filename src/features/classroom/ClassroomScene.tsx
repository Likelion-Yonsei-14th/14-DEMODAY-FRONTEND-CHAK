import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react'
import { useDeskDaypart } from '@/features/desk/useDeskDaypart'
import { CABINET_CELLS, cabinetCells, classroomZoneLabels } from './classroomCabinet'
import './Classroom.css'

/** classroom-day/night.webp are 1344 × 576. */
const CLASSROOM_PHOTO_RATIO = 1344 / 576

/** One locker per door of the cabinet drawn on the right wall; the rest are empty seats. */
const SCENE_LOCKER_MAX = CABINET_CELLS

export type SceneLocker = {
  id: string
  name: string
  mine: boolean
  /** Name tag text; defaults to the name, starred for my own locker. */
  tag?: string
  /** Outside paint colour of the door, if the owner painted it. */
  paintSwatch?: string
}

type ClassroomSceneProps = {
  ariaLabel: string
  camera: number
  onCameraChange: (camera: number) => void
  /** The board overlay; give it the `classroom-map__blackboard` class. */
  blackboard: ReactNode
  /** Lockers in cabinet order; extras beyond the cabinet are only in "전체 보기". */
  lockers: SceneLocker[]
  onLockerClick: (lockerId: string) => void
  emptyLockerLabel: string
  onEmptyLockerClick: () => void
  onShowAllLockers: () => void
  showAllLabel?: string
}

/**
 * The class template: a horizontally explorable classroom photo with a board
 * and a cubby cabinet, one door per member. Shared by 우리 반 and the
 * graduation rolling paper.
 */
export function ClassroomScene({
  ariaLabel,
  camera,
  onCameraChange,
  blackboard,
  lockers,
  onLockerClick,
  emptyLockerLabel,
  onEmptyLockerClick,
  onShowAllLockers,
  showAllLabel = '사물함 전체 보기',
}: ClassroomSceneProps) {
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
  const bankLockers = lockers.slice(0, SCENE_LOCKER_MAX)
  const hiddenLockerCount = lockers.length - bankLockers.length

  return (
    <>
      <section
        ref={viewportRef}
        className={`classroom-map__viewport classroom-map__viewport--${daypart}`}
        aria-label={ariaLabel}
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
          {blackboard}

          {/* Doors of the cubby cabinet drawn on the right wall */}
          <div className="classroom-map__cabinet">
            {cabinetCells.map((cell, index) => {
              const locker = bankLockers[index]

              return (
                <button
                  type="button"
                  key={locker?.id ?? `empty-${index}`}
                  className={[
                    'classroom-map__cubby',
                    locker ? '' : 'classroom-map__cubby--empty',
                    locker?.mine ? 'classroom-map__cubby--mine' : '',
                  ].filter(Boolean).join(' ')}
                  style={{
                    clipPath: cell.clipPath,
                    '--cubby-paint': locker?.paintSwatch,
                  } as React.CSSProperties}
                  aria-label={
                    locker ? `${locker.name}의 사물함` : emptyLockerLabel
                  }
                  onClick={() =>
                    locker ? onLockerClick(locker.id) : onEmptyLockerClick()
                  }
                />
              )
            })}
            {cabinetCells.map((cell, index) => {
              const locker = bankLockers[index]
              if (!locker) return null

              return (
                <span
                  key={`label-${locker.id}`}
                  className={[
                    'classroom-map__cubby-name',
                    locker.mine ? 'classroom-map__cubby-name--mine' : '',
                  ].filter(Boolean).join(' ')}
                  style={{
                    left: cell.labelLeft,
                    top: cell.labelTop,
                    transform: `translate(-50%, -50%) rotate(${cell.labelAngle}deg)`,
                  }}
                  aria-hidden
                >
                  {locker.tag ?? (locker.mine ? `★ ${locker.name}` : locker.name)}
                </span>
              )
            })}
          </div>

          <button
            type="button"
            className="classroom-map__all-lockers"
            onClick={onShowAllLockers}
          >
            <LayoutGrid size={14} aria-hidden />
            {showAllLabel}
            {hiddenLockerCount > 0 && ` (+${hiddenLockerCount})`}
          </button>
        </div>

        <button
          type="button"
          className="classroom-map__move classroom-map__move--left"
          aria-label="교실 왼쪽으로 이동"
          disabled={camera === 0}
          onClick={() => onCameraChange(Math.max(0, camera - 1))}
        >
          <ChevronLeft size={24} aria-hidden />
        </button>

        <button
          type="button"
          className="classroom-map__move classroom-map__move--right"
          aria-label="교실 오른쪽으로 이동"
          disabled={camera === 2}
          onClick={() => onCameraChange(Math.min(2, camera + 1))}
        >
          <ChevronRight size={24} aria-hidden />
        </button>
      </section>

      <div className="classroom-map__position" aria-hidden>
        {classroomZoneLabels.map((label, index) => (
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
    </>
  )
}
