import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DEFAULT_OG_CARD, ogCardFor, withOgCard } from '@/lib/ogCards'

const indexHtml = readFileSync('index.html', 'utf8')

const metaContent = (html: string, property: string) =>
  new RegExp(`<meta property="${property}" content="([^"]*)"`).exec(html)?.[1]

describe('link cards', () => {
  it('gives each shared path its own card', () => {
    expect(ogCardFor('/minigame/exam-career/result/h1-12345-102-none').title).toBe('수험생 커리어 시뮬레이터')
    expect(ogCardFor('/minigame/exam-career/result/h1-12345-102-none').description).toBe(
      '나의 수험생활은 어떻게 끝날까? 지금 도전해 보세요!',
    )
    expect(ogCardFor('/minigame/study-type/result/planner').title).toBe('나의 수험생 유형은?')
    expect(ogCardFor('/minigame/guess-god/result/7').title).toBe('오늘의 찍신은 나야!')
    expect(ogCardFor('/desk/abc').title).toBe('응원 하나 놓고 가 줄래?')
    expect(ogCardFor('/prototype/claim').title).toBe('친구들이 응원 책상을 만들어 두었어요')
    expect(ogCardFor('/prototype/classroom/room-1/join').title).toBe('우리 반 응원 공간에 들어와!')
  })

  it('falls back to the service card elsewhere', () => {
    expect(ogCardFor('/')).toBe(DEFAULT_OG_CARD)
    expect(ogCardFor('/minigame/exam-career')).toBe(DEFAULT_OG_CARD)
  })

  it('index.html carries the default card with an absolute thumbnail URL', () => {
    expect(metaContent(indexHtml, 'og:title')).toBe(DEFAULT_OG_CARD.title)
    expect(metaContent(indexHtml, 'og:description')).toBe(DEFAULT_OG_CARD.description)
    expect(metaContent(indexHtml, 'og:image')).toBe('https://www.chak.live/og-image.png')
    expect(metaContent(indexHtml, 'og:type')).toBe('website')
  })

  it('writes the card of a path into index.html and keeps the thumbnail', () => {
    const html = withOgCard(indexHtml, '/minigame/exam-career/result/h1-12345-102-none')
    expect(metaContent(html, 'og:title')).toBe('수험생 커리어 시뮬레이터')
    expect(metaContent(html, 'og:description')).toBe('나의 수험생활은 어떻게 끝날까? 지금 도전해 보세요!')
    expect(metaContent(html, 'og:url')).toBe('https://www.chak.live/minigame/exam-career/result/h1-12345-102-none')
    expect(metaContent(html, 'og:image')).toBe('https://www.chak.live/og-image.png')
    expect(html).toContain('<div id="root"></div>')
  })
})
