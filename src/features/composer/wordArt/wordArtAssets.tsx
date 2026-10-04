import type { ComponentType } from 'react'
import { GoodLuckWordArt } from './GoodLuckWordArt'
import { NegaWordArt } from './NegaWordArt'
import { ReasonWordArt } from './ReasonWordArt'
import { SuccessWordArt } from './SuccessWordArt'

export type WordArtAssetId =
  | 'wordart-nega'
  | 'wordart-success'
  | 'wordart-reason'
  | 'wordart-good-luck'

export type WordArtDefinition = {
  id: WordArtAssetId
  label: string
  description: string
  aspectRatio: number
  defaultScale: number
  component: ComponentType<{ className?: string }>
}

export const wordArtAssets: WordArtDefinition[] = [
  {
    id: 'wordart-nega',
    label: '네가',
    description: '핑크 손그림 타이포',
    aspectRatio: 250 / 126,
    defaultScale: .9,
    component: NegaWordArt,
  },
  {
    id: 'wordart-success',
    label: '성공하는',
    description: '하늘빛 손그림 타이포',
    aspectRatio: 430 / 128,
    defaultScale: .78,
    component: SuccessWordArt,
  },
  {
    id: 'wordart-reason',
    label: '이유',
    description: '블루 손그림 타이포',
    aspectRatio: 230 / 130,
    defaultScale: .88,
    component: ReasonWordArt,
  },
  {
    id: 'wordart-good-luck',
    label: '잘 될 거야',
    description: '버터 코랄 손그림 타이포',
    aspectRatio: 425 / 128,
    defaultScale: .78,
    component: GoodLuckWordArt,
  },
]

export function getWordArtDefinition(assetId: string) {
  return wordArtAssets.find((asset) => asset.id === assetId)
}

export function WordArtGraphic({
  assetId,
  className,
}: {
  assetId: string
  className?: string
}) {
  const definition = getWordArtDefinition(assetId)

  if (!definition) return null

  const Graphic = definition.component
  return <Graphic className={className} />
}
