import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DEFAULT_OG_CARD, OG_PAGES, withOgCard } from '@/lib/ogCards'

const indexHtml = readFileSync('index.html', 'utf8')
const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
  rewrites: { source: string; destination: string }[]
}

const metaContent = (html: string, property: string) =>
  new RegExp(`<meta property="${property}" content="([^"]*)"`).exec(html)?.[1]

const cardOf = (page: string) => OG_PAGES.find((item) => item.page === page)!.card

describe('link cards', () => {
  it('index.html carries the default card without a thumbnail', () => {
    expect(metaContent(indexHtml, 'og:title')).toBe(DEFAULT_OG_CARD.title)
    expect(metaContent(indexHtml, 'og:description')).toBe(DEFAULT_OG_CARD.description)
    expect(metaContent(indexHtml, 'og:image')).toBeUndefined()
    expect(metaContent(indexHtml, 'og:type')).toBe('website')
  })

  it('writes a card into index.html, keeping the shared address', () => {
    const html = withOgCard(indexHtml, cardOf('exam-career'))
    expect(metaContent(html, 'og:title')).toBe('수험생 커리어 시뮬레이터')
    expect(metaContent(html, 'og:description')).toBe('나의 수험생활은 어떻게 끝날까? 지금 도전해 보세요!')
    expect(metaContent(html, 'og:url')).toBeUndefined()
    expect(html).toContain('<div id="root"></div>')
  })

  it('rewrites every shared path to its card page before the app fallback', () => {
    const sources = vercel.rewrites.map((rewrite) => rewrite.source)
    const fallback = sources.indexOf('/(.*)')
    for (const { page, source } of OG_PAGES) {
      const index = sources.indexOf(source)
      expect(index, source).toBeGreaterThanOrEqual(0)
      expect(index, source).toBeLessThan(fallback)
      expect(vercel.rewrites[index]!.destination).toBe(`/og/${page}.html`)
    }
  })
})
