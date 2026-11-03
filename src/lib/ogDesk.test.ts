import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler, { config } from '../../api/og-desk'
import { OG_PAGES, withOgCard } from './ogCards'

const TOKEN = '0b1e2f3a-1111-4222-8333-444455556666'
const deskPage = withOgCard(readFileSync('index.html', 'utf8'), OG_PAGES.find((item) => item.page === 'desk')!.card)

const fetchMock = vi.fn()

function respond(input: string | URL, desk: { status?: number; body?: unknown } | 'fail' | 'slow', page: 'ok' | 'missing' = 'ok') {
  const url = String(input)
  if (url.endsWith('/og/desk.html')) {
    return Promise.resolve(page === 'ok' ? new Response(deskPage, { status: 200 }) : new Response('', { status: 404 }))
  }
  if (desk === 'fail') return Promise.reject(new TypeError('Failed to fetch'))
  if (desk === 'slow') return Promise.reject(new DOMException('timed out', 'TimeoutError'))
  return Promise.resolve(new Response(JSON.stringify(desk.body ?? {}), { status: desk.status ?? 200 }))
}

const call = (token: string | null = TOKEN) =>
  handler(new Request(`https://www.chak.live/api/og-desk${token === null ? '' : `?token=${token}`}`))

const tag = (html: string, property: string) => new RegExp(`<meta property="${property}" content="([^"]*)"`).exec(html)?.[1]

describe('the personal desk link card', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('runs at the edge, close to whoever scraped the link', () => {
    expect(config).toEqual({ runtime: 'edge' })
  })

  it('puts the owner\'s name in the title and description', async () => {
    fetchMock.mockImplementation((url: string | URL) => respond(url, { body: { displayName: '지수', roomClosed: false } }))

    const response = await call()
    const html = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8')
    expect(tag(html, 'og:title')).toBe('지수님의 응원 책상')
    expect(tag(html, 'og:description')).toBe('수능을 앞둔 지수님에게 응원 한마디를 남겨 주세요.')
    expect(html).toContain('<title>지수님의 응원 책상</title>')
    expect(tag(html, 'og:image')).toBe('https://www.chak.live/assets/og/desk.png')
  })

  it('asks the backend for exactly this desk, and the built card page for the rest', async () => {
    fetchMock.mockImplementation((url: string | URL) => respond(url, { body: { displayName: '지수' } }))

    await call()

    const urls = fetchMock.mock.calls.map(([url]) => String(url))
    expect(urls).toContain(`https://d1itub0wenvsst.cloudfront.net/api/public/desks/${TOKEN}`)
    expect(urls).toContain('https://www.chak.live/og/desk.html')
  })

  it('says when the desk is closed to new letters', async () => {
    fetchMock.mockImplementation((url: string | URL) => respond(url, { body: { displayName: '지수', roomClosed: true } }))

    const html = await (await call()).text()

    expect(tag(html, 'og:description')).toContain('새 응원을 받지 않고')
  })

  it('shows the general card when the desk does not exist', async () => {
    fetchMock.mockImplementation((url: string | URL) => respond(url, { status: 404, body: { code: 'DESK_NOT_FOUND' } }))

    const html = await (await call()).text()

    expect(tag(html, 'og:title')).toBe('응원 하나 놓고 가 줄래?')
  })

  it('shows the general card when the backend cannot be reached or is too slow', async () => {
    for (const failure of ['fail', 'slow'] as const) {
      fetchMock.mockImplementation((url: string | URL) => respond(url, failure))

      const response = await call()

      expect(response.status).toBe(200)
      expect(tag(await response.text(), 'og:title')).toBe('응원 하나 놓고 가 줄래?')
    }
  })

  it('shows the general card for an answer that is not a desk', async () => {
    for (const body of [{}, { displayName: 7 }, { displayName: null }]) {
      fetchMock.mockImplementation((url: string | URL) => respond(url, { body }))

      expect(tag(await (await call()).text(), 'og:title')).toBe('응원 하나 놓고 가 줄래?')
    }
  })

  it('never asks the backend about something that is not a desk link token', async () => {
    fetchMock.mockImplementation((url: string | URL) => respond(url, { body: { displayName: '지수' } }))

    for (const token of [null, '', 'nonsense', '../admin', `${TOKEN}%5C`, `${TOKEN}/x`, '0b1e2f3a-1111-4222-8333']) {
      fetchMock.mockClear()
      const html = await (await call(token)).text()

      expect(tag(html, 'og:title'), String(token)).toBe('응원 하나 놓고 가 줄래?')
      expect(fetchMock.mock.calls.map(([url]) => String(url)).filter((url) => url.includes('cloudfront')), String(token)).toEqual([])
    }
  })

  it('cannot be made to carry markup through a desk name', async () => {
    fetchMock.mockImplementation((url: string | URL) => respond(url, { body: { displayName: '"><script>alert(1)</script>' } }))

    const html = await (await call()).text()

    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&quot;>&lt;script>alert(1)&lt;/script>님의 응원 책상')
  })

  it('keeps the card out of search results', async () => {
    fetchMock.mockImplementation((url: string | URL) => respond(url, { body: { displayName: '지수' } }))

    const html = await (await call()).text()

    expect(html).toContain('<meta name="robots" content="noindex,nofollow" />')
  })

  it('is cached for a few minutes, so a rename shows soon and the backend is not asked at every scrape', async () => {
    fetchMock.mockImplementation((url: string | URL) => respond(url, { body: { displayName: '지수' } }))

    const response = await call()

    expect(response.headers.get('cache-control')).toBe('public, s-maxage=300, stale-while-revalidate=3600')
  })

  it('hands over to the app when the card page itself is missing', async () => {
    fetchMock.mockImplementation((url: string | URL) => respond(url, { body: { displayName: '지수' } }, 'missing'))

    const response = await call()

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('https://www.chak.live/')
  })
})
