import type PptxGenJS from 'pptxgenjs'
import { DESK_NOTES, PITCH_DESK, PITCH_LOGO } from './PitchSlideView'
import type { PitchScreen, PitchSlide } from './pitchSlides'

const INK = '2A1A12'
const BROWN = '3A2217'
const RED = 'C4452C'
const DEEP_RED = 'A4472F'
const YELLOW = 'F1D58A'
const CREAM = 'FFFAF3'
const SAND = 'F1E2C8'
const LINE = 'E6D8C8'
const MUTED = '75655A'
const SOFT = 'ECDACB'
const FONT = 'Malgun Gothic'

const LEFT = 0.75
const WIDTH = 11.83
const GAP = 0.25

type Slide = PptxGenJS.Slide
type TextOptions = PptxGenJS.TextPropsOptions

const box = (slide: Slide, x: number, y: number, w: number, h: number, fill: string, line = fill, radius = 0.1) =>
  slide.addShape('roundRect', { x, y, w, h, rectRadius: radius, fill: { color: fill }, line: { color: line, width: 0.75 } })

const write = (slide: Slide, text: string, options: TextOptions) => slide.addText(text, { fontFace: FONT, margin: 0, color: INK, ...options })

const columns = (count: number, gap = GAP) => {
  const width = (WIDTH - gap * (count - 1)) / count
  return { width, x: (index: number) => LEFT + index * (width + gap) }
}

/** 쿠폰 한 장: 왼쪽에 굵은 줄, 빨간 꼬리표, 매장 이름 */
function coupon(slide: Slide, x: number, y: number, w: number, h: number, store: string, sub: string, scale = 1) {
  box(slide, x, y, w, h, CREAM, INK)
  slide.addShape('rect', { x: x + 0.05 * scale, y: y + 0.08 * scale, w: 0.07 * scale, h: h - 0.16 * scale, fill: { color: INK }, line: { color: INK } })
  write(slide, '수험생 쿠폰', { x: x + 0.25 * scale, y: y + 0.16 * scale, w: 1.15 * scale, h: 0.26 * scale, shape: 'roundRect', rectRadius: 0.13 * scale, fill: { color: RED }, fontSize: 9 * scale, bold: true, color: 'FFFFFF', align: 'center' })
  write(slide, store, { x: x + 0.25 * scale, y: y + 0.48 * scale, w: w - 0.4 * scale, h: h - 0.95 * scale, fontSize: 24 * scale, bold: true, fit: 'shrink', valign: 'middle' })
  write(slide, sub, { x: x + 0.25 * scale, y: y + h - 0.42 * scale, w: w - 0.4 * scale, h: 0.3 * scale, fontSize: 10 * scale, color: MUTED, fit: 'shrink' })
}

