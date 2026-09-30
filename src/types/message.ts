import type { CanvasMode, PhotoElement, PositionedAsset } from '@/types/asset'

export type MessageVisibility = 'public' | 'private'
export type MessageStatus = 'draft' | 'sent' | 'read'

export type TextElement = {
  id: string
  text: string
  /**
   * Legacy preset kept so persisted prototype drafts and seeded messages
   * remain readable after the font system migration.
   */
  styleId?: string
  fontId?: string
  fontSize?: number
  color?: string
  x?: number
  y?: number
  width?: number
  zIndex?: number
  align?: 'left' | 'center' | 'right'
}

export type MessageDraft = {
  id: string
  canvasMode: CanvasMode
  backgroundAssetId: string
  textElements: TextElement[]
  wordArtElements: PositionedAsset[]
  stickerElements: PositionedAsset[]
  photoElements: PhotoElement[]
  visibility: MessageVisibility
  senderName: string
}

export type Message = MessageDraft & {
  recipientDeskId: string
  status: MessageStatus
  createdAt: string
  readAt?: string
  previewColor?: string
}
