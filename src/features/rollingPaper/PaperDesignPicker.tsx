import { paperDesignSurface } from './paperDesignSurface'
import { paperDesigns } from './rollingPaper'
import '@/features/composer/cardRenderShared.css'
import './RollingPaperPages.css'

const groups = [
  { id: 'stationery', label: '편지지' },
  { id: 'basic', label: '기본' },
] as const

/** The same letter papers as the letter composer: every 편지지 template is open here, plus plain colours. */
export function PaperDesignPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (designId: string) => void
}) {
  return (
    <div className="paper-design-picker">
      {groups.map((group) => (
        <div key={group.id} className="paper-design-picker__group">
          <span className="paper-design-picker__label">{group.label}</span>
          <div
            className="paper-design-picker__list"
            role="list"
            aria-label={`${group.label} 디자인`}
          >
            {paperDesigns
              .filter((design) => design.group === group.id)
              .map((design) => {
                const surface = paperDesignSurface(design.id)
                return (
                  <button
                    type="button"
                    role="listitem"
                    key={design.id}
                    className={[
                      'paper-design-picker__item',
                      surface.className,
                    ].filter(Boolean).join(' ')}
                    style={surface.style}
                    aria-label={design.name}
                    aria-pressed={value === design.id}
                    onClick={() => onChange(design.id)}
                  />
                )
              })}
          </div>
        </div>
      ))}
    </div>
  )
}
