import { attemptLabel, MAJOR_FIELDS, SUBJECTS, TRACKS } from './examCareerConfig'
import { subjectLabel, universityLabel } from './examCareerEngine'
import type { SharedCareer } from './examCareerShare'

/** 4:5, the ratio most messengers and stories show without cropping. */
const WIDTH = 1080
const HEIGHT = 1350
const FONT = "'Pretendard Variable', Pretendard, 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif"
const LOGO_SRC = '/assets/brand/chak-mark.svg'

const INK = '#292722'
const SECONDARY = '#6f6961'
const BOARD = '#2f5b48'
const FRAME = '#b98b56'
const CHALK = '#fffdf6'

/** Canvas can't read CSS variables, so the grade tones in ExamCareer.css are repeated as hex. */
const GRADE_COLORS: Record<number, { background: string; text: string }> = {
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

/** The destination line, as the summary page words it. */
export function destinationText(career: SharedCareer) {
  return career.enrolled
    ? `${universityLabel(career.enrolled)} ${MAJOR_FIELDS[career.track]} 진학`
    : '대학에 가지 않고 수험 생활 마무리'
}

export async function renderShareImage(career: SharedCareer, name: string, playUrl: string): Promise<Blob> {
  const labels = SUBJECTS.map((subject) => subjectLabel(subject.id, career.electives))
  const destination = destinationText(career)
  await ensureFonts(`수험생 커리어 시뮬레이터${name}최종 수능 평균등급${labels.map((label) => label.name + (label.elective ?? '')).join('')}${destination}너도 시작해 볼래?`)
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
    const logoHeight = 84
    const logoWidth = (logo.naturalWidth / logo.naturalHeight || 1) * logoHeight
    context.drawImage(logo, (WIDTH - logoWidth) / 2, 104, logoWidth, logoHeight)
  } else {
    context.fillStyle = '#d93a1f'
    context.font = `800 64px ${FONT}`
    context.fillText('착', WIDTH / 2, 170)
  }

  context.fillStyle = INK
  context.font = `800 54px ${FONT}`
  context.fillText('수험생 커리어 시뮬레이터', WIDTH / 2, 266)
  context.fillStyle = SECONDARY
  context.font = `600 32px ${FONT}`
  context.fillText(`${name} · ${TRACKS[career.track].label} · ${attemptLabel(career.attempt)}`, WIDTH / 2, 318)

  // The CSAT on the classroom blackboard, as on the summary page.
  const boardX = 120
  const boardY = 370
  const boardWidth = WIDTH - 240
  const boardHeight = 470
  context.fillStyle = FRAME
  roundedRect(context, boardX, boardY, boardWidth, boardHeight, 28)
  context.fill()
  context.fillStyle = BOARD
  roundedRect(context, boardX + 14, boardY + 14, boardWidth - 28, boardHeight - 28, 18)
  context.fill()

  context.fillStyle = 'rgba(255, 253, 246, .75)'
  context.font = `700 32px ${FONT}`
  context.fillText(`${attemptLabel(career.attempt)} · 최종 수능`, WIDTH / 2, boardY + 82)
  context.fillStyle = CHALK
  context.font = `800 96px ${FONT}`
  context.fillText(`평균 ${career.average}등급`, WIDTH / 2, boardY + 196)

  const columnWidth = (boardWidth - 60) / SUBJECTS.length
  SUBJECTS.forEach((subject, index) => {
    const centerX = boardX + 30 + columnWidth * (index + 0.5)
    const label = labels[index]!
    context.fillStyle = CHALK
    context.font = `700 28px ${FONT}`
    context.fillText(label.name, centerX, boardY + 276)
    if (label.elective) {
      context.fillStyle = 'rgba(255, 253, 246, .7)'
      context.font = `600 22px ${FONT}`
      context.fillText(label.elective, centerX, boardY + 310)
    }
    const grade = career.grades[subject.id]
    const colors = GRADE_COLORS[grade] ?? GRADE_COLORS[9]!
    context.fillStyle = colors.background
    roundedRect(context, centerX - 64, boardY + 336, 128, 72, 36)
    context.fill()
    context.fillStyle = colors.text
    context.font = `800 36px ${FONT}`
    context.fillText(`${grade}등급`, centerX, boardY + 385)
  })

  context.fillStyle = SECONDARY
  context.font = `600 32px ${FONT}`
  context.fillText('진학 결과', WIDTH / 2, 930)
  context.fillStyle = career.enrolled ? '#d93a1f' : INK
  context.font = `800 ${career.enrolled ? 52 : 44}px ${FONT}`
  context.fillText(career.enrolled ? universityLabel(career.enrolled) : '진학하지 않고 마무리', WIDTH / 2, 1000)
  if (career.enrolled) {
    context.fillStyle = INK
    context.font = `600 36px ${FONT}`
    context.fillText(MAJOR_FIELDS[career.track], WIDTH / 2, 1056)
  }

  context.strokeStyle = '#e8e2d9'
  context.lineWidth = 3
  context.beginPath()
  context.moveTo(140, 1140)
  context.lineTo(WIDTH - 140, 1140)
  context.stroke()

  context.fillStyle = INK
  context.font = `700 36px ${FONT}`
  context.fillText('너도 수험생 커리어를 시작해 볼래?', WIDTH / 2, 1204)
  context.fillStyle = SECONDARY
  context.font = `500 28px ${FONT}`
  const displayUrl = playUrl.replace(/^https?:\/\//, '').replace(/\?.*$/, '')
  context.fillText(displayUrl, WIDTH / 2, 1250)

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
