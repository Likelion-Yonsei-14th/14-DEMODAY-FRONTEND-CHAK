import {
  DeskObjectLayer,
} from '@/features/desk/DeskObjectLayer'
import { useDeskDaypart } from '@/features/desk/useDeskDaypart'
import type {
  ClassroomLocker,
  DeskPlacement,
  DeskObjectType,
  Message,
} from '@/types'
import type { LockerDecor } from './lockerDecor'
import './Classroom.css'
import './LockerScene.css'

const LOCKER_ASSET_PATH = '/assets/classroom'

type DraftLockerObject = {
  representationType: DeskObjectType
  assetId?: string
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
  /** Owner-bought light and paint. */
  decor?: LockerDecor
}

/*
 * Two photographs of the same locker, cropped to the same box: closed, and
 * open with the inside of the door and the interior depth visible. They are
 * deliberately separate images — the open state is never a mirrored front.
 */
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
  decor,
}: ClassroomLockerSceneProps) {
  const daypart = useDeskDaypart()

  return (
    <div
      className={[
        'locker-v2',
        open ? 'locker-v2--open' : 'locker-v2--closed',
        `locker-v2--${daypart}`,
      ].join(' ')}
      aria-label={`${locker.studentName}의 사물함`}
    >
      <div className="locker-v2__stage">
        <img
          className="locker-v2__photo locker-v2__photo--closed"
          src={`${LOCKER_ASSET_PATH}/locker-closed.webp`}
          alt=""
          draggable={false}
        />
        {decor?.outside && (
          <img
            className="locker-v2__photo locker-v2__photo--closed"
            src={`${LOCKER_ASSET_PATH}/paint/closed-outside-${decor.outside}.webp`}
            alt=""
            draggable={false}
          />
        )}
        <img
          className="locker-v2__photo locker-v2__photo--open"
          src={`${LOCKER_ASSET_PATH}/locker-open.webp`}
          alt=""
          draggable={false}
        />
        {decor?.outside && (
          <img
            className="locker-v2__photo locker-v2__photo--open"
            src={`${LOCKER_ASSET_PATH}/paint/open-outside-${decor.outside}.webp`}
            alt=""
            draggable={false}
          />
        )}
        {decor?.inside && (
          <img
            className="locker-v2__photo locker-v2__photo--open"
            src={`${LOCKER_ASSET_PATH}/paint/open-inside-${decor.inside}.webp`}
            alt=""
            draggable={false}
          />
        )}
        {decor?.bulb && (
          <div className="locker-v2__light" aria-hidden>
            <span className="locker-v2__glow" />
            <span className="locker-v2__cord" />
            <img
              className={`locker-v2__bulb locker-v2__bulb--${decor.bulb}`}
              src={`${LOCKER_ASSET_PATH}/bulb-${decor.bulb}.webp`}
              alt=""
              draggable={false}
            />
          </div>
        )}

        <div className="locker-v2__object-zone" aria-hidden={!open}>
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

        <button
          type="button"
          className="locker-v2__front-door"
          aria-label="사물함 열기"
          disabled={open}
          tabIndex={open ? -1 : 0}
          onClick={onToggle}
        >
          <span className="locker-v2__nameplate">
            {locker.studentName}
          </span>
        </button>

        <button
          type="button"
          className="locker-v2__back-door"
          aria-label="사물함 닫기"
          disabled={!open}
          tabIndex={open ? 0 : -1}
          onClick={onToggle}
        />
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
      <img
        className="locker-mini__photo"
        src={`${LOCKER_ASSET_PATH}/locker-tile.webp`}
        alt=""
        draggable={false}
      />
      <span className="locker-mini__name">{studentName}</span>
    </span>
  )
}
