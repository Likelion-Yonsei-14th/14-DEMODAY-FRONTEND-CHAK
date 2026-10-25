import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Eye, Gem, LockKeyhole, Move } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AppBar,
  Button,
  IconButton,
} from '@/design-system'
import { getComposerBackground } from '@/features/composer/backgroundAssets'
import { getFirstCardPage } from '@/features/composer/messagePages'
import { DeskScene } from '@/features/desk/DeskScene'
import {
  DeskObjectLayer,
  DeskObjectVisual,
} from '@/features/desk/DeskObjectLayer'
import { AppShell } from '@/layout/AppShell'
import { isApiEnabled } from '@/api/config'
import { sendErrorMessage, sendToServer } from '@/api/send'
import { useFeedback } from '@/design-system/overlays'
import { usePrototypeStore } from '@/store/prototypeStore'
import { DEFAULT_SUPPORTER_TOKEN, supporterPath } from '@/prototype/supporterRoute'
import type {
  DeskGem,
  DeskObjectType,
  DeskPlacement,
} from '@/types'
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
} from './supporterFlow'
import {
  ACRYLIC_CHARM_PRICE,
  charmDesigns,
  getCharmDesign,
  resolveCharmPhrase,
} from './charmDesigns'
import { GEM_PRICE, countGemCost } from './gems'
import { GemDecoratorSheet } from './GemDecoratorSheet'
import { PaymentSheet } from '@/features/payment/PaymentSheet'
import { formatChaltteok } from '@/features/chaltteok/chaltteok'
import { useResumeState } from '@/features/chaltteok/returnFlow'
import './supporterFlow.css'

// Letter and charm both carry a written message; stickers have their own flow.
// Picks kept across a trip to the charge or login page and back. The charm
// itself lives in the store's charmDraft, picked before writing.
type PlacementResume = {
  gems: DeskGem[]
  objectColor: string
  placement: DeskPlacement
}

