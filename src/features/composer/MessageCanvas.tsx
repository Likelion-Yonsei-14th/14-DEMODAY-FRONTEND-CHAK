import {
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { Move } from 'lucide-react'
import type {
  MessageDraft,
  PhotoElement,
  PositionedAsset,
  TextElement,
} from '@/types'
import { getComposerBackground } from './backgroundAssets'
import { WordArtGraphic } from './wordArt/wordArtAssets'
import './composer.css'

type MessageCanvasProps = {
  draft: MessageDraft
  selectedId: string | null
  onSelect: (id: string | null) => void
  onTextChange: (id: string, text: string) => void
  onTextMove: (id: string, x: number, y: number) => void
  onWordArtMove: (id: string, x: number, y: number) => void
  onPhotoMove: (id: string, x: number, y: number) => void
}

export function MessageCanvas({
  draft,
  selectedId,
  onSelect,
  onTextChange,
  onTextMove,
  onWordArtMove,
  onPhotoMove,
}: MessageCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const background = getComposerBackground(
    draft.backgroundAssetId,
  )
  const backgroundPhoto = draft.photoElements.find(
    (photo) => photo.role === 'background',
  )
  const floatingPhotos = draft.photoElements.filter(
    (photo) => photo.role === 'floating',
  )

  return (
    <div className="message-canvas-viewport">
      <div
        ref={canvasRef}
        className={[
          'message-canvas',
          background.kind === 'css'
            ? background.className ?? ''
            : 'message-canvas--image',
        ].filter(Boolean).join(' ')}
        style={{ backgroundColor: background.tone }}
        aria-label="응원 카드 편집 캔버스"
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) {
            onSelect(null)
          }
        }}
      >
        {background.kind === 'image' &&
          background.source && (
            <img
              className={[
                'message-canvas__art-background',
                `message-canvas__art-background--${background.fit ?? 'contain'}`,
              ].join(' ')}
              src={background.source}
              alt=""
              aria-hidden
              draggable={false}
            />
          )}

        {backgroundPhoto && (
          <CanvasBackgroundPhoto
            photo={backgroundPhoto}
            canvasRef={canvasRef}
            selected={selectedId === backgroundPhoto.id}
            onSelect={() => onSelect(backgroundPhoto.id)}
            onMove={(x, y) =>
              onPhotoMove(backgroundPhoto.id, x, y)
            }
          />
        )}

        <div
          className={[
            'message-canvas__shine',
            background.kind === 'image' || backgroundPhoto
              ? 'message-canvas__shine--art'
              : '',
          ].filter(Boolean).join(' ')}
          aria-hidden
        />

        {floatingPhotos.map((photo) => (
          <CanvasFloatingPhoto
            key={photo.id}
            photo={photo}
            canvasRef={canvasRef}
            selected={selectedId === photo.id}
            onSelect={() => onSelect(photo.id)}
            onMove={(x, y) =>
              onPhotoMove(photo.id, x, y)
            }
          />
        ))}

        {draft.wordArtElements.map((element) => (
          <CanvasWordArtElement
            key={element.id}
            element={element}
            canvasRef={canvasRef}
            selected={selectedId === element.id}
            onSelect={() => onSelect(element.id)}
            onMove={(x, y) =>
              onWordArtMove(element.id, x, y)
            }
          />
        ))}

        {draft.textElements.map((element) => (
          <CanvasTextElement
            key={element.id}
            element={element}
            canvasRef={canvasRef}
            selected={selectedId === element.id}
            onSelect={() => onSelect(element.id)}
            onChange={(text) =>
              onTextChange(element.id, text)
            }
            onMove={(x, y) =>
              onTextMove(element.id, x, y)
            }
          />
        ))}

        <div
          className="message-canvas__signature"
          aria-hidden
        >
          for 지수
        </div>
      </div>

      <p className="message-canvas-viewport__hint">
        요소를 눌러 선택하고, <Move size={13} aria-hidden /> 끌어서 위치를 바꿔보세요.
      </p>
    </div>
  )
}

type CanvasTextElementProps = {
  element: TextElement
  canvasRef: React.RefObject<HTMLDivElement | null>
  selected: boolean
  onSelect: () => void
  onChange: (text: string) => void
  onMove: (x: number, y: number) => void
}

function CanvasTextElement({
  element,
  canvasRef,
  selected,
  onSelect,
  onChange,
  onMove,
}: CanvasTextElementProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!textareaRef.current) return
    textareaRef.current.style.height = 'auto'
    textareaRef.current.style.height =
      `${Math.max(72, textareaRef.current.scrollHeight)}px`
  }, [element.text])

  const handlePointerDown =
    createMoveHandler(canvasRef, onSelect, onMove, {
      minX: 8,
      maxX: 92,
      minY: 10,
      maxY: 90,
    })

  return (
    <div
      className={[
        'canvas-text-element',
        selected
          ? 'canvas-text-element--selected'
          : '',
        `canvas-text-element--${element.styleId}`,
      ].join(' ')}
      style={{
        left: `${element.x ?? 50}%`,
        top: `${element.y ?? 50}%`,
        width: `${element.width ?? 76}%`,
      }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <textarea
        ref={textareaRef}
        value={element.text}
        className="canvas-text-element__input"
        placeholder="지수에게 남기고 싶은 말을 적어보세요"
        aria-label="응원 메시지"
        rows={2}
        onFocus={onSelect}
        onClick={onSelect}
        onChange={(event) =>
          onChange(event.target.value)
        }
      />

      {selected && (
        <button
          type="button"
          className="canvas-text-element__move"
          aria-label="글자 위치 옮기기"
          onPointerDown={handlePointerDown}
        >
          <Move size={15} aria-hidden />
        </button>
      )}
    </div>
  )
}

