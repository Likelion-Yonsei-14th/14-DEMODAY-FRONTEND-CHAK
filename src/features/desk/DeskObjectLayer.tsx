import type {
  DeskObject,
  DeskObjectType,
  DeskPlacement,
  Message,
} from '@/types'
import { resolveObjectPlacement } from '@/features/supporter/supporterFlow'
import './DeskObjectLayer.css'

type DraftObject = {
  representationType: DeskObjectType
  placement: DeskPlacement
  previewColor: string
  invalid?: boolean
  dragging?: boolean
  onPointerDown?: React.PointerEventHandler<HTMLButtonElement>
}

type DeskObjectLayerProps = {
  objects?: DeskObject[]
  messages?: Message[]
  onObjectClick?: (messageId: string) => void
  openingMessageId?: string | null
  readMessageIds?: string[]
  draftObject?: DraftObject
}

export function DeskObjectLayer({
  objects = [],
  messages = [],
  onObjectClick,
  openingMessageId,
  readMessageIds = [],
  draftObject,
}: DeskObjectLayerProps) {
  const messageById = new Map(messages.map((message) => [message.id, message]))

  return (
    <div className="desk-object-layer" aria-label="책상 위 응원 오브젝트">
      {objects.map((object) => {
        const placement = resolveObjectPlacement(object)
        const message = messageById.get(object.messageId)
        const previewColor =
          object.color ?? message?.previewColor ?? '#F4C6BC'
        const interactive = Boolean(onObjectClick)
        const read =
          message?.status === 'read' ||
          readMessageIds.includes(object.messageId)
        const opening = openingMessageId === object.messageId
        const deemphasized = Boolean(
          openingMessageId && openingMessageId !== object.messageId,
        )

        return (
          <button
            type="button"
            key={object.id}
            className={[
              'desk-object',
              `desk-object--${object.representationType}`,
              object.locked ? 'desk-object--locked' : '',
              !interactive ? 'desk-object--passive' : '',
              interactive && !read ? 'desk-object--unread' : '',
              opening ? 'desk-object--opening' : '',
              deemphasized ? 'desk-object--deemphasized' : '',
            ].filter(Boolean).join(' ')}
            style={{
              left: `${placement.x}%`,
              top: `${placement.y}%`,
              zIndex: object.zIndex ?? object.order + 10,
              '--desk-object-color': previewColor,
              '--desk-object-rotation': `${placement.rotation}deg`,
              '--desk-object-scale': placement.scale,
            } as React.CSSProperties}
            aria-label={
              interactive
                ? message
                  ? `${message.senderName}의 ${read ? '' : '새 '}응원 열기`
                  : '응원 열기'
                : undefined
            }
            tabIndex={interactive ? 0 : -1}
            onClick={() => onObjectClick?.(object.messageId)}
          >
            <DeskObjectVisual type={object.representationType} />
            {interactive && !read && (
              <span className="desk-object__unread-dot" aria-hidden />
            )}
          </button>
        )
      })}

      {draftObject && (
        <button
          type="button"
          className={[
            'desk-object',
            'desk-object--draft',
            `desk-object--${draftObject.representationType}`,
            draftObject.invalid ? 'desk-object--invalid' : '',
            draftObject.dragging ? 'desk-object--dragging' : '',
          ].filter(Boolean).join(' ')}
          style={{
            left: `${draftObject.placement.x}%`,
            top: `${draftObject.placement.y}%`,
            zIndex: 120,
            '--desk-object-color': draftObject.previewColor,
            '--desk-object-rotation': `${draftObject.placement.rotation}deg`,
            '--desk-object-scale': draftObject.placement.scale,
          } as React.CSSProperties}
          aria-label="내 응원 위치 옮기기"
          onPointerDown={draftObject.onPointerDown}
        >
          <DeskObjectVisual type={draftObject.representationType} />
          <span className="desk-object__drag-hint">여기를 잡고 옮겨요</span>
        </button>
      )}
    </div>
  )
}

export function DeskObjectVisual({ type }: { type: DeskObjectType }) {
  return (
    <span className="desk-object__visual" aria-hidden>
      <span className="desk-object__paper">
        <span className="desk-object__line" />
        <span className="desk-object__line" />
        <span className="desk-object__line" />
      </span>
      {type === 'photo-card' && <span className="desk-object__photo" />}
      {type === 'charm' && <span className="desk-object__charm-knot" />}
      {type === 'ticket' && <span className="desk-object__ticket-notch" />}
      <span className="desk-object__seal" />
    </span>
  )
}
