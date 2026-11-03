import { downloadBlob } from '../examCareer/examCareerShareImage'
import { drawBoard } from './deskBlastShareBoard'
import type { Board, PlacedPiece } from './deskBlastEngine'
import type { BlastLook } from './deskBlastLook'

export { downloadBlob }

/** 9:16, the size of an Instagram story. */
export const SHARE_WIDTH = 1080
export const SHARE_HEIGHT = 1920

const FONT = "'Pretendard Variable', Pretendard, 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif"
const LOGO_SRC = '/assets/brand/chak-mark.svg'

const INK = '#292722'
const SECONDARY = '#6f6961'
const BRAND = '#d93a1f'

export type ShareCardData = {
  score: number
  bestCombo: number
  lines: number
  typeName: string
  line: string
  newBest: boolean
  /** The desk as it ended, drawn onto the card so it reads as the block puzzle it is. */
  board: Board
  placed: readonly PlacedPiece[]
  look: BlastLook
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

/** Heights of each part of the card, top to bottom, for a given number of text lines. */
export const CARD = {
  logoY: 70,
  logoHeight: 80,
  titleBaseline: 238,
  boardY: 290,
  /** The most the desk is drawn at; it shrinks when long text needs the room. */
  boardMax: 780,
  boardMin: 560,
  scoreLabelGap: 80,
  scoreSize: 168,
  typeSize: 72,
  typeLine: 84,
  memeSize: 40,
  memeLine: 54,
  statSize: 34,
  ctaHeight: 100,
  bottomMargin: 36,
} as const

/** The biggest desk that still leaves the text and the button on the card. */
export function fitBoardSize(typeLines: number, memeLines: number, newBest: boolean) {
  for (let size = CARD.boardMax; size > CARD.boardMin; size -= 10) {
    if (cardLayout(typeLines, memeLines, newBest, size).bottom <= SHARE_HEIGHT - 12) return size
  }
  return CARD.boardMin
}

/** Where the parts under the board go, so a long type name or meme line pushes the rest down without overlapping the button. */
export function cardLayout(typeLines: number, memeLines: number, newBest: boolean, boardSize: number) {
  const boardBottom = CARD.boardY + boardSize
  const labelBaseline = boardBottom + CARD.scoreLabelGap
  const scoreBaseline = labelBaseline + CARD.scoreSize + 4
  const pillY = scoreBaseline + 18
  const afterScore = newBest ? pillY + 56 : scoreBaseline + 22
  const typeBaseline = afterScore + 78
  const memeBaseline = typeBaseline + (typeLines - 1) * CARD.typeLine + 70
  const statBaseline = memeBaseline + (memeLines - 1) * CARD.memeLine + 80
  const ctaY = Math.max(statBaseline + 44, SHARE_HEIGHT - CARD.bottomMargin - CARD.ctaHeight - 62)
  return {
    labelBaseline,
    scoreBaseline,
    pillY,
    typeBaseline,
    memeBaseline,
    statBaseline,
    ctaY,
    urlBaseline: ctaY + CARD.ctaHeight + 52,
    /** The lowest point drawn; must stay on the card. */
    bottom: ctaY + CARD.ctaHeight + 52 + 8,
  }
}

export async function renderBlastShareImage(data: ShareCardData): Promise<Blob> {
  await ensureFonts(`${SHARE_TITLE}책상정리력${data.score}${data.typeName}${data.line}최고 콤보 정리한 줄 ${data.bestCombo}콤보 ${data.lines}줄 ${SHARE_URL_TEXT}${SHARE_CTA}`)
  const logo = await loadImage(LOGO_SRC).catch(() => null)

  const canvas = document.createElement('canvas')
  canvas.width = SHARE_WIDTH
  canvas.height = SHARE_HEIGHT
  const context = canvas.getContext('2d')
  if (!context) throw new Error('canvas is not supported')

  const cx = SHARE_WIDTH / 2
  context.fillStyle = '#efebe4'
  context.fillRect(0, 0, SHARE_WIDTH, SHARE_HEIGHT)
  context.textAlign = 'center'
  context.textBaseline = 'alphabetic'

  if (logo) {
    const logoWidth = (logo.naturalWidth / logo.naturalHeight || 1) * CARD.logoHeight
    context.drawImage(logo, cx - logoWidth / 2, CARD.logoY, logoWidth, CARD.logoHeight)
  } else {
    context.fillStyle = BRAND
    context.font = `800 64px ${FONT}`
    context.fillText('착', cx, CARD.logoY + 62)
  }
  context.fillStyle = INK
  context.font = `800 56px ${FONT}`
  context.fillText(SHARE_TITLE, cx, CARD.titleBaseline)

  context.font = `800 ${CARD.typeSize}px ${FONT}`
  const typeLines = wrapLines((text) => context.measureText(text).width, data.typeName, SHARE_WIDTH - 140)
  context.font = `600 ${CARD.memeSize}px ${FONT}`
  const memeLines = wrapLines((text) => context.measureText(text).width, `“${data.line}”`, SHARE_WIDTH - 200)
  const boardSize = fitBoardSize(typeLines.length, memeLines.length, data.newBest)
  const layout = cardLayout(typeLines.length, memeLines.length, data.newBest, boardSize)

  // The desk as the game ended: this is what says it is a block puzzle.
  await drawBoard(context, { x: (SHARE_WIDTH - boardSize) / 2, y: CARD.boardY, size: boardSize }, data)
  context.textAlign = 'center'

  context.fillStyle = SECONDARY
  context.font = `700 34px ${FONT}`
  context.fillText('책상정리력', cx, layout.labelBaseline)
  context.fillStyle = BRAND
  context.font = `800 ${CARD.scoreSize}px ${FONT}`
  context.fillText(data.score.toLocaleString('ko-KR'), cx, layout.scoreBaseline)
  if (data.newBest) {
    context.fillStyle = '#ffedb3'
    roundedRect(context, cx - 120, layout.pillY, 240, 52, 26)
    context.fill()
    context.fillStyle = '#7a5b12'
    context.font = `800 30px ${FONT}`
    context.fillText('최고 기록!', cx, layout.pillY + 37)
  }

  context.fillStyle = INK
  context.font = `800 ${CARD.typeSize}px ${FONT}`
  typeLines.forEach((line, index) => context.fillText(line, cx, layout.typeBaseline + index * CARD.typeLine))

  context.fillStyle = SECONDARY
  context.font = `600 ${CARD.memeSize}px ${FONT}`
  memeLines.forEach((line, index) => context.fillText(line, cx, layout.memeBaseline + index * CARD.memeLine))

  context.fillStyle = INK
  context.font = `700 ${CARD.statSize}px ${FONT}`
  context.fillText(`최고 콤보 ${data.bestCombo} · 정리한 줄 ${data.lines}`, cx, layout.statBaseline)

  context.fillStyle = BRAND
  roundedRect(context, cx - 330, layout.ctaY, 660, CARD.ctaHeight, 50)
  context.fill()
  context.fillStyle = '#ffffff'
  context.font = `800 44px ${FONT}`
  context.fillText(SHARE_CTA, cx, layout.ctaY + 66)
  context.fillStyle = INK
  context.font = `800 40px ${FONT}`
  context.fillText(SHARE_URL_TEXT, cx, layout.urlBaseline)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('image could not be created'))), 'image/png')
  })
}
