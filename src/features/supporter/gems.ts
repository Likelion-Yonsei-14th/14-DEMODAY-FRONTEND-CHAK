import type { DeskGem } from '@/types'

/** Prototype price per gem sticker, in KRW. */
export const GEM_PRICE = 5

/** Loose gems a supporter can stick one by one (a shape set comes on top). */
export const MAX_LOOSE_GEMS = 12

const GEM_ASSET_PATH = '/assets/gems'

export const gemIds = [
  'heart-pink',
  'heart-red',
  'heart-blue',
  'heart-purple',
  'star-silver',
  'star-gold',
  'star-aurora',
  'round-ab',
  'round-emerald',
  'round-sapphire',
  'round-ruby',
  'pearl-white',
  'pearl-cream',
  'drop-aqua',
  'drop-amethyst',
  'flower',
  'butterfly',
  'moon',
  'square-pink',
] as const

export type GemId = (typeof gemIds)[number]

export function getGemImage(gemId: string) {
  return `${GEM_ASSET_PATH}/${gemId}.webp`
}

/** Gem size as a percentage of the object's width. */
export const LOOSE_GEM_SIZE = 11

type Point = { x: number; y: number }

/** Re-samples a closed or open outline into `count` evenly spaced points. */
function resample(points: Point[], count: number, closed: boolean): Point[] {
  const path = closed ? [...points, points[0]!] : points
  const lengths = [0]
  for (let index = 1; index < path.length; index += 1) {
    const a = path[index - 1]!
    const b = path[index]!
    lengths.push(lengths[index - 1]! + Math.hypot(b.x - a.x, b.y - a.y))
  }
  const total = lengths[lengths.length - 1]!
  const step = closed ? total / count : total / Math.max(1, count - 1)

  return Array.from({ length: count }, (_, index) => {
    const target = index * step
    let segment = 1
    while (segment < lengths.length - 1 && lengths[segment]! < target) {
      segment += 1
    }
    const start = path[segment - 1]!
    const end = path[segment]!
    const span = lengths[segment]! - lengths[segment - 1]! || 1
    const t = (target - lengths[segment - 1]!) / span
    return { x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t }
  })
}

function circle(cx: number, cy: number, r: number, from = 0, to = Math.PI * 2, steps = 64) {
  return Array.from({ length: steps + 1 }, (_, index) => {
    const angle = from + ((to - from) * index) / steps
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r }
  })
}

type GemPattern = {
  id: string
  name: string
  /** Gem diameter relative to the shape's size, from outline length / count. */
  gemScale: number
  /** Points in a 0–1 unit square plus which gem goes at each point. */
  build: () => { point: Point; gemId: GemId }[]
}

const alternate = (points: Point[], ids: GemId[]) =>
  points.map((point, index) => ({ point, gemId: ids[index % ids.length]! }))

export const gemPatterns: GemPattern[] = [
  {
    id: 'star',
    name: '별',
    gemScale: 0.1,
    build: () => {
      const vertices = Array.from({ length: 10 }, (_, index) => {
        const angle = -Math.PI / 2 + (index * Math.PI) / 5
        const r = index % 2 === 0 ? 0.5 : 0.21
        return { x: 0.5 + Math.cos(angle) * r, y: 0.53 + Math.sin(angle) * r }
      })
      return alternate(resample(vertices, 30, true), ['star-gold', 'round-ab'])
    },
  },
  {
    id: 'heart',
    name: '하트',
    gemScale: 0.11,
    build: () => {
      const outline = Array.from({ length: 120 }, (_, index) => {
        const t = (index / 120) * Math.PI * 2
        const x = 16 * Math.sin(t) ** 3
        const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
        return { x: 0.5 + x / 34, y: 0.47 - y / 34 }
      })
      return alternate(resample(outline, 26, true), ['round-ruby', 'heart-pink'])
    },
  },
  {
    id: 'clover',
    name: '클로버',
    gemScale: 0.075,
    build: () => {
      const r = 0.175
      const centers = [
        { x: 0.5, y: 0.26 },
        { x: 0.74, y: 0.48 },
        { x: 0.5, y: 0.7 },
        { x: 0.26, y: 0.48 },
      ]
      const leaves = centers.flatMap((center) =>
        resample(circle(center.x, center.y, r), 8, true).filter(
          (point) =>
            !centers.some(
              (other) =>
                other !== center &&
                Math.hypot(point.x - other.x, point.y - other.y) < r * 0.98,
            ),
        ),
      )
      const stem = resample(
        [{ x: 0.56, y: 0.78 }, { x: 0.68, y: 0.97 }],
        3,
        false,
      )
      return [
        ...alternate(leaves, ['round-emerald']),
        ...alternate(stem, ['round-emerald']),
      ]
    },
  },
  {
    id: 'smile',
    name: '스마일',
    gemScale: 0.12,
    build: () => [
      ...alternate(resample(circle(0.5, 0.5, 0.46), 20, true), ['round-sapphire']),
      ...alternate([{ x: 0.37, y: 0.4 }, { x: 0.63, y: 0.4 }], ['pearl-white']),
      ...alternate(
        resample(circle(0.5, 0.52, 0.22, Math.PI * 0.2, Math.PI * 0.8), 6, false),
        ['round-sapphire'],
      ),
    ],
  },
  {
    id: 'bolt',
    name: '번개',
    gemScale: 0.1,
    build: () => {
      const vertices = [
        { x: 0.62, y: 0 },
        { x: 0.22, y: 0.56 },
        { x: 0.47, y: 0.56 },
        { x: 0.36, y: 1 },
        { x: 0.8, y: 0.4 },
        { x: 0.54, y: 0.4 },
        { x: 0.68, y: 0 },
      ]
      return alternate(resample(vertices, 24, true), ['round-ab', 'heart-purple'])
    },
  },
]

export function getGemPatternCount(patternId: string) {
  return gemPatterns.find((pattern) => pattern.id === patternId)?.build().length ?? 0
}

/**
 * Lays a shape set onto an object of the given on-desk size. The shape keeps
 * its proportions on non-square objects (letters) by sizing it from the
 * shorter side, then converting back to width/height percentages.
 */
export function layoutGemPattern(
  patternId: string,
  object: { width: number; height: number },
  center: Point = { x: 50, y: 50 },
): DeskGem[] {
  const pattern = gemPatterns.find((item) => item.id === patternId)
  if (!pattern) return []

  const side = Math.min(object.width, object.height) * 0.78
  return pattern.build().map(({ point, gemId }, index) => ({
    id: `${patternId}-${index}`,
    gemId,
    patternId,
    x: center.x + (((point.x - 0.5) * side) / object.width) * 100,
    y: center.y + (((point.y - 0.5) * side) / object.height) * 100,
    size: ((pattern.gemScale * side) / object.width) * 100,
    rotation: 0,
  }))
}

export function countGemCost(gems: DeskGem[] | undefined) {
  return (gems?.length ?? 0) * GEM_PRICE
}
