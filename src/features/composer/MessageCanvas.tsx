import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { Move } from 'lucide-react'
import type { MessageDraft, TextElement } from '@/types'
import { getComposerBackground } from './backgroundAssets'
import './composer.css'

type MessageCanvasProps = {
  draft: MessageDraft
  onTextChange: (id: string, text: string) => void
  onTextMove: (id: string, x: number, y: number) => void
}

export function MessageCanvas({
  draft,
  onTextChange,
  onTextMove,
}: MessageCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [selectedId, setSelectedId] = useState<string | null>(
    draft.textElements[0]?.id ?? null,
  )
  const background = getComposerBackground(draft.backgroundAssetId)

  return (
    <div className="message-canvas-viewport">
      <div
        ref={canvasRef}
        className={[
          'message-canvas',
          background.kind === 'css' ? background.className ?? '' : 'message-canvas--image',
        ].filter(Boolean).join(' ')}
        style={{ backgroundColor: background.tone }}
        aria-label="응원 카드 편집 캔버스"
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) setSelectedId(null)
        }}
      >
        {background.kind === 'image' && background.source && (
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

        <div
          className={[
            'message-canvas__shine',
            background.kind === 'image' ? 'message-canvas__shine--art' : '',
          ].filter(Boolean).join(' ')}
          aria-hidden
        />

        {draft.textElements.map((element) => (
          <CanvasTextElement
            key={element.id}
            element={element}
            canvasRef={canvasRef}
            selected={selectedId === element.id}
            onSelect={() => setSelectedId(element.id)}
            onChange={(text) => onTextChange(element.id, text)}
            onMove={(x, y) => onTextMove(element.id, x, y)}
          />
        ))}

        <div className="message-canvas__signature" aria-hidden>
          for 지수
        </div>
      </div>
      <p className="message-canvas-viewport__hint">
        글자를 눌러 작성하고, <Move size={13} aria-hidden /> 손잡이로 원하는 곳에 옮겨보세요.
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
    textareaRef.current.style.height = `${Math.max(72, textareaRef.current.scrollHeight)}px`
  }, [element.text])

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    const canvas = canvasRef.current
    if (!canvas) return

    const pointerId = event.pointerId
    event.currentTarget.setPointerCapture(pointerId)
    onSelect()

    const onPointerMove = (moveEvent: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = ((moveEvent.clientX - rect.left) / rect.width) * 100
      const y = ((moveEvent.clientY - rect.top) / rect.height) * 100
      onMove(clamp(x, 8, 92), clamp(y, 10, 90))
    }

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp, { once: true })
  }

  return (
    <div
      className={[
        'canvas-text-element',
        selected ? 'canvas-text-element--selected' : '',
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
        onChange={(event) => onChange(event.target.value)}
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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
