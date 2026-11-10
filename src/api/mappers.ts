import type {
  ApiReply,
  ApiDeskObject,
  ApiDeskWrite,
  ApiOwnerDesk,
  ApiOwnerMessage,
  ApiPublicDesk,
  ApiPublicMessage,
  ApiSendMessageRequest,
} from '@/api/types'
import { getComposerBackground } from '@/features/composer/backgroundAssets'
import { getMessagePages } from '@/features/composer/messagePages'
import { resolveDeskZone } from '@/features/supporter/supporterFlow'
import type {
  CardPage,
  CharmMaterial,
  Desk,
  DeskGem,
  DeskObject,
  DeskObjectType,
  DeskPlacement,
  DeskZone,
  Message,
  MessageDraft,
  MessageReply,
  ReadMode,
} from '@/types'

// ---------- enums ----------

/**
 * App-only object types the backend enum does not know yet. They travel as an
 * existing server type and are told apart by metadata.objectKind, so they
 * work without a backend deploy.
 */
const CLIENT_OBJECT_KINDS: Partial<Record<DeskObjectType, string>> = {
  pepero: 'GENERIC_CARD',
}

export const objectTypeToApi = (type: DeskObjectType) =>
  CLIENT_OBJECT_KINDS[type] ?? type.replaceAll('-', '_').toUpperCase()

export const objectTypeFromApi = (type: string, objectKind?: string) =>
  objectKind && objectKind in CLIENT_OBJECT_KINDS
    ? (objectKind as DeskObjectType)
    : (type.toLowerCase().replaceAll('_', '-') as DeskObjectType)

// ---------- read mode ----------

export function readModeToApi(
  readMode: ReadMode,
): Pick<ApiDeskWrite, 'readModeType' | 'dailyUnlockTime' | 'capsuleUnlockAt'> {
  if (readMode.type === 'daily') {
    const time = readMode.unlockTime
    return {
      readModeType: 'DAILY',
      dailyUnlockTime: time.length === 5 ? `${time}:00` : time,
      capsuleUnlockAt: null,
    }
  }
  return {
    readModeType: 'TIME_CAPSULE',
    dailyUnlockTime: null,
    capsuleUnlockAt: new Date(readMode.unlockAt).toISOString(),
  }
}

export function readModeFromApi(desk: ApiPublicDesk): ReadMode {
  if (desk.readModeType === 'DAILY') {
    return { type: 'daily', unlockTime: (desk.dailyUnlockTime ?? '22:00:00').slice(0, 5) }
  }
  const unlockAt = desk.capsuleUnlockAt ? new Date(desk.capsuleUnlockAt) : new Date()
  return { type: 'time-capsule', unlockAt: toLocalDateTimeValue(unlockAt) }
}

/**
 * The server sends an instant in UTC ("…T11:00:00Z"), but the app keeps the
 * capsule time as the owner's own wall clock ("YYYY-MM-DDTHH:mm") so date and
 * time pickers can show it as-is.
 */
