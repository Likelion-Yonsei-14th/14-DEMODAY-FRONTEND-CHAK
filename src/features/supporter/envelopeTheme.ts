export type EnvelopePattern =
  | 'solid'
  | 'dot'
  | 'micro-dot'
  | 'big-dot'
  | 'thin-stripe'
  | 'wide-stripe'
  | 'diagonal-stripe'
  | 'candy-stripe'
  | 'check'
  | 'plaid'
  | 'wave'
  | 'tiny-heart'
  | 'star'
  | 'daisy'
  | 'clover'
  | 'diamond'
  | 'border'
  | 'notebook'

export type EnvelopeColorFamily =
  | 'pink'
  | 'green'
  | 'blue'
  | 'yellow'
  | 'purple'
  | 'orange'
  | 'neutral'

export type EnvelopeTheme = {
  id: string
  family: EnvelopeColorFamily
  baseColor: string
  flapColor: string
  pocketColor: string
  sideColor: string
  patternColor: string
  inkColor: string
  pattern: EnvelopePattern
}

const envelopeThemes: EnvelopeTheme[] = [
  // Green-card families: keep the envelope complementary rather than all-green.
  theme('cream-coral-dot', 'green', '#FFF7E9', '#FFF9F1', '#F8EDDC', '#F3E5D0', '#E79A8D', '#5B4D45', 'dot'),
  theme('butter-sage-stripe', 'green', '#F8E9AE', '#FFF3C8', '#F1DFA1', '#EAD792', '#7E9D77', '#4C5848', 'thin-stripe'),
  theme('blush-forest-plaid', 'green', '#F5D8DD', '#F9E5E9', '#EFCED5', '#E9C4CD', '#56755D', '#46554A', 'plaid'),
  theme('mint-cream-diamond', 'green', '#DCEBDD', '#EAF3EA', '#D1E3D4', '#C8DACB', '#FFF4DF', '#4C5A50', 'diamond'),
  theme('lavender-sage-daisy', 'green', '#E4DDF1', '#EEE8F7', '#DAD1EA', '#D1C7E2', '#78916F', '#514D5C', 'daisy'),

  // Pink-card families.
  theme('cream-rose-candy', 'pink', '#FFF5E9', '#FFF9F1', '#F8E9DA', '#F1DFC9', '#C97C8B', '#59484A', 'candy-stripe'),
  theme('sky-pink-big-dot', 'pink', '#DDEBF5', '#EAF3F9', '#D3E4F0', '#CADCE9', '#E89AAF', '#49545B', 'big-dot'),
  theme('butter-coral-check', 'pink', '#F8E8A9', '#FFF0C4', '#F1DC99', '#E8D18C', '#D67B70', '#5D4C3F', 'check'),
  theme('pink-wine-border', 'pink', '#F1CDD8', '#F7DDE4', '#E9C1CE', '#E2B8C6', '#8A5360', '#604B52', 'border'),
  theme('mint-rose-heart', 'pink', '#DDF0E6', '#EAF7F0', '#D2E8DD', '#C9DFD5', '#D88398', '#4F5852', 'tiny-heart'),

  // Blue-card families.
  theme('cream-cobalt-micro-dot', 'blue', '#FFF7EA', '#FFFAF2', '#F6EBDC', '#EFE2D0', '#6E92C7', '#4D5260', 'micro-dot'),
  theme('butter-sky-stripe', 'blue', '#F7E8A9', '#FFF0C5', '#EFDC99', '#E7D18C', '#86BFD7', '#4E5660', 'thin-stripe'),
  theme('blush-navy-plaid', 'blue', '#F3D6DE', '#F8E2E8', '#EAC9D3', '#E3C0CB', '#65768B', '#4B5160', 'plaid'),
  theme('sky-red-wide', 'blue', '#D7EAF4', '#E7F2F8', '#CDE2ED', '#C3D9E5', '#D9867D', '#4B5860', 'wide-stripe'),
  theme('lavender-cobalt-star', 'blue', '#E3DDF2', '#EEE9F8', '#D8D1EA', '#CFC6E2', '#6A86BF', '#4E5060', 'star'),

  // Yellow-card families.
  theme('cream-orange-wave', 'yellow', '#FFF7E8', '#FFFAF2', '#F7EAD8', '#F0E0CC', '#E4A267', '#5C5043', 'wave'),
  theme('butter-coral-heart', 'yellow', '#F8E8A9', '#FFF0C5', '#F0DC99', '#E7D08C', '#D98279', '#5B4D43', 'tiny-heart'),
  theme('cream-sage-check', 'yellow', '#FFF5E7', '#FFF9F1', '#F7E8D8', '#EEDDC9', '#8FA884', '#4F574B', 'check'),
  theme('peach-blue-border', 'yellow', '#F7D8BE', '#FCE5D2', '#EFCDB0', '#E7C3A5', '#7599B8', '#55504C', 'border'),
  theme('mint-butter-clover', 'yellow', '#DCEEE4', '#EAF6F0', '#D0E5D8', '#C7DDD0', '#D7AD61', '#4D584F', 'clover'),

  // Purple-card families.
  theme('cream-lilac-dot', 'purple', '#FFF6EA', '#FFFAF2', '#F7E9DA', '#EFDECB', '#A890C8', '#554E5D', 'dot'),
  theme('blush-violet-diagonal', 'purple', '#F2D7E1', '#F8E3EA', '#EACAD5', '#E2C0CD', '#8C72B3', '#564D5B', 'diagonal-stripe'),
  theme('butter-lavender-daisy', 'purple', '#F7E7A7', '#FFF0C3', '#EFDB97', '#E6CF88', '#9E86BE', '#56505B', 'daisy'),
  theme('mint-plum-diamond', 'purple', '#DCEDE5', '#EAF6F0', '#D2E4DA', '#C8DBD1', '#875B78', '#4D5651', 'diamond'),
  theme('lavender-navy-notebook', 'purple', '#E1D9EF', '#EEE8F6', '#D5CCE6', '#CCC2DD', '#65718C', '#4D4E59', 'notebook'),

  // Orange / peach-card families.
  theme('cream-tangerine-big-dot', 'orange', '#FFF6E9', '#FFFAF2', '#F7E8D8', '#EFDECB', '#E49B65', '#5A4E46', 'big-dot'),
  theme('sky-peach-candy', 'orange', '#DCEAF3', '#EAF3F8', '#D1E1EC', '#C8D8E4', '#EAA17F', '#4D565D', 'candy-stripe'),
  theme('sage-orange-plaid', 'orange', '#DDE8D7', '#EAF1E5', '#D2DFCC', '#C9D7C3', '#D78E55', '#4E584B', 'plaid'),
  theme('blush-rust-star', 'orange', '#F3D5D8', '#F8E1E4', '#EAC7CC', '#E2BDC3', '#B96F55', '#5B4C4A', 'star'),
  theme('peach-cobalt-wave', 'orange', '#F5D3BA', '#FBE3D2', '#EBC7AB', '#E2BCA0', '#6F8EB8', '#55505A', 'wave'),

  // Neutral-card families.
  theme('paper-solid', 'neutral', '#F4EEE3', '#FAF6EE', '#EDE4D6', '#E6DCCD', '#B9A99A', '#554C45', 'solid'),
  theme('paper-blue-stripe', 'neutral', '#F7F1E8', '#FBF7F0', '#EEE5D9', '#E7DDD0', '#90A9BE', '#50555B', 'thin-stripe'),
  theme('paper-pink-micro-dot', 'neutral', '#F5EEE4', '#FAF5ED', '#EEE4D8', '#E7DCCF', '#D49AA5', '#594D4E', 'micro-dot'),
  theme('paper-green-notebook', 'neutral', '#F5EFE5', '#FAF6EE', '#ECE3D7', '#E5DACD', '#8FA486', '#4E554C', 'notebook'),
  theme('paper-navy-border', 'neutral', '#F3EDE4', '#F9F5EE', '#EBE2D7', '#E4D9CC', '#6E7C8E', '#4F5052', 'border'),
]

