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
        'locker-v2',
        open ? 'locker-v2--open' : 'locker-v2--closed',
      ].join(' ')}
      aria-label={`${locker.studentName}의 사물함`}
    >
      <div className="locker-v2__stage">
        <div className="locker-v2__cabinet" aria-hidden={!open}>
          <div className="locker-v2__frame">
            <span className="locker-v2__back" aria-hidden />
            <span className="locker-v2__wall locker-v2__wall--left" aria-hidden />
            <span className="locker-v2__wall locker-v2__wall--right" aria-hidden />
            <span className="locker-v2__roof" aria-hidden />
            <span className="locker-v2__floor" aria-hidden />

            <span className="locker-v2__shelf" aria-hidden />
            <span className="locker-v2__hook" aria-hidden />
            <span className="locker-v2__notebook locker-v2__notebook--blue" aria-hidden />
            <span className="locker-v2__notebook locker-v2__notebook--cream" aria-hidden />
            <span className="locker-v2__pouch" aria-hidden />

            <div className="locker-v2__object-zone">
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
          </div>

          <span className="locker-v2__cabinet-hinge locker-v2__cabinet-hinge--top" aria-hidden />
          <span className="locker-v2__cabinet-hinge locker-v2__cabinet-hinge--bottom" aria-hidden />
        </div>

        <button
          type="button"
          className="locker-v2__front-door"
          aria-label="사물함 열기"
          disabled={open}
          tabIndex={open ? -1 : 0}
          onClick={onToggle}
        >
          <span className="locker-v2__front-inner">
            <span className="locker-v2__nameplate">
              {locker.studentName}
            </span>

            <span className="locker-v2__front-vents locker-v2__front-vents--top" aria-hidden>
              <i /><i /><i /><i />
            </span>

            <span className="locker-v2__front-lock" aria-hidden>
              <span className="locker-v2__front-keyhole" />
            </span>

            <span className="locker-v2__front-vents locker-v2__front-vents--bottom" aria-hidden>
              <i /><i /><i /><i />
            </span>
          </span>
        </button>

        <button
          type="button"
          className="locker-v2__back-door"
          aria-label="사물함 닫기"
          disabled={!open}
          tabIndex={open ? 0 : -1}
          onClick={onToggle}
        >
          <span className="locker-v2__back-door-frame">
            <span className="locker-v2__back-door-panel">
              <span className="locker-v2__back-door-brace locker-v2__back-door-brace--top" />
              <span className="locker-v2__back-door-brace locker-v2__back-door-brace--bottom" />
            </span>

            <span className="locker-v2__back-hinge-rail" />
            <span className="locker-v2__back-latch">
              <span className="locker-v2__back-latch-arm" />
            </span>
            <span className="locker-v2__back-screw locker-v2__back-screw--top" />
            <span className="locker-v2__back-screw locker-v2__back-screw--bottom" />
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
