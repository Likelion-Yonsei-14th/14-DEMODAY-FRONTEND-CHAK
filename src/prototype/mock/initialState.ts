import type {
  CardPage,
  Classroom,
  Desk,
  DeskCreationDraft,
  MessageDraft,
  PrototypeUser,
  RollingPaperClass,
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
  inviteCode: 'CLASS32',
}

const rollingNote = (
  id: string,
  paperLockerId: string,
  authorLockerId: string,
  authorName: string,
  text: string,
  pen: string,
  stamp: string,
  x: number,
  y: number,
) => ({
  id,
  paperLockerId,
  authorLockerId,
  authorName,
  text,
  pen,
  stamp,
  x,
  y,
  createdAt: new Date().toISOString(),
})

export const mockRollingPaperClass: RollingPaperClass = {
  id: 'rolling-class-3-2',
  name: '3학년 2반',
  revealMode: 'onEnd',
  boardEntries: [
    { id: 'rolling-board-1', authorLockerId: 'rolling-locker-minji', authorName: '민지', text: '3년 동안 고생 많았다!', createdAt: new Date().toISOString() },
    { id: 'rolling-board-2', authorLockerId: 'rolling-locker-hyunwoo', authorName: '현우', text: '서로 한마디씩 꼭 남기기 ✿', createdAt: new Date().toISOString() },
  ],
  lockers: [
    { id: 'rolling-locker-minji', studentName: '민지', paperDesign: 'bg-stationery-note-pink' },
    { id: 'rolling-locker-hyunwoo', studentName: '현우', paperDesign: 'bg-stationery-gingham-green' },
    { id: 'rolling-locker-seoyeon', studentName: '서연', paperDesign: 'bg-basic-cream' },
  ],
  notes: [
    rollingNote('rolling-note-1', 'rolling-locker-minji', 'rolling-locker-hyunwoo', '현우', '3년 내내 짝꿍 해줘서 고마워! 대학 가서도 연락하자', 'blue', 'smile', 30, 18),
    rollingNote('rolling-note-2', 'rolling-locker-minji', 'rolling-locker-seoyeon', '서연', '야자 끝나고 같이 먹던 컵라면 평생 못 잊어 🍜', 'pink', 'heart', 68, 76),
    rollingNote('rolling-note-3', 'rolling-locker-hyunwoo', 'rolling-locker-minji', '민지', '수능 끝나고 놀러 가자던 약속 지켜라 ㅋㅋ', 'red', 'star', 64, 22),
    rollingNote('rolling-note-4', 'rolling-locker-seoyeon', 'rolling-locker-minji', '민지', '서연아 너 덕분에 수학 버텼다. 졸업 축하해!', 'green', 'cap', 34, 78),
  ],
}
