import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Tabs, type TabItem } from './Tabs'

const items: TabItem[] = [
  { id: 'background', label: '배경' },
  { id: 'photo', label: '사진', restricted: true },
]

describe('Tabs', () => {
  it('changes to an available tab', () => {
    const onChange = vi.fn()
    render(<Tabs items={items} value="photo" onChange={onChange} />)

    fireEvent.click(screen.getByRole('tab', { name: '배경' }))

    expect(onChange).toHaveBeenCalledWith('background')
  })

  it('keeps restricted items clickable for explanation without selecting them', () => {
    const onChange = vi.fn()
    const onRestricted = vi.fn()
    render(
      <Tabs
        items={items}
        value="background"
        onChange={onChange}
        onRestricted={onRestricted}
      />,
    )

    fireEvent.click(screen.getByRole('tab', { name: '사진' }))

    expect(onChange).not.toHaveBeenCalled()
    expect(onRestricted).toHaveBeenCalledWith(items[1])
  })
})
