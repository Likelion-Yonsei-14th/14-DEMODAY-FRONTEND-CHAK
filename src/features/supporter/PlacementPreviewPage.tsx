import { useMemo, useRef, useState } from 'react'
import { ArrowLeft, Eye, LockKeyhole, Move } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppBar, Button, IconButton } from '@/design-system'
import { getComposerBackground } from '@/features/composer/backgroundAssets'
import { getFirstCardPage } from '@/features/composer/messagePages'
import { DeskScene } from '@/features/desk/DeskScene'
import {
  DeskObjectLayer,
  DeskObjectVisual,
} from '@/features/desk/DeskObjectLayer'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import type { DeskObjectType, DeskPlacement } from '@/types'
import {
  mergeSupportMessages,
  seededDeskObjects,
} from './seededMessages'
import {
  clampPlacement,
  deskObjectLabels,
  deskObjectToneOptions,
  isPlacementValid,
  resolveAvailablePlacement,
  resolveDeskObjectType,
  selectableDeskObjectTypes,
} from './supporterFlow'
import './supporterFlow.css'

export function PlacementPreviewPage() {
  const navigate = useNavigate()
  const sceneRef = useRef<HTMLDivElement>(null)
  const draft = usePrototypeStore((state) => state.composerDraft)
  const currentDesk = usePrototypeStore((state) => state.currentDesk)
  const storedMessages = usePrototypeStore((state) => state.messages)
  const messages = useMemo(
    () => mergeSupportMessages(storedMessages),
    [storedMessages],
  )
  const existingObjects = useMemo(
    () => [...seededDeskObjects, ...currentDesk.objects],
    [currentDesk.objects],
  )
  const placeComposerMessage = usePrototypeStore(
    (state) => state.placeComposerMessage,
  )
  const [placing, setPlacing] = useState(false)
  const [dragging, setDragging] = useState(false)

  const recommendedObjectType = useMemo(
    () => resolveDeskObjectType(draft),
    [draft],
  )
  const [objectType, setObjectType] = useState<DeskObjectType>(
    recommendedObjectType,
  )
  const firstPage = getFirstCardPage(draft)
  const cardPreviewColor =
    getComposerBackground(firstPage.backgroundAssetId).tone
  const [objectColor, setObjectColor] = useState(cardPreviewColor)
  const toneChoices = [
    {
      id: 'card',
      label: '카드 색',
      color: cardPreviewColor,
    },
    ...deskObjectToneOptions.filter(
      (tone) => tone.color !== cardPreviewColor,
    ),
  ]
  const initialPlacement = useMemo(
    () => resolveAvailablePlacement(existingObjects, objectType),
    [existingObjects, objectType],
  )
  const [placement, setPlacement] = useState<DeskPlacement>(initialPlacement)
  const [lastValidPlacement, setLastValidPlacement] =
    useState<DeskPlacement>(initialPlacement)

  const valid = isPlacementValid(
    placement,
    existingObjects,
    objectType,
  )
  const visibilityPrivate = draft.visibility === 'private'

  const handlePointerDown: React.PointerEventHandler<HTMLButtonElement> = (
    event,
  ) => {
    event.preventDefault()
    setDragging(true)

    const updateFromPoint = (clientX: number, clientY: number) => {
      const scene = sceneRef.current
      if (!scene) return

      const rect = scene.getBoundingClientRect()
      const next = clampPlacement({
        ...placement,
        x: ((clientX - rect.left) / rect.width) * 100,
        y: ((clientY - rect.top) / rect.height) * 100,
      })

      setPlacement(next)
      if (
        isPlacementValid(
          next,
          existingObjects,
          objectType,
        )
      ) {
        setLastValidPlacement(next)
      }
    }

    updateFromPoint(event.clientX, event.clientY)

    const onMove = (moveEvent: PointerEvent) => {
      updateFromPoint(moveEvent.clientX, moveEvent.clientY)
    }

    const onUp = () => {
      setDragging(false)
      setPlacement((current) =>
        isPlacementValid(
          current,
          existingObjects,
          objectType,
        )
          ? current
          : lastValidPlacement,
      )
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp, { once: true })
  }

  const placeMessage = () => {
    if (placing || !valid) return
    setPlacing(true)

    window.setTimeout(() => {
      placeComposerMessage(placement, objectType, objectColor)
      navigate('/prototype/support/jisu/complete', { replace: true })
    }, 520)
  }

  return (
    <AppShell
      surface="transparent"
      contentClassName="placement-shell"
      appBar={
        <AppBar
          title="책상에 놓기"
          subtitle="원하는 자리를 직접 골라보세요."
          transparent
          leading={
            <IconButton
              label="응원 만들기로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate('/prototype/support/jisu/compose')}
            />
          }
        />
      }
      fixedAction={
        <Button
          variant="brand"
          fullWidth
          loading={placing}
          disabled={!valid}
          onClick={placeMessage}
        >
          이대로 놓고 가기
        </Button>
      }
    >
      <main className="placement-preview">
        <section className="placement-preview__copy">
          <h2>지수님의 책상에서<br />내 응원의 자리를 골라요.</h2>
          <p>
            다른 친구의 응원을 거의 다 가리는 자리만 피하면 어디든 괜찮아요.
          </p>
        </section>

        <section
          className="placement-object-picker"
          aria-label="책상에 놓을 형태"
        >
          {selectableDeskObjectTypes.map((type) => {
            const selected = objectType === type

            return (
              <button
                type="button"
                key={type}
                className={[
                  'placement-object-option',
                  selected
                    ? 'placement-object-option--selected'
                    : '',
                ].filter(Boolean).join(' ')}
                aria-pressed={selected}
                onClick={() => setObjectType(type)}
              >
                <span
                  className={[
                    'placement-object-option__preview',
                    `desk-object--${type}`,
                  ].join(' ')}
                  style={{
                    '--desk-object-color': objectColor,
                  } as React.CSSProperties}
                  aria-hidden
                >
                  <DeskObjectVisual type={type} />
                </span>
                <span>{deskObjectLabels[type]}</span>
              </button>
            )
          })}
        </section>

        <section className="placement-object-tone-picker" aria-label="오브젝트 색상">
          <span className="placement-object-tone-picker__label">색상</span>
          <div className="placement-object-tone-picker__options">
            {toneChoices.map((tone) => {
              const selected = objectColor === tone.color

              return (
                <button
                  type="button"
                  key={tone.id}
                  className={[
                    'placement-object-tone',
                    selected
                      ? 'placement-object-tone--selected'
                      : '',
                  ].filter(Boolean).join(' ')}
                  style={{
                    '--object-tone': tone.color,
                  } as React.CSSProperties}
                  aria-label={tone.label}
                  aria-pressed={selected}
                  onClick={() => setObjectColor(tone.color)}
                />
              )
            })}
          </div>
        </section>

        <div
          ref={sceneRef}
          className={[
            'placement-preview__scene',
            dragging ? 'placement-preview__scene--dragging' : '',
          ].filter(Boolean).join(' ')}
        >
          <DeskScene ownerName="지수님" />
          <DeskObjectLayer
            objects={existingObjects}
            messages={messages}
            draftObject={{
              representationType: objectType,
              placement,
              previewColor: objectColor,
              invalid: !valid,
              dragging,
              onPointerDown: handlePointerDown,
            }}
          />
        </div>

        <div
          className={[
            'placement-preview__notice',
            valid
              ? 'placement-preview__notice--valid'
              : 'placement-preview__notice--invalid',
          ].join(' ')}
          role="status"
        >
          <Move size={16} aria-hidden />
          <span>
            {valid
              ? '카드를 끌어서 원하는 위치에 놓아보세요.'
              : '여기서는 다른 친구의 응원이 너무 많이 가려져요.'}
          </span>
        </div>

        <section className="placement-preview__summary">
          <div className="placement-preview__summary-row">
            <span>형태</span>
            <strong>{deskObjectLabels[objectType]}</strong>
          </div>
          <div className="placement-preview__summary-row">
            <span>배치</span>
            <strong>직접 선택</strong>
          </div>
          <div className="placement-preview__summary-row">
            <span>공개 범위</span>
            <strong className="placement-preview__visibility">
              {visibilityPrivate ? (
                <LockKeyhole size={15} aria-hidden />
              ) : (
                <Eye size={15} aria-hidden />
              )}
              {visibilityPrivate ? '지수님만 보기' : '함께 보기'}
            </strong>
          </div>
        </section>
      </main>
    </AppShell>
  )
}
