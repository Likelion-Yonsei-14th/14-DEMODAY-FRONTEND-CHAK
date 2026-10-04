import { Plus, Trash2 } from 'lucide-react'
import type { CardPage } from '@/types'
import { MAX_CARD_PAGES } from './messagePages'
import './composer.css'

type ComposerPageRailProps = {
  pages: CardPage[]
  activePageId: string
  overflow: boolean
  onSelect: (pageId: string) => void
  onAdd: () => void
  onDelete: () => void
}

export function ComposerPageRail({
  pages,
  activePageId,
  overflow,
  onSelect,
  onAdd,
  onDelete,
}: ComposerPageRailProps) {
  const canAdd = pages.length < MAX_CARD_PAGES

  return (
    <div className="composer-page-control">
      <div
        className="composer-page-rail"
        role="tablist"
        aria-label="카드 페이지"
      >
        {pages.map((page, index) => {
          const active = page.id === activePageId

          return (
            <button
              type="button"
              role="tab"
              key={page.id}
              className={[
                'composer-page-rail__page',
                active
                  ? 'composer-page-rail__page--active'
                  : '',
              ].filter(Boolean).join(' ')}
              aria-selected={active}
              aria-label={`${index + 1}번째 카드`}
              onClick={() => onSelect(page.id)}
            >
              {index + 1}
            </button>
          )
        })}

        {canAdd && (
          <button
            type="button"
            className="composer-page-rail__add"
            aria-label="카드 추가"
            onClick={onAdd}
          >
            <Plus size={15} aria-hidden />
          </button>
        )}

        {pages.length > 1 && (
          <button
            type="button"
            className="composer-page-rail__delete"
            aria-label="현재 카드 삭제"
            onClick={onDelete}
          >
            <Trash2 size={14} aria-hidden />
          </button>
        )}
      </div>

      {overflow && canAdd && (
        <button
          type="button"
          className="composer-page-overflow-action"
          onClick={onAdd}
        >
          새 카드에 이어쓰기
          <Plus size={14} aria-hidden />
        </button>
      )}
    </div>
  )
}
