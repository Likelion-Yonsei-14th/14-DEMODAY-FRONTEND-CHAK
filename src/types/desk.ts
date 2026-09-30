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

export type DeskObject = {
  id: string
  messageId: string
  representationType: DeskObjectType
  assetId?: string
  zone: DeskZone
  order: number
  locked?: boolean
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
  theme: DeskTheme
  readMode: ReadMode
  objects: DeskObject[]
  claimStatus: 'unclaimed' | 'claimed'
}
