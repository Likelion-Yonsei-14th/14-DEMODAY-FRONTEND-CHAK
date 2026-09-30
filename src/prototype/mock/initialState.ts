import type { CardPage, Classroom, Desk, MessageDraft, PrototypeUser } from '@/types'

export const mockCurrentUser: PrototypeUser = {
  id: 'user-owner-01',
  displayName: '지수',
  role: 'owner',
}

export const mockDesk: Desk = {
  id: 'desk-jisu',
  ownerId: 'user-owner-01',
  creatorId: 'user-creator-01',
  displayName: '지수',
  theme: {
    id: 'desk-theme-cream',
    name: '따뜻한 크림',
    backgroundAssetId: 'desk-bg-cream',
  },
  readMode: {
    type: 'daily',
    unlockTime: '22:30',
  },
  objects: [],
  claimStatus: 'claimed',
}

const initialCardPage: CardPage = {
  id: 'draft-01-page-1',
  canvasMode: 'standard',
  backgroundAssetId: 'bg-basic-cream',
  textElements: [
    {
      id: 'text-primary',
      text: '',
      styleId: 'handwriting-default',
      fontId: 'nanum-gim-yui',
      fontSize: 23,
      color: '#3C3833',
      x: 50,
      y: 50,
      width: 76,
      zIndex: 30,
      align: 'center',
    },
  ],
  wordArtElements: [],
  stickerElements: [],
  photoElements: [],
}

export const emptyComposerDraft: MessageDraft = {
  id: 'draft-01',
  canvasMode: initialCardPage.canvasMode,
  backgroundAssetId: initialCardPage.backgroundAssetId,
  textElements: initialCardPage.textElements,
  wordArtElements: initialCardPage.wordArtElements,
  stickerElements: initialCardPage.stickerElements,
  photoElements: initialCardPage.photoElements,
  pages: [initialCardPage],
  activePageId: initialCardPage.id,
  visibility: 'public',
  senderName: '',
}

export const mockClassroom: Classroom = {
  id: 'classroom-3-2',
  name: '3학년 2반',
  blackboardMessageIds: [],
  lockers: [
    { id: 'locker-jisu', studentName: '지수', messageIds: [] },
    { id: 'locker-minji', studentName: '민지', messageIds: [] },
    { id: 'locker-hyunwoo', studentName: '현우', messageIds: [] },
  ],
}
