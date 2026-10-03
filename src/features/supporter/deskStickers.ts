import {
  getMessageAvailability,
  type MessageAvailability,
} from '@/features/desk/dailyAvailability'
import type { DeskObjectType, Message, ReadMode } from '@/types'

export type DeskSticker = {
  id: string
  name: string
  source: string
}

const DESK_STICKER_PATH = '/assets/desk-stickers'

/** Bedazzled die-cut stickers (rhinestone mosaic) left as a gift on the desk. */
export const deskStickers: DeskSticker[] = [
  { id: 'desk-sticker-star', name: '웃는 별', source: `${DESK_STICKER_PATH}/desk-sticker-star.webp` },
  { id: 'desk-sticker-heart', name: '하트', source: `${DESK_STICKER_PATH}/desk-sticker-heart.webp` },
  { id: 'desk-sticker-clover', name: '네잎클로버', source: `${DESK_STICKER_PATH}/desk-sticker-clover.webp` },
  { id: 'desk-sticker-smile', name: '스마일', source: `${DESK_STICKER_PATH}/desk-sticker-smile.webp` },
  { id: 'desk-sticker-crown', name: '왕관', source: `${DESK_STICKER_PATH}/desk-sticker-crown.webp` },
  { id: 'desk-sticker-bolt', name: '번개', source: `${DESK_STICKER_PATH}/desk-sticker-bolt.webp` },
]

export function getDeskSticker(id: string | undefined) {
  return deskStickers.find((sticker) => sticker.id === id) ?? deskStickers[0]!
}

/** What a supporter chooses to leave before anything else. */
export type SupporterObjectChoice = Extract<
  DeskObjectType,
  'letter' | 'charm' | 'sticker'
>

export function isStickerMessage(message: Pick<Message, 'kind'> | undefined) {
  return message?.kind === 'sticker'
}

/** Stickers skip read-mode locks: they are visible as soon as they are placed. */
export function getSupportMessageAvailability(
  mode: ReadMode,
  message: Pick<Message, 'kind' | 'createdAt'>,
  now?: Date,
): MessageAvailability {
  if (isStickerMessage(message)) {
    return { available: true, unlockAt: null }
  }

  return getMessageAvailability(mode, message.createdAt, now)
}
