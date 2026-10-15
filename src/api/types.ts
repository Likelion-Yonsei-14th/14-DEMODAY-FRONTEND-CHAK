export type ApiUser = {
  id: number
  displayName: string
  email: string | null
  profileImageUrl: string | null
  admin: boolean
  /** Which login the account was created with. */
  provider?: 'KAKAO' | 'GOOGLE'
}

/**
 * refreshToken is deliberately absent: the backend sets it as an HttpOnly
 * cookie, and the frontend never reads or stores it.
 */
export type AuthTokenResponse = {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  user: ApiUser
}

export type ApiErrorBody = {
  code: string
  message: string
}

export type SliceResponse<T> = {
  content: T[]
  page: number
  size: number
  hasNext: boolean
}

export type ApiReadModeType = 'DAILY' | 'TIME_CAPSULE'
export type ApiVisibility = 'PUBLIC' | 'PRIVATE'

export type ApiDeskObject = {
  representationType: string
  assetId: string | null
  color: string | null
  x: number
  y: number
  rotation: number
  scale: number
  zIndex: number
  metadata: Record<string, unknown> | null
}

export type ApiPublicDesk = {
  id: number
  displayName: string
  readModeType: ApiReadModeType
  dailyUnlockTime: string | null
  capsuleUnlockAt: string | null
  publicFeedEnabled: boolean
  defaultMessageVisibility: ApiVisibility
  roomClosed: boolean
}

export type ApiOwnerDesk = ApiPublicDesk & {
  supporterToken: string
  pushEnabled: boolean
  createdAt: string
  updatedAt: string
}

export type ApiCard = { pages: unknown[] } | null

export type ApiPublicMessage = {
  id: number
  authorDisplayName: string
  kind: 'CARD' | 'STICKER'
  visibility: ApiVisibility
  schemaVersion: number
  card: ApiCard
  object: ApiDeskObject | null
  unlockAt: string
  createdAt: string
}

export type ApiOwnerMessage = {
  deliveryId: number
  messageId: number
  authorDisplayName: string
  kind: 'CARD' | 'STICKER'
  visibility: ApiVisibility
  status: 'SENT' | 'READ'
  locked: boolean
  schemaVersion: number
  card: ApiCard
  object: ApiDeskObject | null
  unlockAt: string
  readAt: string | null
  basketedAt: string | null
  createdAt: string
}

export type ApiSendMessageRequest = {
  /** A paid order that covers acrylic charms / gems used by this letter. */
  paymentOrderId?: number
  nickname?: string
  kind: 'CARD' | 'STICKER'
  visibility: ApiVisibility
  schemaVersion: 1
  card: { pages: unknown[] } | null
  object: {
    representationType: string
    assetId?: string
    color?: string
    x: number
    y: number
    rotation: number
    scale: number
    zIndex: number
    metadata?: Record<string, unknown>
  }
}

export type ApiDeskWrite = {
  displayName: string
  readModeType: ApiReadModeType
  dailyUnlockTime: string | null
  capsuleUnlockAt: string | null
  publicFeedEnabled?: boolean
  defaultMessageVisibility?: ApiVisibility
}

// ---------- community ----------

export type ApiReaction = 'HEART' | 'TEARY' | 'CLAP'
export type ApiReplyScope = 'SINGLE' | 'DAILY'

export type ApiReply = {
  id: number
  scope: ApiReplyScope
  sourceMessageId: number | null
  targetMessageIds: number[]
  targetSenderNames: string[]
  ownerName: string
  text: string
  createdAt: string
}

export type ApiSupporter = {
  deliveryId: number
  displayName: string
  messageCount: number
  blocked: boolean
  blockId: number | null
}

export type ApiSentMessage = {
  messageId: number
  deskName: string | null
  supporterToken: string | null
  kind: 'CARD' | 'STICKER'
  visibility: ApiVisibility
  status: 'SENT' | 'READ'
  deletable: boolean
  schemaVersion: number
  card: ApiCard
  object: ApiDeskObject | null
  unlockAt: string | null
  readAt: string | null
  createdAt: string
}

// ---------- payments & unlocks ----------

export type ApiProductCode =
  | 'CHARM_ACRYLIC'
  | 'GEM'
  | 'UNIVERSITY_CHARM'
  | 'PENNANT'
  | 'LOCKER_BULB'
  | 'LOCKER_PAINT'

export type ApiOrder = {
  orderId: number
  status: 'CREATED' | 'PAID' | 'CANCELED'
  totalAmount: number
  consumed: boolean
  items: { code: ApiProductCode; ref: string | null; quantity: number; unitPrice: number; amount: number }[]
  createdAt: string
  paidAt: string | null
}

export type ApiUnlockCategory = 'STATIONERY' | 'DECOR'
export type ApiUnlock = { category: ApiUnlockCategory; assetId: string }

export type ApiAdvertisement = {
  id: number
  title: string
  creativeUrl: string
  destinationUrl: string
  placement: string
  startsAt: string
  endsAt: string
  active: boolean
}
