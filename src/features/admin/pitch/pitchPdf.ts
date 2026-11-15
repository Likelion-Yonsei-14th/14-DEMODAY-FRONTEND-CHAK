/** PDF 한 쪽의 픽셀 크기. 16:9, 화면에 띄워도 흐리지 않을 만큼. */
export const PDF_WIDTH = 1920
export const PDF_HEIGHT = 1080

// 탭이 가려져 있으면 requestAnimationFrame이 멈추므로 타이머로 한 번 쉰다
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 50))

/**
 * 화면에 그려진 장표(.pslide)를 한 장씩 이미지로 떠서 한 장이 한 쪽인 PDF로 내려받는다.
 * 웹 장표와 똑같이 나오도록 HTML을 그대로 찍는다(글자는 선택되지 않는다).
 */
export async function downloadPdf(slides: readonly HTMLElement[], fileName: string): Promise<void> {
  if (slides.length === 0) throw new Error('no slides')
  const [{ toJpeg, getFontEmbedCSS }, { jsPDF }] = await Promise.all([import('html-to-image'), import('jspdf')])
  await document.fonts.ready

  // 찍을 때 계산된 크기가 그대로 굳으므로, 미리보기 크기와 상관없이 화면 밖에 PDF 크기로 다시 그린 뒤 찍는다.
  const stage = document.createElement('div')
  stage.setAttribute('aria-hidden', 'true')
  Object.assign(stage.style, { position: 'fixed', top: '0', left: '-100000px', width: `${PDF_WIDTH}px`, pointerEvents: 'none' })
  document.body.append(stage)
  try {
    const copies = slides.map((slide) => {
      const copy = slide.cloneNode(true) as HTMLElement
      Object.assign(copy.style, { width: `${PDF_WIDTH}px`, height: `${PDF_HEIGHT}px`, border: '0', borderRadius: '0', boxShadow: 'none' })
      stage.append(copy)
      return copy
    })
    await Promise.all(
      [...stage.querySelectorAll('img')].map((img) => (img.complete ? Promise.resolve() : img.decode().catch(() => undefined))),
    )
    await settle()

    // 글꼴은 한 번만 읽어 모든 장에 쓴다
    const fontEmbedCSS = await getFontEmbedCSS(copies[0]!).catch(() => '')
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [PDF_WIDTH, PDF_HEIGHT], hotfixes: ['px_scaling'], compress: true })
    for (const [index, copy] of copies.entries()) {
      const image = await toJpeg(copy, { width: PDF_WIDTH, height: PDF_HEIGHT, pixelRatio: 1, quality: 0.92, fontEmbedCSS })
      if (index > 0) pdf.addPage([PDF_WIDTH, PDF_HEIGHT], 'landscape')
      pdf.addImage(image, 'JPEG', 0, 0, PDF_WIDTH, PDF_HEIGHT, undefined, 'FAST')
    }
    pdf.save(fileName)
  } finally {
    stage.remove()
  }
}
