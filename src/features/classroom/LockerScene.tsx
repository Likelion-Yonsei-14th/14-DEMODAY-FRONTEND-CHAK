import {
  DeskObjectLayer,
} from '@/features/desk/DeskObjectLayer'
import type {
  ClassroomLocker,
  DeskPlacement,
  DeskObjectType,
  Message,
} from '@/types'
import './Classroom.css'
import './LockerScene.css'

type DraftLockerObject = {
  representationType: DeskObjectType
  placement: DeskPlacement
  previewColor: string
  dragging?: boolean
  onPointerDown?: React.PointerEventHandler<HTMLButtonElement>
}

type ClassroomLockerSceneProps = {
  locker: ClassroomLocker
  messages: Message[]
  open: boolean
  owner?: boolean
  readMessageIds?: string[]
  lockedMessageIds?: string[]
  onToggle?: () => void
  onObjectClick?: (messageId: string) => void
  draftObject?: DraftLockerObject
}

export function ClassroomLockerScene({
  locker,
  messages,
  open,
  owner = false,
  readMessageIds = [],
  lockedMessageIds = [],
  onToggle,
  onObjectClick,
  draftObject,
}: ClassroomLockerSceneProps) {
  return (
    <div
      className={[
        'locker-scene',
        open ? 'locker-scene--open' : 'locker-scene--closed',
      ].join(' ')}
      aria-label={`${locker.studentName}의 사물함`}
    >
      <div className="locker-scene__case">
        <div className="locker-scene__interior">
          <span className="locker-scene__back-panel" aria-hidden />
          <span className="locker-scene__side locker-scene__side--left" aria-hidden />
          <span className="locker-scene__side locker-scene__side--right" aria-hidden />
          <span className="locker-scene__ceiling" aria-hidden />
          <span className="locker-scene__floor-panel" aria-hidden />

          <div className="locker-scene__shelf locker-scene__shelf--top" />
          <div className="locker-scene__shelf locker-scene__shelf--bottom" />

          <span className="locker-scene__hook" aria-hidden />
          <span className="locker-scene__book locker-scene__book--one" aria-hidden />
          <span className="locker-scene__book locker-scene__book--two" aria-hidden />
          <span className="locker-scene__pouch" aria-hidden />

          <DeskObjectLayer
            objects={locker.objects}
            messages={messages}
            onObjectClick={onObjectClick}
            readMessageIds={readMessageIds}
            lockedMessageIds={lockedMessageIds}
            respectObjectLocks={false}
            showUnreadState={owner}
            draftObject={draftObject}
          />
        </div>

        <span className="locker-scene__hinge locker-scene__hinge--top" aria-hidden />
        <span className="locker-scene__hinge locker-scene__hinge--bottom" aria-hidden />

        <button
          type="button"
          className="locker-scene__door"
          aria-label={open ? '사물함 닫기' : '사물함 열기'}
          onClick={onToggle}
        >
          <span className="locker-scene__door-face locker-scene__door-face--front">
            <span className="locker-scene__nameplate">
              {locker.studentName}
            </span>
            <span className="locker-scene__vents locker-scene__vents--top" aria-hidden />
            <span className="locker-scene__handle" aria-hidden />
            <span className="locker-scene__vents locker-scene__vents--bottom" aria-hidden />
          </span>

          <span
            className="locker-scene__door-face locker-scene__door-face--back"
            aria-hidden
          >
            <span className="locker-scene__door-back-frame">
              <span className="locker-scene__door-back-panel">
                <span className="locker-scene__door-back-brace locker-scene__door-back-brace--top" />
                <span className="locker-scene__door-back-brace locker-scene__door-back-brace--bottom" />
              </span>
            </span>
            <span className="locker-scene__door-back-hinge-rail" />
            <span className="locker-scene__door-back-latch">
              <span className="locker-scene__door-back-latch-arm" />
            </span>
            <span className="locker-scene__door-back-screw locker-scene__door-back-screw--one" />
            <span className="locker-scene__door-back-screw locker-scene__door-back-screw--two" />
          </span>
        </button>
      </div>
    </div>
  )
}

export function LockerMiniDoor({
  studentName,
  active = false,
}: {
  studentName: string
  active?: boolean
}) {
  return (
    <span
      className={[
        'locker-mini',
        active ? 'locker-mini--active' : '',
      ].filter(Boolean).join(' ')}
      aria-hidden
    >
      <span className="locker-mini__name">{studentName}</span>
      <span className="locker-mini__vents" />
      <span className="locker-mini__handle" />
    </span>
  )
}