/** 휴대폰 화면 그림을 도형으로 그린다. */
function phone(slide: Slide, x: number, y: number, h: number, screen: PitchScreen, desk: string) {
  const w = h * (9 / 17.5)
  const pad = 0.07
  const sx = x + pad
  const sy = y + pad
  const sw = w - pad * 2
  const sh = h - pad * 2
  box(slide, x, y, w, h, INK, INK, 0.22)
  if (screen.kind === 'coupon') {
    box(slide, sx, sy, sw, sh, CREAM, CREAM, 0.17)
    write(slide, '혜택함', { x: sx + 0.12, y: sy + 0.18, w: sw - 0.24, h: 0.25, fontSize: 11, bold: true })
    coupon(slide, sx + 0.1, sy + 0.5, sw - 0.2, 0.95, screen.store, `${screen.category} · 수험생 할인`, 0.42)
    box(slide, sx + 0.1, sy + 1.55, sw - 0.2, 0.45, SAND)
    box(slide, sx + 0.1, sy + 2.1, sw - 0.2, 0.45, SAND)
    return
  }
  // 책상 그림은 4:5라 화면 높이에 맞추고 양옆을 잘라 낸다
  const full = sh * 0.8
  slide.addImage({ path: desk, x: sx, y: sy, w: full, h: sh, sizing: { type: 'crop', x: (full - sw) / 2, y: 0, w: sw, h: sh } })
  if (screen.kind === 'desk') {
    const fills = ['FFFDF8', 'FFF3C4', 'FFE1DA']
    DESK_NOTES.forEach((note, index) => {
      const width = sw * 0.68
      write(slide, note, { x: index === 1 ? sx + sw - width - 0.1 : sx + 0.1, y: sy + 0.3 + index * 0.52, w: width, h: 0.36, fill: { color: fills[index]! }, fontSize: 8, bold: true, align: 'center', rotate: [-3, 4, -1][index], fit: 'shrink' })
    })
    write(slide, '오늘의 응원 3개 도착', { x: sx + 0.1, y: sy + sh - 0.42, w: sw - 0.2, h: 0.3, shape: 'roundRect', rectRadius: 0.15, fill: { color: RED }, fontSize: 8, bold: true, color: 'FFFFFF', align: 'center' })
    return
  }
  slide.addShape('rect', { x: sx, y: sy, w: sw, h: sh, fill: { color: INK, transparency: 45 }, line: { color: INK, transparency: 100 } })
  const mw = sw - 0.24
  const mh = mw * 1.25 + 0.95
  const my = sy + (sh - mh) / 2
  box(slide, sx + 0.12, my, mw, mh, 'FFFFFF')
  write(slide, '광고', { x: sx + 0.2, y: my + 0.06, w: mw - 0.16, h: 0.18, fontSize: 7, color: MUTED })
  write(slide, screen.store, { x: sx + 0.2, y: my + 0.26, w: mw - 0.16, h: mw * 1.25 - 0.16, shape: 'roundRect', rectRadius: 0.06, fill: { color: YELLOW }, fontSize: 12, bold: true, align: 'center', valign: 'middle', fit: 'shrink' })
  write(slide, screen.place ? `${screen.place} · 수험생 할인` : '수험생 할인', { x: sx + 0.2, y: my + mw * 1.25 + 0.16, w: mw - 0.16, h: 0.22, fontSize: 7, bold: true, fit: 'shrink' })
  write(slide, '응원 열기', { x: sx + 0.2, y: my + mh - 0.36, w: mw - 0.16, h: 0.26, shape: 'roundRect', rectRadius: 0.06, fill: { color: RED }, fontSize: 8, bold: true, color: 'FFFFFF', align: 'center' })
}

/**
 * 장표를 16:9 pptx로 만들어 내려받는다. 웹 보기와 같은 구성이고, 라이브러리는 누를 때만 불러온다.
 * assetBase는 로고·책상 그림을 읽을 위치(브라우저에서는 비워 둔다).
 */
