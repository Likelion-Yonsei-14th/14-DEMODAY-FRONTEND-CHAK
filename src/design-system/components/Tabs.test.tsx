import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Tabs, type TabItem } from './Tabs'

const items: TabItem[] = [
  { id: 'background', label: '배경' },
  { id: 'photo', label: '사진' },
]

describe('Tabs', () => {
  it('changes the selected tab', () => {
    const onChange = vi.fn()
    render(<Tabs items={items} value="photo" onChange={onChange} />)

    fireEvent.click(screen.getByRole('tab', { name: '배경' }))

    expect(onChange).toHaveBeenCalledWith('background')
  })

  it('exposes the active tab with aria-selected', () => {
    render(
      <Tabs
        items={items}
        value="background"
        onChange={() => undefined}
      />,
    )

    expect(
      screen.getByRole('tab', { name: '배경' }),
    ).toHaveAttribute('aria-selected', 'true')
    expect(
      screen.getByRole('tab', { name: '사진' }),
    ).toHaveAttribute('aria-selected', 'false')
  })
})
