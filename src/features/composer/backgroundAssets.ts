export type ComposerBackground = {
  id: string
  name: string
  group: 'basic' | 'graphic'
  kind: 'css' | 'image'
  className?: string
  source?: string
  tone: string
  fit?: 'cover' | 'contain'
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
