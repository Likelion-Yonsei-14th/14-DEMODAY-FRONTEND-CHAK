export type EnvelopePattern =
  | 'plain'
  | 'stars'
  | 'ribbon'
  | 'clover'
  | 'dots'
  | 'grid'
  | 'scallop'
  | 'stamp'

export type SealVariant = 'heart' | 'star' | 'clover' | 'initial'

export type EnvelopeTheme = {
  baseColor: string
  flapColor: string
  pocketColor: string
  patternColor: string
  sealColor: string
  inkColor: string
  pattern: EnvelopePattern
  seal: SealVariant
}

const patterns: EnvelopePattern[] = [
  'plain',
  'stars',
  'ribbon',
  'clover',
  'dots',
  'grid',
  'scallop',
  'stamp',
]

const seals: SealVariant[] = ['heart', 'star', 'clover', 'initial']

export function createEnvelopeTheme(
  messageId: string,
  previewColor = '#F2E5DA',
): EnvelopeTheme {
  const seed = stableHash(messageId)
  const base = normalizeHex(previewColor)

  return {
    baseColor: mix(base, '#F7F1EA', 0.14),
    flapColor: mix(base, '#FFFFFF', 0.18),
    pocketColor: mix(base, '#FFFFFF', 0.08),
    patternColor: mix(base, '#5E5148', 0.3),
    sealColor: mix(base, '#8E4050', 0.42),
    inkColor: mix(base, '#403A36', 0.68),
    pattern: patterns[seed % patterns.length] ?? 'plain',
    seal: seals[Math.floor(seed / patterns.length) % seals.length] ?? 'heart',
  }
}

export function getSealMark(
  variant: SealVariant,
  senderName: string,
): string {
  switch (variant) {
    case 'heart':
      return '♥'
    case 'star':
      return '✦'
    case 'clover':
      return '✤'
    case 'initial':
      return senderName.trim().slice(0, 1) || '•'
  }
}

function stableHash(value: string) {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

function normalizeHex(value: string) {
  const trimmed = value.trim()
  const short = /^#([0-9a-f]{3})$/i.exec(trimmed)

  if (short) {
    const [r, g, b] = short[1]!.split('')
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
  }

  if (/^#[0-9a-f]{6}$/i.test(trimmed)) {
    return trimmed.toUpperCase()
  }

  return '#F2E5DA'
}

function mix(colorA: string, colorB: string, weightB: number) {
  const a = hexToRgb(normalizeHex(colorA))
  const b = hexToRgb(normalizeHex(colorB))
  const weightA = 1 - weightB

  const r = Math.round(a.r * weightA + b.r * weightB)
  const g = Math.round(a.g * weightA + b.g * weightB)
  const blue = Math.round(a.b * weightA + b.b * weightB)

  return `#${toHex(r)}${toHex(g)}${toHex(blue)}`
}

function hexToRgb(value: string) {
  return {
    r: Number.parseInt(value.slice(1, 3), 16),
    g: Number.parseInt(value.slice(3, 5), 16),
    b: Number.parseInt(value.slice(5, 7), 16),
  }
}

function toHex(value: number) {
  return value.toString(16).padStart(2, '0').toUpperCase()
}