export function createEnvelopeTheme(
  messageId: string,
  previewColor = '#F2E5DA',
): EnvelopeTheme {
  const family = resolveColorFamily(previewColor)
  const candidates = envelopeThemes.filter((item) => item.family === family)
  const fallback = envelopeThemes.filter((item) => item.family === 'neutral')
  const pool = candidates.length > 0 ? candidates : fallback
  const index = stableHash(messageId) % pool.length

  return pool[index] ?? envelopeThemes[0]!
}

function theme(
  id: string,
  family: EnvelopeColorFamily,
  baseColor: string,
  flapColor: string,
  pocketColor: string,
  sideColor: string,
  patternColor: string,
  inkColor: string,
  pattern: EnvelopePattern,
): EnvelopeTheme {
  return {
    id,
    family,
    baseColor,
    flapColor,
    pocketColor,
    sideColor,
    patternColor,
    inkColor,
    pattern,
  }
}

function resolveColorFamily(color: string): EnvelopeColorFamily {
  const { h, s } = rgbToHsl(hexToRgb(normalizeHex(color)))

  if (s < 0.12) return 'neutral'
  if (h >= 335 || h < 12) return 'pink'
  if (h >= 12 && h < 42) return 'orange'
  if (h >= 42 && h < 78) return 'yellow'
  if (h >= 78 && h < 165) return 'green'
  if (h >= 165 && h < 260) return 'blue'
  if (h >= 260 && h < 335) return 'purple'

  return 'neutral'
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

  const saturation = delta / (1 - Math.abs(2 * lightness - 1))

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
