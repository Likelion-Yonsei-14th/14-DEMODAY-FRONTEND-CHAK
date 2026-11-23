import type { RollingPaperRevealMode } from '@/types'
import { revealModeOptions } from './rollingPaper'
import './RollingPaperPages.css'

/** When each owner gets to read their own paper. */
export function RevealModePicker({
  value,
  onChange,
}: {
  value: RollingPaperRevealMode
  onChange: (mode: RollingPaperRevealMode) => void
}) {
  return (
    <div className="reveal-mode-picker" role="radiogroup" aria-label="내 롤링페이퍼 공개 방식">
      {revealModeOptions.map((option) => (
        <button
          type="button"
          role="radio"
          key={option.id}
          className="reveal-mode-picker__option"
          aria-checked={value === option.id}
          onClick={() => onChange(option.id)}
        >
          <strong>{option.title}</strong>
          <span>{option.description}</span>
        </button>
      ))}
    </div>
  )
}
