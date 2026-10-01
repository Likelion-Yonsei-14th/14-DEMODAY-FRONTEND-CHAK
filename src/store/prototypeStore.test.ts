import { beforeEach, describe, expect, it } from 'vitest'
import {
  emptyComposerDraft,
  emptyDeskCreationDraft,
  mockDesk,
} from '@/prototype/mock/initialState'
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
      deskCreationDraft: {
        ...emptyDeskCreationDraft,
      },
      claimReadMode: mockDesk.readMode,
      claimState: 'claimed',
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

    usePrototypeStore.getState().placeComposerMessage(
      {
        x: 52,
        y: 50,
        rotation: 0,
        scale: 1,
      },
      'charm',
      '#C7D8B8',
    )

    const state = usePrototypeStore.getState()
    const sent = state.messages.at(-1)

    expect(sent).toBeDefined()
    expect(sent?.senderName).toBe('다은')
    expect(state.currentDesk.objects.at(-1)?.representationType).toBe(
      'charm',
    )
    expect(state.currentDesk.objects.at(-1)?.color).toBe('#C7D8B8')
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

  it('creates a self-owned desk as claimed with the chosen read mode', () => {
    const currentUser = usePrototypeStore.getState().currentUser

    usePrototypeStore.setState({
      deskCreationDraft: {
        createdFor: 'self',
        recipientDisplayName: currentUser.displayName,
        readMode: {
          type: 'daily',
          unlockTime: '21:30',
        },
      },
    })

    usePrototypeStore.getState().createDeskFromDraft()

    const state = usePrototypeStore.getState()
    expect(state.currentDesk).toMatchObject({
      displayName: currentUser.displayName,
      createdFor: 'self',
      ownerId: currentUser.id,
      creatorId: currentUser.id,
      claimStatus: 'claimed',
      readMode: {
        type: 'daily',
        unlockTime: '21:30',
      },
    })
    expect(state.claimState).toBe('claimed')
  })

  it('creates a desk for someone else as unclaimed', () => {
    usePrototypeStore.setState({
      deskCreationDraft: {
        createdFor: 'other',
        recipientDisplayName: '민지',
        readMode: {
          type: 'time-capsule',
          unlockAt: '2026-11-12T20:00',
        },
      },
    })

    usePrototypeStore.getState().createDeskFromDraft()

    const state = usePrototypeStore.getState()
    expect(state.currentDesk).toMatchObject({
      displayName: '민지',
      createdFor: 'other',
      creatorId: state.currentUser.id,
      claimStatus: 'unclaimed',
      readMode: {
        type: 'time-capsule',
        unlockAt: '2026-11-12T20:00',
      },
    })
    expect(state.currentDesk.ownerId).toBeUndefined()
    expect(state.claimState).toBe('unclaimed')
  })

  it('claims a supporter-created desk with the recipient-approved read mode', () => {
    usePrototypeStore.setState({
      deskCreationDraft: {
        createdFor: 'other',
        recipientDisplayName: '민지',
        readMode: {
          type: 'time-capsule',
          unlockAt: '2026-11-12T20:00',
        },
      },
    })

    usePrototypeStore.getState().createDeskFromDraft()
    const creatorId = usePrototypeStore.getState().currentDesk.creatorId

    usePrototypeStore.getState().beginClaim()

    expect(usePrototypeStore.getState().claimState).toBe('claiming')
    expect(usePrototypeStore.getState().claimReadMode).toEqual({
      type: 'time-capsule',
      unlockAt: '2026-11-12T20:00',
    })

    usePrototypeStore.getState().setClaimReadMode({
      type: 'daily',
      unlockTime: '21:45',
    })
    usePrototypeStore.getState().completeClaim()

    const state = usePrototypeStore.getState()
    expect(state.currentDesk).toMatchObject({
      displayName: '민지',
      claimStatus: 'claimed',
      readMode: {
        type: 'daily',
        unlockTime: '21:45',
      },
    })
    expect(state.currentDesk.ownerId).toBeDefined()
    expect(state.currentDesk.ownerId).not.toBe(creatorId)
    expect(state.claimState).toBe('claimed')
  })
})
