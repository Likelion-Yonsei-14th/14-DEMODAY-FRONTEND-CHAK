import type { PitchSlide } from './pitchSlides'

const INK = '2A1A12'
const BROWN = '3A2217'
const RED = 'C4452C'
const YELLOW = 'F1D58A'
const CREAM = 'FFFAF3'
const MUTED = '75655A'
const FONT = 'Malgun Gothic'

/** 장표를 16:9 pptx로 만들어 내려받는다. 라이브러리는 누를 때만 불러온다. */
export async function downloadDeck(slides: readonly PitchSlide[], fileName: string): Promise<void> {
  const { default: PptxGenJS } = await import('pptxgenjs')
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE' // 13.33 x 7.5 in

  for (const item of slides) {
    const dark = item.tone === 'dark'
    const cover = item.tone === 'cover'
    const text = dark ? 'FFFFFF' : INK
    const slide = pptx.addSlide()
    slide.background = { color: cover ? YELLOW : dark ? BROWN : CREAM }
    slide.addShape('rect', { x: 0.7, y: 0.78, w: 0.35, h: 0.05, fill: { color: dark ? YELLOW : RED }, line: { color: dark ? YELLOW : RED } })
    slide.addText(item.kicker, { x: 1.15, y: 0.55, w: 11, h: 0.5, fontFace: FONT, fontSize: 14, bold: true, color: dark ? YELLOW : RED })
    slide.addText(item.title, { x: 0.7, y: 1.05, w: 11.9, h: cover ? 2 : 1.2, fontFace: FONT, fontSize: cover ? 44 : 30, bold: true, color: text, valign: 'top' })

    let y = cover ? 3.3 : 2.4
    const stats = item.stats ?? []
    if (stats.length > 0) {
      const gap = 0.25
      const width = (11.9 - gap * (stats.length - 1)) / stats.length
      stats.forEach((stat, index) => {
        const x = 0.7 + index * (width + gap)
        slide.addShape('roundRect', { x, y, w: width, h: 1.55, rectRadius: 0.12, fill: { color: dark ? '4A2E21' : 'F1E2C8' }, line: { color: dark ? '4A2E21' : 'F1E2C8' } })
        slide.addText(stat.label, { x: x + 0.2, y: y + 0.12, w: width - 0.4, h: 0.55, fontFace: FONT, fontSize: 11, color: dark ? 'ECDACB' : MUTED, valign: 'top' })
        slide.addText(stat.value, { x: x + 0.2, y: y + 0.68, w: width - 0.4, h: 0.75, fontFace: FONT, fontSize: stats.length > 2 ? 22 : 30, bold: true, color: stat.strong ? (dark ? YELLOW : RED) : text })
      })
      y += 1.85
    }
    if (item.bullets?.length) {
      slide.addText(
        item.bullets.map((line) => ({ text: line, options: { bullet: !cover, breakLine: true } })),
        { x: 0.7, y, w: 11.9, h: Math.min(0.62 * item.bullets.length + 0.2, 6.6 - y), fontFace: FONT, fontSize: cover ? 20 : 16, color: text, valign: 'top', paraSpaceAfter: 8 },
      )
    }
    if (item.note) {
      slide.addText(item.note, { x: 0.7, y: 6.55, w: 11.9, h: 0.5, fontFace: FONT, fontSize: 12, color: dark ? 'ECDACB' : MUTED })
    }
    slide.addText('착 CHAK', { x: 11.2, y: 6.95, w: 1.5, h: 0.35, fontFace: FONT, fontSize: 10, bold: true, color: dark ? 'ECDACB' : MUTED, align: 'right' })
  }

  await pptx.writeFile({ fileName })
}
