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
  it('index.html carries the default card with the brand thumbnail', () => {
    expect(metaContent(indexHtml, 'og:title')).toBe(DEFAULT_OG_CARD.title)
    expect(metaContent(indexHtml, 'og:description')).toBe(DEFAULT_OG_CARD.description)
    expect(metaContent(indexHtml, 'og:image')).toBe('https://www.chak.live/assets/brand/og-chak.png')
    expect(metaContent(indexHtml, 'og:type')).toBe('website')
  })

  it('index.html is the one page a search engine is asked to index', () => {
    expect(indexHtml).toContain('<meta name="robots" content="index,follow" />')
    expect(indexHtml).toContain('<link rel="canonical" href="https://www.chak.live/" />')
    expect(indexHtml).toContain('"@type": "WebSite"')
    expect(indexHtml).toContain('<h1>착! 수험생 응원 책상</h1>')
  })

  it('writes a card into index.html, keeping the shared address', () => {
    const html = withOgCard(indexHtml, cardOf('exam-career'))
    expect(metaContent(html, 'og:title')).toBe('수험생 커리어 시뮬레이터')
    expect(metaContent(html, 'og:description')).toBe('나의 수험생활은 어떻게 끝날까? 지금 도전해 보세요!')
    expect(metaContent(html, 'og:url')).toBeUndefined()
    expect(html).toContain('<div id="root"></div>')
  })

  it('keeps shared pages out of search results and off the home page\'s address', () => {
    for (const { card } of OG_PAGES) {
      const html = withOgCard(indexHtml, card)
      expect(html).toContain('<meta name="robots" content="noindex,nofollow" />')
      expect(html).not.toContain('rel="canonical"')
      expect(html).not.toContain('application/ld+json')
      expect(html).not.toContain('<h1>')
      expect(html).toContain(`<title>${card.title}</title>`)
    }
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
