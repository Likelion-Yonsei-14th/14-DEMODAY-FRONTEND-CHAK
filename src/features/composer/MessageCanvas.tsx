import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  Check,
  Maximize2,
  Move,
} from 'lucide-react'
import type {
  MessageDraft,
  PhotoElement,
  PositionedAsset,
  TextElement,
} from '@/types'
import { getComposerBackground } from './backgroundAssets'
import { getTextAppearance } from './fonts/fontRegistry'
import { WordArtGraphic } from './wordArt/wordArtAssets'
import './composer.css'

type MessageCanvasProps = {
  draft: MessageDraft
  selectedId: string | null
  onSelect: (id: string | null) => void
  onTextDone: () => void
  onTextChange: (id: string, text: string) => void
  onTextMove: (id: string, x: number, y: number) => void
  onTextResize: (id: string, width: number, x: number) => void
  onWordArtMove: (
    id: string,
    x: number,
    y: number,
  ) => void
  onPhotoChange: (
    id: string,
    patch: Partial<PhotoElement>,
  ) => void
}

export function MessageCanvas({
  draft,
  selectedId,
  onSelect,
  onTextDone,
  onTextChange,
  onTextMove,
  onTextResize,
  onWordArtMove,
  onPhotoChange,
}: MessageCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const background = getComposerBackground(
    draft.backgroundAssetId,
  )
  const backgroundPhoto =
    draft.photoElements.find(
      (photo) => photo.role === 'background',
    )
  const floatingPhotos =
    draft.photoElements.filter(
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
        style={{
          backgroundColor: background.tone,
        }}
        aria-label="응원 카드 편집 캔버스"
        onPointerDown={(event) => {
          if (
            event.target === event.currentTarget
          ) {
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
            selected={
              selectedId === backgroundPhoto.id
            }
            onSelect={() =>
              onSelect(backgroundPhoto.id)
            }
            onChange={(patch) =>
              onPhotoChange(
                backgroundPhoto.id,
                patch,
              )
            }
          />
        )}

        <div
          className={[
            'message-canvas__shine',
            background.kind === 'image' ||
            backgroundPhoto
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
            onSelect={() =>
              onSelect(photo.id)
            }
            onChange={(patch) =>
              onPhotoChange(photo.id, patch)
            }
          />
        ))}

        {draft.wordArtElements.map((element) => (
          <CanvasWordArtElement
            key={element.id}
            element={element}
            canvasRef={canvasRef}
            selected={
              selectedId === element.id
            }
            onSelect={() =>
              onSelect(element.id)
            }
            onMove={(x, y) =>
              onWordArtMove(
                element.id,
                x,
                y,
              )
            }
          />
        ))}

        {draft.textElements.map((element) => (
          <CanvasTextElement
            key={element.id}
            element={element}
            canvasRef={canvasRef}
            selected={
              selectedId === element.id
            }
            onSelect={() =>
              onSelect(element.id)
            }
            onDone={onTextDone}
            onChange={(text) =>
              onTextChange(
                element.id,
                text,
              )
            }
            onMove={(x, y) =>
              onTextMove(
                element.id,
                x,
                y,
              )
            }
            onResize={(width, x) =>
              onTextResize(
                element.id,
                width,
                x,
              )
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
        요소를 끌어 이동해요. 사진은{' '}
        <Maximize2 size={13} aria-hidden /> 핸들로,
        텍스트 박스는 두 손가락을 벌리거나 모아 크기를 조절할 수 있어요.
      </p>
    </div>
  )
}

type CanvasTextElementProps = {
  element: TextElement
  canvasRef:
    React.RefObject<HTMLDivElement | null>
  selected: boolean
  onSelect: () => void
  onDone: () => void
  onChange: (text: string) => void
  onMove: (x: number, y: number) => void
  onResize: (width: number, x: number) => void
}

function CanvasTextElement({
  element,
  canvasRef,
  selected,
  onSelect,
  onDone,
  onChange,
  onMove,
  onResize,
}: CanvasTextElementProps) {
  const wrapperRef =
    useRef<HTMLDivElement>(null)
  const textareaRef =
    useRef<HTMLTextAreaElement>(null)
  const touchPointsRef = useRef(
    new Map<number, { x: number; y: number }>(),
  )
  const pinchStartRef = useRef<{
    distance: number
    width: number
    x: number
  } | null>(null)
  const [controlsBelow, setControlsBelow] =
    useState(false)

  const appearance = getTextAppearance(element)

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const resizeToContent = () => {
      textarea.style.height = 'auto'
      textarea.style.height =
        `${Math.max(72, textarea.scrollHeight)}px`
    }

    resizeToContent()

    void document.fonts?.ready.then(() => {
      if (textareaRef.current === textarea) {
        resizeToContent()
      }
    })
  }, [
    element.text,
    element.fontId,
    element.fontSize,
    element.styleId,
    element.width,
  ])

  useLayoutEffect(() => {
    if (!selected) return

    const wrapper = wrapperRef.current
    const canvas = canvasRef.current
    if (!wrapper || !canvas) return

    const updateControlPlacement = () => {
      const wrapperRect =
        wrapper.getBoundingClientRect()
      const canvasRect =
        canvas.getBoundingClientRect()

      setControlsBelow(
        wrapperRect.top <
          canvasRect.top + 34,
      )
    }

    updateControlPlacement()

    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(
            updateControlPlacement,
          )
        : null

    observer?.observe(wrapper)
    observer?.observe(canvas)
    window.addEventListener(
      'resize',
      updateControlPlacement,
    )

    return () => {
      observer?.disconnect()
      window.removeEventListener(
        'resize',
        updateControlPlacement,
      )
    }
  }, [
    selected,
    element.x,
    element.y,
    element.width,
    element.text,
    element.fontSize,
    element.fontId,
  ])

  useEffect(() => {
    if (
      selected &&
      !element.text &&
      textareaRef.current
    ) {
      textareaRef.current.focus()
    }
  }, [selected, element.text])

  const handleMove = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault()
    event.stopPropagation()

    const canvasNode = canvasRef.current
    if (!canvasNode) return

    onSelect()

    const rect =
      canvasNode.getBoundingClientRect()
    const pointerStart = {
      x: event.clientX,
      y: event.clientY,
    }
    const positionStart = {
      x: element.x ?? 50,
      y: element.y ?? 50,
    }
    const width = element.width ?? 76
    const halfWidth = width / 2
    const minX = Math.min(
      50,
      halfWidth + 2,
    )
    const maxX = Math.max(
      50,
      100 - halfWidth - 2,
    )

    const onPointerMove = (
      moveEvent: PointerEvent,
    ) => {
      const x =
        positionStart.x +
        ((moveEvent.clientX -
          pointerStart.x) /
          rect.width) *
          100
      const y =
        positionStart.y +
        ((moveEvent.clientY -
          pointerStart.y) /
          rect.height) *
          100

      onMove(
        clamp(x, minX, maxX),
        clamp(y, 6, 94),
      )
    }

    bindWindowDrag(onPointerMove)
  }

  const handleTouchPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (
      !selected ||
      event.pointerType !== 'touch' ||
      (event.target instanceof Element &&
        event.target.closest('button'))
    ) {
      return
    }

    touchPointsRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    })

    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Some mobile browsers may reject capture during native text editing.
    }

    if (touchPointsRef.current.size !== 2) return

    const points = [...touchPointsRef.current.values()]
    const first = points[0]
    const second = points[1]
    if (!first || !second) return

    event.preventDefault()
    event.stopPropagation()
    textareaRef.current?.blur()
    onSelect()

    pinchStartRef.current = {
      distance: Math.max(
        24,
        distance(
          first.x,
          first.y,
          second.x,
          second.y,
        ),
      ),
      width: element.width ?? 76,
      x: element.x ?? 50,
    }
  }

  const handleTouchPointerMove = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (
      event.pointerType !== 'touch' ||
      !touchPointsRef.current.has(event.pointerId)
    ) {
      return
    }

    touchPointsRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    })

    const pinchStart = pinchStartRef.current
    if (
      !pinchStart ||
      touchPointsRef.current.size < 2
    ) {
      return
    }

    const points = [...touchPointsRef.current.values()]
    const first = points[0]
    const second = points[1]
    if (!first || !second) return

    event.preventDefault()
    event.stopPropagation()

    const currentDistance = Math.max(
      24,
      distance(
        first.x,
        first.y,
        second.x,
        second.y,
      ),
    )
    const width = clamp(
      pinchStart.width *
        (currentDistance / pinchStart.distance),
      28,
      94,
    )
    const halfWidth = width / 2
    const x = clamp(
      pinchStart.x,
      Math.min(50, halfWidth + 2),
      Math.max(50, 100 - halfWidth - 2),
    )

    onResize(width, x)
  }

  const handleTouchPointerEnd = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (event.pointerType !== 'touch') return

    touchPointsRef.current.delete(event.pointerId)

    if (touchPointsRef.current.size < 2) {
      pinchStartRef.current = null
    }

    try {
      if (
        event.currentTarget.hasPointerCapture(
          event.pointerId,
        )
      ) {
        event.currentTarget.releasePointerCapture(
          event.pointerId,
        )
      }
    } catch {
      // Ignore browsers that already released pointer capture.
    }
  }

  return (
    <div
      ref={wrapperRef}
      className={[
        'canvas-text-element',
        selected
          ? 'canvas-text-element--selected'
          : '',
        selected && controlsBelow
          ? 'canvas-text-element--controls-bottom'
          : '',
      ].filter(Boolean).join(' ')}
      style={{
        left: `${element.x ?? 50}%`,
        top: `${element.y ?? 50}%`,
        width:
          `${element.width ?? 76}%`,
        zIndex:
          element.zIndex ?? 30,
      }}
      onPointerDown={(event) => {
        event.stopPropagation()
        handleTouchPointerDown(event)
      }}
      onPointerMove={handleTouchPointerMove}
      onPointerUp={handleTouchPointerEnd}
      onPointerCancel={handleTouchPointerEnd}
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
        style={{
          fontFamily: appearance.fontFamily,
          fontSize: `${appearance.fontSize}px`,
          fontWeight: appearance.fontWeight,
          lineHeight: appearance.lineHeight,
          letterSpacing: appearance.letterSpacing,
          color: appearance.color,
          textAlign: element.align ?? 'center',
        }}
      />

      {selected && (
        <>
          <button
            type="button"
            className="canvas-text-element__done"
            aria-label="텍스트 편집 완료"
            onPointerDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
            }}
            onClick={(event) => {
              event.stopPropagation()
              onDone()
            }}
          >
            <Check size={16} aria-hidden />
          </button>

          <button
            type="button"
            className="canvas-text-element__move"
            aria-label="글자 위치 옮기기"
            onPointerDown={handleMove}
          >
            <Move
              size={15}
              aria-hidden
            />
          </button>

        </>
      )}
    </div>
  )
}

