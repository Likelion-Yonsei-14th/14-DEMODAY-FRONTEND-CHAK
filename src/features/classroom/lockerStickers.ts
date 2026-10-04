import type { DeskSticker } from '@/features/supporter/deskStickers'

/** One college pennant, prototype price in won. */
export const PENNANT_PRICE = 150

export type LockerStickerGroup = 'star' | 'bow' | 'garland' | 'pennant'

export type LockerSticker = DeskSticker & {
  group: LockerStickerGroup
}

const PATH = '/assets/locker-stickers'

const star = (id: string, name: string): LockerSticker => ({
  id: `locker-star-${id}`,
  name,
  source: `${PATH}/star-${id}.webp`,
  group: 'star',
  shape: 'square',
})

const bow = (id: string, name: string): LockerSticker => ({
  id: `locker-bow-${id}`,
  name,
  source: `${PATH}/bow-${id}.webp`,
  group: 'bow',
  shape: 'bow',
})

const garland = (id: string, name: string): LockerSticker => ({
  id: `locker-garland-${id}`,
  name,
  source: `${PATH}/garland-${id}.webp`,
  group: 'garland',
  shape: 'garland',
})

/**
 * Felt pennants carry only the school's name and a colour close to its
 * school colour — no emblems or logos.
 */
const pennant = (id: string, name: string): LockerSticker => ({
  id: `locker-pennant-${id}`,
  name,
  source: `${PATH}/pennant-${id}.webp`,
  group: 'pennant',
  shape: 'pennant',
  price: PENNANT_PRICE,
})

export const lockerStickers: LockerSticker[] = [
  star('gold-glitter', '금색 글리터 별'),
  star('chrome', '은색 풍선 별'),
  star('pink-puffy', '핑크 말랑 별'),
  star('red-glitter', '빨간 글리터 별'),
  star('denim', '데님 별'),
  star('holo', '홀로그램 별'),
  star('yellow-pin', '노란 배지 별'),
  star('blue-glitter', '파란 글리터 별'),
  star('crystal', '크리스탈 별'),
  star('pink-button', '단추 별'),
  star('crayon', '크레용 별'),
  star('smiley', '스마일 별'),
  bow('gingham-sky', '하늘 깅엄 리본'),
  bow('gingham-pink', '분홍 깅엄 리본'),
  bow('gingham-red', '빨간 깅엄 리본'),
  bow('gingham-green', '초록 깅엄 리본'),
  bow('gingham-yellow', '노랑 깅엄 리본'),
  bow('gingham-navy', '네이비 깅엄 리본'),
  bow('gingham-lilac', '라일락 깅엄 리본'),
  bow('satin-pink', '분홍 새틴 리본'),
  bow('satin-brown', '초코 새틴 리본'),
  bow('satin-olive', '올리브 새틴 리본'),
  bow('satin-cream', '크림 새틴 리본'),
  bow('satin-dots', '도트 리본'),
  garland('sage-bunting', '세이지 가랜드'),
  garland('pastel-bunting', '파스텔 가랜드'),
  garland('felt-stars', '별 가랜드'),
  garland('pompom-hearts', '방울 하트 가랜드'),
  pennant('konkuk', '건국대학교'),
  pennant('kyunghee', '경희대학교'),
  pennant('korea', '고려대학교'),
  pennant('kookmin', '국민대학교'),
  pennant('dongguk', '동국대학교'),
  pennant('sahmyook', '삼육대학교'),
  pennant('seoultech', '서울과학기술대학교'),
  pennant('snu', '서울대학교'),
  pennant('uos', '서울시립대학교'),
  pennant('swu', '서울여자대학교'),
  pennant('skku', '성균관대학교'),
  pennant('soongsil', '숭실대학교'),
  pennant('yonsei', '연세대학교'),
  pennant('ewha', '이화여자대학교'),
  pennant('cau', '중앙대학교'),
  pennant('hufs', '한국외국어대학교'),
  pennant('hanyang', '한양대학교'),
  pennant('hansung', '한성대학교'),
]

export const lockerStickerGroups: {
  id: LockerStickerGroup
  label: string
  description: string
}[] = [
  { id: 'star', label: '별', description: '무료' },
  { id: 'bow', label: '리본', description: '무료' },
  { id: 'garland', label: '가랜드', description: '사물함 안에 걸어요 · 무료' },
  {
    id: 'pennant',
    label: '대학 깃발',
    description: `목표 대학을 걸어줘요 · 개당 ${PENNANT_PRICE}원`,
  },
]

export function getLockerSticker(id: string | undefined) {
  return lockerStickers.find((sticker) => sticker.id === id)
}
