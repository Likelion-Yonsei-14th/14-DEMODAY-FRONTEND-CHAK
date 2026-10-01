import { getMessagePages } from '@/features/composer/messagePages'
import type {
  DeskObject,
  DeskObjectType,
  DeskPlacement,
  DeskZone,
  MessageDraft,
} from '@/types'

export const selectableDeskObjectTypes: DeskObjectType[] = [
  'memo',
  'letter',
  'photo-card',
  'poster-card',
  'charm',
]

export const deskObjectToneOptions = [
  { id: 'coral', label: '코랄', color: '#F4C6BC' },
  { id: 'butter', label: '버터', color: '#F4D98A' },
  { id: 'sage', label: '세이지', color: '#C7D8B8' },
  { id: 'sky', label: '스카이', color: '#BFD8E8' },
  { id: 'lilac', label: '라일락', color: '#D7C6E8' },
] as const

export function resolveDeskObjectType(draft: MessageDraft): DeskObjectType {
  const pages = getMessagePages(draft)

  if (pages.some((page) => page.photoElements.length > 0)) {
    return 'photo-card'
  }

  const expressiveAssets = pages.reduce(
    (total, page) =>
      total + page.wordArtElements.length + page.stickerElements.length,
    0,
  )

  if (expressiveAssets >= 3) return 'poster-card'
  if (pages.length > 1) return 'letter'

  return 'memo'
}

const placementOrder: DeskZone[] = ['center', 'left', 'right', 'front', 'back']

export function resolveDeskZone(existingCount: number): DeskZone {
  const index = existingCount % placementOrder.length
  return placementOrder[index] ?? 'center'
}

const placementPresets: DeskPlacement[] = [
  { x: 52, y: 54, rotation: -2, scale: 1 },
  { x: 29, y: 59, rotation: 3, scale: 1 },
  { x: 73, y: 58, rotation: -3, scale: 1 },
  { x: 40, y: 45, rotation: 2, scale: 0.98 },
  { x: 64, y: 68, rotation: 1, scale: 0.98 },
]

export function resolveInitialPlacement(existingCount: number): DeskPlacement {
  const index = existingCount % placementPresets.length
  return placementPresets[index] ?? placementPresets[0]!
}

export function resolveObjectPlacement(object: DeskObject): DeskPlacement {
  if (typeof object.x === 'number' && typeof object.y === 'number') {
    return {
      x: object.x,
      y: object.y,
      rotation: object.rotation ?? 0,
      scale: object.scale ?? 1,
    }
  }

  const fallbackByZone: Record<DeskZone, DeskPlacement> = {
    left: { x: 24, y: 50, rotation: -3, scale: 1 },
    center: { x: 52, y: 49, rotation: 2, scale: 1 },
    right: { x: 77, y: 50, rotation: 3, scale: 1 },
    back: { x: 61, y: 42, rotation: -2, scale: 0.96 },
    front: { x: 41, y: 55, rotation: 2, scale: 1 },
  }

  return fallbackByZone[object.zone]
}

type Rect = {
  x: number
  y: number
  width: number
  height: number
}

const STATIC_DECOR_RECTS: Rect[] = [
  { x: 14, y: 39, width: 23, height: 19 },
  { x: 84, y: 37, width: 23, height: 15 },
]

const objectSizeByType: Record<
  DeskObjectType,
  { width: number; height: number }
> = {
  memo: { width: 20, height: 14 },
  letter: { width: 21, height: 13 },
  'photo-card': { width: 17, height: 20 },
  'poster-card': { width: 18, height: 22 },
  charm: { width: 15, height: 19 },
  ticket: { width: 21, height: 11 },
  'generic-card': { width: 20, height: 14 },
}

export function clampPlacement(placement: DeskPlacement): DeskPlacement {
  return {
    ...placement,
    x: clamp(placement.x, 12, 88),
    y: clamp(placement.y, 40, 72),
    rotation: clamp(placement.rotation, -7, 7),
    scale: clamp(placement.scale, 0.9, 1.08),
  }
}

export function isPlacementValid(
  placement: DeskPlacement,
  existingObjects: DeskObject[],
  draftType: DeskObjectType = 'memo',
): boolean {
  const draftSize =
    objectSizeByType[draftType] ??
    objectSizeByType.memo

  const draftRect = centeredRect(
    placement.x,
    placement.y,
    draftSize.width * placement.scale,
    draftSize.height * placement.scale,
  )

  const occupiedRects = [
    ...STATIC_DECOR_RECTS.map((rect) =>
      centeredRect(rect.x, rect.y, rect.width, rect.height),
    ),
    ...existingObjects.map((object) => {
      const position = resolveObjectPlacement(object)
      const size =
        objectSizeByType[object.representationType] ??
        objectSizeByType.memo

      return centeredRect(
        position.x,
        position.y,
        size.width * position.scale,
        size.height * position.scale,
      )
    }),
  ]

  return occupiedRects.every((existingRect) => {
    const intersection = intersectionArea(draftRect, existingRect)
    const existingArea = existingRect.width * existingRect.height

    if (existingArea <= 0) return true
    return intersection / existingArea < 0.68
  })
}

function centeredRect(
  centerX: number,
  centerY: number,
  width: number,
  height: number,
): Rect {
  return {
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
  }
}

function intersectionArea(a: Rect, b: Rect) {
  const width = Math.max(
    0,
    Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x),
  )
  const height = Math.max(
    0,
    Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y),
  )

  return width * height
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export const deskObjectLabels: Record<DeskObjectType, string> = {
  memo: '작은 메모 카드',
  'photo-card': '사진 카드',
  charm: '행운 부적',
  'poster-card': '응원 포스터',
  letter: '편지',
  ticket: '약속 티켓',
  'generic-card': '응원 카드',
}
