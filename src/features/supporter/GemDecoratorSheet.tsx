import { useRef, useState } from 'react'
import { BottomSheet, Button } from '@/design-system'
import { DeskObjectVisual } from '@/features/desk/DeskObjectLayer'
import type { CharmMaterial, DeskGem, DeskObjectType } from '@/types'
import {
  GEM_PRICE,
  LOOSE_GEM_SIZE,
  MAX_LOOSE_GEMS,
  gemIds,
  gemPatterns,
  getGemImage,
  getGemPatternCount,
  layoutGemPattern,
} from './gems'

/** On-desk box of each decoratable object, in px (matches DeskObjectLayer.css). */
const OBJECT_BOX: Partial<Record<DeskObjectType, { width: number; height: number }>> = {
  letter: { width: 90, height: 64 },
  charm: { width: 48, height: 72 },
}

const STAGE_WIDTH = 280
const STAGE_HEIGHT = 230

type GemDecoratorSheetProps = {
  open: boolean
  onClose: () => void
  type: DeskObjectType
  assetId?: string
  material?: CharmMaterial
  charmPhrase?: string
  color: string
  gems: DeskGem[]
  onChange: React.Dispatch<React.SetStateAction<DeskGem[]>>
}

type DragState = {
  gemId: string
  patternId?: string
  startX: number
  startY: number
  origin: DeskGem[]
  moved: boolean
}

