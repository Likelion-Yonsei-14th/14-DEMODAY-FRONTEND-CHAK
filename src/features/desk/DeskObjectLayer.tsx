import { LockKeyhole } from 'lucide-react'
import type {
  CharmMaterial,
  DeskGem,
  DeskObject,
  DeskObjectType,
  DeskPlacement,
  Message,
} from '@/types'
import { resolveObjectPlacement } from '@/features/supporter/supporterFlow'
import { getDeskSticker } from '@/features/supporter/deskStickers'
import {
  getCharmDesign,
  getCharmImage,
  resolveCharmPhrase,
} from '@/features/supporter/charmDesigns'
import { getGemImage } from '@/features/supporter/gems'
import { UniversityCharm } from '@/features/classroom/UniversityCharm'
import { parseUniversityCharmId } from '@/features/classroom/universities'
import { useDeskDaypart } from './useDeskDaypart'
import './DeskObjectLayer.css'

type DraftObject = {
  representationType: DeskObjectType
  assetId?: string
  material?: CharmMaterial
  charmPhrase?: string
  gems?: DeskGem[]
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
  lockedMessageIds?: string[]
  respectObjectLocks?: boolean
  showUnreadState?: boolean
  draftObject?: DraftObject
}

export function DeskObjectLayer({
  objects = [],
  messages = [],
  onObjectClick,
  openingMessageId,
  readMessageIds = [],
  lockedMessageIds = [],
  respectObjectLocks = true,
  showUnreadState = true,
  draftObject,
}: DeskObjectLayerProps) {
  const messageById = new Map(messages.map((message) => [message.id, message]))
  const daypart = useDeskDaypart()

  return (
    <div
      className={`desk-object-layer desk-object-layer--${daypart}`}
      aria-label="책상 위 응원 오브젝트"
    >
      {objects.map((object) => {
        const placement = resolveObjectPlacement(object)
        const message = messageById.get(object.messageId)
        const previewColor =
          object.color ?? message?.previewColor ?? '#D8644A'
        const interactive = Boolean(onObjectClick)
        const read =
          message?.status === 'read' ||
          readMessageIds.includes(object.messageId)
        const locked =
          lockedMessageIds.includes(object.messageId) ||
          (respectObjectLocks && Boolean(object.locked))
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
              stickerShapeClass(object.representationType, object.assetId),
              locked ? 'desk-object--locked' : '',
              !interactive ? 'desk-object--passive' : '',
              interactive && showUnreadState && !read && !locked
                ? 'desk-object--unread'
                : '',
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
                  ? object.representationType === 'sticker'
                    ? `${message.senderName}님이 붙인 스티커`
                    : locked
                    ? `아직 열리지 않은 ${message.senderName}님의 응원`
                    : `${message.senderName}의 ${showUnreadState && !read ? '새 ' : ''}응원 열기`
                  : '응원 열기'
                : undefined
            }
            tabIndex={interactive ? 0 : -1}
            onClick={() => onObjectClick?.(object.messageId)}
          >
            <DeskObjectVisual
              type={object.representationType}
              assetId={object.assetId}
              material={object.material}
              charmPhrase={object.charmPhrase}
              gems={object.gems}
              seed={object.id}
            />
            {locked && (
              <span className="desk-object__lock" aria-hidden>
                <LockKeyhole size={11} />
              </span>
            )}
            {interactive && showUnreadState && !read && !locked && (
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
            stickerShapeClass(
              draftObject.representationType,
              draftObject.assetId,
            ),
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
          <DeskObjectVisual
            type={draftObject.representationType}
            assetId={draftObject.assetId}
            material={draftObject.material}
            charmPhrase={draftObject.charmPhrase}
            gems={draftObject.gems}
            seed="draft"
          />
          <span className="desk-object__drag-hint">여기를 잡고 옮겨요</span>
        </button>
      )}
    </div>
  )
}

const DESK_ASSET_PATH = '/assets/desk'

const TAPE_IMAGES = [
  'tape-cream',
  'tape-pink',
  'tape-sage',
  'tape-blue',
  'tape-mustard',
  'washi-mint',
  'washi-pink',
]

const TAPED_TYPES: DeskObjectType[] = [
  'memo',
  'photo-card',
  'poster-card',
  'ticket',
  'generic-card',
]

function hashSeed(seed: string) {
  let hash = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/**
 * Small organic differences derived only from the object id: the same object
 * always looks the same on every screen, and stored placement is untouched.
 */
function resolveVisualVariation(seed: string) {
  const hash = hashSeed(seed)

  return {
    tapeImage: TAPE_IMAGES[hash % TAPE_IMAGES.length]!,
    tapeX: 32 + ((hash >>> 3) % 37),
    tapeRotation: ((hash >>> 9) % 25) - 12,
    jitterRotation: (((hash >>> 14) % 7) - 3) * 0.6,
    jitterScale: 0.97 + ((hash >>> 17) % 7) * 0.01,
    linedPaper: (hash >>> 20) % 3 === 0,
    // How far the paper sits off the wood (curl, thickness): shadow spread
    lift: 0.75 + ((hash >>> 23) % 6) * 0.1,
    dogEar: (hash >>> 26) % 3 === 0,
    curlCorner: CURL_CORNERS[(hash >>> 28) % CURL_CORNERS.length]!,
  }
}

const CURL_CORNERS = ['top left', 'bottom left', 'bottom right', 'none']

const DOG_EAR_TYPES: DeskObjectType[] = ['memo', 'poster-card', 'ticket']

export function DeskObjectVisual({
  type,
  assetId,
  material,
  charmPhrase,
  gems,
  seed,
}: {
  type: DeskObjectType
  assetId?: string
  material?: CharmMaterial
  charmPhrase?: string
  gems?: DeskGem[]
  seed?: string
}) {
  const gemLayer = gems?.length ? <DeskGemLayer gems={gems} /> : null

  const variation = resolveVisualVariation(seed ?? type)
  const style = {
    '--visual-jitter-rotation': `${variation.jitterRotation}deg`,
    '--visual-jitter-scale': variation.jitterScale,
    '--tape-image': `url('${DESK_ASSET_PATH}/${variation.tapeImage}.webp')`,
    '--tape-x': `${variation.tapeX}%`,
    '--tape-rotation': `${variation.tapeRotation}deg`,
    '--lift': variation.lift,
    '--curl-at': variation.curlCorner,
  } as React.CSSProperties
  const dogEar = variation.dogEar && DOG_EAR_TYPES.includes(type)

  if (type === 'sticker') {
    return (
      <span className="desk-object__visual" style={style} aria-hidden>
        <img
          className="desk-object__sticker"
          src={getDeskSticker(assetId).source}
          alt=""
          draggable={false}
        />
      </span>
    )
  }

  const universityCharm =
    type === 'charm' ? parseUniversityCharmId(assetId) : null
  if (universityCharm) {
    // Locker university goods: always an acrylic keyring
    return (
      <span
        className="desk-object__visual desk-object__visual--charm-acrylic"
        style={style}
        aria-hidden
      >
        <span className="desk-object__charm desk-object__charm--university">
          <UniversityCharm
            school={universityCharm.school}
            shape={universityCharm.shape}
          />
        </span>
        {gemLayer}
      </span>
    )
  }

  if (type === 'charm' && assetId) {
    const design = getCharmDesign(assetId)
    const finish = material ?? 'flat'
    const phrase = resolveCharmPhrase(assetId, charmPhrase)

    return (
      <span
        className={`desk-object__visual desk-object__visual--charm-${finish}`}
        style={style}
        aria-hidden
      >
        <span
          className="desk-object__charm"
          style={{
            '--charm-ink': design.ink,
            '--charm-phrase-length': Math.max(phrase.length, 5),
          } as React.CSSProperties}
        >
          <img
            className="desk-object__charm-art"
            src={getCharmImage(assetId, finish)}
            alt=""
            draggable={false}
          />
          <span className="desk-object__charm-phrase">{phrase}</span>
        </span>
        {gemLayer}
      </span>
    )
  }

  const lined = type === 'memo' && variation.linedPaper

  return (
    <span
      className={[
        'desk-object__visual',
        lined ? 'desk-object__visual--lined' : '',
        dogEar ? 'desk-object__visual--dog-ear' : '',
        variation.curlCorner !== 'none' ? 'desk-object__visual--curl' : '',
      ].filter(Boolean).join(' ')}
      style={style}
      aria-hidden
    >
      {type === 'charm' && <span className="desk-object__string" />}
      {type === 'photo-card' ? (
        <>
          <span className="desk-object__photo" />
          <span className="desk-object__frame" />
          <span className="desk-object__light" />
        </>
      ) : (
        <span className="desk-object__paper">
          {type === 'charm' && (
            <span className="desk-object__charm-text">합격</span>
          )}
          {type === 'ticket' && (
            <span className="desk-object__ticket-text">응원권</span>
          )}
          {(type === 'memo' || type === 'poster-card' || type === 'generic-card') &&
            !lined && (
              <>
                <span className="desk-object__line" />
                <span className="desk-object__line" />
                <span className="desk-object__line" />
              </>
            )}
          <span className="desk-object__light" />
        </span>
      )}
      {dogEar && <span className="desk-object__dog-ear" />}
      {type === 'poster-card' && (
        <span className="desk-object__label">FIGHTING!</span>
      )}
      {TAPED_TYPES.includes(type) && <span className="desk-object__tape" />}
      {gemLayer}
    </span>
  )
}

export function DeskGemLayer({ gems }: { gems: DeskGem[] }) {
  return (
    <span className="desk-object__gems">
      {gems.map((gem) => (
        <img
          key={gem.id}
          className="desk-object__gem"
          src={getGemImage(gem.gemId)}
          alt=""
          draggable={false}
          style={{
            left: `${gem.x}%`,
            top: `${gem.y}%`,
            width: `${gem.size}%`,
            transform: `translate(-50%, -50%) rotate(${gem.rotation}deg)`,
          }}
        />
      ))}
    </span>
  )
}

/** Wide stickers (garlands, pennants) need their own box size. */
function stickerShapeClass(type: DeskObjectType, assetId?: string) {
  if (type !== 'sticker') return ''
  return `desk-object--sticker-${getDeskSticker(assetId).shape ?? 'square'}`
}
