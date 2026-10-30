import type { CSSProperties } from 'react'
import type {
  PhotoElement,
  PositionedAsset,
  TextElement,
} from '@/types'

/**
 * Card text is authored against a card this wide. Text metrics are written in
 * cqw of the card (container-type in cardRenderShared.css), so the composer and
 * the recipient view keep the same text-to-card proportion at any card size.
 */
export const CARD_DESIGN_WIDTH = 320

export const cardPx = (px: number) =>
  `calc(${px} * 100cqw / ${CARD_DESIGN_WIDTH})`

/** Keeps text above stickers, word art and photos whatever their stored zIndex. */
const TEXT_LAYER_OFFSET = 100

/**
 * Smallest text box: the composer's two-row textarea or 72px, whichever is
 * taller (9px padding top and bottom). Both renderers use it so short text
 * sits at the same height.
 */
export function getTextMinHeight(
  fontSize: number,
  lineHeight: number,
) {
  return cardPx(Math.max(72, fontSize * lineHeight * 2 + 18))
}

export function getPositionedAssetStyle(
  element: PositionedAsset,
): CSSProperties {
  return {
    left: `${element.x}%`,
    top: `${element.y}%`,
    zIndex: element.zIndex,
    transform:
      `translate(-50%, -50%) rotate(${element.rotation}deg) scale(${element.scale})`,
  }
}

export function getStickerStyle(
  element: PositionedAsset,
  baseWidthPercent: number,
): CSSProperties {
  return {
    ...getPositionedAssetStyle(element),
    width: `${baseWidthPercent}%`,
  }
}

export function getTextBoxStyle(
  element: TextElement,
): CSSProperties {
  return {
    left: `${element.x ?? 50}%`,
    top: `${element.y ?? 50}%`,
    width: `${element.width ?? 76}%`,
    zIndex: (element.zIndex ?? 30) + TEXT_LAYER_OFFSET,
  }
}

export function getFloatingPhotoStyle(
  photo: PhotoElement,
): CSSProperties {
  return {
    left: `${photo.x ?? 50}%`,
    top: `${photo.y ?? 50}%`,
    zIndex: photo.zIndex ?? 10,
    aspectRatio:
      (photo.frame ?? 'white') === 'polaroid'
        ? '4 / 3.8'
        : String(photo.aspectRatio ?? 4 / 3),
    transform:
      `translate(-50%, -50%) rotate(${photo.rotation ?? 0}deg) scale(${photo.scale ?? 1})`,
  }
}

export function getBackgroundPhotoStyle(
  photo: PhotoElement,
): CSSProperties {
  return {
    objectPosition:
      `${photo.x ?? 50}% ${photo.y ?? 50}%`,
    transform: `scale(${photo.scale ?? 1})`,
  }
}

export function getPhotoObjectFit(
  photo: PhotoElement,
): CSSProperties['objectFit'] {
  return photo.hasTransparency ||
    (photo.frame ?? 'white') === 'plain'
    ? 'contain'
    : 'cover'
}
