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