function CanvasFloatingPhoto({
  photo,
  canvasRef,
  selected,
  onSelect,
  onChange,
}: {
  photo: PhotoElement
  canvasRef:
    React.RefObject<HTMLDivElement | null>
  selected: boolean
  onSelect: () => void
  onChange: (
    patch: Partial<PhotoElement>,
  ) => void
}) {
  const photoRef =
    useRef<HTMLDivElement>(null)

  const handleDrag = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    event.preventDefault()
    event.stopPropagation()

    const canvas = canvasRef.current
    if (!canvas) return

    onSelect()

    const canvasRect =
      canvas.getBoundingClientRect()
    const pointerStart = {
      x: event.clientX,
      y: event.clientY,
    }
    const positionStart = {
      x: photo.x ?? 50,
      y: photo.y ?? 50,
    }

    const onPointerMove = (
      moveEvent: PointerEvent,
    ) => {
      const x =
        positionStart.x +
        ((moveEvent.clientX -
          pointerStart.x) /
          canvasRect.width) *
          100
      const y =
        positionStart.y +
        ((moveEvent.clientY -
          pointerStart.y) /
          canvasRect.height) *
          100

      onChange({
        x: clamp(x, 9, 91),
        y: clamp(y, 9, 91),
      })
    }

    bindWindowDrag(onPointerMove)
  }

  const handleTransform = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault()
    event.stopPropagation()

    const node = photoRef.current
    if (!node) return

    onSelect()

    const rect =
      node.getBoundingClientRect()
    const center = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }
    const startDistance = Math.max(
      12,
      distance(
        center.x,
        center.y,
        event.clientX,
        event.clientY,
      ),
    )
    const startAngle = angle(
      center.x,
      center.y,
      event.clientX,
      event.clientY,
    )
    const scaleStart =
      photo.scale ?? 1
    const rotationStart =
      photo.rotation ?? 0

    const onPointerMove = (
      moveEvent: PointerEvent,
    ) => {
      const currentDistance = distance(
        center.x,
        center.y,
        moveEvent.clientX,
        moveEvent.clientY,
      )
      const currentAngle = angle(
        center.x,
        center.y,
        moveEvent.clientX,
        moveEvent.clientY,
      )

      onChange({
        scale: clamp(
          scaleStart *
            (currentDistance /
              startDistance),
          .42,
          1.7,
        ),
        rotation: clamp(
          rotationStart +
            normalizeAngle(
              currentAngle -
                startAngle,
            ),
          -28,
          28,
        ),
      })
    }

    bindWindowDrag(onPointerMove)
  }

  const frame =
    photo.frame ?? 'white'
  const preserveShape =
    frame === 'plain' ||
    photo.hasTransparency

  return (
    <div
      ref={photoRef}
      role="button"
      tabIndex={0}
      className={[
        'canvas-photo',
        `canvas-photo--${frame}`,
        photo.hasTransparency
          ? 'canvas-photo--transparent'
          : '',
        selected
          ? 'canvas-photo--selected'
          : '',
      ].filter(Boolean).join(' ')}
      style={{
        left: `${photo.x ?? 50}%`,
        top: `${photo.y ?? 50}%`,
        zIndex:
          photo.zIndex ?? 10,
        aspectRatio:
          frame === 'polaroid'
            ? '4 / 3.8'
            : String(
                photo.aspectRatio ??
                  4 / 3,
              ),
        transform:
          `translate(-50%, -50%) rotate(${photo.rotation ?? 0}deg) scale(${photo.scale ?? 1})`,
      }}
      aria-label="사진 위치 옮기기"
      onClick={(event) => {
        event.stopPropagation()
        onSelect()
      }}
      onPointerDown={handleDrag}
    >
      <img
        src={photo.src}
        alt={photo.alt ?? ''}
        draggable={false}
        style={{
          objectFit:
            preserveShape
              ? 'contain'
              : 'cover',
        }}
      />

      {selected && (
        <button
          type="button"
          className="canvas-photo__transform-handle"
          aria-label="사진 크기와 각도 조절"
          onPointerDown={
            handleTransform
          }
        >
          <Maximize2
            size={15}
            aria-hidden
          />
        </button>
      )}
    </div>
  )
}

