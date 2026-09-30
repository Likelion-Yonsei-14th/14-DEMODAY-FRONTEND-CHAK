import { useRef, useState } from 'react'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ImagePlus,
  Images,
  Sparkles,
  Wallpaper,
} from 'lucide-react'
import { ChoiceChip } from '@/design-system'
import type {
  MessageDraft,
  PhotoElement,
  PhotoFrame,
} from '@/types'
import { composerBackgrounds, type ComposerBackground } from './backgroundAssets'
import type { ComposerTool } from './ComposerDock'
import { LayerTransformControls } from './LayerTransformControls'

type ComposerToolTrayProps = {
  tool: ComposerTool
  draft: MessageDraft
  selectedPhoto?: PhotoElement
  onBackgroundChange: (backgroundId: string) => void
  onTextStyleChange: (styleId: string) => void
  onTextAlignChange: (align: 'left' | 'center' | 'right') => void
  onWordArtAdd: (assetId: string) => void
  onPhotoAdd: (
    file: File,
    role: 'floating' | 'background',
  ) => Promise<void>
  onPhotoSelect: (id: string) => void
  onPhotoUpdate: (patch: Partial<PhotoElement>) => void
  onPhotoDelete: () => void
}

export function ComposerToolTray({
  tool,
  draft,
  selectedPhoto,
  onBackgroundChange,
  onTextStyleChange,
  onTextAlignChange,
  onWordArtAdd: _onWordArtAdd,
  onPhotoAdd,
  onPhotoSelect,
  onPhotoUpdate,
  onPhotoDelete,
}: ComposerToolTrayProps) {
  const primaryText = draft.textElements[0]
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

      {tool === 'text' && primaryText && (
        <>
          <ToolTrayHeader
            title="글자"
            description="직접 쓰는 글자는 읽기 편하면서도 살짝 손글씨처럼 보여요."
          />
          <div className="composer-chip-section">
            <span className="composer-tool-label">스타일</span>
            <div className="composer-chip-row">
              <ChoiceChip
                selected={
                  primaryText.styleId === 'handwriting-default'
                }
                onClick={() =>
                  onTextStyleChange('handwriting-default')
                }
              >
                손글씨
              </ChoiceChip>
              <ChoiceChip
                selected={
                  primaryText.styleId === 'handwriting-large'
                }
                onClick={() =>
                  onTextStyleChange('handwriting-large')
                }
              >
                크게
              </ChoiceChip>
              <ChoiceChip
                selected={primaryText.styleId === 'clean'}
                onClick={() => onTextStyleChange('clean')}
              >
                깔끔하게
              </ChoiceChip>
            </div>
          </div>

          <div className="composer-chip-section">
            <span className="composer-tool-label">정렬</span>
            <div className="composer-align-row">
              <ToolIconButton
                label="왼쪽 정렬"
                active={primaryText.align === 'left'}
                onClick={() => onTextAlignChange('left')}
                icon={<AlignLeft size={18} aria-hidden />}
              />
              <ToolIconButton
                label="가운데 정렬"
                active={
                  (primaryText.align ?? 'center') === 'center'
                }
                onClick={() => onTextAlignChange('center')}
                icon={<AlignCenter size={18} aria-hidden />}
              />
              <ToolIconButton
                label="오른쪽 정렬"
                active={primaryText.align === 'right'}
                onClick={() => onTextAlignChange('right')}
                icon={<AlignRight size={18} aria-hidden />}
              />
            </div>
          </div>
        </>
      )}

      {tool === 'phrase' && (
        <FutureTool
          icon={<Sparkles size={19} aria-hidden />}
          title="그래픽 문구"
          description="Figma에서 만든 벡터 에셋을 연결할 예정이에요."
        />
      )}

      {tool === 'sticker' && (
        <FutureTool
          icon={<Sparkles size={19} aria-hidden />}
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
  onPhotoUpdate: (patch: Partial<PhotoElement>) => void
  onPhotoDelete: () => void
}) {
  const floatingInputRef = useRef<HTMLInputElement>(null)
  const backgroundInputRef = useRef<HTMLInputElement>(null)
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
            processing !== null || floatingCount >= 3
          }
          onClick={() => floatingInputRef.current?.click()}
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
          onClick={() => backgroundInputRef.current?.click()}
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
          <span className="composer-tool-label">추가한 사진</span>
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
                ].filter(Boolean).join(' ')}
                onClick={() => onPhotoSelect(photo.id)}
              >
                <img src={photo.src} alt="" />
                <span>
                  {photo.role === 'background'
                    ? '배경'
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
                ? '카드에서 사진을 끌어 보이는 위치를 조정하세요.'
                : '사진 자체를 끌어서 원하는 곳에 놓을 수 있어요.'}
            </span>
          </div>

          {selectedPhoto.role === 'floating' && (
            <div className="composer-chip-section">
              <span className="composer-tool-label">프레임</span>
              <div className="composer-chip-row">
                {([
                  ['plain', '그대로'],
                  ['white', '화이트'],
                  ['polaroid', '폴라로이드'],
                ] as Array<[PhotoFrame, string]>).map(
                  ([frame, label]) => (
                    <ChoiceChip
                      key={frame}
                      selected={
                        (selectedPhoto.frame ?? 'white') === frame
                      }
                      onClick={() => onPhotoUpdate({ frame })}
                    >
                      {label}
                    </ChoiceChip>
                  ),
                )}
              </div>
            </div>
          )}

          <LayerTransformControls
            onScaleDown={() =>
              onPhotoUpdate({
                scale: clamp(
                  (selectedPhoto.scale ?? 1) - .1,
                  selectedPhoto.role === 'background' ? 1 : .55,
                  selectedPhoto.role === 'background' ? 1.65 : 1.45,
                ),
              })
            }
            onScaleUp={() =>
              onPhotoUpdate({
                scale: clamp(
                  (selectedPhoto.scale ?? 1) + .1,
                  selectedPhoto.role === 'background' ? 1 : .55,
                  selectedPhoto.role === 'background' ? 1.65 : 1.45,
                ),
              })
            }
            onRotateLeft={
              selectedPhoto.role === 'floating'
                ? () =>
                    onPhotoUpdate({
                      rotation: clamp(
                        (selectedPhoto.rotation ?? 0) - 5,
                        -18,
                        18,
                      ),
                    })
                : undefined
            }
            onRotateRight={
              selectedPhoto.role === 'floating'
                ? () =>
                    onPhotoUpdate({
                      rotation: clamp(
                        (selectedPhoto.rotation ?? 0) + 5,
                        -18,
                        18,
                      ),
                    })
                : undefined
            }
            onDelete={onPhotoDelete}
          />
        </div>
      ) : (
        <div className="composer-photo-empty-hint">
          <ImagePlus size={17} aria-hidden />
          <span>사진을 추가하면 이곳에서 크기와 프레임을 조정할 수 있어요.</span>
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
      <span className="composer-tool-label">{label}</span>
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
            onClick={() => onSelect(background.id)}
            aria-pressed={selectedId === background.id}
          >
            {background.kind === 'image' &&
            background.source ? (
              <span
                className="composer-bg composer-bg--image"
                style={{
                  backgroundColor: background.tone,
                }}
              >
                <img
                  src={background.source}
                  alt=""
                  draggable={false}
                  style={{
                    objectFit: background.fit ?? 'contain',
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
        active ? 'composer-align-button--active' : '',
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
      <span className="composer-future-tool__icon">{icon}</span>
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
    </div>
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
