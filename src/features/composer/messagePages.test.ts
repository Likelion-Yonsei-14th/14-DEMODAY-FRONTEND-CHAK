import { describe, expect, it } from 'vitest'
import { emptyComposerDraft } from '@/prototype/mock/initialState'
import type { MessageDraft } from '@/types'
import {
  appendContinuationPage,
  deleteDraftPage,
  getActiveCardPage,
  getMessagePages,
  selectDraftPage,
  updateDraftPage,
} from './messagePages'

function freshDraft(): MessageDraft {
  return {
    ...emptyComposerDraft,
    textElements: emptyComposerDraft.textElements.map((item) => ({
      ...item,
    })),
    pages: emptyComposerDraft.pages?.map((page) => ({
      ...page,
      textElements: page.textElements.map((item) => ({ ...item })),
      wordArtElements: [...page.wordArtElements],
      stickerElements: [...page.stickerElements],
      photoElements: [...page.photoElements],
    })),
  }
}

describe('multi-page card draft', () => {
  it('normalizes older persisted pages with missing asset arrays', () => {
    const legacy = {
      ...freshDraft(),
      pages: [
        {
          id: 'legacy-page',
          backgroundAssetId: 'bg-basic-cream',
          textElements: [
            {
              id: 'legacy-text',
              text: '이전 저장본',
              x: 50,
              y: 50,
              width: 76,
            },
          ],
        },
      ],
      activePageId: 'legacy-page',
    } as unknown as MessageDraft

    const [page] = getMessagePages(legacy)

    expect(page).toMatchObject({
      id: 'legacy-page',
      stickerElements: [],
      photoElements: [],
      wordArtElements: [],
    })
    expect(page?.textElements[0]?.text).toBe('이전 저장본')
  })

  it('inherits the previous background and last text style', () => {
    let draft: MessageDraft = freshDraft()
    const first = getActiveCardPage(draft)

    draft = updateDraftPage(draft, first.id, {
      backgroundAssetId: 'bg-pattern-daisy-sage',
      textElements: [
        {
          id: 'text-a',
          text: '첫 문장',
          fontId: 'nanum-hana',
          fontSize: 31,
          color: '#735E83',
          x: 48,
          y: 55,
          width: 64,
          zIndex: 34,
          align: 'right',
        },
      ],
      stickerElements: [
        {
          id: 'sticker-a',
          assetId: 'sticker-number-01',
          x: 52,
          y: 44,
          scale: 1.1,
          rotation: -8,
          zIndex: 24,
        },
      ],
      photoElements: [
        {
          id: 'photo-a',
          src: 'data:image/png;base64,a',
          role: 'floating',
        },
      ],
    })

    const next = appendContinuationPage(draft)
    const second = getActiveCardPage(next)

    expect(next.id).toBe('draft-01')
    expect(getMessagePages(next)).toHaveLength(2)
    expect(second.backgroundAssetId).toBe('bg-pattern-daisy-sage')
    expect(second.photoElements).toHaveLength(0)
    expect(second.stickerElements).toHaveLength(0)
    expect(getMessagePages(next)[0]?.stickerElements).toHaveLength(1)
    expect(second.textElements).toHaveLength(1)
    expect(second.textElements[0]).toMatchObject({
      fontId: 'nanum-hana',
      fontSize: 31,
      color: '#735E83',
      width: 64,
      align: 'right',
      text: '',
    })
  })

  it('keeps complex page content isolated while switching between three cards', () => {
    let draft = freshDraft()
    const page1 = getActiveCardPage(draft)

    draft = updateDraftPage(draft, page1.id, {
      backgroundAssetId: 'bg-art-rainbow-cloud-blue',
      textElements: [
        {
          id: 'page1-text-a',
          text: '첫 번째 카드의 긴 응원 문장',
          fontId: 'nanum-hana',
          fontSize: 30,
          color: '#735E83',
          x: 42,
          y: 35,
          width: 62,
          zIndex: 45,
          align: 'left',
        },
        {
          id: 'page1-text-b',
          text: '겹쳐 보는 두 번째 텍스트',
          fontId: 'pretendard',
          fontSize: 18,
          color: '#3C3833',
          x: 58,
          y: 68,
          width: 54,
          zIndex: 12,
          align: 'right',
        },
      ],
      stickerElements: [
        {
          id: 'page1-sticker',
          assetId: 'sticker-emphasis',
          x: 76,
          y: 25,
          scale: 1.25,
          rotation: 14,
          zIndex: 50,
        },
      ],
      photoElements: [
        {
          id: 'page1-photo',
          src: 'data:image/webp;base64,page1',
          role: 'floating',
          x: 28,
          y: 62,
          scale: .82,
          rotation: -7,
          frame: 'polaroid',
          zIndex: 20,
          aspectRatio: 1.4,
        },
      ],
    })

    draft = appendContinuationPage(draft)
    const page2 = getActiveCardPage(draft)
    draft = updateDraftPage(draft, page2.id, {
      backgroundAssetId: 'bg-pattern-daisy-sage',
      textElements: [
        {
          ...page2.textElements[0]!,
          text: '두 번째 카드',
          x: 50,
          y: 48,
        },
      ],
      stickerElements: [
        {
          id: 'page2-sticker',
          assetId: 'sticker-number-02',
          x: 20,
          y: 20,
          scale: .7,
          rotation: -4,
          zIndex: 22,
        },
      ],
    })

    draft = appendContinuationPage(draft)
    const page3 = getActiveCardPage(draft)
    draft = updateDraftPage(draft, page3.id, {
      backgroundAssetId: 'bg-frame-clover-orange',
      textElements: [
        {
          ...page3.textElements[0]!,
          text: '세 번째 카드',
        },
      ],
      photoElements: [
        {
          id: 'page3-background-photo',
          src: 'data:image/webp;base64,page3',
          role: 'background',
          x: 40,
          y: 63,
          scale: 1.18,
          rotation: 0,
          frame: 'plain',
          zIndex: 2,
          aspectRatio: 1.2,
        },
      ],
    })

    const pages = getMessagePages(draft)
    expect(pages).toHaveLength(3)
    expect(pages[0]).toMatchObject({
      backgroundAssetId: 'bg-art-rainbow-cloud-blue',
    })
    expect(pages[0]?.textElements).toHaveLength(2)
    expect(pages[0]?.stickerElements[0]).toMatchObject({
      assetId: 'sticker-emphasis',
      zIndex: 50,
    })
    expect(pages[0]?.photoElements[0]).toMatchObject({
      frame: 'polaroid',
      rotation: -7,
    })

    expect(pages[1]).toMatchObject({
      backgroundAssetId: 'bg-pattern-daisy-sage',
    })
    expect(pages[1]?.stickerElements).toHaveLength(1)
    expect(pages[1]?.photoElements).toHaveLength(0)

    expect(pages[2]).toMatchObject({
      backgroundAssetId: 'bg-frame-clover-orange',
    })
    expect(pages[2]?.stickerElements).toHaveLength(0)
    expect(pages[2]?.photoElements[0]).toMatchObject({
      role: 'background',
      x: 40,
      y: 63,
      scale: 1.18,
    })

    const restoredFirst = selectDraftPage(draft, pages[0]!.id)
    expect(getActiveCardPage(restoredFirst).textElements[1]).toMatchObject({
      id: 'page1-text-b',
      zIndex: 12,
      align: 'right',
    })
    expect(getMessagePages(restoredFirst)[2]?.photoElements).toHaveLength(1)
  })

  it('allows at most three card pages', () => {
    const page2 = appendContinuationPage(freshDraft())
    const page3 = appendContinuationPage(page2)
    const page4Attempt = appendContinuationPage(page3)

    expect(getMessagePages(page3)).toHaveLength(3)
    expect(page4Attempt).toBe(page3)
  })

  it('keeps the message id while switching and editing pages', () => {
    const draft = appendContinuationPage(freshDraft())
    const pages = getMessagePages(draft)
    const first = pages[0]!

    const selected = selectDraftPage(draft, first.id)
    const edited = updateDraftPage(selected, first.id, {
      backgroundAssetId: 'bg-soft-coral',
    })

    expect(selected.id).toBe('draft-01')
    expect(edited.id).toBe('draft-01')
    expect(getActiveCardPage(edited).backgroundAssetId).toBe(
      'bg-soft-coral',
    )
  })

  it('deletes only the current page and returns to a remaining page', () => {
    const withSecond = appendContinuationPage(freshDraft())
    const secondId = getActiveCardPage(withSecond).id
    const result = deleteDraftPage(withSecond, secondId)

    expect(getMessagePages(result)).toHaveLength(1)
    expect(result.id).toBe('draft-01')
    expect(getActiveCardPage(result).id).not.toBe(secondId)
  })
})