function CanvasBackgroundPhoto({
  photo,
  canvasRef,
  selected,
  onSelect,
  onChange,
}: {
  photo: PhotoElement
  canvasRef:
    React.RefObject<HTMLDivElement | null>
  selected: boolean
  onSelect: () => void
  onChange: (
    patch: Partial<PhotoElement>,
  ) => void
}) {
  const handleDrag = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    event.preventDefault()
    event.stopPropagation()

    const canvas = canvasRef.current
    if (!canvas) return

    onSelect()

    const rect =
      canvas.getBoundingClientRect()
    const pointerStart = {
      x: event.clientX,
      y: event.clientY,
    }
    const positionStart = {
      x: photo.x ?? 50,
      y: photo.y ?? 50,
    }

    const onPointerMove = (
      moveEvent: PointerEvent,
    ) => {
      const x =
        positionStart.x +
        ((moveEvent.clientX -
          pointerStart.x) /
          rect.width) *
          100
      const y =
        positionStart.y +
        ((moveEvent.clientY -
          pointerStart.y) /
          rect.height) *
          100

      onChange({
        x: clamp(x, 0, 100),
        y: clamp(y, 0, 100),
      })
    }

    bindWindowDrag(onPointerMove)
  }

  const handleScale = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault()
    event.stopPropagation()

    const canvas = canvasRef.current
    if (!canvas) return

    const rect =
      canvas.getBoundingClientRect()
    const center = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }
    const startDistance = Math.max(
      20,
      distance(
        center.x,
        center.y,
        event.clientX,
        event.clientY,
      ),
    )
    const scaleStart =
      photo.scale ?? 1

    const onPointerMove = (
      moveEvent: PointerEvent,
    ) => {
      const currentDistance = distance(
        center.x,
        center.y,
        moveEvent.clientX,
        moveEvent.clientY,
      )

      onChange({
        scale: clamp(
          scaleStart *
            (currentDistance /
              startDistance),
          1,
          1.8,
        ),
      })
    }

    bindWindowDrag(onPointerMove)
  }

  return (
    <div
      className={[
        'canvas-photo-background',
        selected
          ? 'canvas-photo-background--selected'
          : '',
      ].filter(Boolean).join(' ')}
      role="button"
      tabIndex={selected ? 0 : -1}
      aria-label="배경 사진 위치 조정"
      onPointerDown={handleDrag}
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
          transform:
            `scale(${photo.scale ?? 1})`,
        }}
      />

      {selected && (
        <button
          type="button"
          className="canvas-photo-background__scale-handle"
          aria-label="배경 사진 확대 축소"
          onPointerDown={handleScale}
        >
          <Maximize2
            size={15}
            aria-hidden
          />
        </button>
      )}
    </div>
  )
}

