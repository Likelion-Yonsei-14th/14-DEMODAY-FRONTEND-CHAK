import { downloadBlob } from '../examCareer/examCareerShareImage'

export { downloadBlob }

/** 9:16, the size of an Instagram story. */
export const SHARE_WIDTH = 1080
export const SHARE_HEIGHT = 1920

const FONT = "'Pretendard Variable', Pretendard, 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif"
const LOGO_SRC = '/assets/brand/chak-mark.svg'

const INK = '#292722'
const SECONDARY = '#6f6961'
const BRAND = '#d93a1f'
/** Canvas can't read CSS variables, so the stationery colors in DeskBlast.css are repeated as hex. */
const PIECE_COLORS = ['#f07fa0', '#9a6342', '#c4e03a', '#ffc21a', '#7ea6f0', '#ffe14d', '#e3e9f7', '#2f9c82', '#9aa4b5', '#47b9a8', '#f08a24', '#d94a52', '#8e72f0']

export type ShareCardData = {
  score: number
  bestCombo: number
  lines: number
  typeName: string
  line: string
  newBest: boolean
}

export const SHARE_FILE_NAME = 'chak-desk-blast.png'
export const SHARE_URL_TEXT = 'chak.live'
export const SHARE_CTA = '너도 책상 정리해보기'
export const SHARE_TITLE = '수능 책상 정리'

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('image failed to load'))
    image.src = src
  })
}

async function ensureFonts(sample: string) {
  if (!document.fonts?.load) return
  try {
    await Promise.all([
      document.fonts.load(`800 80px ${FONT}`, sample),
      document.fonts.load(`600 40px ${FONT}`, sample),
    ])
  } catch {
    // System Korean fonts in the stack still render the text correctly.
  }
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.arcTo(x + width, y, x + width, y + height, radius)
  context.arcTo(x + width, y + height, x, y + height, radius)
  context.arcTo(x, y + height, x, y, radius)
  context.arcTo(x, y, x + width, y, radius)
  context.closePath()
}

/** Breaks Korean text into lines that fit `maxWidth`, at spaces where it can and between letters where it must. */
export function wrapLines(measure: (text: string) => number, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  let current = ''
  for (const word of text.split(/(\s+)/)) {
    if (!word) continue
    if (measure(current + word) <= maxWidth) {
      current += word
      continue
    }
    if (current.trim()) lines.push(current.trim())
    current = ''
    if (measure(word) <= maxWidth) {
      current = word.trimStart()
      continue
    }
    for (const char of Array.from(word)) {
      if (measure(current + char) > maxWidth && current) {
        lines.push(current)
        current = ''
      }
      current += char
    }
  }
  if (current.trim()) lines.push(current.trim())
  return lines
}

