import type { CSSProperties } from 'react'
import { getComposerBackground } from '@/features/composer/backgroundAssets'
import { WordArtGraphic } from '@/features/composer/wordArt/wordArtAssets'
import { getTextAppearance } from '@/features/composer/fonts/fontRegistry'
import { getFirstCardPage } from '@/features/composer/messagePages'
import { getStickerAsset } from '@/features/composer/stickerAssets'
import {
  getBackgroundPhotoStyle,
  getFloatingPhotoStyle,
  getPhotoObjectFit,
  getPositionedAssetStyle,
  getStickerStyle,
  getTextBoxStyle,
} from '@/features/composer/cardRenderStyles'
import type { CardPage, Message, PhotoElement } from '@/types'
import './MessageViewerPage.css'
import '@/features/composer/cardRenderShared.css'

export function OriginalMessageRenderer({
  message,
  page,
}: {
  message: Message
  page?: CardPage
}) {
  const cardPage = page ?? getFirstCardPage(message)
  const background = getComposerBackground(
    cardPage.backgroundAssetId,
  )
  const longCard = cardPage.canvasMode === 'long'
  const backgroundPhoto = cardPage.photoElements.find(
    (photo) => photo.role === 'background',
  )
  const floatingPhotos = cardPage.photoElements.filter(
    (photo) => photo.role === 'floating',
  )

  return (
    <div
      className={[
        'original-message',
        longCard
          ? 'original-message--long'
          : 'original-message--standard',
        background.kind === 'css'
          ? background.className ?? ''
          : '',
      ].filter(Boolean).join(' ')}
      style={{ backgroundColor: background.tone }}
    >
      {background.kind === 'image' &&
        background.source && (
          <img
            className={[
              'original-message__background',
              `original-message__background--${background.fit ?? 'contain'}`,
            ].join(' ')}
            src={background.source}
            alt=""
            aria-hidden
            draggable={false}
          />
        )}

      {backgroundPhoto && (
        <div className="original-message__photo-background">
          <img
            src={backgroundPhoto.src}
            alt={backgroundPhoto.alt ?? ''}
            style={getBackgroundPhotoStyle(backgroundPhoto)}
          />
        </div>
      )}

      <div
        className={[
          'original-message__shine',
          background.kind === 'image' || backgroundPhoto
            ? 'original-message__shine--art'
            : '',
        ].filter(Boolean).join(' ')}
        aria-hidden
      />

      {floatingPhotos.map((photo) => (
        <RenderedFloatingPhoto
          key={photo.id}
          photo={photo}
        />
      ))}

      {cardPage.wordArtElements.map((element) => (
        <div
          key={element.id}
          className="original-message__word-art"
          style={getPositionedAssetStyle(element)}
        >
          <WordArtGraphic
            assetId={element.assetId}
            className="original-message__word-art-graphic"
          />
        </div>
      ))}

      {cardPage.stickerElements.map((element) => {
        const asset = getStickerAsset(element.assetId)
        if (!asset) return null

        return (
          <div
            key={element.id}
            className="original-message__sticker"
            style={getStickerStyle(
              element,
              asset.baseWidthPercent,
            )}
          >
            <img
              src={asset.source}
              alt=""
              draggable={false}
            />
          </div>
        )
      })}

      <div
        className={
          longCard
            ? 'original-message__flow'
            : undefined
        }
      >
        {cardPage.textElements.map((element) => {
          const appearance = getTextAppearance(element)
          const typography: CSSProperties = {
            fontFamily: appearance.fontFamily,
            fontSize: `${appearance.fontSize}px`,
            fontWeight: appearance.fontWeight,
            lineHeight: appearance.lineHeight,
            letterSpacing: appearance.letterSpacing,
            color: appearance.color,
          }

          return (
            <p
              key={element.id}
              className="original-message__text"
              style={
                longCard
                  ? {
                      ...typography,
                      textAlign:
                        element.align ?? 'left',
                    }
                  : ({
                      ...typography,
                      ...getTextBoxStyle(element),
                      textAlign:
                        element.align ?? 'center',
                    } as CSSProperties)
              }
            >
              {element.text}
            </p>
          )
        })}
      </div>

    </div>
  )
}

function RenderedFloatingPhoto({
  photo,
}: {
  photo: PhotoElement
}) {
  return (
    <div
      className={[
        'original-message__floating-photo',
        `original-message__floating-photo--${photo.frame ?? 'white'}`,
        photo.hasTransparency
          ? 'original-message__floating-photo--transparent'
          : '',
      ].filter(Boolean).join(' ')}
      style={getFloatingPhotoStyle(photo)}
    >
      <img
        src={photo.src}
        alt={photo.alt ?? ''}
        style={{
          objectFit: getPhotoObjectFit(photo),
        }}
      />
    </div>
  )
}