export function GemDecoratorSheet({
  open,
  onClose,
  type,
  assetId,
  material,
  charmPhrase,
  color,
  gems,
  onChange,
}: GemDecoratorSheetProps) {
  const objectRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const [tab, setTab] = useState<'loose' | 'pattern'>('loose')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const box = OBJECT_BOX[type] ?? { width: 64, height: 64 }
  const scale = Math.min(STAGE_WIDTH / box.width, STAGE_HEIGHT / box.height)
  const looseCount = gems.filter((gem) => !gem.patternId).length
  const activePattern = gems.find((gem) => gem.patternId)?.patternId
  const selected = gems.find((gem) => gem.id === selectedId)

  const addLooseGem = (gemId: string) => {
    if (looseCount >= MAX_LOOSE_GEMS) return
    const id = `gem-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
    onChange((current) => {
      if (current.filter((gem) => !gem.patternId).length >= MAX_LOOSE_GEMS) {
        return current
      }
      const n = current.length
      return [
        ...current,
        {
          id,
          gemId,
          x: 50 + (((n * 37) % 44) - 22),
          y: 50 + (((n * 23) % 44) - 22),
          size: LOOSE_GEM_SIZE * (48 / box.width) * 1.4,
          rotation: ((n * 17) % 31) - 15,
        },
      ]
    })
    setSelectedId(id)
  }

  const togglePattern = (patternId: string) => {
    const withoutPattern = gems.filter((gem) => !gem.patternId)
    onChange(
      activePattern === patternId
        ? withoutPattern
        : [...withoutPattern, ...layoutGemPattern(patternId, box)],
    )
    setSelectedId(null)
  }

  const removeSelected = () => {
    if (!selected) return
    onChange(
      gems.filter((gem) =>
        selected.patternId
          ? gem.patternId !== selected.patternId
          : gem.id !== selected.id,
      ),
    )
    setSelectedId(null)
  }

  const handlePointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    gem: DeskGem,
  ) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      gemId: gem.id,
      patternId: gem.patternId,
      startX: event.clientX,
      startY: event.clientY,
      origin: gems,
      moved: false,
    }
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    const rect = objectRef.current?.getBoundingClientRect()
    if (!drag || !rect) return

    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY
    if (!drag.moved && Math.hypot(dx, dy) < 4) return
    drag.moved = true

    const dxPct = (dx / rect.width) * 100
    const dyPct = (dy / rect.height) * 100
    onChange(
      drag.origin.map((gem) => {
        // A shape set moves as one piece; a loose gem moves alone.
        const moves = drag.patternId
          ? gem.patternId === drag.patternId
          : gem.id === drag.gemId
        if (!moves) return gem
        return {
          ...gem,
          x: Math.min(100, Math.max(0, gem.x + dxPct)),
          y: Math.min(100, Math.max(0, gem.y + dyPct)),
        }
      }),
    )
  }

  const handlePointerUp = (gem: DeskGem) => {
    const drag = dragRef.current
    dragRef.current = null
    if (drag && !drag.moved) {
      setSelectedId((current) => (current === gem.id ? null : gem.id))
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="보석 스티커로 꾸미기"
      description={`보석 하나에 ${GEM_PRICE}원이에요. 끌어서 옮기고, 눌러서 고를 수 있어요.`}
    >
      <div className="gem-decorator">
        <div className="gem-decorator__stage">
          <div
            ref={objectRef}
            className={`gem-decorator__object desk-object--${type}`}
            style={{
              width: box.width * scale,
              height: box.height * scale,
              '--desk-object-color': color,
            } as React.CSSProperties}
          >
            <DeskObjectVisual
              type={type}
              assetId={assetId}
              material={material}
              charmPhrase={charmPhrase}
              gems={gems}
              seed="draft"
            />
            <div className="gem-decorator__handles">
              {gems.map((gem) => (
                <button
                  type="button"
                  key={gem.id}
                  className={[
                    'gem-decorator__handle',
                    selected &&
                    (selected.patternId
                      ? gem.patternId === selected.patternId
                      : gem.id === selected.id)
                      ? 'gem-decorator__handle--selected'
                      : '',
                  ].filter(Boolean).join(' ')}
                  style={{
                    left: `${gem.x}%`,
                    top: `${gem.y}%`,
                    width: `${gem.size}%`,
                  }}
                  aria-label={gem.patternId ? '모양 세트 보석' : '보석'}
                  onPointerDown={(event) => handlePointerDown(event, gem)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={() => handlePointerUp(gem)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="gem-decorator__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'loose'}
            onClick={() => setTab('loose')}
          >
            낱개 보석 ({looseCount}/{MAX_LOOSE_GEMS})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'pattern'}
            onClick={() => setTab('pattern')}
          >
            모양 세트
          </button>
        </div>

        {tab === 'loose' ? (
          <div className="gem-decorator__tray">
            {gemIds.map((gemId) => (
              <button
                type="button"
                key={gemId}
                className="gem-decorator__tray-gem"
                disabled={looseCount >= MAX_LOOSE_GEMS}
                aria-label={`${gemId} 보석 붙이기`}
                onClick={() => addLooseGem(gemId)}
              >
                <img src={getGemImage(gemId)} alt="" draggable={false} />
              </button>
            ))}
          </div>
        ) : (
          <div className="gem-decorator__patterns">
            {gemPatterns.map((pattern) => {
              const count = getGemPatternCount(pattern.id)
              const active = activePattern === pattern.id

              return (
                <button
                  type="button"
                  key={pattern.id}
                  className={[
                    'gem-decorator__pattern',
                    active ? 'gem-decorator__pattern--active' : '',
                  ].filter(Boolean).join(' ')}
                  aria-pressed={active}
                  onClick={() => togglePattern(pattern.id)}
                >
                  <strong>{pattern.name}</strong>
                  <span>
                    보석 {count}개 · {count * GEM_PRICE}원
                  </span>
                </button>
              )
            })}
          </div>
        )}

        <div className="gem-decorator__actions">
          <button
            type="button"
            className="gem-decorator__text-button"
            disabled={!selected}
            onClick={removeSelected}
          >
            {selected?.patternId ? '선택한 모양 떼기' : '선택한 보석 떼기'}
          </button>
          <button
            type="button"
            className="gem-decorator__text-button"
            disabled={gems.length === 0}
            onClick={() => {
              onChange([])
              setSelectedId(null)
            }}
          >
            모두 떼기
          </button>
        </div>

        <Button variant="brand" fullWidth onClick={onClose}>
          {gems.length > 0
            ? `보석 ${gems.length}개 · ${gems.length * GEM_PRICE}원으로 꾸미기`
            : '꾸미기 닫기'}
        </Button>
      </div>
    </BottomSheet>
  )
}
