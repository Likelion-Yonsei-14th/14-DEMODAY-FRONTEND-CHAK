/**
 * 화면 찍기용 글꼴 CSS. 이 문서에서 실제로 내려받아 쓰고 있는 웹 글꼴만 골라
 * 파일 하나씩(woff2 우선) data URL로 심은 @font-face를 만든다.
 *
 * html-to-image에 맡기면 가져온 글꼴 CSS의 모든 글꼴·모든 형식(eot·woff·ttf…)을 다 받아 수십 초가 걸리고,
 * 아예 빼면 기기 글꼴로 그려져 글자 폭이 달라지면서 줄바꿈이 밀리고 글자가 겹친다.
 * 가져오지 못한 글꼴은 건너뛴다(그 글꼴만 기기 글꼴로 나온다).
 */

import { buildPretendardEmbedCSS, PRETENDARD_FAMILY } from './pretendardSubset'

type Face = { family: string; weight: string; style: string; unicodeRange: string; src: string; base: string }

const FORMAT_RANK = ['woff2', 'woff', 'truetype', 'opentype']
const dataUrlCache = new Map<string, Promise<string | null>>()

const unquote = (value: string) => value.trim().replace(/^["']|["']$/g, '')
const faceKey = (family: string, weight: string, style: string) =>
  [unquote(family), weight || 'normal', style || 'normal'].map((part) => part.trim().replace(/\s+/g, ' ').toLowerCase()).join('|')

function toFace(style: CSSStyleDeclaration, base: string): Face {
  return {
    family: unquote(style.getPropertyValue('font-family')),
    weight: style.getPropertyValue('font-weight'),
    style: style.getPropertyValue('font-style'),
    unicodeRange: style.getPropertyValue('unicode-range'),
    src: style.getPropertyValue('src'),
    base,
  }
}

/** 문서의 모든 @font-face를 모은다. 다른 사이트에서 @import한 CSS는 규칙을 읽을 수 없어 내용을 받아 읽는다. */
async function collectFaces(): Promise<Face[]> {
  const faces: Face[] = []
  const visitRules = async (rules: CSSRuleList, base: string) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSFontFaceRule) faces.push(toFace(rule.style, base))
      else if (rule instanceof CSSImportRule) await visitSheet(rule.styleSheet, rule.href, base)
      else if (rule instanceof CSSGroupingRule) await visitRules(rule.cssRules, base)
    }
  }
  const visitSheet = async (sheet: CSSStyleSheet | null, href: string | null, parentBase: string) => {
    const base = href ? new URL(href, parentBase).href : parentBase
    try {
      if (sheet) {
        await visitRules(sheet.cssRules, base)
        return
      }
    } catch {
      // 다른 출처의 CSS라 규칙을 읽을 수 없다. 아래에서 받아 읽는다.
    }
    if (!href) return
    const text = await fetch(base)
      .then((res) => (res.ok ? res.text() : ''))
      .catch(() => '')
    if (!text) return
    const parsed = new CSSStyleSheet()
    parsed.replaceSync(text)
    await visitRules(parsed.cssRules, base)
  }
  for (const sheet of Array.from(document.styleSheets)) await visitSheet(sheet, sheet.href, document.baseURI)
  return faces
}

/** src 목록에서 가장 가벼운 형식의 주소 하나. local()과 eot는 건너뛴다. */
function pickSource(face: Face): { url: string; format: string } | null {
  const candidates: { url: string; format: string }[] = []
  for (const match of face.src.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)\s*(?:format\(\s*(['"]?)(.*?)\3\s*\))?/g)) {
    const url = match[2]!
    if (url.startsWith('data:')) return { url, format: match[4] ?? '' }
    const ext = url.split(/[?#]/)[0]!.split('.').pop()?.toLowerCase() ?? ''
    // 가변 글꼴은 'woff2-variations'처럼 적힌다.
    const format = (match[4] ?? { woff2: 'woff2', woff: 'woff', ttf: 'truetype', otf: 'opentype' }[ext] ?? '')
      .toLowerCase()
      .replace(/-variations$/, '')
    if (!FORMAT_RANK.includes(format)) continue
    candidates.push({ url: new URL(url, face.base).href, format })
  }
  candidates.sort((a, b) => FORMAT_RANK.indexOf(a.format) - FORMAT_RANK.indexOf(b.format))
  return candidates[0] ?? null
}

function toDataUrl(url: string) {
  if (url.startsWith('data:')) return Promise.resolve(url)
  let cached = dataUrlCache.get(url)
  if (!cached) {
    cached = fetch(url)
      .then((res) => (res.ok ? res.blob() : Promise.reject(new Error(String(res.status)))))
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(blob)
          }),
      )
      .catch(() => null)
    dataUrlCache.set(url, cached)
  }
  return cached
}

/** `text`는 화면에 그려지는 글자. Pretendard는 이 글자가 걸치는 조각만 심는다(pretendardSubset.ts). */
export async function buildFontEmbedCSS(text: string): Promise<string> {
  await document.fonts.ready
  const loaded = new Set<string>()
  let usesPretendard = false
  document.fonts.forEach((font) => {
    if (font.status !== 'loaded') return
    loaded.add(faceKey(font.family, font.weight, font.style))
    if (unquote(font.family).toLowerCase() === PRETENDARD_FAMILY.toLowerCase()) usesPretendard = true
  })
  if (loaded.size === 0) return ''

  const pretendard = usesPretendard ? buildPretendardEmbedCSS(text, toDataUrl) : Promise.resolve('')
  const faces = (await collectFaces()).filter(
    (face) =>
      unquote(face.family).toLowerCase() !== PRETENDARD_FAMILY.toLowerCase() &&
      loaded.has(faceKey(face.family, face.weight, face.style)),
  )
  const blocks = await Promise.all(
    faces.map(async (face) => {
      const source = pickSource(face)
      const dataUrl = source && (await toDataUrl(source.url))
      if (!source || !dataUrl) return ''
      return [
        '@font-face{',
        `font-family:${JSON.stringify(face.family)};`,
        face.weight ? `font-weight:${face.weight};` : '',
        face.style ? `font-style:${face.style};` : '',
        face.unicodeRange ? `unicode-range:${face.unicodeRange};` : '',
        `src:url(${dataUrl})${source.format ? ` format("${source.format}")` : ''};`,
        '}',
      ].join('')
    }),
  )
  return [await pretendard, ...blocks].filter(Boolean).join('\n')
}
