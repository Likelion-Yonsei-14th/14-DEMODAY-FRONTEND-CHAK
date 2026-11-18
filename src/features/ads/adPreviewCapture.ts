/** 미리보기 iframe 안에서만 쓰는 화면 찍기. html-to-image는 필요할 때만 불러온다. */

export const CAPTURE_WIDTH = 390
export const CAPTURE_HEIGHT = 780
const PIXEL_RATIO = 2
// 다른 사이트 이미지는 보안 정책(connect-src) 때문에 못 가져올 수 있어 빈 칸으로 둔다.
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='

/**
 * 페이지 전체를 펼쳐 찍은 뒤, 배너가 가운데 오도록 휴대폰 한 화면 크기로 잘라 PNG data URL로 돌려준다.
 * 배너가 없으면 맨 위 한 화면을 찍는다.
 */
export async function captureAroundBanner(): Promise<string> {
  const [{ toCanvas }, { buildFontEmbedCSS }] = await Promise.all([import('html-to-image'), import('./captureFonts')])
  const fontEmbedCSS = await buildFontEmbedCSS().catch(() => '')
  const root = (document.getElementById('root') ?? document.body) as HTMLElement
  const slot = document.querySelector<HTMLElement>('.ad-banner-preview-slot')

  // 안쪽에서 스크롤되는 상자는 잠시 펼쳐 전체 길이로 그린다(미리보기 전용 화면이라 바로 되돌린다).
  const restored: [HTMLElement, string][] = []
  for (let el = slot?.parentElement ?? null; el && el !== document.body; el = el.parentElement) {
    const style = getComputedStyle(el)
    if (/(auto|scroll|hidden)/.test(style.overflowY) && el.scrollHeight > el.clientHeight) {
      restored.push([el, el.style.cssText])
      Object.assign(el.style, { overflow: 'visible', height: 'auto', maxHeight: 'none' })
    }
  }
  const scrollY = window.scrollY
  window.scrollTo(0, 0)
  try {
    await new Promise((resolve) => setTimeout(resolve, 60))
    const rootTop = root.getBoundingClientRect().top
    const center = slot ? slot.getBoundingClientRect().top - rootTop + slot.offsetHeight / 2 : CAPTURE_HEIGHT / 2
    const fullHeight = root.scrollHeight
    const top = Math.max(0, Math.min(center - CAPTURE_HEIGHT / 2, fullHeight - CAPTURE_HEIGHT))
    const background = getComputedStyle(document.body).backgroundColor || '#fbf9f5'
    // 긴 페이지를 통째로 그리면 캔버스 최대 크기를 넘어 줄어들므로, 배너 둘레 한 화면만 옮겨 그린다.
    const out = await toCanvas(root, {
      width: CAPTURE_WIDTH,
      height: CAPTURE_HEIGHT,
      pixelRatio: PIXEL_RATIO,
      backgroundColor: background,
      style: { transform: `translateY(${-top}px)`, transformOrigin: '0 0', width: `${CAPTURE_WIDTH}px` },
      // 글꼴을 빼면 기기 글꼴로 그려져 줄바꿈이 밀리고 글자가 겹친다. 실제로 쓰인 글꼴만 골라 심는다.
      fontEmbedCSS,
      imagePlaceholder: BLANK,
    })
    return out.toDataURL('image/png')
  } finally {
    restored.forEach(([el, css]) => (el.style.cssText = css))
    window.scrollTo(0, scrollY)
    slot?.scrollIntoView({ block: 'center' })
  }
}