export function PlacementPreviewPage() {
  const navigate = useNavigate()
  const { supporterToken = DEFAULT_SUPPORTER_TOKEN } = useParams()
  const sceneRef = useRef<HTMLDivElement>(null)
  const draft = usePrototypeStore((state) => state.composerDraft)
  const currentDesk = usePrototypeStore((state) => state.currentDesk)
  const storedMessages = usePrototypeStore((state) => state.messages)
  const messages = useMemo(
    () => mergeSupportMessages(storedMessages),
    [storedMessages],
  )
  const basketMessageIds = usePrototypeStore(
    (state) => state.basketMessageIds,
  )
  // Objects the owner put in the basket no longer take up desk space.
  const existingObjects = useMemo(
    () =>
      [...seededDeskObjects, ...currentDesk.objects].filter(
        (object) => !basketMessageIds.includes(object.messageId),
      ),
    [basketMessageIds, currentDesk.objects],
  )
  const placeComposerMessage = usePrototypeStore(
    (state) => state.placeComposerMessage,
  )
  const placeSticker = usePrototypeStore((state) => state.placeSticker)
  const objectChoice = usePrototypeStore(
    (state) => state.supporterObjectChoice,
  )
  const stickerId = usePrototypeStore(
    (state) => state.stickerDraft.stickerId,
  )
  const stickerMode = objectChoice === 'sticker'
  const [placing, setPlacing] = useState(false)
  const { showToast } = useFeedback()
  const [dragging, setDragging] = useState(false)

  const resumed = useResumeState<PlacementResume>()
  // The shape was decided before writing: a letter, or the charm picked first
  const charmMode = objectChoice === 'charm'
  const objectType: DeskObjectType = stickerMode
    ? 'sticker'
    : charmMode
      ? 'charm'
      : 'letter'
  const charmDraft = usePrototypeStore((state) => state.charmDraft)
  const charmDesignId = charmDesigns.some((design) => design.id === charmDraft.assetId)
    ? charmDraft.assetId
    : charmDesigns[0]!.id
  const charmMaterial = charmDraft.material
  // Empty means "use the design's recommended phrase".
  const charmPhrase = charmDraft.phrase
  const finalCharmPhrase = resolveCharmPhrase(charmDesignId, charmPhrase)
  const [gems, setGems] = useState<DeskGem[]>(resumed?.gems ?? [])
  const [decoratorOpen, setDecoratorOpen] = useState(false)
  // Gem positions are relative to the object's box, so a new shape starts clean.
  const gemsShape = useRef(objectType)
  useEffect(() => {
    if (gemsShape.current === objectType) return
    gemsShape.current = objectType
    setGems([])
  }, [objectType])

  // Prototype-only purchase: no payment details are collected.
  const acrylicCost =
    charmMode && charmMaterial === 'acrylic' ? ACRYLIC_CHARM_PRICE : 0
  const gemCost = countGemCost(gems)
  const totalCost = acrylicCost + gemCost
  const [paidAmount, setPaidAmount] = useState(0)
  const [paidOrderId, setPaidOrderId] = useState<number | undefined>()
  const [paymentOpen, setPaymentOpen] = useState(false)
  const needsPayment = !stickerMode && totalCost > paidAmount
  const signedIn = usePrototypeStore(
    (state) => state.authSession.status === 'authenticated',
  )
  const firstPage = getFirstCardPage(draft)
  const cardPreviewColor =
    getComposerBackground(firstPage.backgroundAssetId).tone
  const [objectColor, setObjectColor] = useState(
    resumed?.objectColor ?? cardPreviewColor,
  )
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
  const [placement, setPlacement] = useState<DeskPlacement>(
    resumed?.placement ?? initialPlacement,
  )
  const [lastValidPlacement, setLastValidPlacement] = useState<DeskPlacement>(
    resumed?.placement ?? initialPlacement,
  )

  const valid = isPlacementValid(
    placement,
    existingObjects,
    objectType,
  )
  const visibilityPrivate = draft.visibility === 'private'
  const recipientName = currentDesk.displayName

  const handlePointerDown: React.PointerEventHandler<HTMLButtonElement> = (
    event,
  ) => {
    event.preventDefault()
    setDragging(true)

    const updateFromPoint = (clientX: number, clientY: number) => {
      const scene = sceneRef.current
      if (!scene) return

      const rect = scene.getBoundingClientRect()
      const next = clampPlacement(
        {
          ...placement,
          x: ((clientX - rect.left) / rect.width) * 100,
          y: ((clientY - rect.top) / rect.height) * 100,
        },
        objectType,
      )

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
    if (needsPayment) {
      setPaymentOpen(true)
      return
    }
    setPlacing(true)

    if (isApiEnabled) {
      sendToServer({
        supporterToken,
        stickerMode,
        objectType,
        objectColor,
        placement,
        charm: charmMode
          ? {
              assetId: charmDesignId,
              material: charmMaterial,
              charmPhrase: finalCharmPhrase,
            }
          : undefined,
        gems,
        paymentOrderId: paidOrderId,
      })
        .then(() => {
          navigate(supporterPath(supporterToken, '/complete'), { replace: true })
        })
        .catch((error: unknown) => {
          setPlacing(false)
          showToast(sendErrorMessage(error))
        })
      return
    }

    window.setTimeout(() => {
      if (stickerMode) {
        placeSticker(placement)
      } else {
        placeComposerMessage(
          placement,
          objectType,
          objectColor,
          charmMode
            ? {
                assetId: charmDesignId,
                material: charmMaterial,
                charmPhrase: finalCharmPhrase,
              }
            : undefined,
          gems,
        )
      }
      navigate(supporterPath(supporterToken, '/complete'), { replace: true })
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
              label={stickerMode ? '스티커 고르기로 돌아가기' : '응원 쓰기로 돌아가기'}
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() =>
                navigate(
                  supporterPath(
                    supporterToken,
                    stickerMode ? '/sticker' : '/compose',
                  ),
                )
              }
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
          {stickerMode
            ? '여기에 붙이기'
            : needsPayment
              ? `${formatChaltteok(totalCost)}으로 놓기`
              : '이대로 놓고 가기'}
        </Button>
      }
    >
      <main className="placement-preview">
        <section className="placement-preview__copy">
          <h2>
            {recipientName}님의 책상에서
            <br />
            {stickerMode ? '스티커 붙일 자리를 골라요.' : '내 응원의 자리를 골라요.'}
          </h2>
          <p>
            다른 친구의 응원을 거의 다 가리는 자리만 피하면 어디든 괜찮아요.
          </p>
        </section>

        {charmMode && (
          <section className="charm-summary" aria-label="고른 부적">
            <span className="charm-summary__preview desk-object--charm" aria-hidden>
              <DeskObjectVisual
                type="charm"
                assetId={charmDesignId}
                material={charmMaterial}
                charmPhrase={finalCharmPhrase}
                seed={charmDesignId}
              />
            </span>
            <span className="charm-summary__text">
              <strong>
                {getCharmDesign(charmDesignId).name} 부적 ·{' '}
                {charmMaterial === 'acrylic'
                  ? `아크릴 3D ${formatChaltteok(ACRYLIC_CHARM_PRICE)}`
                  : '평면 스티커 무료'}
              </strong>
              <span>“{finalCharmPhrase}”</span>
            </span>
            <button
              type="button"
              className="charm-summary__change"
              onClick={() => navigate(supporterPath(supporterToken, '/charm'))}
            >
              바꾸기
            </button>
          </section>
        )}

        {!stickerMode && (
          <button
            type="button"
            className="gem-entry"
            onClick={() => setDecoratorOpen(true)}
          >
            <Gem size={17} aria-hidden />
            <span className="gem-entry__label">보석 스티커로 꾸미기</span>
            <span className="gem-entry__meta">
              {gems.length > 0
                ? `보석 ${gems.length}개 · ${formatChaltteok(gemCost)}`
                : `하나에 ${formatChaltteok(GEM_PRICE)}`}
            </span>
          </button>
        )}

        {needsPayment && !signedIn && (
          <p className="paid-login-note">
            유료 꾸미기는 로그인한 뒤 찰떡으로 구매해요. 로그인하고 돌아와도 쓰던 응원은 그대로예요.
          </p>
        )}

        {!stickerMode && !charmMode && (
        <section className="placement-object-tone-picker" aria-label="색">
          <span className="placement-object-tone-picker__label">색</span>
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
        )}

        <div
          ref={sceneRef}
          className={[
            'placement-preview__scene',
            dragging ? 'placement-preview__scene--dragging' : '',
          ].filter(Boolean).join(' ')}
        >
          <DeskScene ownerName={`${recipientName}님`} />
          <DeskObjectLayer
            objects={existingObjects}
            messages={messages}
            draftObject={{
              representationType: objectType,
              assetId: stickerMode
                ? stickerId
                : charmMode
                  ? charmDesignId
                  : undefined,
              material: charmMode ? charmMaterial : undefined,
              charmPhrase: charmMode ? finalCharmPhrase : undefined,
              gems,
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
              ? `${stickerMode ? '스티커를' : '카드를'} 끌어서 원하는 위치에 놓아보세요.`
              : '여기서는 다른 친구의 응원이 너무 많이 가려져요.'}
          </span>
        </div>

        <section className="placement-preview__summary">
          <div className="placement-preview__summary-row">
            <span>형태</span>
            <strong>
              {charmMode
                ? `${finalCharmPhrase} 부적 · ${
                    charmMaterial === 'acrylic' ? '아크릴 3D' : '평면 스티커'
                  }`
                : deskObjectLabels[objectType]}
            </strong>
          </div>
          {gems.length > 0 && (
            <div className="placement-preview__summary-row">
              <span>꾸미기</span>
              <strong>보석 스티커 {gems.length}개</strong>
            </div>
          )}
          <div className="placement-preview__summary-row">
            <span>배치</span>
            <strong>직접 선택</strong>
          </div>
          <div className="placement-preview__summary-row">
            <span>{stickerMode ? '보낸 사람' : '공개 범위'}</span>
            <strong className="placement-preview__visibility">
              {visibilityPrivate || stickerMode ? (
                <LockKeyhole size={15} aria-hidden />
              ) : (
                <Eye size={15} aria-hidden />
              )}
              {stickerMode
                ? `${recipientName}님만 볼 수 있어요`
                : visibilityPrivate
                  ? `${recipientName}님만 보기`
                  : '함께 보기'}
            </strong>
          </div>
        </section>
      </main>

      <PaymentSheet
        open={paymentOpen}
        description="반짝이는 꾸미기는 책상 위에서 더 눈에 띄어요."
        items={[
          ...(acrylicCost > 0
            ? [
                {
                  label: `${finalCharmPhrase} 부적 · 아크릴 3D`,
                  amount: acrylicCost,
                  code: 'CHARM_ACRYLIC' as const,
                },
              ]
            : []),
          ...(gemCost > 0
            ? [
                {
                  label: `보석 스티커 ${gems.length}개 × ${formatChaltteok(GEM_PRICE)}`,
                  amount: gemCost,
                  code: 'GEM' as const,
                  quantity: gems.length,
                },
              ]
            : []),
        ]}
        resumeState={
          {
            gems,
            objectColor,
            placement,
          } satisfies PlacementResume
        }
        onClose={() => setPaymentOpen(false)}
        onConfirm={(purchase) => {
          // The send attaches this paid order as paymentOrderId ([제안] in the backend spec).
          setPaidOrderId(purchase.orderId)
          setPaidAmount(totalCost)
          setPaymentOpen(false)
        }}
      />

      {!stickerMode && (
        <GemDecoratorSheet
          open={decoratorOpen}
          onClose={() => setDecoratorOpen(false)}
          type={objectType}
          assetId={charmMode ? charmDesignId : undefined}
          material={charmMode ? charmMaterial : undefined}
          charmPhrase={charmMode ? finalCharmPhrase : undefined}
          color={objectColor}
          gems={gems}
          onChange={setGems}
        />
      )}
    </AppShell>
  )
}
