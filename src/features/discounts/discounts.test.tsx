import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { DISCOUNTS, DISCOUNT_CATEGORIES, type Discount } from './discountData'
import { periodLabel, seoulToday, sourceHost, timingOf, visibleDiscounts } from './discounts'
import { DiscountsPage } from './DiscountsPage'

const make = (patch: Partial<Discount>): Discount => ({
  brand: 'A',
  category: '놀이·체험',
  benefit: '50% 할인',
  start: null,
  end: null,
  conditions: '',
  area: '서울',
  place: '서울',
  sourceUrl: 'https://www.example.com/a',
  sourceDate: '2026-11-16',
  ...patch,
})

describe('discount data', () => {
  it('only lists sourced offers with known categories and valid dates', () => {
    for (const d of DISCOUNTS) {
      expect(d.sourceUrl, d.brand).toMatch(/^https:\/\//)
      expect(DISCOUNT_CATEGORIES, d.brand).toContain(d.category)
      for (const date of [d.start, d.end]) if (date) expect(date, d.brand).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      if (d.start && d.end) expect(d.start <= d.end, d.brand).toBe(true)
    }
  })
})

describe('discount list', () => {
  it('drops ended offers and puts the ones ending soonest first', () => {
    const list = visibleDiscounts(
      [
        make({ brand: '끝남', end: '2026-11-15' }),
        make({ brand: '늦게 끝남', end: '2026-12-31' }),
        make({ brand: '곧 끝남', end: '2026-11-20' }),
        make({ brand: '아직', start: '2026-11-19', end: '2026-11-19' }),
      ],
      '2026-11-16',
      { category: null, area: null },
    )
    expect(list.map((d) => d.brand)).toEqual(['곧 끝남', '늦게 끝남', '아직'])
    expect(timingOf(make({ start: '2026-11-19' }), '2026-11-16')).toBe('soon')
  })

  it('keeps nationwide offers when a region is picked', () => {
    const list = visibleDiscounts(
      [make({ brand: '부산', area: '부산' }), make({ brand: '전국', area: '전국' }), make({ brand: '서울' })],
      '2026-11-16',
      { category: null, area: '서울' },
    )
    expect(list.map((d) => d.brand).sort()).toEqual(['서울', '전국'])
  })

  it('writes periods briefly', () => {
    expect(periodLabel(make({ start: '2026-11-19', end: '2026-12-31' }))).toBe('11/19 ~ 12/31')
    expect(periodLabel(make({ end: '2027-01-31' }))).toBe('~ 2027. 1/31')
    expect(periodLabel(make({ start: '2026-11-21', end: '2026-11-21' }))).toBe('11/21 하루')
    expect(periodLabel(make({}))).toBe('기간은 출처에서 확인')
    expect(sourceHost('https://www.fnnews.com/news/1')).toBe('fnnews.com')
    expect(seoulToday(new Date('2026-11-16T16:00:00Z'))).toBe('2026-11-17')
  })

  it('filters the page by kind and links every offer to its source', () => {
    render(
      <MemoryRouter>
        <DiscountsPage />
      </MemoryRouter>,
    )
    const filters = screen.getByRole('group', { name: '종류' })
    fireEvent.click(within(filters).getByRole('button', { name: '뷰티·미용' }))
    const items = screen.getAllByRole('listitem')
    expect(items.length).toBeGreaterThan(0)
    for (const item of items) {
      expect(within(item).getByText('뷰티·미용')).toBeInTheDocument()
      expect(within(item).getByRole('link')).toHaveAttribute('target', '_blank')
    }
  })
})
