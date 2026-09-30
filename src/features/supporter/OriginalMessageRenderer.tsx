import type { CSSProperties } from 'react'
import { getComposerBackground } from '@/features/composer/backgroundAssets'
import { WordArtGraphic } from '@/features/composer/wordArt/wordArtAssets'
import { getTextAppearance } from '@/features/composer/fonts/fontRegistry'
import { getFirstCardPage } from '@/features/composer/messagePages'
import { getStickerAsset } from '@/features/composer/stickerAssets'
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
            style={{
              objectPosition:
                `${backgroundPhoto.x ?? 50}% ${backgroundPhoto.y ?? 50}%`,
              transform:
                `scale(${backgroundPhoto.scale ?? 1})`,
            }}
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
          style={{
            left: `${element.x}%`,
            top: `${element.y}%`,
            zIndex: element.zIndex,
            transform:
              `translate(-50%, -50%) rotate(${element.rotation}deg) scale(${element.scale})`,
          }}
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
            style={{
              left: `${element.x}%`,
              top: `${element.y}%`,
              width: `${asset.baseWidthPercent}%`,
              zIndex: element.zIndex,
              transform:
                `translate(-50%, -50%) rotate(${element.rotation}deg) scale(${element.scale})`,
            }}
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
                      left:
                        `${element.x ?? 50}%`,
                      top:
                        `${element.y ?? 50}%`,
                      width:
                        `${element.width ?? 76}%`,
                      zIndex:
                        element.zIndex ?? 30,
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

      <span className="original-message__for">
        for 지수
      </span>
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
      style={{
        left: `${photo.x ?? 50}%`,
        top: `${photo.y ?? 50}%`,
        zIndex: photo.zIndex ?? 10,
        aspectRatio:
          (photo.frame ?? 'white') === 'polaroid'
            ? '4 / 3.8'
            : String(photo.aspectRatio ?? 4 / 3),
        transform:
          `translate(-50%, -50%) rotate(${photo.rotation ?? 0}deg) scale(${photo.scale ?? 1})`,
      }}
    >
      <img
        src={photo.src}
        alt={photo.alt ?? ''}
        style={{
          objectFit:
            photo.hasTransparency ||
            (photo.frame ?? 'white') === 'plain'
              ? 'contain'
              : 'cover',
        }}
      />
    </div>
  )
}
