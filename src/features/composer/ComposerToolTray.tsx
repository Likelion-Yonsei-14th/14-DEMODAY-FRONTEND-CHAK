import { useRef, useState } from 'react'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Minus,
  Plus,
  Images,
  Sparkles,
  Trash2,
  Wallpaper,
} from 'lucide-react'
import { AssetTile, ChoiceChip } from '@/design-system'
import type {
  CardPage,
  PhotoElement,
  PositionedAsset,
  TextElement,
  PhotoFrame,
} from '@/types'
import {
  composerBackgrounds,
  type ComposerBackground,
} from './backgroundAssets'
import type { ComposerTool } from './ComposerDock'
import {
  composerStickers,
  getStickerAsset,
} from './stickerAssets'
import {
  composerFonts,
  composerTextColors,
  resolveTextColor,
  resolveTextFontId,
  resolveTextFontSize,
} from './fonts/fontRegistry'

type ComposerToolTrayProps = {
  tool: ComposerTool
  draft: CardPage
  selectedText?: TextElement
  selectedPhoto?: PhotoElement
  selectedSticker?: PositionedAsset
  onBackgroundChange: (backgroundId: string) => void
  onTextAdd: () => void
  onTextSelect: (id: string) => void
  onTextFontChange: (fontId: string) => void
  onTextSizeChange: (fontSize: number) => void
  onTextColorChange: (color: string) => void
  onTextAlignChange: (
    align: 'left' | 'center' | 'right',
  ) => void
  onTextSendBackward: () => void
  onTextBringForward: () => void
  onTextDelete: () => void
  onStickerAdd: (assetId: string) => void
  onStickerSelect: (id: string) => void
  onStickerSendBackward: () => void
  onStickerBringForward: () => void
  onStickerDelete: () => void
  onPhotoAdd: (
    file: File,
    role: 'floating' | 'background',
  ) => Promise<void>
  onPhotoSelect: (id: string) => void
  onPhotoUpdate: (
    patch: Partial<PhotoElement>,
  ) => void
  onPhotoSendBackward: () => void
  onPhotoBringForward: () => void
  onPhotoDelete: () => void
}

