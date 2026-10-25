import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { CardPage } from '@/types'
import { ComposerPageRail } from './ComposerPageRail'

const pages = [{ id: 'page-1' }, { id: 'page-2' }] as CardPage[]

function renderRail() {
  const handlers = { onSelect: vi.fn(), onAdd: vi.fn(), onDelete: vi.fn() }
  render(
    <ComposerPageRail
      pages={pages}
      activePageId="page-1"
      overflow={false}
      {...handlers}
    />,
  )
  return handlers
}

describe('ComposerPageRail', () => {
  it('keeps only page tabs inside the tablist', () => {
    renderRail()

    const tablist = screen.getByRole('tablist', { name: '카드 페이지' })
    expect(within(tablist).getAllByRole('tab')).toHaveLength(2)
    expect(within(tablist).queryByRole('button')).toBeNull()
    expect(screen.getByRole('button', { name: '카드 추가' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '현재 카드 삭제' })).toBeInTheDocument()
  })

  it('still selects, adds and deletes pages', () => {
    const { onSelect, onAdd, onDelete } = renderRail()

    fireEvent.click(screen.getByRole('tab', { name: '2번째 카드' }))
    fireEvent.click(screen.getByRole('button', { name: '카드 추가' }))
    fireEvent.click(screen.getByRole('button', { name: '현재 카드 삭제' }))

    expect(onSelect).toHaveBeenCalledWith('page-2')
    expect(onAdd).toHaveBeenCalled()
    expect(onDelete).toHaveBeenCalled()
  })
})
