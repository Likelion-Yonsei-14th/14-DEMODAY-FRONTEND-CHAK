import { describe, expect, it, vi } from 'vitest'
import {
  buildPretendardEmbedCSS,
  parseSubsetFaces,
  parseUnicodeRange,
  pickSubsetFaces,
  PRETENDARD_FAMILY,
} from './pretendardSubset'

const CSS = `
/* [0] */
@font-face {
	font-family: 'Pretendard Variable';
	font-weight: 45 920;
	src: url(./woff2-dynamic-subset/PretendardVariable.subset.0.woff2) format('woff2-variations');
	unicode-range: U+f9ca-fa0b, U+ff03-ff05;
}
/* [1] */
@font-face {
	font-family: 'Pretendard Variable';
	src: url(./woff2-dynamic-subset/PretendardVariable.subset.1.woff2) format('woff2-variations');
	unicode-range: U+c11c, U+c6b8;
}
/* [2] */
@font-face {
	font-family: 'Pretendard Variable';
	src: url(./woff2-dynamic-subset/PretendardVariable.subset.2.woff2) format('woff2-variations');
	unicode-range: U+0-ff;
}
`

describe('parseUnicodeRange', () => {
  it('reads single points, spans and wildcards', () => {
    expect(parseUnicodeRange('U+c11c, U+ac00-d7a3, U+4??')).toEqual([
      [0xc11c, 0xc11c],
      [0xac00, 0xd7a3],
      [0x400, 0x4ff],
    ])
  })
})

describe('parseSubsetFaces', () => {
  it('reads each face file and range', () => {
    const faces = parseSubsetFaces(CSS)
    expect(faces.map((face) => face.file)).toEqual([
      'PretendardVariable.subset.0.woff2',
      'PretendardVariable.subset.1.woff2',
      'PretendardVariable.subset.2.woff2',
    ])
    expect(faces[1]!.unicodeRange).toBe('U+c11c, U+c6b8')
  })

  it('reads the real package css into its 92 pieces', async () => {
    const { default: css } = await import('pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css?raw')
    expect(parseSubsetFaces(css)).toHaveLength(92)
  })
})

describe('pickSubsetFaces', () => {
  const faces = parseSubsetFaces(CSS)

  it('keeps only pieces the text touches, plus basic latin', () => {
    // '서'(U+C11C)는 1번 조각, 라틴 글자는 2번 조각. 0번(호환 한자·전각 기호)은 필요 없다.
    expect(pickSubsetFaces(faces, '서').map((face) => face.file)).toEqual([
      'PretendardVariable.subset.1.woff2',
      'PretendardVariable.subset.2.woff2',
    ])
  })

  it('skips Hangul pieces when the text has no Hangul', () => {
    expect(pickSubsetFaces(faces, 'Total 53').map((face) => face.file)).toEqual(['PretendardVariable.subset.2.woff2'])
  })
})

describe('buildPretendardEmbedCSS', () => {
  it('embeds same-site pieces for the screen text and drops ones that fail to load', async () => {
    const toDataUrl = vi.fn(async (url: string) => (url.includes('subset.0.') ? null : `data:font/woff2;base64,${url.length}`))
    const css = await buildPretendardEmbedCSS('서울 전체 53 모든 지역 현장', toDataUrl)
    const blocks = css.split('\n')
    expect(blocks.length).toBeGreaterThan(0)
    expect(blocks.length).toBe(toDataUrl.mock.calls.length - toDataUrl.mock.calls.filter(([u]) => u.includes('subset.0.')).length)
    expect(toDataUrl.mock.calls.length).toBeLessThan(92)
    for (const block of blocks) {
      expect(block).toContain(`font-family:"${PRETENDARD_FAMILY}"`)
      expect(block).toContain('font-weight:45 920')
      expect(block).toMatch(/unicode-range:U\+/i)
      expect(block).toContain('format("woff2")')
    }
    // 다른 사이트(CDN)가 아니라 이 사이트의 주소에서 받는다.
    for (const [url] of toDataUrl.mock.calls) expect(new URL(url).origin).toBe(window.location.origin)
  })
})
