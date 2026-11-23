import type { RollingPaperKind } from '@/types'
import './RollingPaperPages.css'

const kindOptions = [
  {
    id: 'class',
    title: '우리 반 롤링페이퍼',
    description: '반 친구마다 사물함에 종이를 걸고, 서로의 종이에 한마디씩 남겨요.',
  },
  {
    id: 'personal',
    title: '내 롤링페이퍼',
    description: '내 종이 한 장을 링크로 보내 한마디씩 받아요. 남이 쓴 글은 나만 볼 수 있어요.',
  },
] as const satisfies ReadonlyArray<{ id: RollingPaperKind; title: string; description: string }>

/** Class (everyone hangs a paper) or personal (one paper, sent as a link). */
export function KindPicker({
  value,
  onChange,
}: {
  value: RollingPaperKind
  onChange: (kind: RollingPaperKind) => void
}) {
  return (
    <div className="reveal-mode-picker" role="radiogroup" aria-label="롤링페이퍼 종류">
      {kindOptions.map((option) => (
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
