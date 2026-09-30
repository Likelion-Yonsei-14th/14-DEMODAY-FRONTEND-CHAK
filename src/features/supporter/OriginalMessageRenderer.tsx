import type { CSSProperties } from 'react'
import { getComposerBackground } from '@/features/composer/backgroundAssets'
import { WordArtGraphic } from '@/features/composer/wordArt/wordArtAssets'
import type { Message, PhotoElement } from '@/types'
import './MessageViewerPage.css'

export function OriginalMessageRenderer({
  message,
}: {
  message: Message
}) {
  const background = getComposerBackground(
    message.backgroundAssetId,
  )
  const longCard = message.canvasMode === 'long'
  const backgroundPhoto = message.photoElements.find(
    (photo) => photo.role === 'background',
  )
  const floatingPhotos = message.photoElements.filter(
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
        className="original-message__shine"
        aria-hidden
      />

      {floatingPhotos.map((photo) => (
        <RenderedFloatingPhoto
          key={photo.id}
          photo={photo}
        />
      ))}

      {message.wordArtElements.map((element) => (
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

      <div
        className={
          longCard
            ? 'original-message__flow'
            : undefined
        }
      >
        {message.textElements.map((element) => (
          <p
            key={element.id}
            className={[
              'original-message__text',
              `original-message__text--${element.styleId}`,
            ].join(' ')}
            style={
              longCard
                ? {
                    textAlign:
                      element.align ?? 'left',
                  }
                : ({
                    left:
                      `${element.x ?? 50}%`,
                    top:
                      `${element.y ?? 50}%`,
                    width:
                      `${element.width ?? 76}%`,
                    textAlign:
                      element.align ?? 'center',
                  } as CSSProperties)
            }
          >
            {element.text}
          </p>
        ))}
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
      ].join(' ')}
      style={{
        left: `${photo.x ?? 50}%`,
        top: `${photo.y ?? 50}%`,
        zIndex: photo.zIndex ?? 10,
        transform:
          `translate(-50%, -50%) rotate(${photo.rotation ?? 0}deg) scale(${photo.scale ?? 1})`,
      }}
    >
      <img
        src={photo.src}
        alt={photo.alt ?? ''}
      />
    </div>
  )
}
