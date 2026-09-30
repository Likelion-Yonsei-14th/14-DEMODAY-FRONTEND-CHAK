import type {
  DeskObject,
  DeskObjectType,
  DeskPlacement,
  DeskZone,
  MessageDraft,
} from '@/types'

export function resolveDeskObjectType(draft: MessageDraft): DeskObjectType {
  if (draft.photoElements.length > 0) return 'photo-card'

  const expressiveAssets =
    draft.wordArtElements.length + draft.stickerElements.length

  if (expressiveAssets >= 3) return 'poster-card'
  if (draft.canvasMode === 'long') return 'letter'

  return 'memo'
}

const placementOrder: DeskZone[] = ['center', 'left', 'right', 'front', 'back']

export function resolveDeskZone(existingCount: number): DeskZone {
  const index = existingCount % placementOrder.length
  return placementOrder[index] ?? 'center'
}

const placementPresets: DeskPlacement[] = [
  { x: 54, y: 49, rotation: -2, scale: 1 },
  { x: 25, y: 51, rotation: 3, scale: 1 },
  { x: 76, y: 50, rotation: -3, scale: 1 },
  { x: 40, y: 43, rotation: 2, scale: 0.98 },
  { x: 66, y: 43, rotation: 1, scale: 0.98 },
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

const STATIC_MESSAGE_RECTS: Rect[] = [
  { x: 35, y: 48, width: 12, height: 11 },
  { x: 68, y: 49, width: 13, height: 11 },
  { x: 50, y: 54, width: 14, height: 8 },
  { x: 84, y: 44, width: 10, height: 12 },
]

const DRAFT_SIZE = { width: 20, height: 14 }
const DYNAMIC_SIZE = { width: 18, height: 13 }

export function clampPlacement(placement: DeskPlacement): DeskPlacement {
  return {
    ...placement,
    x: clamp(placement.x, 12, 88),
    y: clamp(placement.y, 38, 58),
    rotation: clamp(placement.rotation, -7, 7),
    scale: clamp(placement.scale, 0.9, 1.08),
  }
}

export function isPlacementValid(
  placement: DeskPlacement,
  existingObjects: DeskObject[],
): boolean {
  const draftRect = centeredRect(
    placement.x,
    placement.y,
    DRAFT_SIZE.width * placement.scale,
    DRAFT_SIZE.height * placement.scale,
  )

  const occupiedRects = [
    ...STATIC_MESSAGE_RECTS.map((rect) =>
      centeredRect(rect.x, rect.y, rect.width, rect.height),
    ),
    ...existingObjects.map((object) => {
      const position = resolveObjectPlacement(object)
      return centeredRect(
        position.x,
        position.y,
        DYNAMIC_SIZE.width * position.scale,
        DYNAMIC_SIZE.height * position.scale,
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
