import {
  Image as ImageIcon,
  Palette,
  Sticker,
  Type,
  WandSparkles,
} from 'lucide-react'

export type ComposerTool = 'background' | 'text' | 'phrase' | 'sticker' | 'photo'

const tools: Array<{
  id: ComposerTool
  label: string
  icon: React.ReactNode
}> = [
  { id: 'background', label: '배경', icon: <Palette size={19} aria-hidden /> },
  { id: 'text', label: '글자', icon: <Type size={19} aria-hidden /> },
  { id: 'phrase', label: '문구', icon: <WandSparkles size={19} aria-hidden /> },
  { id: 'sticker', label: '스티커', icon: <Sticker size={19} aria-hidden /> },
  { id: 'photo', label: '사진', icon: <ImageIcon size={19} aria-hidden /> },
]

type ComposerDockProps = {
  value: ComposerTool
  onChange: (tool: ComposerTool) => void
}

export function ComposerDock({ value, onChange }: ComposerDockProps) {
  return (
    <nav className="composer-dock" aria-label="카드 꾸미기 도구">
      {tools.map((tool) => {
        const active = value === tool.id
        return (
          <button
            key={tool.id}
            type="button"
            className={[
              'composer-dock__item',
              active ? 'composer-dock__item--active' : '',
            ].filter(Boolean).join(' ')}
            aria-pressed={active}
            onClick={() => onChange(tool.id)}
          >
            <span className="composer-dock__icon">{tool.icon}</span>
            <span>{tool.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
