export type EnvelopePattern =
  | 'solid'
  | 'dot'
  | 'thin-stripe'
  | 'wide-stripe'
  | 'check'
  | 'wave'
  | 'tiny-heart'
  | 'border'

export type EnvelopeTheme = {
  id: string
  family: 'pink' | 'green' | 'blue' | 'yellow' | 'neutral'
  baseColor: string
  flapColor: string
  pocketColor: string
  sideColor: string
  patternColor: string
  inkColor: string
  pattern: EnvelopePattern
}

const envelopeThemes: EnvelopeTheme[] = [
  {
    id: 'cream-coral-dot',
    family: 'green',
    baseColor: '#FFF7E9',
    flapColor: '#FFF9F1',
    pocketColor: '#F8EDDC',
    sideColor: '#F3E5D0',
    patternColor: '#E79A8D',
    inkColor: '#5B4D45',
    pattern: 'dot',
  },
  {
    id: 'butter-sage-stripe',
    family: 'green',
    baseColor: '#F8E9AE',
    flapColor: '#FFF3C8',
    pocketColor: '#F1DFA1',
    sideColor: '#EAD792',
    patternColor: '#7E9D77',
    inkColor: '#4C5848',
    pattern: 'thin-stripe',
  },
  {
    id: 'blush-forest-check',
    family: 'green',
    baseColor: '#F5D8DD',
    flapColor: '#F9E5E9',
    pocketColor: '#EFCED5',
    sideColor: '#E9C4CD',
    patternColor: '#56755D',
    inkColor: '#46554A',
    pattern: 'check',
  },
  {
    id: 'sage-cream-wide',
    family: 'green',
    baseColor: '#DCE8D4',
    flapColor: '#EAF0E4',
    pocketColor: '#D2DFC9',
    sideColor: '#CAD9C0',
    patternColor: '#FFF6E7',
    inkColor: '#4D5B49',
    pattern: 'wide-stripe',
  },
  {
    id: 'cream-rose-stripe',
    family: 'pink',
    baseColor: '#FFF5E9',
    flapColor: '#FFF9F1',
    pocketColor: '#F8E9DA',
    sideColor: '#F1DFC9',
    patternColor: '#C97C8B',
    inkColor: '#59484A',
    pattern: 'thin-stripe',
  },
  {
    id: 'sky-pink-dot',
    family: 'pink',
    baseColor: '#DDEBF5',
    flapColor: '#EAF3F9',
    pocketColor: '#D3E4F0',
    sideColor: '#CADCE9',
    patternColor: '#E89AAF',
    inkColor: '#49545B',
    pattern: 'dot',
  },
  {
    id: 'butter-coral-check',
    family: 'pink',
    baseColor: '#F8E8A9',
    flapColor: '#FFF0C4',
    pocketColor: '#F1DC99',
    sideColor: '#E8D18C',
    patternColor: '#D67B70',
    inkColor: '#5D4C3F',
    pattern: 'check',
  },
  {
    id: 'pink-wine-border',
    family: 'pink',
    baseColor: '#F1CDD8',
    flapColor: '#F7DDE4',
    pocketColor: '#E9C1CE',
    sideColor: '#E2B8C6',
    patternColor: '#8A5360',
    inkColor: '#604B52',
    pattern: 'border',
  },
  {
    id: 'cream-cobalt-dot',
    family: 'blue',
    baseColor: '#FFF7EA',
    flapColor: '#FFFAF2',
    pocketColor: '#F6EBDC',
    sideColor: '#EFE2D0',
    patternColor: '#6E92C7',
    inkColor: '#4D5260',
    pattern: 'dot',
  },
  {
    id: 'butter-sky-stripe',
    family: 'blue',
    baseColor: '#F7E8A9',
    flapColor: '#FFF0C5',
    pocketColor: '#EFDC99',
    sideColor: '#E7D18C',
    patternColor: '#86BFD7',
    inkColor: '#4E5660',
    pattern: 'thin-stripe',
  },
  {
    id: 'blush-navy-check',
    family: 'blue',
    baseColor: '#F3D6DE',
    flapColor: '#F8E2E8',
    pocketColor: '#EAC9D3',
    sideColor: '#E3C0CB',
    patternColor: '#65768B',
    inkColor: '#4B5160',
    pattern: 'check',
  },
  {
    id: 'sky-red-wide',
    family: 'blue',
    baseColor: '#D7EAF4',
    flapColor: '#E7F2F8',
    pocketColor: '#CDE2ED',
    sideColor: '#C3D9E5',
    patternColor: '#D9867D',
    inkColor: '#4B5860',
    pattern: 'wide-stripe',
  },
  {
    id: 'cream-orange-wave',
    family: 'yellow',
    baseColor: '#FFF7E8',
    flapColor: '#FFFAF2',
    pocketColor: '#F7EAD8',
    sideColor: '#F0E0CC',
    patternColor: '#E4A267',
    inkColor: '#5C5043',
    pattern: 'wave',
  },
  {
    id: 'butter-coral-heart',
    family: 'yellow',
    baseColor: '#F8E8A9',
    flapColor: '#FFF0C5',
    pocketColor: '#F0DC99',
    sideColor: '#E7D08C',
    patternColor: '#D98279',
    inkColor: '#5B4D43',
    pattern: 'tiny-heart',
  },
  {
    id: 'cream-sage-grid',
    family: 'yellow',
    baseColor: '#FFF5E7',
    flapColor: '#FFF9F1',
    pocketColor: '#F7E8D8',
    sideColor: '#EEDDC9',
    patternColor: '#8FA884',
    inkColor: '#4F574B',
    pattern: 'check',
  },
  {
    id: 'butter-blue-border',
    family: 'yellow',
    baseColor: '#F5E3A0',
    flapColor: '#FCECB9',
    pocketColor: '#ECD58D',
    sideColor: '#E2C97E',
    patternColor: '#7599B8',
    inkColor: '#50555A',
    pattern: 'border',
  },
  {
    id: 'paper-solid',
    family: 'neutral',
    baseColor: '#F4EEE3',
    flapColor: '#FAF6EE',
    pocketColor: '#EDE4D6',
    sideColor: '#E6DCCD',
    patternColor: '#B9A99A',
    inkColor: '#554C45',
    pattern: 'solid',
  },
  {
    id: 'paper-blue-stripe',
    family: 'neutral',
    baseColor: '#F7F1E8',
    flapColor: '#FBF7F0',
    pocketColor: '#EEE5D9',
    sideColor: '#E7DDD0',
    patternColor: '#90A9BE',
    inkColor: '#50555B',
    pattern: 'thin-stripe',
  },
  {
    id: 'paper-pink-dot',
    family: 'neutral',
    baseColor: '#F5EEE4',
    flapColor: '#FAF5ED',
    pocketColor: '#EEE4D8',
    sideColor: '#E7DCCF',
    patternColor: '#D49AA5',
    inkColor: '#594D4E',
    pattern: 'dot',
  },
  {
    id: 'paper-green-wave',
    family: 'neutral',
    baseColor: '#F5EFE5',
    flapColor: '#FAF6EE',
    pocketColor: '#ECE3D7',
    sideColor: '#E5DACD',
    patternColor: '#8FA486',
    inkColor: '#4E554C',
    pattern: 'wave',
  },
]