function toLocalDateTimeValue(date: Date) {
  if (Number.isNaN(date.getTime())) return ''
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// ---------- objects ----------

type ObjectMetadata = {
  zone?: DeskZone
  order?: number
  material?: CharmMaterial
  charmPhrase?: string
  gems?: DeskGem[]
  locked?: boolean
  /** App-only object type riding on a server type (see CLIENT_OBJECT_KINDS). */
  objectKind?: string
}

export function objectFromApi(
  object: ApiDeskObject,
  messageId: string,
  index: number,
  visibility: 'public' | 'private',
): DeskObject {
  const meta = (object.metadata ?? {}) as ObjectMetadata
  return {
    id: `desk-object-${messageId}`,
    messageId,
    representationType: objectTypeFromApi(object.representationType, meta.objectKind),
    assetId: object.assetId ?? undefined,
    color: object.color ?? undefined,
    x: object.x,
    y: object.y,
    rotation: object.rotation,
    scale: object.scale,
    zIndex: object.zIndex,
    zone: meta.zone ?? resolveDeskZone(index),
    order: meta.order ?? index,
    material: meta.material,
    charmPhrase: meta.charmPhrase,
    gems: meta.gems,
    locked: meta.locked ?? visibility === 'private',
  }
}

// ---------- messages ----------

const EMPTY_PAGE_FIELDS = {
  textElements: [],
  wordArtElements: [],
  stickerElements: [],
  photoElements: [],
} as const

function pagesFromApi(card: { pages: unknown[] } | null): CardPage[] {
  return ((card?.pages ?? []) as CardPage[]).map((page) => ({
    ...EMPTY_PAGE_FIELDS,
    ...page,
  }))
}

type CommonMessage = {
  id: string
  authorDisplayName: string
  kind: 'CARD' | 'STICKER'
  visibility: 'PUBLIC' | 'PRIVATE'
  card: { pages: unknown[] } | null
  object: ApiDeskObject | null
  createdAt: string
  unlockAt: string
}

function buildMessage(
  common: CommonMessage,
  deskId: string,
  extra: Pick<Message, 'status' | 'readAt' | 'deliveryId'>,
): Message {
  const pages = pagesFromApi(common.card)
  const first = pages[0]
  const visibility = common.visibility === 'PUBLIC' ? 'public' : 'private'
  const kind = common.kind === 'STICKER' ? 'sticker' : 'card'

  return {
    id: common.id,
    backgroundAssetId: first?.backgroundAssetId ?? '',
    textElements: first?.textElements ?? [],
    wordArtElements: first?.wordArtElements ?? [],
    stickerElements: first?.stickerElements ?? [],
    photoElements: first?.photoElements ?? [],
    pages,
    activePageId: first?.id,
    visibility,
    senderName: common.authorDisplayName,
    kind,
    ...(kind === 'sticker' && common.object?.assetId
      ? { stickerId: common.object.assetId }
      : {}),
    recipientDeskId: deskId,
    createdAt: common.createdAt,
    unlockAt: common.unlockAt,
    ...(first ? { previewColor: getComposerBackground(first.backgroundAssetId).tone } : {}),
    ...extra,
  }
}

export type MappedMessages = {
  messages: Message[]
  objects: DeskObject[]
  readMessageIds: string[]
  basketMessageIds: string[]
}

export function publicMessagesFromApi(
  items: ApiPublicMessage[],
  deskId: string,
): MappedMessages {
  const messages: Message[] = []
  const objects: DeskObject[] = []
  items.forEach((item, index) => {
    const id = String(item.id)
    const message = buildMessage({ ...item, id }, deskId, { status: 'sent' })
    messages.push(message)
    if (item.object) {
      objects.push(objectFromApi(item.object, id, index, message.visibility))
    }
  })
  return { messages, objects, readMessageIds: [], basketMessageIds: [] }
}

export function ownerMessagesFromApi(
  items: ApiOwnerMessage[],
  deskId: string,
): MappedMessages {
  const messages: Message[] = []
  const objects: DeskObject[] = []
  const readMessageIds: string[] = []
  const basketMessageIds: string[] = []

  items.forEach((item, index) => {
    const id = String(item.messageId)
    const read = item.status === 'READ'
    const message = buildMessage({ ...item, id }, deskId, {
      status: read ? 'read' : 'sent',
      readAt: item.readAt ?? undefined,
      deliveryId: item.deliveryId,
    })
    messages.push(message)
    if (read) readMessageIds.push(id)
    if (item.basketedAt) basketMessageIds.push(id)
    if (item.object) {
      objects.push(objectFromApi(item.object, id, index, message.visibility))
    }
  })
  return { messages, objects, readMessageIds, basketMessageIds }
}

// ---------- desks ----------

export function deskFromApi(
  desk: ApiPublicDesk | ApiOwnerDesk,
  base: Desk,
  objects: DeskObject[],
  supporterToken: string,
): Desk {
  return {
    ...base,
    id: String(desk.id),
    displayName: desk.displayName,
    readMode: readModeFromApi(desk),
    objects,
    claimStatus: 'claimed',
    supporterToken,
  }
}

// ---------- sending ----------

export type SendLetterInput = {
  draft: MessageDraft
  nickname?: string
  objectType: DeskObjectType
  objectColor?: string
  placement: DeskPlacement
  zone: DeskZone
  order: number
  zIndex: number
  charm?: { assetId: string; material: CharmMaterial; charmPhrase?: string }
  /** Artwork of a non-charm object, e.g. the 빼빼로 flavor. */
  assetId?: string
  gems?: DeskGem[]
  paymentOrderId?: number
}

export function letterRequest(input: SendLetterInput): ApiSendMessageRequest {
  const { draft, placement } = input
  return {
    nickname: input.nickname,
    ...(input.paymentOrderId ? { paymentOrderId: input.paymentOrderId } : {}),
    kind: 'CARD',
    visibility: draft.visibility === 'public' ? 'PUBLIC' : 'PRIVATE',
    schemaVersion: 1,
    card: { pages: getMessagePages(draft) },
    object: {
      representationType: objectTypeToApi(input.objectType),
      assetId: input.charm?.assetId ?? input.assetId,
      color: input.objectColor,
      x: placement.x,
      y: placement.y,
      rotation: placement.rotation,
      scale: placement.scale,
      zIndex: input.zIndex,
      metadata: {
        zone: input.zone,
        order: input.order,
        ...(input.objectType in CLIENT_OBJECT_KINDS
          ? { objectKind: input.objectType }
          : {}),
        ...(input.charm
          ? { material: input.charm.material, charmPhrase: input.charm.charmPhrase }
          : {}),
        ...(input.gems?.length ? { gems: input.gems } : {}),
        locked: draft.visibility === 'private',
      },
    },
  }
}

export type SendStickerInput = {
  stickerId: string
  nickname?: string
  placement: DeskPlacement
  zone: DeskZone
  order: number
  zIndex: number
}

export function stickerRequest(input: SendStickerInput): ApiSendMessageRequest {
  return {
    nickname: input.nickname,
    kind: 'STICKER',
    visibility: 'PRIVATE',
    schemaVersion: 1,
    card: null,
    object: {
      representationType: 'STICKER',
      assetId: input.stickerId,
      x: input.placement.x,
      y: input.placement.y,
      rotation: input.placement.rotation,
      scale: input.placement.scale,
      zIndex: input.zIndex,
      metadata: { zone: input.zone, order: input.order },
    },
  }
}

// ---------- replies ----------

export function replyFromApi(reply: ApiReply): MessageReply {
  return {
    id: String(reply.id),
    scope: reply.scope === 'DAILY' ? 'daily' : 'single',
    sourceMessageId: String(reply.sourceMessageId ?? reply.targetMessageIds[0] ?? ''),
    targetMessageIds: reply.targetMessageIds.map(String),
    targetSenderNames: reply.targetSenderNames,
    ownerName: reply.ownerName,
    text: reply.text,
    createdAt: reply.createdAt,
  }
}

/** First line of text on the first page of a card, for list previews. */
export function cardPreviewText(card: { pages: unknown[] } | null): string {
  const first = card?.pages?.[0] as { textElements?: { text?: string }[] } | undefined
  return first?.textElements?.[0]?.text ?? ''
}
