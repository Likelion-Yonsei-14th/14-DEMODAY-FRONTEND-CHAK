import type { DeskObject, Message } from '@/types'

function localIso(daysAgo: number, hour: number, minute: number) {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

export const seededSupportMessages: Message[] = [
  {
    id: 'seed-message-multicard-demo',
    backgroundAssetId: 'bg-frame-ribbon-pink',
    textElements: [
      {
        id: 'seed-demo-text-1',
        text: '여기까지 온 것만으로도 정말 대단해.',
        styleId: 'handwriting-default',
        x: 50,
        y: 48,
        width: 72,
        align: 'center',
      },
    ],
    wordArtElements: [],
    stickerElements: [],
    photoElements: [],
    pages: [
      {
        id: 'seed-demo-page-1',
        backgroundAssetId: 'bg-frame-ribbon-pink',
        textElements: [
          {
            id: 'seed-demo-text-1',
            text: '여기까지 온 것만으로도 정말 대단해.',
            styleId: 'handwriting-default',
            x: 50,
            y: 48,
            width: 72,
            align: 'center',
          },
        ],
        wordArtElements: [],
        stickerElements: [
          {
            id: 'seed-demo-sticker-1',
            assetId: 'sticker-number-01',
            x: 77,
            y: 24,
            scale: .72,
            rotation: 8,
            zIndex: 22,
          },
        ],
        photoElements: [],
      },
      {
        id: 'seed-demo-page-2',
        backgroundAssetId: 'bg-frame-ribbon-pink',
        textElements: [
          {
            id: 'seed-demo-text-2',
            text: '결과보다 네가 버텨온 시간이 더 오래 기억에 남을 거야.',
            styleId: 'handwriting-default',
            x: 50,
            y: 50,
            width: 72,
            align: 'center',
          },
        ],
        wordArtElements: [],
        stickerElements: [
          {
            id: 'seed-demo-sticker-2',
            assetId: 'sticker-number-02',
            x: 23,
            y: 72,
            scale: .68,
            rotation: -9,
            zIndex: 22,
          },
        ],
        photoElements: [],
      },
      {
        id: 'seed-demo-page-3',
        backgroundAssetId: 'bg-frame-ribbon-pink',
        textElements: [
          {
            id: 'seed-demo-text-3',
            text: '수능 끝나면 우리 진짜 아무 생각 없이 놀자 🍀',
            styleId: 'handwriting-default',
            x: 50,
            y: 52,
            width: 72,
            align: 'center',
          },
        ],
        wordArtElements: [],
        stickerElements: [
          {
            id: 'seed-demo-sticker-3',
            assetId: 'sticker-number-03',
            x: 76,
            y: 73,
            scale: .72,
            rotation: 7,
            zIndex: 22,
          },
        ],
        photoElements: [],
      },
    ],
    activePageId: 'seed-demo-page-1',
    visibility: 'public',
    senderName: '다은',
    recipientDeskId: 'desk-jisu',
    status: 'sent',
    createdAt: localIso(0, 5, 40),
    previewColor: '#F6CED8',
  },
  {
    id: 'seed-message-minji',
    backgroundAssetId: 'bg-frame-ribbon-pink',
    textElements: [
      {
        id: 'seed-minji-text',
        text: '네가 여기까지 온 것만으로도 진짜 대단해. 끝나면 제일 먼저 맛있는 거 먹으러 가자!',
        styleId: 'handwriting-default',
        x: 50,
        y: 51,
        width: 72,
        align: 'center',
      },
    ],
    wordArtElements: [],
    stickerElements: [],
    photoElements: [],
    visibility: 'public',
    senderName: '민지',
    recipientDeskId: 'desk-jisu',
    status: 'sent',
    createdAt: localIso(0, 22, 14),
    previewColor: '#F6CED8',
  },
  {
    id: 'seed-message-soobin',
    backgroundAssetId: 'bg-pattern-stars-butter',
    textElements: [
      {
        id: 'seed-soobin-text',
        text: '오늘도 할 만큼 했다! 이제 푹 자고 내일의 너한테 넘겨주기 🌟',
        styleId: 'handwriting-large',
        x: 50,
        y: 50,
        width: 72,
        align: 'center',
      },
    ],
    wordArtElements: [],
    stickerElements: [],
    photoElements: [],
    visibility: 'public',
    senderName: '수빈',
    recipientDeskId: 'desk-jisu',
    status: 'sent',
    createdAt: localIso(0, 19, 38),
    previewColor: '#FFF3B7',
  },
  {
    id: 'seed-message-hyunwoo',
    backgroundAssetId: 'bg-art-rainbow-cloud-blue',
    textElements: [
      {
        id: 'seed-hyunwoo-text',
        text: '수능 끝나는 날 바로 연락해. 할 말도 많고 갈 데도 많음.',
        styleId: 'clean',
        x: 50,
        y: 52,
        width: 70,
        align: 'center',
      },
    ],
    wordArtElements: [],
    stickerElements: [],
    photoElements: [],
    visibility: 'public',
    senderName: '현우',
    recipientDeskId: 'desk-jisu',
    status: 'sent',
    createdAt: localIso(0, 16, 8),
    previewColor: '#BFE8F8',
  },
  {
    id: 'seed-message-yuna',
    backgroundAssetId: 'bg-pattern-daisy-sage',
    textElements: [
      {
        id: 'seed-yuna-text',
        text: '불안한 날이어도 네가 해온 건 안 사라져. 오늘은 그냥 그걸 믿자 🍀',
        styleId: 'handwriting-default',
        x: 50,
        y: 49,
        width: 73,
        align: 'center',
      },
    ],
    wordArtElements: [],
    stickerElements: [],
    photoElements: [],
    visibility: 'private',
    senderName: '유나',
    recipientDeskId: 'desk-jisu',
    status: 'sent',
    createdAt: localIso(0, 12, 42),
    previewColor: '#D9F0D5',
  },
  {
    id: 'seed-message-jun',
    backgroundAssetId: 'bg-soft-coral',
    textElements: [
      {
        id: 'seed-jun-text',
        text: '어제보다 오늘 한 문제 더 알면 됐지 뭐. 마지막까지 너무 무리하지 마!',
        styleId: 'handwriting-default',
        x: 50,
        y: 50,
        width: 72,
        align: 'center',
      },
    ],
    wordArtElements: [],
    stickerElements: [],
    photoElements: [],
    visibility: 'public',
    senderName: '준',
    recipientDeskId: 'desk-jisu',
    status: 'read',
    createdAt: localIso(1, 21, 5),
    readAt: localIso(1, 22, 11),
    previewColor: '#F7D8CF',
  },
  {
    id: 'seed-message-seoyeon',
    backgroundAssetId: 'bg-frame-clover-orange',
    textElements: [
      {
        id: 'seed-seoyeon-text',
        text: '행운은 이미 충분히 모였고, 이제 네가 해온 거 보여주기만 하면 됨!',
        styleId: 'handwriting-large',
        x: 50,
        y: 50,
        width: 70,
        align: 'center',
      },
    ],
    wordArtElements: [],
    stickerElements: [],
    photoElements: [],
    visibility: 'public',
    senderName: '서연',
    recipientDeskId: 'desk-jisu',
    status: 'read',
    createdAt: localIso(2, 18, 26),
    readAt: localIso(2, 22, 30),
    previewColor: '#FFF6E3',
  },
]

export function mergeSupportMessages(messages: Message[]) {
  const merged = [...seededSupportMessages, ...messages]
  const unique = new Map(merged.map((message) => [message.id, message]))

  return [...unique.values()].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function isToday(createdAt: string) {
  const target = new Date(createdAt)
  const today = new Date()

  return (
    target.getFullYear() === today.getFullYear() &&
    target.getMonth() === today.getMonth() &&
    target.getDate() === today.getDate()
  )
}


export const seededDeskObjects: DeskObject[] = [
  {
    id: 'seed-object-minji',
    messageId: 'seed-message-minji',
    color: '#D8644A',
    representationType: 'memo',
    zone: 'left',
    order: 0,
    x: 24,
    y: 51,
    rotation: -4,
    scale: 0.96,
    zIndex: 20,
  },
  {
    id: 'seed-object-soobin',
    messageId: 'seed-message-soobin',
    color: '#4F72C4',
    representationType: 'poster-card',
    zone: 'center',
    order: 1,
    x: 42,
    y: 47,
    rotation: 3,
    scale: 0.9,
    zIndex: 22,
  },
  {
    id: 'seed-object-hyunwoo',
    messageId: 'seed-message-hyunwoo',
    color: '#EDCB62',
    representationType: 'photo-card',
    zone: 'right',
    order: 2,
    x: 67,
    y: 49,
    rotation: -3,
    scale: 0.9,
    zIndex: 21,
  },
  {
    id: 'seed-object-yuna',
    messageId: 'seed-message-yuna',
    color: '#DD7D95',
    representationType: 'charm',
    assetId: 'charm-clover',
    material: 'acrylic',
    zone: 'right',
    order: 3,
    locked: true,
    x: 82,
    y: 44,
    rotation: 3,
    scale: 0.88,
    zIndex: 19,
  },
  {
    id: 'seed-object-jun',
    messageId: 'seed-message-jun',
    color: '#3E9A62',
    representationType: 'letter',
    zone: 'front',
    order: 4,
    x: 55,
    y: 56,
    rotation: 2,
    scale: 0.94,
    zIndex: 24,
  },
  {
    id: 'seed-object-seoyeon',
    messageId: 'seed-message-seoyeon',
    color: '#F1E6CC',
    representationType: 'ticket',
    zone: 'front',
    order: 5,
    x: 31,
    y: 57,
    rotation: -2,
    scale: 0.92,
    zIndex: 23,
  },
]
