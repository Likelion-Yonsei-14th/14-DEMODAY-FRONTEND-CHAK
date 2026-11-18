/**
 * 화면 찍기용 Pretendard 글꼴. 가변 글꼴 통파일(약 2MB)을 data URL로 심으면 이미지가 그려질 때까지
 * 글꼴이 준비되지 않아 기기 글꼴로 그려지고(Pretendard가 없는 컴퓨터에서 칩 글자가 세로로 쪼개짐), 느리다.
 * 그래서 npm 패키지의 조각(dynamic subset) 파일을 이 사이트에서 내보내고, 화면 글자가 걸치는 조각만 심는다.
 */
import subsetCss from 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css?raw'

export const PRETENDARD_FAMILY = 'Pretendard Variable'
const WEIGHT = '45 920'

/** 조각 파일 이름 → 이 사이트에서 내려받을 주소. */
const SUBSET_URLS: Record<string, string> = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>('/node_modules/pretendard/dist/web/variable/woff2-dynamic-subset/*.woff2', {
      query: '?url',
      import: 'default',
      eager: true,
    }),
  ).map(([path, url]) => [path.split('/').pop()!, url]),
)

export type SubsetFace = { file: string; unicodeRange: string; ranges: [number, number][] }

/** `U+ac00-d7a3`, `U+20`, `U+4??` 꼴을 [시작, 끝] 목록으로. */
export function parseUnicodeRange(value: string): [number, number][] {
  const ranges: [number, number][] = []
  for (const part of value.split(',')) {
    const match = /^\s*u\+([0-9a-f?]+)(?:-([0-9a-f]+))?\s*$/i.exec(part)
    if (!match) continue
    const [, start, end] = match
    if (start!.includes('?')) {
      ranges.push([parseInt(start!.replace(/\?/g, '0'), 16), parseInt(start!.replace(/\?/g, 'f'), 16)])
    } else {
      ranges.push([parseInt(start!, 16), parseInt(end ?? start!, 16)])
    }
  }
  return ranges
}

/** 조각 CSS의 @font-face마다 파일 이름과 unicode-range를 읽는다. */
export function parseSubsetFaces(css: string): SubsetFace[] {
  const faces: SubsetFace[] = []
  for (const [block] of css.matchAll(/@font-face\s*{[^}]*}/g)) {
    const file = /url\(\s*['"]?[^'")]*?([^/'")]+\.woff2)['"]?\s*\)/.exec(block)?.[1]
    const unicodeRange = /unicode-range\s*:\s*([^;}]+)/.exec(block)?.[1]?.trim()
    if (file && unicodeRange) faces.push({ file, unicodeRange, ranges: parseUnicodeRange(unicodeRange) })
  }
  return faces
}

/** 글자 가운데 하나라도 걸치는 조각만. 기본 라틴 글자(숫자·문장 부호)는 늘 넣는다. */
export function pickSubsetFaces(faces: SubsetFace[], text: string): SubsetFace[] {
  const codes = new Set<number>()
  for (let code = 0x20; code <= 0x7e; code++) codes.add(code)
  for (const char of text) codes.add(char.codePointAt(0)!)
  const sorted = [...codes].sort((a, b) => a - b)
  return faces.filter((face) =>
    face.ranges.some(([start, end]) => {
      // 정렬된 글자 목록에서 start 이상인 첫 글자가 end 이하인지 본다.
      let lo = 0
      let hi = sorted.length
      while (lo < hi) {
        const mid = (lo + hi) >> 1
        if (sorted[mid]! < start) lo = mid + 1
        else hi = mid
      }
      return lo < sorted.length && sorted[lo]! <= end
    }),
  )
}

const FACES = parseSubsetFaces(subsetCss)

/** 화면 글자에 필요한 Pretendard 조각들을 data URL로 심은 @font-face. 받지 못한 조각은 건너뛴다. */
export async function buildPretendardEmbedCSS(
  text: string,
  toDataUrl: (url: string) => Promise<string | null>,
): Promise<string> {
  const blocks = await Promise.all(
    pickSubsetFaces(FACES, text).map(async (face) => {
      const url = SUBSET_URLS[face.file]
      const dataUrl = url ? await toDataUrl(new URL(url, document.baseURI).href) : null
      if (!dataUrl) return ''
      return (
        `@font-face{font-family:${JSON.stringify(PRETENDARD_FAMILY)};font-weight:${WEIGHT};font-style:normal;` +
        `unicode-range:${face.unicodeRange};src:url(${dataUrl}) format("woff2");}`
      )
    }),
  )
  return blocks.filter(Boolean).join('\n')
}
