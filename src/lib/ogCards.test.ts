import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DEFAULT_OG_CARD, GUESS_GOD_SCORES, OG_PAGES, deskCard, withOgCard } from '@/lib/ogCards'
import { STUDY_TYPE_CODES, STUDY_TYPE_RESULTS } from '@/features/minigame/studyType/studyTypeResults'

const indexHtml = readFileSync('index.html', 'utf8')
const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
  rewrites: { source: string; destination: string; has?: { type: string; key: string; value: string }[] }[]
}

const metaContent = (html: string, property: string) =>
  new RegExp(`<meta property="${property}" content="([^"]*)"`).exec(html)?.[1]

const cardOf = (page: string) => OG_PAGES.find((item) => item.page === page)!.card

const contentOf = (html: string, name: string) => new RegExp(`<meta name="${name}" content="([^"]*)"`).exec(html)?.[1]

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

  it('keeps shared results, invitations and personal pages out of search results and off the home page\'s address', () => {
    for (const { card } of OG_PAGES.filter((item) => !item.card.indexPath)) {
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

  it('lets the mini game start pages be found, each under its own address', () => {
    const starts = OG_PAGES.filter((item) => item.card.indexPath)
    expect(starts.map((item) => item.card.indexPath).sort()).toEqual([
      '/minigame/d1-course',
      '/minigame/desk-blast',
      '/minigame/exam-career',
      '/minigame/guess-god',
      '/minigame/sneaky-phone',
      '/minigame/study-type',
    ])
    for (const { source, card } of starts) {
      const html = withOgCard(indexHtml, card)
      expect(source).toBe(card.indexPath)
      expect(html).toContain('<meta name="robots" content="index,follow" />')
      expect(html).toContain(`<link rel="canonical" href="https://www.chak.live${card.indexPath}" />`)
      expect(metaContent(html, 'og:url')).toBe(`https://www.chak.live${card.indexPath}`)
      expect(html).not.toContain('application/ld+json')
      expect(html).not.toContain('<h1>')
    }
  })

  it('gives every mini game and shareable page its own title and thumbnail, not the brand card', () => {
    const titles = new Set<string>()
    for (const { page, card } of OG_PAGES) {
      expect(card.image, page).toMatch(/^\/assets\/og\/[a-z0-9-]+\.png$/)
      expect(card.title.length, page).toBeGreaterThan(0)
      expect(card.description.length, page).toBeGreaterThan(0)
      titles.add(card.title)
    }
    expect(titles.size).toBeGreaterThan(10)
    expect(metaContent(withOgCard(indexHtml, cardOf('desk-blast')), 'og:title')).toBe('수능 블라스트 · 책상 정리 퍼즐')
  })

  it('points og:image and twitter:image at the page\'s own thumbnail, at its full address', () => {
    const html = withOgCard(indexHtml, cardOf('desk-blast'))
    expect(metaContent(html, 'og:image')).toBe('https://www.chak.live/assets/og/desk-blast.png')
    expect(contentOf(html, 'twitter:image')).toBe('https://www.chak.live/assets/og/desk-blast.png')
    expect(html.match(/name="twitter:image"/g)).toHaveLength(1)
    expect(metaContent(html, 'og:image:width')).toBe('1200')
    expect(metaContent(html, 'og:image:height')).toBe('630')
  })

  it('keeps the brand thumbnail for a card that names none', () => {
    const html = withOgCard(indexHtml, { title: 't', description: 'd' })
    expect(metaContent(html, 'og:image')).toBe('https://www.chak.live/assets/brand/og-chak.png')
  })

  it('can be applied twice without doubling a tag', () => {
    const once = withOgCard(indexHtml, cardOf('desk'))
    const twice = withOgCard(once, deskCard({ displayName: '지수' }))
    expect(twice.match(/name="twitter:image"/g)).toHaveLength(1)
    expect(twice.match(/property="og:image"/g)).toHaveLength(1)
    expect(metaContent(twice, 'og:title')).toBe('지수님의 응원 책상')
  })

  it('escapes a name that carries markup', () => {
    const html = withOgCard(indexHtml, deskCard({ displayName: '<b>"해커"</b>' }))
    expect(html).not.toContain('<b>"해커"</b>')
    expect(html).toContain('&lt;b>&quot;해커&quot;&lt;/b>님의 응원 책상')
  })

  it('has a thumbnail file of exactly 1200x630 for every card', () => {
    for (const { page, card } of OG_PAGES) {
      const bytes = readFileSync(`public${card.image}`)
      // A PNG starts with an 8-byte signature, then the IHDR chunk holding width and height.
      expect(bytes.subarray(1, 4).toString('ascii'), page).toBe('PNG')
      expect(bytes.readUInt32BE(16), `${page} width`).toBe(1200)
      expect(bytes.readUInt32BE(20), `${page} height`).toBe(630)
    }
  })

  it('names each study type in its result link card, with that type\'s own thumbnail', () => {
    for (const code of STUDY_TYPE_CODES) {
      const result = STUDY_TYPE_RESULTS[code]
      const item = OG_PAGES.find((entry) => entry.source === `/minigame/study-type/result/${result.slug}`)!
      expect(item.card.title).toBe(`나는 ${result.typeName}!`)
      expect(item.card.description).toContain(result.tagline)
      expect(item.card.image).toBe(`/assets/og/study-type-${result.slug}.png`)
      expect(item.card.indexPath).toBeUndefined()
    }
    expect(new Set(STUDY_TYPE_CODES.map((code) => STUDY_TYPE_RESULTS[code].slug)).size).toBe(8)
  })

  it('names the score in a guess-god result link, for every possible score', () => {
    expect(GUESS_GOD_SCORES).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    for (const score of GUESS_GOD_SCORES) {
      const item = OG_PAGES.find((entry) => entry.source === `/minigame/guess-god/result/${score}`)!
      expect(item.card.title).toBe(`오늘의 찍신 ${score}/10`)
      expect(item.card.description).toContain(`${score}개`)
    }
  })

  it('serves a specific result link before the general one, so each gets its own card', () => {
    const sources = vercel.rewrites.map((rewrite) => rewrite.source)
    const generalStudy = sources.indexOf('/minigame/study-type/result/:path*')
    const generalGuess = sources.indexOf('/minigame/guess-god/result/:path*')
    for (const { source } of OG_PAGES) {
      if (source.startsWith('/minigame/study-type/result/') && !source.includes(':')) expect(sources.indexOf(source)).toBeLessThan(generalStudy)
      if (source.startsWith('/minigame/guess-god/result/') && !source.includes(':')) expect(sources.indexOf(source)).toBeLessThan(generalGuess)
    }
  })

  it('has no two cards for the same address or the same file', () => {
    expect(new Set(OG_PAGES.map((item) => item.source)).size).toBe(OG_PAGES.length)
    expect(new Set(OG_PAGES.map((item) => item.page)).size).toBe(OG_PAGES.length)
  })

  it('names the owner on a desk card, and falls back to the general card when the desk is unknown', () => {
    expect(deskCard({ displayName: '  지수  ' }).title).toBe('지수님의 응원 책상')
    expect(deskCard({ displayName: '지수' }).description).toBe('수능을 앞둔 지수님에게 응원 한마디를 남겨 주세요.')
    expect(deskCard({ displayName: '지수', roomClosed: true }).description).toContain('새 응원을 받지 않고')
    expect(deskCard({ displayName: '지수' }).image).toBe('/assets/og/desk.png')
    expect(deskCard(null)).toEqual(cardOf('desk'))
    expect(deskCard({ displayName: '   ' })).toEqual(cardOf('desk'))
  })

  it('sends only link scrapers of a desk link to the personal card, before the general desk card', () => {
    const sources = vercel.rewrites.map((rewrite) => rewrite.source)
    const personal = vercel.rewrites.find((rewrite) => rewrite.destination.startsWith('/api/og-desk'))!
    expect(sources.indexOf(personal.source)).toBeLessThan(sources.indexOf('/desk/:path*'))
    expect(personal.destination).toBe('/api/og-desk?token=:token')
    const agent = new RegExp(`^${personal.has![0]!.value}$`)
    for (const scraper of [
      'facebookexternalhit/1.1;kakaotalk-scrap/1.0 (+https://devtalk.kakao.com/)',
      'Mozilla/5.0 (compatible; Twitterbot/1.0)',
      'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
      'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
      'WhatsApp/2.23.20.0',
      'Mozilla/5.0 (compatible; Yeti/1.1; +http://naver.me/spd)',
    ]) {
      expect(agent.test(scraper), scraper).toBe(true)
    }
    for (const person of [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 KAKAOTALK 10.5.0',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    ]) {
      expect(agent.test(person), person).toBe(false)
    }
  })
})
