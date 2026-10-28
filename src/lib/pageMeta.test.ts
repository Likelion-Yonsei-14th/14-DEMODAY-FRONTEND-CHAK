import { beforeEach, describe, expect, it } from 'vitest'
import { applyPageMeta, PAGE_META } from '@/lib/pageMeta'

describe('page meta', () => {
  beforeEach(() => {
    document.head.innerHTML = `
      <title>기본 제목</title>
      <meta name="description" content="기본 설명" />
      <link rel="canonical" href="https://www.chak.live/" />`
    document.title = '기본 제목'
  })

  const description = () => document.head.querySelector<HTMLMetaElement>('meta[name="description"]')!.content
  const canonical = () => document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')!.href

  it('gives a public page its own title, description and address', () => {
    applyPageMeta('/minigame/exam-career')

    expect(document.title).toBe(PAGE_META['/minigame/exam-career']!.title)
    expect(description()).toBe(PAGE_META['/minigame/exam-career']!.description)
    expect(canonical()).toBe('https://www.chak.live/minigame/exam-career')
  })

  it('ignores a trailing slash', () => {
    applyPageMeta('/terms/')

    expect(canonical()).toBe('https://www.chak.live/terms')
  })

  it('puts the original head back when leaving, but leaves other screens\' own titles alone', () => {
    applyPageMeta('/privacy')
    applyPageMeta('/account')

    expect(document.title).toBe('기본 제목')
    expect(description()).toBe('기본 설명')
    expect(canonical()).toBe('https://www.chak.live/')

    document.title = '제안 페이지'
    applyPageMeta('/promotion/apply')
    expect(document.title).toBe('제안 페이지')
  })
})