export function ComposerToolTray({
  tool,
  draft,
  selectedText,
  selectedPhoto,
  selectedSticker,
  onBackgroundChange,
  onTextAdd,
  onTextSelect,
  onTextFontChange,
  onTextSizeChange,
  onTextColorChange,
  onTextAlignChange,
  onTextSendBackward,
  onTextBringForward,
  onTextDelete,
  onStickerAdd,
  onStickerSelect,
  onStickerSendBackward,
  onStickerBringForward,
  onStickerDelete,
  onPhotoAdd,
  onPhotoSelect,
  onPhotoUpdate,
  onPhotoSendBackward,
  onPhotoBringForward,
  onPhotoDelete,
}: ComposerToolTrayProps) {
  const activeText = selectedText
  const basicBackgrounds = composerBackgrounds.filter(
    (background) => background.group === 'basic',
  )
  const graphicBackgrounds = composerBackgrounds.filter(
    (background) => background.group === 'graphic',
  )

  return (
    <section
      className="composer-tool-tray"
      aria-label="꾸미기 옵션"
    >
      {tool === 'background' && (
        <>
          <ToolTrayHeader title="배경" />
          <BackgroundRow
            label="기본"
            backgrounds={basicBackgrounds}
            selectedId={draft.backgroundAssetId}
            onSelect={onBackgroundChange}
          />
          <BackgroundRow
            label="그래픽"
            backgrounds={graphicBackgrounds}
            selectedId={draft.backgroundAssetId}
            onSelect={onBackgroundChange}
          />
        </>
      )}

      {tool === 'text' && (
        <>
          <div className="composer-text-tool-header">
            <ToolTrayHeader title="글자" />
            <button
              type="button"
              className="composer-text-add"
              onClick={onTextAdd}
            >
              <Plus size={15} aria-hidden />
              텍스트 추가
            </button>
          </div>

          <div
            className="composer-text-layer-row"
            role="list"
            aria-label="텍스트 박스 선택"
          >
            {draft.textElements.map((element, index) => {
              const active = activeText?.id === element.id

              return (
                <button
                  type="button"
                  key={element.id}
                  className={[
                    'composer-text-layer-chip',
                    active
                      ? 'composer-text-layer-chip--active'
                      : '',
                  ].filter(Boolean).join(' ')}
                  aria-pressed={active}
                  onClick={() => onTextSelect(element.id)}
                >
                  {element.text.trim()
                    ? element.text.trim().slice(0, 8)
                    : `텍스트 ${index + 1}`}
                </button>
              )
            })}
          </div>

          {activeText ? (
            <>
              <div className="composer-font-section">
                <span className="composer-tool-label">폰트</span>
                <div
                  className="composer-font-list"
                  role="list"
                  aria-label="글씨체 선택"
                >
                  {composerFonts.map((font) => {
                    const selected =
                      resolveTextFontId(activeText) === font.id

                    return (
                      <button
                        type="button"
                        key={font.id}
                        className={[
                          'composer-font-card',
                          selected
                            ? 'composer-font-card--selected'
                            : '',
                        ].filter(Boolean).join(' ')}
                        aria-pressed={selected}
                        onClick={() =>
                          onTextFontChange(font.id)
                        }
                      >
                        <span className="composer-font-card__meta">
                          <span className="composer-font-card__category">
                            {font.categoryLabel}
                          </span>
                          <strong>{font.label}</strong>
                        </span>
                        <span
                          className="composer-font-card__sample"
                          style={{
                            fontFamily: font.family,
                            fontWeight: font.weight,
                          }}
                        >
                          {font.sample}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="composer-chip-section">
                <span className="composer-tool-label">크기</span>
                <div
                  className="composer-font-size-stepper"
                  role="group"
                  aria-label="글자 크기 조절"
                >
                  <button
                    type="button"
                    aria-label="글자 크기 줄이기"
                    disabled={resolveTextFontSize(activeText) <= 14}
                    onClick={() =>
                      onTextSizeChange(
                        Math.max(
                          14,
                          resolveTextFontSize(activeText) - 1,
                        ),
                      )
                    }
                  >
                    <Minus size={17} aria-hidden />
                  </button>
                  <output
                    className="composer-font-size-stepper__value"
                    aria-live="polite"
                  >
                    {resolveTextFontSize(activeText)}
                  </output>
                  <button
                    type="button"
                    aria-label="글자 크기 키우기"
                    disabled={resolveTextFontSize(activeText) >= 42}
                    onClick={() =>
                      onTextSizeChange(
                        Math.min(
                          42,
                          resolveTextFontSize(activeText) + 1,
                        ),
                      )
                    }
                  >
                    <Plus size={17} aria-hidden />
                  </button>
                </div>
              </div>

              <div className="composer-chip-section">
                <span className="composer-tool-label">색상</span>
                <div
                  className="composer-text-color-row"
                  aria-label="글자 색상"
                >
                  {composerTextColors.map((color) => {
                    const selected =
                      resolveTextColor(activeText).toLowerCase() ===
                      color.value.toLowerCase()

                    return (
                      <button
                        key={color.id}
                        type="button"
                        className={[
                          'composer-text-color',
                          selected
                            ? 'composer-text-color--selected'
                            : '',
                        ].filter(Boolean).join(' ')}
                        aria-label={color.label}
                        aria-pressed={selected}
                        title={color.label}
                        onClick={() =>
                          onTextColorChange(color.value)
                        }
                      >
                        <span
                          style={{
                            backgroundColor: color.value,
                          }}
                        />
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="composer-text-bottom-row">
                <div className="composer-chip-section">
                  <span className="composer-tool-label">정렬</span>
                  <div className="composer-align-row">
                    <ToolIconButton
                      label="왼쪽 정렬"
                      active={activeText.align === 'left'}
                      onClick={() =>
                        onTextAlignChange('left')
                      }
                      icon={<AlignLeft size={18} aria-hidden />}
                    />
                    <ToolIconButton
                      label="가운데 정렬"
                      active={
                        (activeText.align ?? 'center') === 'center'
                      }
                      onClick={() =>
                        onTextAlignChange('center')
                      }
                      icon={<AlignCenter size={18} aria-hidden />}
                    />
                    <ToolIconButton
                      label="오른쪽 정렬"
                      active={activeText.align === 'right'}
                      onClick={() =>
                        onTextAlignChange('right')
                      }
                      icon={<AlignRight size={18} aria-hidden />}
                    />
                  </div>
                </div>

              </div>

              <LayerActions
                onSendBackward={onTextSendBackward}
                onBringForward={onTextBringForward}
                onDelete={onTextDelete}
              />

              <p className="composer-font-license-note">
                네이버 나눔손글씨 · 나눔스퀘어 네오와 오픈 라이선스
                Pretendard를 사용해요.
              </p>
            </>
          ) : (
            <div className="composer-text-empty-state">
              <span>편집할 텍스트 박스를 카드에서 선택해 주세요.</span>
              <button type="button" onClick={onTextAdd}>
                <Plus size={14} aria-hidden />
                새 텍스트 추가
              </button>
            </div>
          )}
        </>
      )}

      {tool === 'phrase' && (
        <FutureTool
          icon={
            <Sparkles size={19} aria-hidden />
          }
          title="그래픽 문구"
          description="Figma에서 만든 벡터 에셋을 연결할 예정이에요."
        />
      )}

      {tool === 'sticker' && (
        <StickerTool
          draft={draft}
          selectedSticker={selectedSticker}
          onAdd={onStickerAdd}
          onSelect={onStickerSelect}
          onSendBackward={onStickerSendBackward}
          onBringForward={onStickerBringForward}
          onDelete={onStickerDelete}
        />
      )}

      {tool === 'photo' && (
        <PhotoTool
          draft={draft}
          selectedPhoto={selectedPhoto}
          onPhotoAdd={onPhotoAdd}
          onPhotoSelect={onPhotoSelect}
          onPhotoUpdate={onPhotoUpdate}
          onPhotoSendBackward={onPhotoSendBackward}
          onPhotoBringForward={onPhotoBringForward}
          onPhotoDelete={onPhotoDelete}
        />
      )}
    </section>
  )
}

function StickerTool({
  draft,
  selectedSticker,
  onAdd,
  onSelect,
  onSendBackward,
  onBringForward,
  onDelete,
}: {
  draft: CardPage
  selectedSticker?: PositionedAsset
  onAdd: (assetId: string) => void
  onSelect: (id: string) => void
  onSendBackward: () => void
  onBringForward: () => void
  onDelete: () => void
}) {
  return (
    <>
      <ToolTrayHeader title="스티커" />

      <div
        className="composer-sticker-list"
        role="list"
        aria-label="스티커 추가"
      >
        {composerStickers.map((asset) => (
          <AssetTile
            key={asset.id}
            name={asset.name}
            className="composer-sticker-asset"
            thumbnail={
              <img
                src={asset.source}
                alt=""
                draggable={false}
              />
            }
            onClick={() => onAdd(asset.id)}
          />
        ))}
      </div>

      {draft.stickerElements.length > 0 && (
        <div
          className="composer-sticker-layer-row"
          role="list"
          aria-label="추가한 스티커 선택"
        >
          {draft.stickerElements.map((sticker, index) => {
            const asset = getStickerAsset(sticker.assetId)
            if (!asset) return null
            const active = selectedSticker?.id === sticker.id

            return (
              <button
                type="button"
                key={sticker.id}
                className={[
                  'composer-sticker-layer-chip',
                  active
                    ? 'composer-sticker-layer-chip--active'
                    : '',
                ].filter(Boolean).join(' ')}
                aria-label={`${asset.name} ${index + 1}`}
                aria-pressed={active}
                onClick={() => onSelect(sticker.id)}
              >
                <img src={asset.source} alt="" />
              </button>
            )
          })}
        </div>
      )}

      {selectedSticker && (
        <LayerActions
          onSendBackward={onSendBackward}
          onBringForward={onBringForward}
          onDelete={onDelete}
        />
      )}

    </>
  )
}

function PhotoTool({
  draft,
  selectedPhoto,
  onPhotoAdd,
  onPhotoSelect,
  onPhotoUpdate,
  onPhotoSendBackward,
  onPhotoBringForward,
  onPhotoDelete,
}: {
  draft: CardPage
  selectedPhoto?: PhotoElement
  onPhotoAdd: (
    file: File,
    role: 'floating' | 'background',
  ) => Promise<void>
  onPhotoSelect: (id: string) => void
  onPhotoUpdate: (
    patch: Partial<PhotoElement>,
  ) => void
  onPhotoSendBackward: () => void
  onPhotoBringForward: () => void
  onPhotoDelete: () => void
}) {
  const floatingInputRef =
    useRef<HTMLInputElement>(null)
  const backgroundInputRef =
    useRef<HTMLInputElement>(null)
  const [processing, setProcessing] = useState<
    'floating' | 'background' | null
  >(null)

  const floatingCount = draft.photoElements.filter(
    (photo) => photo.role === 'floating',
  ).length
  const backgroundPhoto = draft.photoElements.find(
    (photo) => photo.role === 'background',
  )

  const pickPhoto = async (
    file: File | undefined,
    role: 'floating' | 'background',
  ) => {
    if (!file) return
    setProcessing(role)

    try {
      await onPhotoAdd(file, role)
    } finally {
      setProcessing(null)
    }
  }

  return (
    <>
      <ToolTrayHeader title="사진" />

      <div className="composer-photo-actions">
        <button
          type="button"
          className="composer-photo-action"
          disabled={
            processing !== null ||
            floatingCount >= 3
          }
          onClick={() =>
            floatingInputRef.current?.click()
          }
        >
          <span className="composer-photo-action__icon">
            <Images size={19} aria-hidden />
          </span>
          <span>
            <strong>
              {processing === 'floating'
                ? '사진 준비 중…'
                : '카드 위에 사진'}
            </strong>
            <small>{floatingCount}/3장</small>
          </span>
        </button>

        <button
          type="button"
          className="composer-photo-action"
          disabled={processing !== null}
          onClick={() =>
            backgroundInputRef.current?.click()
          }
        >
          <span className="composer-photo-action__icon">
            <Wallpaper size={19} aria-hidden />
          </span>
          <span>
            <strong>
              {processing === 'background'
                ? '배경 준비 중…'
                : backgroundPhoto
                  ? '배경 사진 바꾸기'
                  : '배경으로 채우기'}
            </strong>
            <small>1장</small>
          </span>
        </button>
      </div>

      <input
        ref={floatingInputRef}
        className="composer-photo-input"
        type="file"
        accept="image/*"
        onChange={(event) => {
          void pickPhoto(
            event.currentTarget.files?.[0],
            'floating',
          )
          event.currentTarget.value = ''
        }}
      />
      <input
        ref={backgroundInputRef}
        className="composer-photo-input"
        type="file"
        accept="image/*"
        onChange={(event) => {
          void pickPhoto(
            event.currentTarget.files?.[0],
            'background',
          )
          event.currentTarget.value = ''
        }}
      />

      {draft.photoElements.length > 0 && (
        <div className="composer-photo-section">
          <span className="composer-tool-label">
            추가한 사진
          </span>
          <div
            className="composer-photo-strip"
            aria-label="추가한 사진 목록"
          >
            {draft.photoElements.map((photo) => (
              <button
                type="button"
                key={photo.id}
                className={[
                  'composer-photo-thumb',
                  selectedPhoto?.id === photo.id
                    ? 'composer-photo-thumb--selected'
                    : '',
                  photo.hasTransparency
                    ? 'composer-photo-thumb--transparent'
                    : '',
                ].filter(Boolean).join(' ')}
                onClick={() =>
                  onPhotoSelect(photo.id)
                }
              >
                <img src={photo.src} alt="" />
                <span>
                  {photo.role === 'background'
                    ? '배경'
                    : photo.hasTransparency
                      ? '누끼'
                      : '사진'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedPhoto ? (
        <div className="composer-photo-editor">
          <div className="composer-photo-editor__heading">
            <strong>
              {selectedPhoto.role === 'background'
                ? '배경 사진 편집'
                : '사진 편집'}
            </strong>
          </div>

          {selectedPhoto.hasTransparency &&
            selectedPhoto.role === 'floating' &&
            (selectedPhoto.frame ?? 'plain') ===
              'plain' && (
              <div className="composer-photo-alpha-note">
                투명 배경을 그대로 유지하고 있어요.
              </div>
            )}

          {selectedPhoto.role === 'floating' && (
            <div className="composer-chip-section">
              <span className="composer-tool-label">
                프레임
              </span>
              <div className="composer-chip-row">
                {([
                  ['plain', '그대로'],
                  ['white', '화이트'],
                  ['polaroid', '폴라로이드'],
                ] as Array<
                  [PhotoFrame, string]
                >).map(([frame, label]) => (
                  <ChoiceChip
                    key={frame}
                    selected={
                      (selectedPhoto.frame ??
                        'white') === frame
                    }
                    onClick={() =>
                      onPhotoUpdate({ frame })
                    }
                  >
                    {label}
                  </ChoiceChip>
                ))}
              </div>
            </div>
          )}

          <LayerActions
            onSendBackward={onPhotoSendBackward}
            onBringForward={onPhotoBringForward}
            onDelete={onPhotoDelete}
            canReorder={selectedPhoto.role === 'floating'}
          />
        </div>
      ) : null}
    </>
  )
}

function LayerActions({
  onSendBackward,
  onBringForward,
  onDelete,
  canReorder = true,
}: {
  onSendBackward: () => void
  onBringForward: () => void
  onDelete: () => void
  canReorder?: boolean
}) {
  return (
    <div className="composer-layer-actions">
      {canReorder && (
        <>
          <span className="composer-tool-label">레이어</span>
          <div className="composer-layer-actions__row">
            <button
              type="button"
              onClick={onSendBackward}
            >
              <ArrowDown size={14} aria-hidden />
              맨 뒤로
            </button>
            <button
              type="button"
              onClick={onBringForward}
            >
              <ArrowUp size={14} aria-hidden />
              맨 앞으로
            </button>
          </div>
        </>
      )}

      <button
        type="button"
        className="composer-layer-actions__delete"
        onClick={onDelete}
      >
        <Trash2 size={15} aria-hidden />
        삭제
      </button>
    </div>
  )
}

function BackgroundRow({
  label,
  backgrounds,
  selectedId,
  onSelect,
}: {
  label: string
  backgrounds: ComposerBackground[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="composer-background-section">
      <span className="composer-tool-label">
        {label}
      </span>
      <div
        className="composer-bg-list"
        role="list"
        aria-label={`${label} 배경`}
      >
        {backgrounds.map((background) => (
          <button
            type="button"
            key={background.id}
            className={[
              'composer-bg-item',
              selectedId === background.id
                ? 'composer-bg-item--selected'
                : '',
            ].filter(Boolean).join(' ')}
            onClick={() =>
              onSelect(background.id)
            }
            aria-pressed={
              selectedId === background.id
            }
          >
            {background.kind === 'image' &&
            background.source ? (
              <span
                className="composer-bg composer-bg--image"
                style={{
                  backgroundColor:
                    background.tone,
                }}
              >
                <img
                  src={background.source}
                  alt=""
                  draggable={false}
                  style={{
                    objectFit:
                      background.fit ??
                      'contain',
                  }}
                />
              </span>
            ) : (
              <span
                className={[
                  'composer-bg',
                  background.className?.replace(
                    'message-canvas',
                    'composer-bg',
                  ),
                ].filter(Boolean).join(' ')}
              />
            )}
            <span>{background.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ToolTrayHeader({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <header className="composer-tool-tray__header">
      <strong>{title}</strong>
      {description && <span>{description}</span>}
    </header>
  )
}

function ToolIconButton({
  label,
  active,
  icon,
  onClick,
}: {
  label: string
  active: boolean
  icon: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      className={[
        'composer-align-button',
        active
          ? 'composer-align-button--active'
          : '',
      ].filter(Boolean).join(' ')}
      onClick={onClick}
    >
      {icon}
    </button>
  )
}

function FutureTool({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="composer-future-tool">
      <span className="composer-future-tool__icon">
        {icon}
      </span>
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
    </div>
  )
}
