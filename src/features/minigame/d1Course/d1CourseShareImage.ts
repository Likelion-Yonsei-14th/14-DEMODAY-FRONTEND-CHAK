import { courseLabelOf, type ActivityId } from './d1CourseConfig'

/** 4:5, the ratio most messengers and stories show without cropping. */
const WIDTH = 1080
const HEIGHT = 1350
const FONT = "'Pretendard Variable', Pretendard, 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif"
const LOGO_SRC = '/assets/brand/chak-mark.svg'

const INK = '#292722'
const SECONDARY = '#6f6961'
/** Canvas can't read CSS variables, so the ticket colors in D1Course.css are repeated as hex. */
const TICKET = '#1f4e79'
const TICKET_TEXT = '#fdf7e8'
const STOP_COLORS = ['#ffd9cf', '#ffedb3', '#cdefe4'] as const
const STOP_TEXT = ['#bd2e15', '#7a5b12', '#17664f'] as const

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

export async function renderShareImage(
  owner: string,
  place: string,
  activities: readonly ActivityId[],
  playUrl: string,
): Promise<Blob> {
  const stops = activities.map(courseLabelOf)
  const title = `${owner}의 수능 끝 코스`
  await ensureFonts(`수능 끝 D+1 코스 짜기${title}${place}${stops.join('')}너도 코스를 짜 볼래?`)
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

  context.fillStyle = SECONDARY
  context.font = `700 32px ${FONT}`
  context.fillText('수능 끝 D+1 코스 짜기', WIDTH / 2, 256)
  context.fillStyle = INK
  context.font = `800 60px ${FONT}`
  context.fillText(title, WIDTH / 2, 336)

  // The course on a ticket: the place on top, the three stops below.
  const ticketX = 120
  const ticketY = 396
  const ticketWidth = WIDTH - 240
  const ticketHeight = 620
  context.fillStyle = TICKET
  roundedRect(context, ticketX, ticketY, ticketWidth, ticketHeight, 32)
  context.fill()

  context.fillStyle = 'rgba(253, 247, 232, .72)'
  context.font = `700 30px ${FONT}`
  context.fillText('D+1 · 수능 다음 날', WIDTH / 2, ticketY + 78)
  context.fillStyle = TICKET_TEXT
  context.font = `800 ${place.length > 8 ? 64 : 84}px ${FONT}`
  context.fillText(place, WIDTH / 2, ticketY + 182)

  context.setLineDash([14, 12])
  context.strokeStyle = 'rgba(253, 247, 232, .4)'
  context.lineWidth = 3
  context.beginPath()
  context.moveTo(ticketX + 40, ticketY + 236)
  context.lineTo(ticketX + ticketWidth - 40, ticketY + 236)
  context.stroke()
  context.setLineDash([])

  stops.forEach((stop, index) => {
    const rowY = ticketY + 280 + index * 106
    const rowX = ticketX + 56
    context.fillStyle = STOP_COLORS[index]!
    roundedRect(context, rowX, rowY, ticketWidth - 112, 84, 42)
    context.fill()
    context.fillStyle = STOP_TEXT[index]!
    context.textAlign = 'left'
    context.font = `800 32px ${FONT}`
    context.fillText(`${index + 1}`, rowX + 36, rowY + 54)
    context.fillStyle = INK
    context.font = `800 40px ${FONT}`
    context.fillText(stop, rowX + 96, rowY + 56)
    context.textAlign = 'center'
  })

  context.strokeStyle = '#e8e2d9'
  context.lineWidth = 3
  context.beginPath()
  context.moveTo(140, 1120)
  context.lineTo(WIDTH - 140, 1120)
  context.stroke()

  context.fillStyle = INK
  context.font = `700 36px ${FONT}`
  context.fillText('너도 수능 끝 코스를 짜 볼래?', WIDTH / 2, 1196)
  context.fillStyle = SECONDARY
  context.font = `500 28px ${FONT}`
  const displayUrl = playUrl.replace(/^https?:\/\//, '').replace(/\?.*$/, '')
  context.fillText(displayUrl, WIDTH / 2, 1244)

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
