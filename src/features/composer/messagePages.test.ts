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
