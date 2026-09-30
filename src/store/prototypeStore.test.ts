import { beforeEach, describe, expect, it } from 'vitest'
import { emptyComposerDraft, mockDesk } from '@/prototype/mock/initialState'
import {
  appendContinuationPage,
  getActiveCardPage,
  getMessagePages,
  updateDraftPage,
} from '@/features/composer/messagePages'
import type { MessageDraft } from '@/types'
import { usePrototypeStore } from './prototypeStore'

function buildThreePageDraft() {
  let draft: MessageDraft = {
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
    senderName: '다은',
  }

  const page1 = getActiveCardPage(draft)
  draft = updateDraftPage(draft, page1.id, {
    textElements: [
      {
        ...page1.textElements[0]!,
        text: '첫 카드',
      },
    ],
    stickerElements: [
      {
        id: 'store-sticker-1',
        assetId: 'sticker-emphasis',
        x: 70,
        y: 24,
        scale: .9,
        rotation: 8,
        zIndex: 42,
      },
    ],
  })

  draft = appendContinuationPage(draft)
  const page2 = getActiveCardPage(draft)
  draft = updateDraftPage(draft, page2.id, {
    textElements: [
      {
        ...page2.textElements[0]!,
        text: '둘째 카드',
      },
    ],
  })

  draft = appendContinuationPage(draft)
  const page3 = getActiveCardPage(draft)
  return updateDraftPage(draft, page3.id, {
    textElements: [
      {
        ...page3.textElements[0]!,
        text: '셋째 카드',
      },
    ],
    photoElements: [
      {
        id: 'store-photo-3',
        src: 'data:image/webp;base64,preview',
        role: 'floating',
        x: 45,
        y: 62,
        scale: .8,
        rotation: -6,
        frame: 'white',
        zIndex: 18,
        aspectRatio: 1.4,
      },
    ],
  })
}

describe('prototype store composer handoff', () => {
  beforeEach(() => {
    usePrototypeStore.setState({
      messages: [],
      currentDesk: {
        ...mockDesk,
        objects: [],
      },
      composerDraft: {
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
      },
    })
  })

  it('sends all card pages intact and resets only the composer draft', () => {
    const draft = buildThreePageDraft()
    usePrototypeStore.setState({ composerDraft: draft })

    usePrototypeStore.getState().placeComposerMessage({
      x: 52,
      y: 50,
      rotation: 0,
      scale: 1,
    })

    const state = usePrototypeStore.getState()
    const sent = state.messages.at(-1)

    expect(sent).toBeDefined()
    expect(sent?.senderName).toBe('다은')
    expect(getMessagePages(sent!)).toHaveLength(3)
    expect(getMessagePages(sent!)[0]?.stickerElements[0]).toMatchObject({
      assetId: 'sticker-emphasis',
      zIndex: 42,
    })
    expect(getMessagePages(sent!)[2]?.photoElements[0]).toMatchObject({
      id: 'store-photo-3',
      rotation: -6,
      frame: 'white',
    })

    expect(getMessagePages(state.composerDraft)).toHaveLength(1)
    expect(
      getActiveCardPage(state.composerDraft).textElements[0]?.text,
    ).toBe('')
  })
})
