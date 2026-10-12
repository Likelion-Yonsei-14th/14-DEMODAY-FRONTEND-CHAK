export type ApiUser = {
  id: number
  displayName: string
  email: string | null
  profileImageUrl: string | null
  admin: boolean
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