export function createEnvelopeTheme(
  messageId: string,
  previewColor = '#F2E5DA',
): EnvelopeTheme {
  const family = resolveColorFamily(previewColor)
  const candidates = envelopeThemes.filter((theme) => theme.family === family)
  const fallback = envelopeThemes.filter((theme) => theme.family === 'neutral')
  const pool = candidates.length > 0 ? candidates : fallback
  const index = stableHash(messageId) % pool.length

  return pool[index] ?? envelopeThemes[0]!
}

function resolveColorFamily(
  color: string,
): EnvelopeTheme['family'] {
  const { h, s } = rgbToHsl(hexToRgb(normalizeHex(color)))

  if (s < 0.12) return 'neutral'
  if (h >= 330 || h < 18) return 'pink'
  if (h >= 18 && h < 72) return 'yellow'
  if (h >= 72 && h < 165) return 'green'
  if (h >= 165 && h < 285) return 'blue'

  return 'pink'
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

function hexToRgb(value: string) {
  return {
    r: Number.parseInt(value.slice(1, 3), 16) / 255,
    g: Number.parseInt(value.slice(3, 5), 16) / 255,
    b: Number.parseInt(value.slice(5, 7), 16) / 255,
  }
}

function rgbToHsl({ r, g, b }: { r: number; g: number; b: number }) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  const lightness = (max + min) / 2

  if (delta === 0) {
    return { h: 0, s: 0, l: lightness }
  }

  const saturation =
    delta / (1 - Math.abs(2 * lightness - 1))

  let hue = 0

  if (max === r) {
    hue = 60 * (((g - b) / delta) % 6)
  } else if (max === g) {
    hue = 60 * ((b - r) / delta + 2)
  } else {
    hue = 60 * ((r - g) / delta + 4)
  }

  if (hue < 0) hue += 360

  return { h: hue, s: saturation, l: lightness }
}
