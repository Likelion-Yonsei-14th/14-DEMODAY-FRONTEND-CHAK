import { useRef, useState } from 'react'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Plus,
  ImagePlus,
  Images,
  Sparkles,
  Trash2,
  Wallpaper,
} from 'lucide-react'
import { ChoiceChip } from '@/design-system'
import type {
  MessageDraft,
  PhotoElement,
  TextElement,
  PhotoFrame,
} from '@/types'
import {
  composerBackgrounds,
  type ComposerBackground,
} from './backgroundAssets'
import type { ComposerTool } from './ComposerDock'
import {
  composerFonts,
  composerTextColors,
  composerTextSizes,
  resolveTextColor,
  resolveTextFontId,
  resolveTextFontSize,
} from './fonts/fontRegistry'

type ComposerToolTrayProps = {
  tool: ComposerTool
  draft: MessageDraft
  selectedText?: TextElement
  selectedPhoto?: PhotoElement
  onBackgroundChange: (backgroundId: string) => void
  onTextAdd: () => void
  onTextFontChange: (fontId: string) => void
  onTextSizeChange: (fontSize: number) => void
  onTextColorChange: (color: string) => void
  onTextAlignChange: (
    align: 'left' | 'center' | 'right',
  ) => void
  onTextDelete: () => void
  onPhotoAdd: (
    file: File,
    role: 'floating' | 'background',
  ) => Promise<void>
  onPhotoSelect: (id: string) => void
  onPhotoUpdate: (
    patch: Partial<PhotoElement>,
  ) => void
  onPhotoDelete: () => void
}

export function ComposerToolTray({
  tool,
  draft,
  selectedText,
  selectedPhoto,
  onBackgroundChange,
  onTextAdd,
  onTextFontChange,
  onTextSizeChange,
  onTextColorChange,
  onTextAlignChange,
  onTextDelete,
  onPhotoAdd,
  onPhotoSelect,
  onPhotoUpdate,
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
          <ToolTrayHeader
            title="배경"
            description="기본 컬러부터 손그림 배경까지 골라보세요."
          />
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
            <ToolTrayHeader
              title="글자"
              description={
                activeText
                  ? '선택한 텍스트 박스의 글씨체와 크기, 색을 조정해보세요.'
                  : '카드의 텍스트를 누르거나 새 텍스트를 추가해보세요.'
              }
            />
            <button
              type="button"
              className="composer-text-add"
              onClick={onTextAdd}
            >
              <Plus size={15} aria-hidden />
              텍스트 추가
            </button>
          </div>

          <div className="composer-text-layer-row">
            {draft.textElements.map((element, index) => (
              <span
                key={element.id}
                className={[
                  'composer-text-layer-chip',
                  activeText?.id === element.id
                    ? 'composer-text-layer-chip--active'
                    : '',
                ].filter(Boolean).join(' ')}
              >
                {element.text.trim()
                  ? element.text.trim().slice(0, 8)
                  : `텍스트 ${index + 1}`}
              </span>
            ))}
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
                <div className="composer-size-heading">
                  <span className="composer-tool-label">크기</span>
                  <span className="composer-size-value">
                    {resolveTextFontSize(activeText)}px
                  </span>
                </div>
                <div className="composer-chip-row">
                  {composerTextSizes.map((size) => (
                    <ChoiceChip
                      key={size.id}
                      selected={
                        resolveTextFontSize(activeText) === size.value
                      }
                      onClick={() =>
                        onTextSizeChange(size.value)
                      }
                    >
                      {size.label}
                    </ChoiceChip>
                  ))}
                </div>
                <div className="composer-font-size-slider">
                  <span aria-hidden>가</span>
                  <input
                    type="range"
                    min="14"
                    max="42"
                    step="1"
                    value={resolveTextFontSize(activeText)}
                    aria-label="글자 크기"
                    aria-valuetext={`${resolveTextFontSize(activeText)}픽셀`}
                    onChange={(event) =>
                      onTextSizeChange(Number(event.target.value))
                    }
                  />
                  <span
                    className="composer-font-size-slider__large"
                    aria-hidden
                  >
                    가
                  </span>
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

                <button
                  type="button"
                  className="composer-text-delete"
                  onClick={onTextDelete}
                >
                  <Trash2 size={15} aria-hidden />
                  텍스트 삭제
                </button>
              </div>

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
        <FutureTool
          icon={
            <Sparkles size={19} aria-hidden />
          }
          title="스티커"
          description="하트, 클로버, 별과 시험 소품 벡터 에셋을 연결할 예정이에요."
        />
      )}

      {tool === 'photo' && (
        <PhotoTool
          draft={draft}
          selectedPhoto={selectedPhoto}
          onPhotoAdd={onPhotoAdd}
          onPhotoSelect={onPhotoSelect}
          onPhotoUpdate={onPhotoUpdate}
          onPhotoDelete={onPhotoDelete}
        />
      )}
    </section>
  )
}

function PhotoTool({
  draft,
  selectedPhoto,
  onPhotoAdd,
  onPhotoSelect,
  onPhotoUpdate,
  onPhotoDelete,
}: {
  draft: MessageDraft
  selectedPhoto?: PhotoElement
  onPhotoAdd: (
    file: File,
    role: 'floating' | 'background',
  ) => Promise<void>
  onPhotoSelect: (id: string) => void
  onPhotoUpdate: (
    patch: Partial<PhotoElement>,
  ) => void
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
      <ToolTrayHeader
        title="사진"
        description="사진을 카드 위에 놓거나, 카드 전체 배경으로 채울 수 있어요."
      />

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
            <span>
              {selectedPhoto.role === 'background'
                ? '사진을 끌어 위치를 바꾸고, 캔버스 오른쪽 아래 핸들을 끌어 확대·축소하세요.'
                : '사진을 끌어 이동하고, 오른쪽 아래 핸들을 끌어 크기와 각도를 조절하세요.'}
            </span>
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

          <button
            type="button"
            className="composer-photo-delete"
            onClick={onPhotoDelete}
          >
            <Trash2 size={15} aria-hidden />
            사진 삭제
          </button>
        </div>
      ) : (
        <div className="composer-photo-empty-hint">
          <ImagePlus size={17} aria-hidden />
          <span>
            사진을 추가하면 캔버스에서 직접 이동하고
            크기를 조절할 수 있어요.
          </span>
        </div>
      )}
    </>
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
  description: string
}) {
  return (
    <header className="composer-tool-tray__header">
      <strong>{title}</strong>
      <span>{description}</span>
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
