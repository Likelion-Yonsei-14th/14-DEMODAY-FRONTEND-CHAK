import type { TextElement } from '@/types'

export type ComposerFontCategory = 'handwriting' | 'sans'

export type ComposerFontDefinition = {
  id: string
  label: string
  family: string
  category: ComposerFontCategory
  categoryLabel: string
  weight: number
  sample: string
}

export const composerFonts: ComposerFontDefinition[] = [
  {
    id: 'nanum-gim-yui',
    label: '김유이체',
    family: "'나눔손글씨 김유이체', 'Nanum GimYuICe', cursive",
    category: 'handwriting',
    categoryLabel: '손글씨',
    weight: 400,
    sample: '오늘도 정말 고생했어',
  },
  {
    id: 'nanum-sonpyeonji',
    label: '손편지체',
    family: "'나눔손글씨 손편지체', 'Nanum SonPyeonJiCe', cursive",
    category: 'handwriting',
    categoryLabel: '손글씨',
    weight: 400,
    sample: '오늘도 정말 고생했어',
  },
  {
    id: 'nanum-bareunhipi',
    label: '바른히피',
    family: "'나눔손글씨 바른히피', 'Nanum BaReunHiPi', cursive",
    category: 'handwriting',
    categoryLabel: '손글씨',
    weight: 400,
    sample: '오늘도 정말 고생했어',
  },
  {
    id: 'nanum-junghagsaeng',
    label: '중학생',
    family: "'나눔손글씨 중학생', 'Nanum JungHagSaeng', cursive",
    category: 'handwriting',
    categoryLabel: '손글씨',
    weight: 400,
    sample: '오늘도 정말 고생했어',
  },
  {
    id: 'nanum-jalhago',
    label: '잘하고 있어',
    family: "'나눔손글씨 잘하고 있어', 'Nanum JarHaGoIssEo', cursive",
    category: 'handwriting',
    categoryLabel: '손글씨',
    weight: 400,
    sample: '오늘도 정말 고생했어',
  },
  {
    id: 'nanum-jeongeun',
    label: '정은체',
    family: "'나눔손글씨 정은체', 'Nanum JeongEunCe', cursive",
    category: 'handwriting',
    categoryLabel: '손글씨',
    weight: 400,
    sample: '오늘도 정말 고생했어',
  },
  {
    id: 'nanum-yeonji',
    label: '연지체',
    family: "'나눔손글씨 연지체', 'Nanum YeonJiCe', cursive",
    category: 'handwriting',
    categoryLabel: '손글씨',
    weight: 400,
    sample: '오늘도 정말 고생했어',
  },
  {
    id: 'nanum-hana',
    label: '하나손글씨',
    family: "'나눔손글씨 하나손글씨', 'Nanum HaNaSonGeurSsi', cursive",
    category: 'handwriting',
    categoryLabel: '손글씨',
    weight: 400,
    sample: '오늘도 정말 고생했어',
  },
  {
    id: 'pretendard',
    label: 'Pretendard',
    family: "'Pretendard Variable', Pretendard, var(--font-ui), sans-serif",
    category: 'sans',
    categoryLabel: '고딕',
    weight: 550,
    sample: '오늘도 정말 고생했어',
  },
  {
    id: 'nanum-square-neo',
    label: '나눔스퀘어 네오',
    family: "'NanumSquareNeo', var(--font-ui), sans-serif",
    category: 'sans',
    categoryLabel: '고딕',
    weight: 400,
    sample: '오늘도 정말 고생했어',
  },
]

export const composerTextSizes = [
  { id: 'small', label: '작게', value: 18 },
  { id: 'medium', label: '보통', value: 23 },
  { id: 'large', label: '크게', value: 30 },
] as const

export const composerTextColors = [
  { id: 'ink', label: '먹색', value: '#3C3833' },
  { id: 'coral', label: '코랄', value: '#B85F50' },
  { id: 'blue', label: '블루', value: '#4D6F91' },
  { id: 'green', label: '그린', value: '#56705A' },
  { id: 'purple', label: '퍼플', value: '#735E83' },
  { id: 'brown', label: '브라운', value: '#755B4C' },
] as const

export function getComposerFont(fontId: string | undefined) {
  return (
    composerFonts.find((font) => font.id === fontId) ??
    composerFonts[0]!
  )
}

export function resolveTextFontId(element: TextElement) {
  if (element.fontId) return element.fontId

  if (element.styleId === 'clean') return 'pretendard'
  if (element.styleId === 'handwriting-large') return 'nanum-hana'

  return 'nanum-gim-yui'
}

export function resolveTextFontSize(element: TextElement) {
  if (typeof element.fontSize === 'number') return element.fontSize

  if (element.styleId === 'clean') return 19
  if (element.styleId === 'handwriting-large') return 30

  return 23
}

export function resolveTextColor(element: TextElement) {
  return element.color ?? '#3C3833'
}

export function getTextAppearance(element: TextElement) {
  const font = getComposerFont(resolveTextFontId(element))

  return {
    font,
    fontId: font.id,
    fontFamily: font.family,
    fontWeight: font.weight,
    fontSize: resolveTextFontSize(element),
    color: resolveTextColor(element),
    lineHeight: font.category === 'handwriting' ? 1.46 : 1.55,
    letterSpacing: font.category === 'handwriting' ? '-0.018em' : '-0.012em',
  }
}
