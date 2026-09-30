import type { CSSProperties } from 'react'
import { getComposerBackground } from '@/features/composer/backgroundAssets'
import type { Message } from '@/types'
import './MessageViewerPage.css'

export function OriginalMessageRenderer({ message }: { message: Message }) {
  const background = getComposerBackground(message.backgroundAssetId)
  const longCard = message.canvasMode === 'long'

  return (
    <div
      className={[
        'original-message',
        longCard ? 'original-message--long' : 'original-message--standard',
        background.kind === 'css' ? background.className ?? '' : '',
      ].filter(Boolean).join(' ')}
      style={{ backgroundColor: background.tone }}
    >
      {background.kind === 'image' && background.source && (
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

      <div className="original-message__shine" aria-hidden />

      {message.photoElements.map((photo) =>
        photo.role === 'background' ? (
          <img
            key={photo.id}
            className="original-message__photo original-message__photo--background"
            src={photo.src}
            alt={photo.alt ?? ''}
          />
        ) : (
          <img
            key={photo.id}
            className="original-message__photo"
            src={photo.src}
            alt={photo.alt ?? ''}
            style={{
              left: `${photo.x ?? 50}%`,
              top: `${photo.y ?? 50}%`,
              transform: `translate(-50%, -50%) rotate(${photo.rotation ?? 0}deg) scale(${photo.scale ?? 1})`,
            }}
          />
        ),
      )}

      <div className={longCard ? 'original-message__flow' : undefined}>
        {message.textElements.map((element) => (
          <p
            key={element.id}
            className={[
              'original-message__text',
              `original-message__text--${element.styleId}`,
            ].join(' ')}
            style={
              longCard
                ? { textAlign: element.align ?? 'left' }
                : ({
                    left: `${element.x ?? 50}%`,
                    top: `${element.y ?? 50}%`,
                    width: `${element.width ?? 76}%`,
                    textAlign: element.align ?? 'center',
                  } as CSSProperties)
            }
          >
            {element.text}
          </p>
        ))}
      </div>

      <span className="original-message__for">for 지수</span>
    </div>
  )
}
