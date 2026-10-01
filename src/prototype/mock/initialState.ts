import type {
  CardPage,
  Classroom,
  Desk,
  DeskCreationDraft,
  MessageDraft,
  PrototypeUser,
} from '@/types'

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
  createdFor: 'self',
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

export const emptyDeskCreationDraft: DeskCreationDraft = {
  createdFor: null,
  recipientDisplayName: '',
  readMode: {
    type: 'daily',
    unlockTime: '22:00',
  },
}

const initialCardPage: CardPage = {
  id: 'draft-01-page-1',
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
  blackboardEntries: [
    {
      id: 'board-entry-1',
      authorName: '민지',
      text: '우리 반 다 같이 끝까지 가보자 🍀',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'board-entry-2',
      authorName: '현우',
      text: '수능 끝나고 바로 놀러 가는 거다',
      createdAt: new Date().toISOString(),
    },
  ],
  lockers: [
    { id: 'locker-minji', studentName: '민지', messageIds: [], objects: [] },
    { id: 'locker-hyunwoo', studentName: '현우', messageIds: [], objects: [] },
    { id: 'locker-seoyeon', studentName: '서연', messageIds: [], objects: [] },
  ],
  dailyUnlockTime: '22:00',
}
