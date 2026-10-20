import type { Grade, SubjectResult } from './gradeDrawLogic'

/** 4:5, the ratio most messengers and stories show without cropping. */
const WIDTH = 1080
const HEIGHT = 1350
const FONT = "'Pretendard Variable', Pretendard, 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif"
const LOGO_SRC = '/assets/brand/chak-mark.svg'

const INK = '#292722'
const SECONDARY = '#6f6961'

/** Canvas can't read CSS variables, so the grade chips repeat GradeDraw.css as hex. */
export const GRADE_COLORS: Record<Grade, { background: string; text: string }> = {
  1: { background: '#ffd9cf', text: '#bd2e15' },
  2: { background: '#ffedb3', text: '#7a5b12' },
  3: { background: '#cdefe4', text: '#17664f' },
  4: { background: '#d6e2ff', text: '#2449b8' },
  5: { background: '#e3dbff', text: '#5a3fd1' },
  6: { background: '#ffd3e6', text: '#a3245b' },
  7: { background: '#e9e4db', text: '#5c564f' },
  8: { background: '#e1dbd0', text: '#4d4842' },
  9: { background: '#d9d1c7', text: '#3f3a34' },
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

export async function generateShareImage(
  subjects: readonly SubjectResult[],
  playUrl: string,
): Promise<Blob> {
  await ensureFonts('수능 운빨 뽑기나의 성적표국어수학영어한국사탐구등급너도 도전해 볼래?가상 실제 무관')
  const logo = await loadImage(LOGO_SRC).catch(() => null)

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
    const logoHeight = 72
    const logoWidth = (logo.naturalWidth / logo.naturalHeight || 1) * logoHeight
    context.drawImage(logo, (WIDTH - logoWidth) / 2, 100, logoWidth, logoHeight)
  } else {
    context.fillStyle = '#d93a1f'
    context.font = `800 60px ${FONT}`
    context.fillText('착', WIDTH / 2, 158)
  }

  context.fillStyle = '#d93a1f'
  context.font = `700 32px ${FONT}`
  context.fillText('수능 운빨 뽑기', WIDTH / 2, 230)
  context.fillStyle = INK
  context.font = `800 54px ${FONT}`
  context.fillText('나의 운빨 수능 성적표', WIDTH / 2, 296)

  // Report card: one row per subject, the grade in a colored chip.
  const tableX = 150
  const tableWidth = WIDTH - 300
  const tableTop = 340
  const rowHeight = 110
  context.fillStyle = '#ffffff'
  roundedRect(context, tableX, tableTop, tableWidth, rowHeight * subjects.length + 24, 28)
  context.fill()
  context.strokeStyle = '#d9d1c7'
  context.lineWidth = 2
  context.stroke()

  subjects.forEach((subject, index) => {
    const centerY = tableTop + 12 + rowHeight * index + rowHeight / 2
    if (index > 0) {
      context.strokeStyle = '#e8e2d9'
      context.lineWidth = 2
      context.beginPath()
      context.moveTo(tableX + 36, centerY - rowHeight / 2)
      context.lineTo(tableX + tableWidth - 36, centerY - rowHeight / 2)
      context.stroke()
    }

    context.textAlign = 'left'
    context.fillStyle = INK
    context.font = `700 40px ${FONT}`
    context.fillText(subject.subjectName, tableX + 52, centerY + 14)

    const grade = subject.grade ?? 9
    const colors = GRADE_COLORS[grade]
    const chipWidth = 190
    const chipX = tableX + tableWidth - 52 - chipWidth
    context.fillStyle = colors.background
    roundedRect(context, chipX, centerY - 32, chipWidth, 64, 32)
    context.fill()
    context.textAlign = 'center'
    context.fillStyle = colors.text
    context.font = `800 38px ${FONT}`
    context.fillText(`${grade}등급`, chipX + chipWidth / 2, centerY + 13)
  })

  context.textAlign = 'center'
  context.strokeStyle = '#e8e2d9'
  context.lineWidth = 3
  context.beginPath()
  context.moveTo(140, 1100)
  context.lineTo(WIDTH - 140, 1100)
  context.stroke()

  context.fillStyle = INK
  context.font = `700 36px ${FONT}`
  context.fillText('너도 운빨 수능에 도전해 볼래?', WIDTH / 2, 1160)
  context.fillStyle = SECONDARY
  context.font = `500 26px ${FONT}`
  const displayUrl = playUrl.replace(/^https?:\/\//, '').replace(/\?.*$/, '')
  context.fillText(displayUrl, WIDTH / 2, 1206)
  context.fillStyle = '#928b82'
  context.font = `500 22px ${FONT}`
  context.fillText('가상 성적표 · 실제 수능 성적과 무관해요', WIDTH / 2, 1250)

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
