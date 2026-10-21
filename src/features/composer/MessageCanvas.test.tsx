import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { CardPage } from '@/types'
import { MessageCanvas } from './MessageCanvas'

const page: CardPage = {
  id: 'page-1',
  backgroundAssetId: 'stationery-plain',
  textElements: [{ id: 'text-1', text: '' }],
  wordArtElements: [],
  stickerElements: [],
  photoElements: [],
}

function renderCanvas(recipientName?: string) {
  return render(
    <MessageCanvas
      draft={page}
      recipientName={recipientName}
      selectedId={null}
      onSelect={vi.fn()}
      onTextDone={vi.fn()}
      onTextChange={vi.fn()}
      onTextMove={vi.fn()}
      onTextResize={vi.fn()}
      onWordArtMove={vi.fn()}
      onStickerChange={vi.fn()}
      onPhotoChange={vi.fn()}
      onOverflowChange={vi.fn()}
    />,
  )
}

describe('message canvas', () => {
  it("names the desk or locker owner in the empty message box", () => {
    renderCanvas('민준')
    expect(screen.getByRole('textbox', { name: '응원 메시지' })).toHaveAttribute(
      'placeholder',
      '민준에게 남기고 싶은 말을 적어보세요',
    )
  })

  it('falls back to "친구" when there is no name', () => {
    renderCanvas('  ')
    expect(screen.getByRole('textbox', { name: '응원 메시지' })).toHaveAttribute(
      'placeholder',
      '친구에게 남기고 싶은 말을 적어보세요',
    )
  })
})
