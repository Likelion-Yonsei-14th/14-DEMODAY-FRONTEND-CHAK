export type AssetCategory = 'background' | 'word-art' | 'sticker' | 'photo'
export type BackgroundType = 'scalable' | 'repeatable' | 'fixed' | 'photo'
export type PhotoFrame = 'plain' | 'white' | 'polaroid'

export type AssetCapability = {
  movable: boolean
  scalable: boolean
  rotatable: boolean
}

export type AssetDefinition = {
  id: string
  name: string
  category: AssetCategory
  thumbnailSrc?: string
  sourceSrc?: string
  backgroundType?: BackgroundType
  capability: AssetCapability
  tags?: string[]
  isNew?: boolean
}

export type PositionedAsset = {
  id: string
  assetId: string
  x: number
  y: number
  scale: number
  rotation: number
  zIndex: number
}

export type PhotoElement = {
  id: string
  src: string
  role: 'background' | 'floating' | 'inline' | 'header'
  x?: number
  y?: number
  scale?: number
  rotation?: number
  frame?: PhotoFrame
  zIndex?: number
  aspectRatio?: number
  hasTransparency?: boolean
  alt?: string
}
