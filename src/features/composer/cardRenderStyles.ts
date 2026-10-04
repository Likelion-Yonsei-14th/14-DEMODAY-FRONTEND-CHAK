import type { CSSProperties } from 'react'
import type {
  PhotoElement,
  PositionedAsset,
  TextElement,
} from '@/types'

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
    zIndex: element.zIndex ?? 30,
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
