export type StickerAsset = {
  id: string
  name: string
  source: string
  baseWidthPercent: number
  tags?: string[]
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
]

const stickerAssetMap = new Map(
  composerStickers.map((asset) => [asset.id, asset]),
)

export function getStickerAsset(assetId: string) {
  return stickerAssetMap.get(assetId)
}
