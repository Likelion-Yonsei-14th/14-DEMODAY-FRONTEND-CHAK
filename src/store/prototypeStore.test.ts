import { beforeEach, describe, expect, it } from 'vitest'
import {
  emptyComposerDraft,
  emptyDeskCreationDraft,
  mockClassroom,
  mockCurrentUser,
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
      currentUser: mockCurrentUser,
      authSession: { status: 'anonymous' },
      currentDesk: {
        ...mockDesk,
        objects: [],
      },
      deskCreationDraft: {
        ...emptyDeskCreationDraft,
      },
      claimReadMode: mockDesk.readMode,
      claimState: 'claimed',
      classroom: {
        ...mockClassroom,
        blackboardEntries: [...mockClassroom.blackboardEntries],
        lockers: mockClassroom.lockers.map((locker) => ({
          ...locker,
          messageIds: [...locker.messageIds],
          objects: [...locker.objects],
        })),
      },
      classroomMember: null,
      ownerSettings: {
        publicFeedEnabled: true,
        pushEnabled: true,
        roomClosed: false,
        blockedSupporters: [],
        connectedRooms: [],
      },
      readMessageIds: [],
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

  it('supports signup, logout, and email login without gating anonymous use', () => {
    usePrototypeStore
      .getState()
      .signUp('혜경', 'hyegyeong@example.com')

    let state = usePrototypeStore.getState()
    expect(state.currentUser.displayName).toBe('혜경')
    expect(state.authSession).toEqual({
      status: 'authenticated',
      email: 'hyegyeong@example.com',
      provider: 'password',
    })

    usePrototypeStore.getState().signOut()
    expect(usePrototypeStore.getState().authSession).toEqual({
      status: 'anonymous',
    })

    usePrototypeStore
      .getState()
      .signIn('hyegyeong@example.com')

    state = usePrototypeStore.getState()
    expect(state.authSession).toEqual({
      status: 'authenticated',
      email: 'hyegyeong@example.com',
      provider: 'password',
    })
  })

  it('supports Google login and returns to anonymous state after account deletion', () => {
    usePrototypeStore
      .getState()
      .signIn('jisu@gmail.com', 'google')

    expect(usePrototypeStore.getState().authSession).toEqual({
      status: 'authenticated',
      email: 'jisu@gmail.com',
      provider: 'google',
    })

    usePrototypeStore.getState().deleteAccount()

    const state = usePrototypeStore.getState()
    expect(state.authSession).toEqual({
      status: 'anonymous',
    })
    expect(state.currentUser).toEqual(mockCurrentUser)
  })

  it('updates owner settings, blocks supporters, and connects separate rooms', () => {
    usePrototypeStore.getState().updateOwnerSettings({
      pushEnabled: false,
    })
    usePrototypeStore
      .getState()
      .toggleBlockedSupporter('민지')
    usePrototypeStore
      .getState()
      .connectRoom('abc123')

    let state = usePrototypeStore.getState()
    expect(state.ownerSettings.pushEnabled).toBe(false)
    expect(state.ownerSettings.blockedSupporters).toEqual(['민지'])
    expect(state.ownerSettings.connectedRooms[0]).toMatchObject({
      code: 'ABC123',
    })

    usePrototypeStore
      .getState()
      .toggleBlockedSupporter('민지')
    usePrototypeStore.getState().endRoom()

    state = usePrototypeStore.getState()
    expect(state.ownerSettings.blockedSupporters).toEqual([])
    expect(state.ownerSettings.roomClosed).toBe(true)
  })

  it('updates the current desk opening schedule from management', () => {
    usePrototypeStore.getState().setDeskReadMode({
      type: 'daily',
      unlockTime: '23:10',
    })

    expect(
      usePrototypeStore.getState().currentDesk.readMode,
    ).toEqual({
      type: 'daily',
      unlockTime: '23:10',
    })
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

  it('creates a self-owned time capsule and clears the previous desk session', () => {
    usePrototypeStore.setState({
      composerDraft: {
        ...emptyComposerDraft,
        senderName: '이전 친구',
      },
    })
    usePrototypeStore.getState().placeComposerMessage()
    const previousMessageId =
      usePrototypeStore.getState().messages[0]?.id

    if (previousMessageId) {
      usePrototypeStore.getState().markMessageRead(previousMessageId)
    }

    const currentUser = usePrototypeStore.getState().currentUser
    usePrototypeStore.setState({
      deskCreationDraft: {
        createdFor: 'self',
        recipientDisplayName: currentUser.displayName,
        readMode: {
          type: 'time-capsule',
          unlockAt: '2026-11-12T20:00',
        },
      },
    })

    usePrototypeStore.getState().createDeskFromDraft()

    const state = usePrototypeStore.getState()
    expect(state.currentDesk.readMode).toEqual({
      type: 'time-capsule',
      unlockAt: '2026-11-12T20:00',
    })
    expect(state.currentDesk.claimStatus).toBe('claimed')
    expect(state.currentDesk.objects).toEqual([])
    expect(state.messages).toEqual([])
    expect(state.readMessageIds).toEqual([])
  })

  it('claims a supporter-created daily desk without changing its schedule', () => {
    usePrototypeStore.setState({
      deskCreationDraft: {
        createdFor: 'other',
        recipientDisplayName: '민지',
        readMode: {
          type: 'daily',
          unlockTime: '22:15',
        },
      },
    })

    usePrototypeStore.getState().createDeskFromDraft()
    usePrototypeStore.getState().beginClaim()
    usePrototypeStore.getState().completeClaim()

    const state = usePrototypeStore.getState()
    expect(state.currentDesk).toMatchObject({
      displayName: '민지',
      createdFor: 'other',
      claimStatus: 'claimed',
      readMode: {
        type: 'daily',
        unlockTime: '22:15',
      },
    })
    expect(state.currentDesk.ownerId).toBeDefined()
    expect(state.claimState).toBe('claimed')
  })


  it('creates a shared classroom and gives each joining member one locker', () => {
    const classroomId = usePrototypeStore
      .getState()
      .createClassroom('수능 뿌셔')

    expect(usePrototypeStore.getState().classroom).toMatchObject({
      id: classroomId,
      name: '수능 뿌셔',
      dailyUnlockTime: '22:00',
      lockers: [],
    })

    const lockerId = usePrototypeStore
      .getState()
      .joinClassroom('지수')

    const state = usePrototypeStore.getState()
    expect(state.classroomMember).toEqual({
      lockerId,
      displayName: '지수',
    })
    expect(state.classroom.lockers).toEqual([
      expect.objectContaining({
        id: lockerId,
        studentName: '지수',
        messageIds: [],
        objects: [],
      }),
    ])
  })

  it('adds public blackboard notes and places composer cards inside a locker', () => {
    usePrototypeStore.getState().createClassroom('3학년 2반')
    const lockerId = usePrototypeStore
      .getState()
      .joinClassroom('지수')

    usePrototypeStore.getState().addBlackboardEntry({
      text: '우리 반 다 같이 끝까지 가자!',
    })

    usePrototypeStore.setState({
      composerDraft: {
        ...emptyComposerDraft,
        senderName: '',
        textElements: emptyComposerDraft.textElements.map((item) => ({
          ...item,
          text: '오늘도 파이팅!',
        })),
        pages: emptyComposerDraft.pages?.map((page) => ({
          ...page,
          textElements: page.textElements.map((item) => ({
            ...item,
            text: '오늘도 파이팅!',
          })),
        })),
      },
    })

    usePrototypeStore
      .getState()
      .placeComposerMessageInLocker(lockerId)

    const state = usePrototypeStore.getState()
    const locker = state.classroom.lockers.find(
      (item) => item.id === lockerId,
    )
    const message = state.messages.at(-1)

    expect(state.classroom.blackboardEntries.at(-1)).toMatchObject({
      authorName: '지수',
      text: '우리 반 다 같이 끝까지 가자!',
    })
    expect(locker?.messageIds).toContain(message?.id)
    expect(locker?.objects).toHaveLength(1)
    expect(message).toMatchObject({
      senderName: '지수',
      recipientDeskId: lockerId,
      status: 'sent',
    })
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
