import type PptxGenJS from 'pptxgenjs'
import type { PitchSlide } from './pitchSlides'

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

const box = (slide: Slide, x: number, y: number, w: number, h: number, fill: string, line = fill) =>
  slide.addShape('roundRect', { x, y, w, h, rectRadius: 0.1, fill: { color: fill }, line: { color: line, width: 0.75 } })

const columns = (count: number, gap = GAP) => {
  const width = (WIDTH - gap * (count - 1)) / count
  return { width, x: (index: number) => LEFT + index * (width + gap) }
}

/** 장표를 16:9 pptx로 만들어 내려받는다. 웹 보기와 같은 구성이고, 라이브러리는 누를 때만 불러온다. */
export async function downloadDeck(slides: readonly PitchSlide[], fileName: string): Promise<void> {
  const { default: Pptx } = await import('pptxgenjs')
  const pptx = new Pptx()
  pptx.layout = 'LAYOUT_WIDE' // 13.33 x 7.5 in

  slides.forEach((item, index) => {
    const dark = item.tone === 'dark'
    const cover = item.tone === 'cover'
    const text = dark ? 'FFFFFF' : INK
    const accent = dark ? YELLOW : RED
    const soft = dark ? SOFT : MUTED
    const slide = pptx.addSlide()
    slide.background = { color: cover ? YELLOW : dark ? BROWN : CREAM }

    let y = cover ? 1.9 : 0.6
    slide.addShape('rect', { x: LEFT, y: y + 0.17, w: 0.32, h: 0.05, fill: { color: accent }, line: { color: accent } })
    slide.addText(item.kicker, { x: LEFT + 0.45, y, w: WIDTH - 0.45, h: 0.4, fontFace: FONT, fontSize: 14, bold: true, color: accent, margin: 0 })
    y += 0.5
    const titleHeight = cover ? 1.2 : 0.8
    slide.addText(item.title, { x: LEFT, y, w: WIDTH, h: titleHeight, fontFace: FONT, fontSize: cover ? 48 : 30, bold: true, color: text, margin: 0, valign: 'top', fit: 'shrink' })
    y += titleHeight + 0.25

    if (item.pill) {
      slide.addText(item.pill, { x: LEFT, y, w: 4.3, h: 0.5, shape: 'roundRect', rectRadius: 0.25, fill: { color: RED }, fontFace: FONT, fontSize: 14, bold: true, color: 'FFFFFF', align: 'center' })
      y += 0.8
    }

    if (item.stats?.length) {
      const col = columns(item.stats.length)
      item.stats.forEach((stat, i) => {
        box(slide, col.x(i), y, col.width, 1.45, dark ? '4A2E21' : SAND)
        slide.addText(stat.label, { x: col.x(i) + 0.25, y: y + 0.15, w: col.width - 0.5, h: 0.4, fontFace: FONT, fontSize: 12, color: soft, margin: 0 })
        slide.addText(stat.value, { x: col.x(i) + 0.25, y: y + 0.55, w: col.width - 0.5, h: 0.8, fontFace: FONT, fontSize: 36, bold: true, color: stat.strong ? accent : text, margin: 0 })
      })
      y += 1.7
    }

    if (item.cards?.length) {
      const col = columns(item.cards.length)
      const height = Math.min(6.2 - y, 2.6)
      item.cards.forEach((card, i) => {
        const x = col.x(i)
        box(slide, x, y, col.width, height, card.highlight ? DEEP_RED : 'FFFFFF', card.highlight ? DEEP_RED : LINE)
        if (!card.highlight) slide.addShape('rect', { x: x + 0.1, y, w: col.width - 0.2, h: 0.07, fill: { color: BROWN }, line: { color: BROWN } })
        slide.addText(card.tag ?? '', { x: x + 0.25, y: y + 0.25, w: col.width - 0.5, h: 0.35, fontFace: FONT, fontSize: 12, bold: true, color: card.highlight ? YELLOW : RED, margin: 0 })
        slide.addText(card.title, { x: x + 0.25, y: y + 0.62, w: col.width - 0.5, h: 0.5, fontFace: FONT, fontSize: 20, bold: true, color: card.highlight ? 'FFFFFF' : INK, margin: 0, fit: 'shrink' })
        slide.addText(card.body, { x: x + 0.25, y: y + 1.18, w: col.width - 0.5, h: height - 1.3, fontFace: FONT, fontSize: 13, color: card.highlight ? 'F6E3DC' : MUTED, margin: 0, valign: 'top' })
      })
      y += height + 0.25
    }

    if (item.steps?.length) {
      const col = columns(item.steps.length, 0.5)
      item.steps.forEach((step, i) => {
        const x = col.x(i)
        box(slide, x, y, col.width, 1.3, SAND)
        if (i > 0) slide.addText('→', { x: x - 0.5, y: y + 0.4, w: 0.5, h: 0.5, fontFace: FONT, fontSize: 18, bold: true, color: RED, align: 'center', margin: 0 })
        slide.addText(step.label, { x: x + 0.2, y: y + 0.12, w: col.width - 0.4, h: 0.3, fontFace: FONT, fontSize: 11, color: MUTED, margin: 0 })
        slide.addText(step.value, { x: x + 0.2, y: y + 0.42, w: col.width - 0.4, h: 0.5, fontFace: FONT, fontSize: 22, bold: true, color: INK, margin: 0, fit: 'shrink' })
        slide.addText(step.sub ?? '', { x: x + 0.2, y: y + 0.93, w: col.width - 0.4, h: 0.28, fontFace: FONT, fontSize: 10, color: MUTED, margin: 0 })
      })
      y += 1.6
    }

    if (item.compare) {
      const track = WIDTH - 2.2 - 2.7
      const rows = [
        { label: '예상 수익', value: item.compare.profit, ratio: 1, color: 'C9B8A6', ink: INK },
        { label: '제안 광고비', value: item.compare.price, ratio: Math.max(item.compare.ratio, 0.03), color: RED, ink: RED },
      ]
      rows.forEach((row) => {
        slide.addText(row.label, { x: LEFT, y, w: 2.1, h: 0.5, fontFace: FONT, fontSize: 14, bold: true, color: row.ink, margin: 0 })
        slide.addShape('roundRect', { x: LEFT + 2.2, y: y + 0.06, w: track * row.ratio, h: 0.38, rectRadius: 0.06, fill: { color: row.color }, line: { color: row.color } })
        slide.addText(row.value, { x: LEFT + WIDTH - 2.6, y, w: 2.6, h: 0.5, fontFace: FONT, fontSize: 22, bold: true, color: row.ink, align: 'right', margin: 0 })
        y += 0.6
      })
      slide.addText(item.compare.summary, { x: LEFT, y: y + 0.05, w: WIDTH, h: 0.4, fontFace: FONT, fontSize: 15, bold: true, color: text, margin: 0 })
      y += 0.6
    }

    if (item.bullets?.length) {
      slide.addText(
        item.bullets.map((line) => ({ text: line, options: { bullet: cover ? false : { code: '25CF' }, breakLine: true } })),
        { x: LEFT, y, w: WIDTH, h: Math.max(Math.min(0.6 * item.bullets.length + 0.2, 6.4 - y), 0.6), fontFace: FONT, fontSize: cover ? 20 : 17, bold: cover, color: text, margin: 0, valign: 'top', paraSpaceAfter: 8 },
      )
    }

    slide.addText(item.note ?? '', { x: LEFT, y: 6.85, w: WIDTH - 2.2, h: 0.35, fontFace: FONT, fontSize: 11, color: soft, margin: 0 })
    slide.addText(`착 CHAK · ${index + 1} / ${slides.length}`, { x: LEFT + WIDTH - 2.2, y: 6.85, w: 2.2, h: 0.35, fontFace: FONT, fontSize: 11, bold: true, color: soft, align: 'right', margin: 0 })
  })

  await pptx.writeFile({ fileName })
}
