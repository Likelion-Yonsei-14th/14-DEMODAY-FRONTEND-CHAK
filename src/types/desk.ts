export type DeskCreatedFor = 'self' | 'other'

export type DeskCreationDraft = {
  createdFor: DeskCreatedFor | null
  recipientDisplayName: string
  readMode: ReadMode
}

export type ReadMode =
  | {
      type: 'daily'
      unlockTime: string
    }
  | {
      type: 'time-capsule'
      unlockAt: string
    }

export type DeskObjectType =
  | 'memo'
  | 'photo-card'
  | 'charm'
  | 'poster-card'
  | 'letter'
  | 'ticket'
  | 'generic-card'
  | 'sticker'

/** Charm finish: a free flat sticker, or the paid clear-acrylic keychain. */
export type CharmMaterial = 'flat' | 'acrylic'

/**
 * A small rhinestone stuck on a desk object. Position and size are
 * percentages of the object's box, so gems scale with the object.
 */
export type DeskGem = {
  id: string
  gemId: string
  x: number
  y: number
  size: number
  rotation: number
  /** Set when the gem belongs to a shape set (star, heart, …). */
  patternId?: string
}

export type DeskZone = 'left' | 'center' | 'right' | 'back' | 'front'

export type DeskPlacement = {
  x: number
  y: number
  rotation: number
  scale: number
}

export type DeskObject = {
  id: string
  messageId: string
  representationType: DeskObjectType
  assetId?: string
  material?: CharmMaterial
  /** Short phrase printed on a charm's banner — visible on the desk to everyone. */
  charmPhrase?: string
  gems?: DeskGem[]
  color?: string
  zone: DeskZone
  order: number
  locked?: boolean
  x?: number
  y?: number
  rotation?: number
  scale?: number
  zIndex?: number
}

export type DeskTheme = {
  id: string
  name: string
  backgroundAssetId?: string
}

export type Desk = {
  id: string
  ownerId?: string
  creatorId?: string
  displayName: string
  createdFor?: DeskCreatedFor
  theme: DeskTheme
  readMode: ReadMode
  objects: DeskObject[]
  claimStatus: 'unclaimed' | 'claimed'
}


export type ConnectedRoom = {
  id: string
  name: string
  code: string
}

export type OwnerSettings = {
  publicFeedEnabled: boolean
  pushEnabled: boolean
  roomClosed: boolean
  blockedSupporters: string[]
  connectedRooms: ConnectedRoom[]
}