export async function renderBlastShareImage(data: ShareCardData): Promise<Blob> {
  await ensureFonts(`${SHARE_TITLE}책상정리력${data.score}${data.typeName}${data.line}최고 콤보${data.lines}${SHARE_URL_TEXT}${SHARE_CTA}`)
  const logo = await loadImage(LOGO_SRC).catch(() => null)

  const canvas = document.createElement('canvas')
  canvas.width = SHARE_WIDTH
  canvas.height = SHARE_HEIGHT
  const context = canvas.getContext('2d')
  if (!context) throw new Error('canvas is not supported')

  const cx = SHARE_WIDTH / 2
  context.fillStyle = '#efebe4'
  context.fillRect(0, 0, SHARE_WIDTH, SHARE_HEIGHT)

  // A row of the game's colored tiles above the card.
  const tile = 64
  const gap = 8
  const rowWidth = 9 * tile + 8 * gap
  for (let index = 0; index < 9; index += 1) {
    context.fillStyle = PIECE_COLORS[index % PIECE_COLORS.length]!
    roundedRect(context, cx - rowWidth / 2 + index * (tile + gap), 150, tile, tile, 16)
    context.fill()
  }

  const cardX = 80
  const cardY = 290
  const cardWidth = SHARE_WIDTH - 160
  const cardHeight = SHARE_HEIGHT - 580
  context.save()
  context.shadowColor = 'rgba(30, 20, 10, .16)'
  context.shadowBlur = 48
  context.shadowOffsetY = 16
  context.fillStyle = '#fbf9f5'
  roundedRect(context, cardX, cardY, cardWidth, cardHeight, 56)
  context.fill()
  context.restore()

  context.textAlign = 'center'
  context.textBaseline = 'alphabetic'

  if (logo) {
    const logoHeight = 92
    const logoWidth = (logo.naturalWidth / logo.naturalHeight || 1) * logoHeight
    context.drawImage(logo, cx - logoWidth / 2, cardY + 56, logoWidth, logoHeight)
  } else {
    context.fillStyle = BRAND
    context.font = `800 72px ${FONT}`
    context.fillText('착', cx, cardY + 130)
  }

  context.fillStyle = INK
  context.font = `800 64px ${FONT}`
  context.fillText(SHARE_TITLE, cx, cardY + 250)

  context.fillStyle = SECONDARY
  context.font = `700 38px ${FONT}`
  context.fillText('책상정리력', cx, cardY + 380)
  context.fillStyle = BRAND
  context.font = `800 190px ${FONT}`
  context.fillText(data.score.toLocaleString('ko-KR'), cx, cardY + 560)
  if (data.newBest) {
    context.fillStyle = '#ffedb3'
    roundedRect(context, cx - 130, cardY + 606, 260, 60, 30)
    context.fill()
    context.fillStyle = '#7a5b12'
    context.font = `800 32px ${FONT}`
    context.fillText('최고 기록!', cx, cardY + 648)
  }

  context.fillStyle = INK
  context.font = `800 80px ${FONT}`
  const typeLines = wrapLines((text) => context.measureText(text).width, data.typeName, cardWidth - 120)
  typeLines.forEach((line, index) => context.fillText(line, cx, cardY + 800 + index * 96))
  const afterType = cardY + 800 + (typeLines.length - 1) * 96

  context.fillStyle = SECONDARY
  context.font = `600 42px ${FONT}`
  const memeLines = wrapLines((text) => context.measureText(text).width, `“${data.line}”`, cardWidth - 160)
  memeLines.forEach((line, index) => context.fillText(line, cx, afterType + 110 + index * 62))
  const afterMeme = afterType + 110 + (memeLines.length - 1) * 62

  const statY = Math.max(afterMeme + 120, cardY + cardHeight - 330)
  const half = cardWidth / 2
  context.fillStyle = '#f2ede4'
  roundedRect(context, cardX + 56, statY, cardWidth - 112, 170, 32)
  context.fill()
  context.fillStyle = SECONDARY
  context.font = `700 32px ${FONT}`
  context.fillText('최고 콤보', cardX + half / 2 + 28, statY + 62)
  context.fillText('정리한 줄', cardX + half + half / 2 - 28, statY + 62)
  context.fillStyle = INK
  context.font = `800 66px ${FONT}`
  context.fillText(`${data.bestCombo}콤보`, cardX + half / 2 + 28, statY + 138)
  context.fillText(`${data.lines}줄`, cardX + half + half / 2 - 28, statY + 138)

  const ctaY = SHARE_HEIGHT - 260
  context.fillStyle = BRAND
  roundedRect(context, cx - 330, ctaY, 660, 112, 56)
  context.fill()
  context.fillStyle = '#ffffff'
  context.font = `800 46px ${FONT}`
  context.fillText(SHARE_CTA, cx, ctaY + 72)
  context.fillStyle = INK
  context.font = `800 44px ${FONT}`
  context.fillText(SHARE_URL_TEXT, cx, ctaY + 190)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('image could not be created'))), 'image/png')
  })
}
