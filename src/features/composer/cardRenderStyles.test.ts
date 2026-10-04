import { describe, expect, it } from 'vitest'
import type {
  PhotoElement,
  PositionedAsset,
  TextElement,
} from '@/types'
import {
  getBackgroundPhotoStyle,
  getFloatingPhotoStyle,
  getPhotoObjectFit,
  getPositionedAssetStyle,
  getStickerStyle,
  getTextBoxStyle,
} from './cardRenderStyles'

describe('card render styles', () => {
  it('uses one positioned-asset transform for composer and recipient renderers', () => {
    const asset: PositionedAsset = {
      id: 'asset-1',
      assetId: 'sticker-number-01',
      x: 61,
      y: 37,
      scale: 1.2,
      rotation: -8,
      zIndex: 24,
    }

    expect(getPositionedAssetStyle(asset)).toEqual({
      left: '61%',
      top: '37%',
      zIndex: 24,
      transform:
        'translate(-50%, -50%) rotate(-8deg) scale(1.2)',
    })
    expect(getStickerStyle(asset, 18)).toMatchObject({
      width: '18%',
      left: '61%',
      top: '37%',
      zIndex: 24,
    })
  })

  it('keeps text geometry deterministic', () => {
    const text: TextElement = {
      id: 'text-1',
      text: '응원해',
      x: 48,
      y: 55,
      width: 70,
      zIndex: 31,
    }

    expect(getTextBoxStyle(text)).toEqual({
      left: '48%',
      top: '55%',
      width: '70%',
      zIndex: 31,
    })
  })

  it('keeps photo geometry and crop rules deterministic', () => {
    const photo: PhotoElement = {
      id: 'photo-1',
      src: 'data:image/png;base64,a',
      role: 'floating',
      x: 44,
      y: 63,
      scale: .9,
      rotation: 6,
      frame: 'polaroid',
      zIndex: 18,
      aspectRatio: 1.5,
    }

    expect(getFloatingPhotoStyle(photo)).toEqual({
      left: '44%',
      top: '63%',
      zIndex: 18,
      aspectRatio: '4 / 3.8',
      transform:
        'translate(-50%, -50%) rotate(6deg) scale(0.9)',
    })
    expect(getPhotoObjectFit(photo)).toBe('cover')

    expect(
      getBackgroundPhotoStyle({
        ...photo,
        role: 'background',
        x: 35,
        y: 70,
        scale: 1.25,
      }),
    ).toEqual({
      objectPosition: '35% 70%',
      transform: 'scale(1.25)',
    })
  })
})