function CanvasFloatingPhoto({
  photo,
  canvasRef,
  selected,
  onSelect,
  onMove,
}: {
  photo: PhotoElement
  canvasRef: React.RefObject<HTMLDivElement | null>
  selected: boolean
  onSelect: () => void
  onMove: (x: number, y: number) => void
}) {
  const handlePointerDown =
    createMoveHandler(canvasRef, onSelect, onMove, {
      minX: 12,
      maxX: 88,
      minY: 12,
      maxY: 88,
    })

  return (
    <button
      type="button"
      className={[
        'canvas-photo',
        `canvas-photo--${photo.frame ?? 'white'}`,
        selected ? 'canvas-photo--selected' : '',
      ].filter(Boolean).join(' ')}
      style={{
        left: `${photo.x ?? 50}%`,
        top: `${photo.y ?? 50}%`,
        zIndex: photo.zIndex ?? 10,
        transform:
          `translate(-50%, -50%) rotate(${photo.rotation ?? 0}deg) scale(${photo.scale ?? 1})`,
      }}
      aria-label="사진 위치 옮기기"
      onClick={(event) => {
        event.stopPropagation()
        onSelect()
      }}
      onPointerDown={handlePointerDown}
    >
      <img src={photo.src} alt={photo.alt ?? ''} />
    </button>
  )
}

function CanvasBackgroundPhoto({
  photo,
  canvasRef,
  selected,
  onSelect,
  onMove,
}: {
  photo: PhotoElement
  canvasRef: React.RefObject<HTMLDivElement | null>
  selected: boolean
  onSelect: () => void
  onMove: (x: number, y: number) => void
}) {
  const handlePointerDown =
    createMoveHandler(canvasRef, onSelect, onMove, {
      minX: 0,
      maxX: 100,
      minY: 0,
      maxY: 100,
    })

  return (
    <button
      type="button"
      className={[
        'canvas-photo-background',
        selected
          ? 'canvas-photo-background--selected'
          : '',
      ].filter(Boolean).join(' ')}
      aria-label="배경 사진 위치 조정"
      onPointerDown={handlePointerDown}
      onClick={(event) => {
        event.stopPropagation()
        onSelect()
      }}
    >
      <img
        src={photo.src}
        alt={photo.alt ?? ''}
        draggable={false}
        style={{
          objectPosition:
            `${photo.x ?? 50}% ${photo.y ?? 50}%`,
          transform: `scale(${photo.scale ?? 1})`,
        }}
      />
    </button>
  )
}

type CanvasWordArtElementProps = {
  element: PositionedAsset
  canvasRef: React.RefObject<HTMLDivElement | null>
  selected: boolean
  onSelect: () => void
  onMove: (x: number, y: number) => void
}

function CanvasWordArtElement({
  element,
  canvasRef,
  selected,
  onSelect,
  onMove,
}: CanvasWordArtElementProps) {
  const handlePointerDown =
    createMoveHandler(canvasRef, onSelect, onMove, {
      minX: 10,
      maxX: 90,
      minY: 9,
      maxY: 91,
    })

  return (
    <button
      type="button"
      className={[
        'canvas-word-art',
        selected ? 'canvas-word-art--selected' : '',
      ].filter(Boolean).join(' ')}
      style={{
        left: `${element.x}%`,
        top: `${element.y}%`,
        zIndex: element.zIndex,
        transform:
          `translate(-50%, -50%) rotate(${element.rotation}deg) scale(${element.scale})`,
      }}
      aria-label="그래픽 문구 위치 옮기기"
      onClick={(event) => {
        event.stopPropagation()
        onSelect()
      }}
      onPointerDown={handlePointerDown}
    >
      <WordArtGraphic
        assetId={element.assetId}
        className="canvas-word-art__graphic"
      />
    </button>
  )
}

function createMoveHandler(
  canvasRef: React.RefObject<HTMLDivElement | null>,
  onSelect: () => void,
  onMove: (x: number, y: number) => void,
  bounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  },
) {
  return (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault()
    event.stopPropagation()

    const canvas = canvasRef.current
    if (!canvas) return

    onSelect()

    const update = (
      clientX: number,
      clientY: number,
    ) => {
      const rect = canvas.getBoundingClientRect()
      const x =
        ((clientX - rect.left) / rect.width) * 100
      const y =
        ((clientY - rect.top) / rect.height) * 100

      onMove(
        clamp(x, bounds.minX, bounds.maxX),
        clamp(y, bounds.minY, bounds.maxY),
      )
    }

    update(event.clientX, event.clientY)

    const onPointerMove = (moveEvent: PointerEvent) => {
      update(moveEvent.clientX, moveEvent.clientY)
    }

    const onPointerUp = () => {
      window.removeEventListener(
        'pointermove',
        onPointerMove,
      )
      window.removeEventListener(
        'pointerup',
        onPointerUp,
      )
    }

    window.addEventListener(
      'pointermove',
      onPointerMove,
    )
    window.addEventListener(
      'pointerup',
      onPointerUp,
      { once: true },
    )
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
