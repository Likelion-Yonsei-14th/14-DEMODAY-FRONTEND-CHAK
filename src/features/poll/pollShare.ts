import type { Poll, PollResults } from '@/api/polls'
import { MIN_SHOWN_VOTES, percentages } from './pollResults'

/** 4:5, 메신저와 스토리에서 잘리지 않는 비율. */
const WIDTH = 1080
const HEIGHT = 1350
const FONT = "'Pretendard Variable', Pretendard, 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif"
const LOGO_SRC = '/assets/brand/chak-mark.svg'
const INK = '#292722'
const SECONDARY = '#6f6961'
const BRAND = '#d93a1f'
const BRAND_SOFT = '#ffd9cf'
const TRACK = '#ece6dc'
export const POLL_PATH = '/poll'

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('image failed to load'))
    image.src = src
  })
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, height / 2, width / 2)
  context.beginPath()
  context.moveTo(x + r, y)
  context.arcTo(x + width, y, x + width, y + height, r)
  context.arcTo(x + width, y + height, x, y + height, r)
  context.arcTo(x, y + height, x, y, r)
  context.arcTo(x, y, x + width, y, r)
  context.closePath()
}

/** 결과 카드 이미지: 질문, 선택지별 막대, 참여 수, 내 선택. */
export async function renderPollImage(poll: Poll, results: PollResults, siteUrl: string): Promise<Blob> {
  if (document.fonts?.load) {
    try {
      await Promise.all([document.fonts.load(`800 64px ${FONT}`, poll.question), document.fonts.load(`600 36px ${FONT}`, '가')])
    } catch {
      // 시스템 한글 글꼴로 그린다.
    }
  }
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const context = canvas.getContext('2d')
  if (!context) throw new Error('canvas unavailable')

  context.fillStyle = '#fbf9f5'
  context.fillRect(0, 0, WIDTH, HEIGHT)
  context.textBaseline = 'alphabetic'

  try {
    const logo = await loadImage(LOGO_SRC)
    context.drawImage(logo, 80, 80, 72, 72)
  } catch {
    // 로고 없이 그린다.
  }
  context.fillStyle = INK
  context.font = `800 34px ${FONT}`
  context.fillText('수능 여론', 168, 128)
  context.fillStyle = BRAND
  context.font = `700 30px ${FONT}`
  context.textAlign = 'right'
  context.fillText(poll.tag, WIDTH - 80, 128)
  context.textAlign = 'left'

  // 질문 (두 줄까지)
  context.fillStyle = INK
  context.font = `800 64px ${FONT}`
  const words = poll.question.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (context.measureText(next).width > WIDTH - 160 && line) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  lines.push(line)
  lines.slice(0, 2).forEach((text, index) => context.fillText(text, 80, 270 + index * 80))

  const percent = percentages(results.counts)
  const top = Math.max(...percent)
  const startY = 270 + Math.min(lines.length, 2) * 80 + 40
  const rowHeight = Math.min(130, (1120 - startY) / Math.max(poll.options.length, 1))
  poll.options.forEach((option, index) => {
    const y = startY + index * rowHeight
    const height = rowHeight - 26
    const mine = option.id === poll.myOptionId
    context.fillStyle = TRACK
    roundedRect(context, 80, y, WIDTH - 160, height, 22)
    context.fill()
    const value = percent[index] ?? 0
    if (value > 0) {
      context.fillStyle = value === top ? BRAND : BRAND_SOFT
      roundedRect(context, 80, y, Math.max(44, ((WIDTH - 160) * value) / 100), height, 22)
      context.fill()
    }
    context.fillStyle = value === top ? '#ffffff' : INK
    context.font = `${mine ? 800 : 600} 38px ${FONT}`
    context.fillText(`${mine ? '✓ ' : ''}${option.label}`, 112, y + height / 2 + 13)
    context.fillStyle = INK
    context.textAlign = 'right'
    context.font = `800 40px ${FONT}`
    context.fillText(`${value}%`, WIDTH - 112, y + height / 2 + 14)
    context.textAlign = 'left'
  })

  context.fillStyle = SECONDARY
  context.font = `600 32px ${FONT}`
  context.fillText(
    results.total >= MIN_SHOWN_VOTES ? `${results.total.toLocaleString('ko-KR')}명 참여 · 재미로 보는 참여형 투표` : '재미로 보는 참여형 투표',
    80,
    1180,
  )
  context.fillStyle = INK
  context.font = `700 34px ${FONT}`
  context.fillText(`너는 어떻게 생각해?  ${siteUrl.replace(/^https?:\/\//, '')}`, 80, 1250)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('image export failed'))), 'image/png')
  })
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** 휴대폰이면 공유 창으로, 아니면 이미지를 내려받는다. 사용자가 공유 창을 닫으면 'cancelled'. */
export async function sharePollResult(poll: Poll, results: PollResults): Promise<'shared' | 'downloaded' | 'cancelled' | 'failed'> {
  const siteUrl = `${window.location.origin}${POLL_PATH}`
  let blob: Blob
  try {
    blob = await renderPollImage(poll, results, siteUrl)
  } catch {
    return 'failed'
  }
  const fileName = `chak-poll-${poll.slug}.png`
  const file = new File([blob], fileName, { type: 'image/png' })
  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: poll.question, url: siteUrl })
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
    }
  }
  downloadBlob(blob, fileName)
  return 'downloaded'
}
