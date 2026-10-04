export type StickerAsset = {
  id: string
  name: string
  source: string
  baseWidthPercent: number
  tags?: string[]
  /** Which row of the sticker tool it sits in; also decides where it lands. */
  group?: 'sticker' | 'clip' | 'tape'
  /** Opens after watching one rewarded ad (prototype). */
  adLocked?: boolean
}

const STICKER_ASSET_PATH = '/assets/stickers'

export const composerStickers: StickerAsset[] = [
  {
    id: 'sticker-number-01',
    name: '숫자 1',
    source: `${STICKER_ASSET_PATH}/sticker-number-01.svg`,
    baseWidthPercent: 27,
    tags: ['숫자', '응원'],
  },
  {
    id: 'sticker-number-02',
    name: '숫자 2',
    source: `${STICKER_ASSET_PATH}/sticker-number-02.svg`,
    baseWidthPercent: 27,
    tags: ['숫자', '응원'],
  },
  {
    id: 'sticker-number-03',
    name: '숫자 3',
    source: `${STICKER_ASSET_PATH}/sticker-number-03.svg`,
    baseWidthPercent: 25,
    tags: ['숫자', '응원'],
  },
  {
    id: 'sticker-emphasis',
    name: '강조 효과',
    source: `${STICKER_ASSET_PATH}/sticker-emphasis.svg`,
    baseWidthPercent: 18,
    tags: ['강조', '효과', '응원'],
  },
]

const LETTER_DECOR_PATH = '/assets/letter-decor'

const clip = (
  id: string,
  name: string,
  baseWidthPercent: number,
  adLocked = false,
): StickerAsset => ({
  id: `clip-${id}`,
  name,
  source: `${LETTER_DECOR_PATH}/clip-${id}.webp`,
  baseWidthPercent,
  group: 'clip',
  adLocked,
})

const tape = (id: string, name: string, adLocked = false): StickerAsset => ({
  id: `tape-${id}`,
  name,
  source: `${LETTER_DECOR_PATH}/tape-${id}.webp`,
  baseWidthPercent: 34,
  group: 'tape',
  adLocked,
})

/** Clips that hold the letter from its top edge. */
export const letterClips: StickerAsset[] = [
  clip('bulldog-silver', '은색 집게', 17),
  clip('bulldog-gold', '금색 집게', 17),
  clip('binder-red', '빨간 바인더 클립', 14),
  clip('binder-pink', '분홍 바인더 클립', 14),
  clip('paperclip-silver', '은색 클립', 11),
  clip('paperclip-gold', '금색 클립', 11),
  clip('clothespin', '나무 집게', 15),
  clip('paperclip-heart', '하트 클립', 9, true),
  clip('paperclip-star', '별 클립', 9, true),
  clip('binder-polka', '도트 바인더 클립', 14, true),
  clip('bulldog-sage', '세이지 집게', 17, true),
  clip('ring-gold', '금색 링 클립', 15, true),
]

/** Washi tape strips that stick the letter's corners down. */
export const letterTapes: StickerAsset[] = [
  tape('cream', '크림 테이프'),
  tape('pink', '분홍 테이프'),
  tape('kraft', '크라프트 테이프'),
  tape('yellow', '노랑 테이프'),
  tape('sky', '하늘 테이프'),
  tape('dots-black', '블랙 도트 테이프'),
  tape('gingham-green', '초록 깅엄 테이프', true),
  tape('plaid', '체크 테이프', true),
  tape('polka-coral', '코랄 도트 테이프', true),
  tape('dots-pink', '분홍 도트 테이프', true),
  tape('stripe-brown', '스트라이프 테이프', true),
  tape('foil', '홀로그램 테이프', true),
]

const stickerAssetMap = new Map(
  [...composerStickers, ...letterClips, ...letterTapes].map((asset) => [
    asset.id,
    asset,
  ]),
)

export function getStickerAsset(assetId: string) {
  return stickerAssetMap.get(assetId)
}
