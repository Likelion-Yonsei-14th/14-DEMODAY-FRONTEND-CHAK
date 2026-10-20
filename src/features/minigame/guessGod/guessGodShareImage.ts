import { QUESTION_COUNT } from './guessGodLogic'
import type { GuessGodResult, GuessGodTier } from './guessGodResults'

/** 4:5, the ratio most messengers and stories show without cropping. */
const WIDTH = 1080
const HEIGHT = 1350
const FONT = "'Pretendard Variable', Pretendard, 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif"
const LOGO_SRC = '/assets/brand/chak-mark.svg'

const INK = '#292722'
const SECONDARY = '#6f6961'

/** Canvas can't read CSS variables, so the tier tones are repeated as hex. */
const TIER_COLORS: Record<GuessGodTier, { background: string; accent: string }> = {
  'day-off': { background: '#e3dbff', accent: '#7b5cff' },
  'off-day': { background: '#d6e2ff', accent: '#2f6bff' },
  rookie: { background: '#cdefe4', accent: '#17866f' },
  expert: { background: '#ffedb3', accent: '#9a7424' },
  master: { background: '#ffd3e6', accent: '#c2306f' },
  legend: { background: '#ffd9cf', accent: '#d93a1f' },
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('image failed to load'))
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

/** A row of OMR bubbles: filled for a hit, outlined for a miss. */
function drawBubbles(
  context: CanvasRenderingContext2D,
  grades: readonly boolean[],
  centerY: number,
  accent: string,
) {
  const gap = 66
  const startX = WIDTH / 2 - (gap * (grades.length - 1)) / 2
  grades.forEach((correct, index) => {
    const x = startX + gap * index
    context.beginPath()
    context.ellipse(x, centerY, 20, 27, 0, 0, Math.PI * 2)
    if (correct) {
      context.fillStyle = accent
      context.fill()
    } else {
      context.fillStyle = '#ffffff'
      context.fill()
      context.strokeStyle = 'rgba(41, 39, 34, .35)'
      context.lineWidth = 3
      context.stroke()
    }
  })
}

export async function renderShareImage(
  result: GuessGodResult,
  score: number,
  grades: readonly boolean[],
  playUrl: string,
): Promise<Blob> {
  await ensureFonts(`${result.title}${result.quote}오늘의 찍신은 나야!문제 중 정답 너도 도전해 볼래?`)
  const logo = await loadImage(LOGO_SRC).catch(() => null)
  const colors = TIER_COLORS[result.tier]

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

  if (logo) {
    const logoHeight = 84
    const logoWidth = (logo.naturalWidth / logo.naturalHeight || 1) * logoHeight
    context.drawImage(logo, (WIDTH - logoWidth) / 2, 104, logoWidth, logoHeight)
  } else {
    context.fillStyle = '#d93a1f'
    context.font = `800 64px ${FONT}`
    context.fillText('착', WIDTH / 2, 170)
  }

  context.fillStyle = INK
  context.font = `800 56px ${FONT}`
  context.fillText('오늘의 찍신은 나야!', WIDTH / 2, 268)
  context.fillStyle = SECONDARY
  context.font = `600 32px ${FONT}`
  context.fillText('나의 수능 찍기 실력은?', WIDTH / 2, 320)

  context.fillStyle = colors.background
  roundedRect(context, 140, 370, WIDTH - 280, 520, 36)
  context.fill()

  const scoreText = String(score)
  const totalText = ` / ${QUESTION_COUNT}`
  context.font = `800 210px ${FONT}`
  const scoreWidth = context.measureText(scoreText).width
  context.font = `700 72px ${FONT}`
  const totalWidth = context.measureText(totalText).width
  const scoreLeft = (WIDTH - scoreWidth - totalWidth) / 2
  context.textAlign = 'left'
  context.fillStyle = INK
  context.font = `800 210px ${FONT}`
  context.fillText(scoreText, scoreLeft, 630)
  context.fillStyle = SECONDARY
  context.font = `700 72px ${FONT}`
  context.fillText(totalText, scoreLeft + scoreWidth, 630)
  context.textAlign = 'center'

  context.fillStyle = INK
  context.font = `700 42px ${FONT}`
  context.fillText(`${QUESTION_COUNT}문제 중 ${score}문제 정답!`, WIDTH / 2, 718)

  drawBubbles(context, grades, 806, colors.accent)

  context.fillStyle = colors.accent
  context.font = `800 70px ${FONT}`
  context.fillText(result.title, WIDTH / 2, 1000)

  context.fillStyle = INK
  context.font = `600 38px ${FONT}`
  const quoteLines = wrapText(
    (text) => context.measureText(text).width,
    `“${result.quote}”`,
    WIDTH - 260,
  )
  quoteLines.slice(0, 2).forEach((line, index) => {
    context.fillText(line, WIDTH / 2, 1066 + index * 52)
  })

  context.strokeStyle = '#e8e2d9'
  context.lineWidth = 3
  context.beginPath()
  context.moveTo(140, 1160)
  context.lineTo(WIDTH - 140, 1160)
  context.stroke()

  context.fillStyle = INK
  context.font = `700 36px ${FONT}`
  context.fillText('너도 도전해 볼래?', WIDTH / 2, 1212)
  context.fillStyle = SECONDARY
  context.font = `500 28px ${FONT}`
  const displayUrl = playUrl.replace(/^https?:\/\//, '').replace(/\?.*$/, '')
  context.fillText(displayUrl, WIDTH / 2, 1256)

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
