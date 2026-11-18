import { describe, expect, it } from 'vitest'
import type { Discount } from './discountData'
import { formatKm, withSponsoredFirst } from './sponsored'

const d = (id: number, sponsored = false): Discount => ({
  id,
  sponsored,
  brand: `b${id}`,
  category: '뷰티·미용',
  benefit: 'x',
  start: null,
  end: null,
  conditions: '',
  area: '서울',
  place: '',
  sourceUrl: 'https://example.com',
  sourceDate: '',
})

describe('withSponsoredFirst', () => {
  it('puts sponsored discounts on top in the server order and keeps the rest in place', () => {
    const list = [d(1), d(2, true), d(3), d(4, true), d(5, true)]
    const order = { region: '서울', located: true, items: [{ id: 5, distanceKm: 0.4 }, { id: 2, distanceKm: 3 }, { id: 4, distanceKm: null }] }
    const { items, meta } = withSponsoredFirst(list, order)
    expect(items.map((x) => x.id)).toEqual([5, 2, 4, 1, 3])
    expect(meta.get(5)).toEqual({ distanceKm: 0.4 })
    expect(meta.has(1)).toBe(false)
  })

  it('keeps sponsored on top in their own order until the server order arrives', () => {
    const { items, meta } = withSponsoredFirst([d(1), d(2, true), d(3, true)], null)
    expect(items.map((x) => x.id)).toEqual([2, 3, 1])
    expect(meta.get(2)).toEqual({ distanceKm: null })
  })

  it('treats a sponsored discount the server left out (e.g. ended) as a normal card', () => {
    const { items, meta } = withSponsoredFirst([d(1), d(2, true)], { region: null, located: false, items: [] })
    expect(items.map((x) => x.id)).toEqual([1, 2])
    expect(meta.size).toBe(0)
  })
})

describe('formatKm', () => {
  it('shows meters under 1km and one decimal under 10km', () => {
    expect(formatKm(0.34)).toBe('300m')
    expect(formatKm(0.02)).toBe('100m')
    expect(formatKm(3.26)).toBe('3.3km')
    expect(formatKm(12.4)).toBe('12km')
  })
})
