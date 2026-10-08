import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Eye, Gem, LockKeyhole, Move } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AppBar,
  BottomSheet,
  Button,
  IconButton,
  TextField,
} from '@/design-system'
import { getComposerBackground } from '@/features/composer/backgroundAssets'
import { getFirstCardPage } from '@/features/composer/messagePages'
import { DeskScene } from '@/features/desk/DeskScene'
import {
  DeskObjectLayer,
  DeskObjectVisual,
} from '@/features/desk/DeskObjectLayer'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import { DEFAULT_SUPPORTER_TOKEN, supporterPath } from '@/prototype/supporterRoute'
import type {
  CharmMaterial,
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
  CHARM_PHRASE_MAX_LENGTH,
  charmDesigns,
  getCharmDesign,
  resolveCharmPhrase,
} from './charmDesigns'
import { GEM_PRICE, countGemCost } from './gems'
import { GemDecoratorSheet } from './GemDecoratorSheet'
import './supporterFlow.css'

// Letter and charm both carry a written message; stickers have their own flow.
const cardObjectTypes: DeskObjectType[] = ['letter', 'charm']

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
  const [dragging, setDragging] = useState(false)

  const [objectType, setObjectType] = useState<DeskObjectType>(objectChoice)
  const charmMode = !stickerMode && objectType === 'charm'
  const [charmDesignId, setCharmDesignId] = useState(charmDesigns[0]!.id)
  const [charmMaterial, setCharmMaterial] = useState<CharmMaterial>('flat')
  // Empty means "use the design's recommended phrase".
  const [charmPhrase, setCharmPhrase] = useState('')
  const recommendedPhrase = getCharmDesign(charmDesignId).phrase
  const finalCharmPhrase = resolveCharmPhrase(charmDesignId, charmPhrase)
  const [gems, setGems] = useState<DeskGem[]>([])
  const [decoratorOpen, setDecoratorOpen] = useState(false)
  // Gem positions are relative to the object's box, so a new shape starts clean.
  useEffect(() => setGems([]), [objectType])

  // Prototype-only purchase: no payment details are collected.
  const acrylicCost =
    charmMode && charmMaterial === 'acrylic' ? ACRYLIC_CHARM_PRICE : 0
  const gemCost = countGemCost(gems)
  const totalCost = acrylicCost + gemCost
  const [paidAmount, setPaidAmount] = useState(0)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const needsPayment = !stickerMode && totalCost > paidAmount
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
              ? `${totalCost}원 결제하고 놓기`
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

        {!stickerMode && (
        <section
          className="placement-object-picker placement-object-picker--two"
          aria-label="책상에 놓을 형태"
        >
          {cardObjectTypes.map((type) => {
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
                  <DeskObjectVisual
                    type={type}
                    assetId={type === 'charm' ? charmDesignId : undefined}
                    material={charmMaterial}
                  />
                </span>
                <span>{deskObjectLabels[type]}</span>
              </button>
            )
          })}
        </section>
        )}

        {charmMode && (
          <section className="charm-picker" aria-label="부적 디자인과 재질">
            <div className="charm-picker__designs">
              {charmDesigns.map((design) => {
                const selected = charmDesignId === design.id

                return (
                  <button
                    type="button"
                    key={design.id}
                    className={[
                      'charm-picker__design',
                      selected ? 'charm-picker__design--selected' : '',
                    ].filter(Boolean).join(' ')}
                    aria-label={`${design.phrase} 부적`}
                    aria-pressed={selected}
                    onClick={() => setCharmDesignId(design.id)}
                  >
                    <span
                      className="charm-picker__preview desk-object--charm"
                      aria-hidden
                    >
                      <DeskObjectVisual
                        type="charm"
                        assetId={design.id}
                        material="flat"
                        seed={design.id}
                      />
                    </span>
                    <span>{design.phrase}</span>
                  </button>
                )
              })}
            </div>

            <div className="charm-phrase">
              <TextField
                id="charm-phrase"
                label="부적에 적을 응원"
                helper={`책상 위에 보여서 누구나 볼 수 있어요. 비워두면 '${recommendedPhrase}'(으)로 적혀요.`}
                placeholder={`${recommendedPhrase}  ·  Tab으로 넣기`}
                maxLength={CHARM_PHRASE_MAX_LENGTH}
                value={charmPhrase}
                onChange={(event) => setCharmPhrase(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Tab' && !event.shiftKey && !charmPhrase) {
                    event.preventDefault()
                    setCharmPhrase(recommendedPhrase)
                  }
                }}
              />
              {charmPhrase !== recommendedPhrase && (
                <button
                  type="button"
                  className="charm-phrase__suggestion"
                  onClick={() => setCharmPhrase(recommendedPhrase)}
                >
                  추천 문구 넣기 · {recommendedPhrase}
                </button>
              )}
            </div>

            <div
              className="charm-picker__materials"
              role="radiogroup"
              aria-label="재질"
            >
              {([
                ['flat', '평면 스티커', '무료'],
                ['acrylic', '아크릴 3D', `${ACRYLIC_CHARM_PRICE}원`],
              ] as const).map(([material, label, price]) => (
                <button
                  type="button"
                  key={material}
                  role="radio"
                  aria-checked={charmMaterial === material}
                  className={[
                    'charm-picker__material',
                    charmMaterial === material
                      ? 'charm-picker__material--selected'
                      : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => setCharmMaterial(material)}
                >
                  <strong>{label}</strong>
                  <span>{price}</span>
                </button>
              ))}
            </div>
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
                ? `보석 ${gems.length}개 · ${gemCost}원`
                : `하나에 ${GEM_PRICE}원`}
            </span>
          </button>
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

      <BottomSheet
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        title="이대로 결제하고 놓을까요?"
        description="반짝이는 꾸미기는 책상 위에서 더 눈에 띄어요."
      >
        <div className="charm-payment">
          {acrylicCost > 0 && (
            <div className="charm-payment__row">
              <span>{finalCharmPhrase} 부적 · 아크릴 3D</span>
              <strong>{acrylicCost}원</strong>
            </div>
          )}
          {gemCost > 0 && (
            <div className="charm-payment__row">
              <span>
                보석 스티커 {gems.length}개 × {GEM_PRICE}원
              </span>
              <strong>{gemCost}원</strong>
            </div>
          )}
          <div className="charm-payment__row charm-payment__row--total">
            <span>합계</span>
            <strong>{totalCost}원</strong>
          </div>
          <p className="charm-payment__note">
            프로토타입이라 실제 결제는 되지 않아요.
          </p>
          <Button
            variant="brand"
            fullWidth
            onClick={() => {
              setPaidAmount(totalCost)
              setPaymentOpen(false)
            }}
          >
            {totalCost}원 결제하기
          </Button>
        </div>
      </BottomSheet>

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
