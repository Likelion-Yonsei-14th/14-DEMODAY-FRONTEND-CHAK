import type { PhotoElement, PositionedAsset } from '@/types/asset'

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

export type CardPage = {
  id: string
  backgroundAssetId: string
  textElements: TextElement[]
  wordArtElements: PositionedAsset[]
  stickerElements: PositionedAsset[]
  photoElements: PhotoElement[]
}

/**
 * The top-level card fields remain as an active-page snapshot for backwards
 * compatibility with persisted prototype data and older screens.
 * New multi-page flows use pages + activePageId as the source of truth.
 */
export type MessageDraft = Omit<CardPage, 'id'> & {
  id: string
  pages?: CardPage[]
  activePageId?: string
  visibility: MessageVisibility
  senderName: string
}

/**
 * 'sticker' is a gift with no written content: pages stay empty and only the
 * sender name and time are shown, to the desk owner only.
 */
export type MessageKind = 'card' | 'sticker'

export type Message = MessageDraft & {
  kind?: MessageKind
  stickerId?: string
  recipientDeskId: string
  status: MessageStatus
  createdAt: string
  readAt?: string
  previewColor?: string
}


export type MessageReaction = 'heart' | 'teary' | 'clap'

export type MessageReply = {
  id: string
  scope: 'single' | 'daily'
  sourceMessageId: string
  targetMessageIds: string[]
  targetSenderNames: string[]
  ownerName: string
  text: string
  createdAt: string
}
