import { AlignCenter, AlignLeft, AlignRight, ImagePlus, Sparkles } from 'lucide-react'
import { ChoiceChip } from '@/design-system'
import type { MessageDraft } from '@/types'
import { composerBackgrounds, type ComposerBackground } from './backgroundAssets'
import type { ComposerTool } from './ComposerDock'

type ComposerToolTrayProps = {
  tool: ComposerTool
  draft: MessageDraft
  onBackgroundChange: (backgroundId: string) => void
  onTextStyleChange: (styleId: string) => void
  onTextAlignChange: (align: 'left' | 'center' | 'right') => void
}

export function ComposerToolTray({
  tool,
  draft,
  onBackgroundChange,
  onTextStyleChange,
  onTextAlignChange,
}: ComposerToolTrayProps) {
  const primaryText = draft.textElements[0]
  const basicBackgrounds = composerBackgrounds.filter((background) => background.group === 'basic')
  const graphicBackgrounds = composerBackgrounds.filter((background) => background.group === 'graphic')

  return (
    <section className="composer-tool-tray" aria-label="꾸미기 옵션">
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
          <ToolTrayHeader title="글자" description="직접 쓰는 글자는 읽기 편하면서도 살짝 손글씨처럼 보여요." />
          <div className="composer-chip-section">
            <span className="composer-tool-label">스타일</span>
            <div className="composer-chip-row">
              <ChoiceChip
                selected={primaryText.styleId === 'handwriting-default'}
                onClick={() => onTextStyleChange('handwriting-default')}
              >
                손글씨
              </ChoiceChip>
              <ChoiceChip
                selected={primaryText.styleId === 'handwriting-large'}
                onClick={() => onTextStyleChange('handwriting-large')}
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
                active={(primaryText.align ?? 'center') === 'center'}
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
          description="‘잘될거야’, ‘기죽지마라’ 같은 손그림 Word Art 에셋을 이 영역에 연결합니다."
        />
      )}

      {tool === 'sticker' && (
        <FutureTool
          icon={<Sparkles size={19} aria-hidden />}
          title="스티커"
          description="하트, 클로버, 별, 숫자 1–5와 시험 소품 에셋을 이 영역에서 고르게 됩니다."
        />
      )}

      {tool === 'photo' && (
        <FutureTool
          icon={<ImagePlus size={19} aria-hidden />}
          title="사진"
          description="앨범 사진을 카드 배경으로 쓰거나, 카드 위에 사진 한 장을 놓는 기능을 연결합니다."
        />
      )}
    </section>
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
      <div className="composer-bg-list" role="list" aria-label={`${label} 배경`}>
        {backgrounds.map((background) => (
          <button
            type="button"
            key={background.id}
            className={[
              'composer-bg-item',
              selectedId === background.id ? 'composer-bg-item--selected' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => onSelect(background.id)}
            aria-pressed={selectedId === background.id}
          >
            {background.kind === 'image' && background.source ? (
              <span
                className="composer-bg composer-bg--image"
                style={{ backgroundColor: background.tone }}
              >
                <img
                  src={background.source}
                  alt=""
                  draggable={false}
                  style={{ objectFit: background.fit ?? 'contain' }}
                />
              </span>
            ) : (
              <span className={['composer-bg', background.className?.replace('message-canvas', 'composer-bg')].filter(Boolean).join(' ')} />
            )}
            <span>{background.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ToolTrayHeader({ title, description }: { title: string; description: string }) {
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
