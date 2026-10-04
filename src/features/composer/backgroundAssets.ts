export type ComposerBackground = {
  id: string
  name: string
  /** 'stationery': letter-paper templates whose centre stays clear for text. */
  group: 'basic' | 'stationery' | 'graphic'
  kind: 'css' | 'image'
  className?: string
  source?: string
  tone: string
  fit?: 'cover' | 'contain'
  /**
   * Insets (% of the card) of the area where text may sit, so writing never
   * runs over a template's border or corner decorations.
   */
  textArea?: { top: number; right: number; bottom: number; left: number }
}

const defaultBackground: ComposerBackground = {
  id: 'bg-basic-cream',
  name: 'Cream',
  group: 'basic',
  kind: 'css',
  className: 'message-canvas--cream',
  tone: '#F8F1E7',
}

export const composerBackgrounds: ComposerBackground[] = [
  defaultBackground,
  {
    id: 'bg-stationery-gingham-yellow',
    name: '노랑 체크',
    group: 'stationery',
    kind: 'image',
    source: '/assets/backgrounds/stationery_gingham_yellow.webp',
    tone: '#E9D27A',
    fit: 'cover',
    textArea: { top: 12, right: 9, bottom: 13, left: 14 },
  },
  {
    id: 'bg-stationery-gingham-red',
    name: '빨강 체크',
    group: 'stationery',
    kind: 'image',
    source: '/assets/backgrounds/stationery_gingham_red.webp',
    tone: '#C9574A',
    fit: 'cover',
    textArea: { top: 17, right: 9, bottom: 20, left: 14 },
  },
  {
    id: 'bg-stationery-gingham-green',
    name: '초록 체크',
    group: 'stationery',
    kind: 'image',
    source: '/assets/backgrounds/stationery_gingham_green.webp',
    tone: '#8FA77A',
    fit: 'cover',
    textArea: { top: 17, right: 9, bottom: 21, left: 14 },
  },
  {
    id: 'bg-stationery-checker-navy',
    name: '네이비 체커',
    group: 'stationery',
    kind: 'image',
    source: '/assets/backgrounds/stationery_checker_navy.webp',
    tone: '#4A5872',
    fit: 'cover',
    textArea: { top: 11, right: 12, bottom: 20, left: 14 },
  },
  {
    id: 'bg-stationery-note-pink',
    name: '핑크 노트',
    group: 'stationery',
    kind: 'image',
    source: '/assets/backgrounds/stationery_note_pink.webp',
    tone: '#EDBDBD',
    fit: 'cover',
    textArea: { top: 16, right: 10, bottom: 8, left: 10 },
  },
  {
    id: 'bg-stationery-note-mint',
    name: '민트 노트',
    group: 'stationery',
    kind: 'image',
    source: '/assets/backgrounds/stationery_note_mint.webp',
    tone: '#BFDCCB',
    fit: 'cover',
    textArea: { top: 16, right: 10, bottom: 8, left: 10 },
  },
  {
    id: 'bg-stationery-note-butter',
    name: '버터 노트',
    group: 'stationery',
    kind: 'image',
    source: '/assets/backgrounds/stationery_note_butter.webp',
    tone: '#F3D98A',
    fit: 'cover',
    textArea: { top: 16, right: 10, bottom: 8, left: 10 },
  },
  {
    id: 'bg-stationery-doodle-snacks',
    name: '수능 간식',
    group: 'stationery',
    kind: 'image',
    source: '/assets/backgrounds/stationery_doodle_snacks.webp',
    tone: '#9CC08A',
    fit: 'cover',
    textArea: { top: 30, right: 10, bottom: 8, left: 10 },
  },
  {
    id: 'bg-soft-coral',
    name: 'Coral',
    group: 'basic',
    kind: 'css',
    className: 'message-canvas--coral',
    tone: '#F7D8CF',
  },
  {
    id: 'bg-sage',
    name: 'Sage',
    group: 'basic',
    kind: 'css',
    className: 'message-canvas--sage',
    tone: '#DFE8D7',
  },
  {
    id: 'bg-sky',
    name: 'Sky',
    group: 'basic',
    kind: 'css',
    className: 'message-canvas--sky',
    tone: '#DCE7EF',
  },
  {
    id: 'bg-butter',
    name: 'Butter',
    group: 'basic',
    kind: 'css',
    className: 'message-canvas--butter',
    tone: '#F8ECC3',
  },
  {
    id: 'bg-art-heart-crown-pink',
    name: '하트 왕관',
    group: 'graphic',
    kind: 'image',
    source: '/assets/backgrounds/bg_art_heart_crown_pink.webp',
    tone: '#F7CBD5',
    fit: 'cover',
  },
  {
    id: 'bg-art-rainbow-cloud-blue',
    name: '무지개 구름',
    group: 'graphic',
    kind: 'image',
    source: '/assets/backgrounds/bg_art_rainbow_cloud_blue.webp',
    tone: '#BFE8F8',
    fit: 'cover',
  },
  {
    id: 'bg-pattern-daisy-sage',
    name: '데이지',
    group: 'graphic',
    kind: 'image',
    source: '/assets/backgrounds/bg_pattern_daisy_sage.webp',
    tone: '#D9F0D5',
    fit: 'contain',
  },
  {
    id: 'bg-pattern-stars-butter',
    name: '별빛',
    group: 'graphic',
    kind: 'image',
    source: '/assets/backgrounds/bg_pattern_stars_butter.webp',
    tone: '#FFF3B7',
    fit: 'contain',
  },
  {
    id: 'bg-frame-ribbon-pink',
    name: '핑크 리본',
    group: 'graphic',
    kind: 'image',
    source: '/assets/backgrounds/bg_frame_ribbon_pink.webp',
    tone: '#F6CED8',
    fit: 'contain',
  },
  {
    id: 'bg-frame-ribbon-butter',
    name: '옐로 리본',
    group: 'graphic',
    kind: 'image',
    source: '/assets/backgrounds/bg_frame_ribbon_butter.webp',
    tone: '#FFF3B8',
    fit: 'contain',
  },
  {
    id: 'bg-frame-clover-orange',
    name: '행운 클로버',
    group: 'graphic',
    kind: 'image',
    source: '/assets/backgrounds/bg_frame_clover_orange.webp',
    tone: '#FFF6E3',
    fit: 'contain',
  },
  {
    id: 'bg-frame-hearts-pink',
    name: '하트 프레임',
    group: 'graphic',
    kind: 'image',
    source: '/assets/backgrounds/bg_frame_hearts_pink.webp',
    tone: '#F7CED9',
    fit: 'contain',
  },
  {
    id: 'bg-frame-hearts-minimal-pink',
    name: '미니 하트',
    group: 'graphic',
    kind: 'image',
    source: '/assets/backgrounds/bg_frame_hearts_minimal_pink.webp',
    tone: '#F5CBD7',
    fit: 'contain',
  },
  {
    id: 'bg-art-torn-clover-butter',
    name: '행운 종이',
    group: 'graphic',
    kind: 'image',
    source: '/assets/backgrounds/bg_art_torn_clover_butter.webp',
    tone: '#FFF2B7',
    fit: 'contain',
  },
]

export const getComposerBackground = (id: string): ComposerBackground =>
  composerBackgrounds.find((background) => background.id === id) ?? defaultBackground

export type TextBounds = {
  left: number
  top: number
  right: number
  bottom: number
}

const FULL_CARD: TextBounds = { left: 2, top: 6, right: 98, bottom: 94 }

/** Where text may be placed on this background, in % of the card. */
export function getTextBounds(background: ComposerBackground): TextBounds {
  const area = background.textArea
  if (!area) return FULL_CARD
  return {
    left: area.left,
    top: area.top,
    right: 100 - area.right,
    bottom: 100 - area.bottom,
  }
}

/** Shrinks and moves a text box so it sits inside the bounds. */
export function fitTextElementToBounds<T extends { x?: number; y?: number; width?: number }>(
  element: T,
  bounds: TextBounds,
): T {
  const maxWidth = bounds.right - bounds.left
  const width = Math.min(element.width ?? 76, maxWidth)
  const half = width / 2
  const x = Math.min(
    Math.max(element.x ?? 50, bounds.left + half),
    bounds.right - half,
  )
  const y = Math.min(
    Math.max(element.y ?? 50, bounds.top + 4),
    bounds.bottom - 4,
  )
  return { ...element, width, x, y }
}