type CanvasWordArtElementProps = {
  element: PositionedAsset
  canvasRef:
    React.RefObject<HTMLDivElement | null>
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
    createMoveHandler(
      canvasRef,
      onSelect,
      onMove,
      {
        minX: 10,
        maxX: 90,
        minY: 9,
        maxY: 91,
      },
    )

  return (
    <button
      type="button"
      className={[
        'canvas-word-art',
        selected
          ? 'canvas-word-art--selected'
          : '',
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
      onPointerDown={
        handlePointerDown
      }
    >
      <WordArtGraphic
        assetId={element.assetId}
        className="canvas-word-art__graphic"
      />
    </button>
  )
}

function createMoveHandler(
  canvasRef:
    React.RefObject<HTMLDivElement | null>,
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
      const rect =
        canvas.getBoundingClientRect()
      const x =
        ((clientX - rect.left) /
          rect.width) *
        100
      const y =
        ((clientY - rect.top) /
          rect.height) *
        100

      onMove(
        clamp(
          x,
          bounds.minX,
          bounds.maxX,
        ),
        clamp(
          y,
          bounds.minY,
          bounds.maxY,
        ),
      )
    }

    update(
      event.clientX,
      event.clientY,
    )

    const onPointerMove = (
      moveEvent: PointerEvent,
    ) => {
      update(
        moveEvent.clientX,
        moveEvent.clientY,
      )
    }

    bindWindowDrag(onPointerMove)
  }
}

function bindWindowDrag(
  onPointerMove: (
    event: PointerEvent,
  ) => void,
) {
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

function distance(
  centerX: number,
  centerY: number,
  x: number,
  y: number,
) {
  return Math.hypot(
    x - centerX,
    y - centerY,
  )
}

function angle(
  centerX: number,
  centerY: number,
  x: number,
  y: number,
) {
  return (
    Math.atan2(
      y - centerY,
      x - centerX,
    ) *
    (180 / Math.PI)
  )
}

function normalizeAngle(value: number) {
  let normalized = value

  while (normalized > 180) {
    normalized -= 360
  }
  while (normalized < -180) {
    normalized += 360
  }

  return normalized
}

function clamp(
  value: number,
  min: number,
  max: number,
) {
  return Math.min(
    Math.max(value, min),
    max,
  )
}
