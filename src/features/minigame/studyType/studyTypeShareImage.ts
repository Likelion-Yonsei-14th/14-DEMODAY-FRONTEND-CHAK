import { getCharacterSrc } from './studyTypeCharacters'
import type { StudyTypeResult } from './studyTypeResults'

/** 4:5, the ratio most messengers and stories show without cropping. */
const WIDTH = 1080
const HEIGHT = 1350
const FONT = "'Pretendard Variable', Pretendard, 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif"

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('character image failed to load'))
    image.src = src
  })
}

/** Waits for the Korean webfont so the canvas doesn't fall back mid-draw. */
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

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.arcTo(x + width, y, x + width, y + height, radius)
  context.arcTo(x + width, y + height, x, y + height, radius)
  context.arcTo(x, y + height, x, y, radius)
  context.arcTo(x, y, x + width, y, radius)
  context.closePath()
}

/** Breaks Korean text at spaces first, and inside a word only when it can't fit. */
export function wrapText(
  measure: (text: string) => number,
  text: string,
  maxWidth: number,
) {
  const lines: string[] = []
  let line = ''

  for (const word of text.split(' ')) {
    const candidate = line ? `${line} ${word}` : word
    if (measure(candidate) <= maxWidth) {
      line = candidate
      continue
    }
    if (line) lines.push(line)
    line = ''
    for (const character of word) {
      if (measure(line + character) > maxWidth && line) {
        lines.push(line)
        line = character
      } else {
        line += character
      }
    }
  }

  if (line) lines.push(line)
  return lines
}

export async function renderShareImage(
  result: StudyTypeResult,
  testUrl: string,
): Promise<Blob> {
  await ensureFonts(`${result.typeName}${result.tagline}나의 수험생 유형은`)
  const character = await loadImage(getCharacterSrc(result.typeCode))

  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const context = canvas.getContext('2d')
  if (!context) throw new Error('canvas is not supported')

  context.fillStyle = '#efebe4'
  context.fillRect(0, 0, WIDTH, HEIGHT)

  context.save()
  context.shadowColor = 'rgba(30, 20, 10, .14)'
  context.shadowBlur = 40
  context.shadowOffsetY = 12
  context.fillStyle = '#fbf9f5'
  roundedRect(context, 60, 60, WIDTH - 120, HEIGHT - 120, 48)
  context.fill()
  context.restore()

  context.textAlign = 'center'
  context.textBaseline = 'alphabetic'

  context.fillStyle = '#6f6961'
  context.font = `600 38px ${FONT}`
  context.fillText('나의 수험생 유형은?', WIDTH / 2, 160)

  const characterSize = 500
  context.drawImage(character, (WIDTH - characterSize) / 2, 200, characterSize, characterSize)

  context.fillStyle = '#292722'
  context.font = `800 84px ${FONT}`
  context.fillText(result.typeName, WIDTH / 2, 842)

  context.fillStyle = '#d93a1f'
  context.font = `600 44px ${FONT}`
  const taglineLines = wrapText(
    (text) => context.measureText(text).width,
    `“${result.tagline}”`,
    WIDTH - 240,
  )
  taglineLines.slice(0, 2).forEach((line, index) => {
    context.fillText(line, WIDTH / 2, 932 + index * 60)
  })

  context.strokeStyle = '#e8e2d9'
  context.lineWidth = 3
  context.beginPath()
  context.moveTo(140, 1120)
  context.lineTo(WIDTH - 140, 1120)
  context.stroke()

  context.fillStyle = '#292722'
  context.font = `700 36px ${FONT}`
  context.fillText('나도 테스트해 보기', WIDTH / 2, 1186)
  context.fillStyle = '#6f6961'
  context.font = `500 30px ${FONT}`
  const displayUrl = testUrl.replace(/^https?:\/\//, '').replace(/\?.*$/, '')
  context.fillText(displayUrl, WIDTH / 2, 1236)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('image export failed'))),
      'image/png',
    )
  })
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