export async function downloadDeck(slides: readonly PitchSlide[], fileName: string, assetBase = ''): Promise<void> {
  const { default: Pptx } = await import('pptxgenjs')
  const pptx = new Pptx()
  pptx.layout = 'LAYOUT_WIDE' // 13.33 x 7.5 in
  const logo = assetBase + PITCH_LOGO
  const desk = assetBase + PITCH_DESK

  slides.forEach((item, index) => {
    const dark = item.tone === 'dark'
    const cover = item.tone === 'cover'
    const text = dark ? 'FFFFFF' : INK
    const accent = dark ? YELLOW : RED
    const soft = dark ? SOFT : MUTED
    const panel = dark ? '4A2E21' : SAND
    const width = cover ? 7.2 : WIDTH
    const slide = pptx.addSlide()
    slide.background = { color: cover ? YELLOW : dark ? BROWN : CREAM }

    const mark = cover ? 0.6 : 0.42
    const word = cover ? 1.35 : 0.95
    const brandX = LEFT + WIDTH - mark - 0.12 - word
    slide.addImage({ path: logo, x: brandX, y: 0.45, w: mark, h: mark })
    write(slide, '착 CHAK', { x: brandX + mark + 0.12, y: 0.45, w: word, h: mark, fontSize: cover ? 18 : 13, bold: true, color: text, valign: 'middle' })

    let y = cover ? 1.7 : 0.6
    slide.addShape('rect', { x: LEFT, y: y + 0.17, w: 0.32, h: 0.05, fill: { color: accent }, line: { color: accent } })
    write(slide, item.kicker, { x: LEFT + 0.45, y, w: width - 2, h: 0.4, fontSize: 14, bold: true, color: accent })
    y += 0.5
    const titleHeight = cover ? 2 : 0.8
    write(slide, item.title, { x: LEFT, y, w: width, h: titleHeight, fontSize: cover ? 50 : 30, bold: true, color: text, valign: cover ? 'middle' : 'top', fit: 'shrink' })
    y += titleHeight + 0.25

    if (item.pill) {
      write(slide, item.pill, { x: LEFT, y, w: 4.3, h: 0.5, shape: 'roundRect', rectRadius: 0.25, fill: { color: RED }, fontSize: 14, bold: true, color: 'FFFFFF', align: 'center' })
      y += 0.8
    }

    if (item.coupon) {
      const cx = 8.7
      const cy = 2.9
      slide.addShape('roundRect', { x: cx - 0.2, y: cy - 0.55, w: 3.9, h: 1.9, rectRadius: 0.12, rotate: -4, fill: { color: BROWN }, line: { color: INK, width: 1 } })
      slide.addShape('roundRect', { x: cx - 0.05, y: cy - 0.25, w: 3.9, h: 1.9, rectRadius: 0.12, rotate: 2.5, fill: { color: RED }, line: { color: INK, width: 1 } })
      coupon(slide, cx, cy, 3.9, 1.9, item.coupon.store, `${item.coupon.category} · 수험생 할인`)
    }

    if (item.chart) {
      // 왼쪽에 숫자를 쌓고, 오른쪽에 막대와 수능 당일까지 올라가는 점선 추세선을 그린다
      const height = 3.3
      const statWidth = 3.3
      const stats = item.stats ?? []
      const statHeight = (height - GAP * (stats.length - 1)) / Math.max(stats.length, 1)
      stats.forEach((stat, i) => {
        const sy = y + i * (statHeight + GAP)
        box(slide, LEFT, sy, statWidth, statHeight, panel)
        write(slide, stat.label, { x: LEFT + 0.25, y: sy + statHeight / 2 - 0.6, w: statWidth - 0.5, h: 0.35, fontSize: 12, color: soft })
        write(slide, stat.value, { x: LEFT + 0.25, y: sy + statHeight / 2 - 0.25, w: statWidth - 0.5, h: 0.75, fontSize: 32, bold: true, color: stat.strong ? accent : text })
      })

      const cx = LEFT + statWidth + 0.4
      const cw = WIDTH - statWidth - 0.4
      const plotTop = y + 0.45
      const plotBottom = y + height - 0.35
      const all = [...item.chart.values, ...item.chart.ahead]
      const top = Math.max(...all, 1)
      const slot = cw / all.length
      const px = (i: number) => cx + slot * i + slot / 2
      const py = (value: number) => plotBottom - (value / top) * (plotBottom - plotTop)
      const lastIndex = item.chart.values.length - 1
      item.chart.values.forEach((value, i) => {
        if (value <= 0) return
        const color = i === lastIndex ? RED : 'C9B8A6'
        slide.addShape('rect', { x: px(i) - slot * 0.36, y: py(value), w: slot * 0.72, h: plotBottom - py(value), fill: { color }, line: { color } })
      })
      const trend = [item.chart.values[lastIndex] ?? 0, ...item.chart.ahead]
      for (let i = 1; i < trend.length; i += 1) {
        const x1 = px(lastIndex + i - 1)
        const y1 = py(trend[i - 1]!)
        const y2 = py(trend[i]!)
        slide.addShape('line', { x: x1, y: Math.min(y1, y2), w: slot, h: Math.abs(y1 - y2), flipV: y2 < y1, line: { color: RED, width: 2.5, dashType: 'dash' } })
      }
      slide.addShape('line', { x: cx, y: plotBottom, w: cw, h: 0, line: { color: INK, width: 1.25 } })
      const first = item.chart.values[0] ?? 0
      const last = item.chart.values[lastIndex] ?? 0
      write(slide, first.toLocaleString('ko-KR'), { x: px(0) - 0.5, y: py(first) - 0.3, w: 1, h: 0.26, fontSize: 11, bold: true, color: MUTED, align: 'center' })
      write(slide, last.toLocaleString('ko-KR'), { x: px(lastIndex) - 0.6, y: py(last) - 0.32, w: 1.2, h: 0.28, fontSize: 12, bold: true, color: RED, align: 'center' })
      const peak = item.chart.ahead.at(-1)
      if (peak !== undefined) {
        const dot = 0.2
        slide.addShape('ellipse', { x: px(all.length - 1) - dot / 2, y: py(peak) - dot / 2, w: dot, h: dot, fill: { color: RED }, line: { color: 'ECC9BD', width: 2 } })
        write(slide, `예상 ${peak.toLocaleString('ko-KR')}`, { x: px(all.length - 1) - 2.9, y: py(peak) - 0.22, w: 2.7, h: 0.44, fontSize: 20, bold: true, color: RED, align: 'right' })
        write(slide, '수능 당일', { x: cx + cw - 1.5, y: plotBottom + 0.06, w: 1.5, h: 0.28, fontSize: 10, bold: true, color: RED, align: 'right' })
      }
      write(slide, item.chart.from, { x: px(0) - 0.5, y: plotBottom + 0.06, w: 1, h: 0.28, fontSize: 10, color: MUTED, align: 'center' })
      write(slide, item.chart.to, { x: px(lastIndex) - 0.5, y: plotBottom + 0.06, w: 1, h: 0.28, fontSize: 10, color: MUTED, align: 'center' })
      y += height + 0.3
    } else if (item.stats?.length) {
      const col = columns(item.stats.length)
      item.stats.forEach((stat, i) => {
        box(slide, col.x(i), y, col.width, 1.35, panel)
        write(slide, stat.label, { x: col.x(i) + 0.25, y: y + 0.13, w: col.width - 0.5, h: 0.35, fontSize: 12, color: soft })
        write(slide, stat.value, { x: col.x(i) + 0.25, y: y + 0.5, w: col.width - 0.5, h: 0.75, fontSize: 34, bold: true, color: stat.strong ? accent : text })
      })
      y += 1.6
    }

    if (item.phones?.length) {
      const col = columns(item.phones.length, 0.35)
      const height = 3.5
      const phoneWidth = height * (9 / 17.5)
      item.phones.forEach((entry, i) => {
        const x = col.x(i)
        phone(slide, x, y, height, entry.screen, desk)
        const tx = x + phoneWidth + 0.25
        const tw = col.width - phoneWidth - 0.25
        write(slide, entry.tag, { x: tx, y: y + 0.85, w: tw, h: 0.3, fontSize: 12, bold: true, color: RED })
        write(slide, entry.title, { x: tx, y: y + 1.17, w: tw, h: 0.5, fontSize: 20, bold: true, fit: 'shrink' })
        write(slide, entry.body, { x: tx, y: y + 1.72, w: tw, h: 1.5, fontSize: 12, color: MUTED, valign: 'top' })
      })
      y += height + 0.25
    }

    if (item.cards?.length) {
      const col = columns(item.cards.length)
      const height = Math.min((item.callout ? 5.5 : 6.3) - y, 2.6)
      item.cards.forEach((card, i) => {
        const x = col.x(i)
        box(slide, x, y, col.width, height, card.highlight ? DEEP_RED : 'FFFFFF', card.highlight ? DEEP_RED : LINE)
        if (!card.highlight) slide.addShape('rect', { x: x + 0.1, y, w: col.width - 0.2, h: 0.07, fill: { color: BROWN }, line: { color: BROWN } })
        write(slide, card.tag ?? '', { x: x + 0.25, y: y + 0.25, w: col.width - 0.5, h: 0.35, fontSize: 12, bold: true, color: card.highlight ? YELLOW : RED })
        write(slide, card.title, { x: x + 0.25, y: y + 0.62, w: col.width - 0.5, h: 0.5, fontSize: 20, bold: true, color: card.highlight ? 'FFFFFF' : INK, fit: 'shrink' })
        write(slide, card.body, { x: x + 0.25, y: y + 1.18, w: col.width - 0.5, h: height - 1.3, fontSize: 13, color: card.highlight ? 'F6E3DC' : MUTED, valign: 'top' })
      })
      y += height + 0.25
    }

    if (item.bullets?.length) {
      const height = 0.55 * item.bullets.length + 0.1
      slide.addText(
        // 글머리표는 글자로 넣는다(뷰어마다 들여쓰기가 달라 틀 밖으로 나가는 일이 있다)
        item.bullets.map((line) => ({ text: cover ? line : `•  ${line}`, options: { breakLine: true } })),
        { x: LEFT, y, w: width, h: height, fontFace: FONT, fontSize: cover ? 20 : 16, bold: cover, color: text, margin: 0, valign: 'top', paraSpaceAfter: 6, fit: 'shrink' },
      )
      y += height + 0.15
    }

    if (item.steps?.length) {
      const col = columns(item.steps.length, 0.5)
      item.steps.forEach((step, i) => {
        const x = col.x(i)
        box(slide, x, y, col.width, 1.25, panel)
        if (i > 0) write(slide, '→', { x: x - 0.5, y: y + 0.38, w: 0.5, h: 0.5, fontSize: 18, bold: true, color: accent, align: 'center' })
        write(slide, step.label, { x: x + 0.2, y: y + 0.12, w: col.width - 0.4, h: 0.28, fontSize: 11, bold: dark, color: dark ? YELLOW : MUTED })
        write(slide, step.value, { x: x + 0.2, y: y + 0.4, w: col.width - 0.4, h: 0.5, fontSize: 22, bold: true, color: text, fit: 'shrink' })
        write(slide, step.sub ?? '', { x: x + 0.2, y: y + 0.9, w: col.width - 0.4, h: 0.26, fontSize: 10, color: soft })
      })
      y += 1.5
    }

    if (item.compare) {
      const track = WIDTH - 2.2 - 2.7
      const rows = [
        { label: '예상 수익', value: item.compare.profit, ratio: 1, color: 'C9B8A6', ink: INK },
        { label: '제안 광고비', value: item.compare.price, ratio: Math.max(item.compare.ratio, 0.03), color: RED, ink: RED },
      ]
      rows.forEach((row) => {
        write(slide, row.label, { x: LEFT, y, w: 2.1, h: 0.5, fontSize: 14, bold: true, color: row.ink })
        slide.addShape('roundRect', { x: LEFT + 2.2, y: y + 0.06, w: track * row.ratio, h: 0.38, rectRadius: 0.06, fill: { color: row.color }, line: { color: row.color } })
        write(slide, row.value, { x: LEFT + WIDTH - 2.6, y, w: 2.6, h: 0.5, fontSize: 22, bold: true, color: row.ink, align: 'right' })
        y += 0.6
      })
      write(slide, item.compare.summary, { x: LEFT, y: y + 0.05, w: WIDTH, h: 0.4, fontSize: 15, bold: true, color: text })
      y += 0.6
    }

    if (item.callout) {
      write(slide, item.callout, { x: LEFT, y: Math.max(y, 5.55), w: WIDTH, h: 0.85, shape: 'roundRect', rectRadius: 0.12, fill: { color: DEEP_RED }, fontSize: 20, bold: true, color: 'FFFFFF', margin: [0, 18, 0, 18] as unknown as number, valign: 'middle' })
    }

    write(slide, item.note ?? '', { x: LEFT, y: 6.85, w: WIDTH - 1.2, h: 0.35, fontSize: 11, color: soft })
    write(slide, `${index + 1} / ${slides.length}`, { x: LEFT + WIDTH - 1.2, y: 6.85, w: 1.2, h: 0.35, fontSize: 11, bold: true, color: soft, align: 'right' })
  })

  await pptx.writeFile({ fileName })
}
