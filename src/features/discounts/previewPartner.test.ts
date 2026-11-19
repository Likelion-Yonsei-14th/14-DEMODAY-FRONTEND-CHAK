import { describe, expect, it } from 'vitest'
import type { Discount } from './discountData'
import { PREVIEW_PARTNER_ID, withPreviewPartner } from './previewPartner'

const base = { category: '교육', start: null, end: null, conditions: '', area: '전국', place: '', sourceUrl: '', sourceDate: '' } as const
const plain: Discount = { ...base, id: 1, brand: '일반', benefit: '무료' }
const partner: Discount = { ...base, id: 2, brand: '제휴', benefit: '50%', sponsored: true, image: 'https://x/creatives/1' }
const otherPartner: Discount = { ...base, id: 3, brand: '다른 매장', benefit: '10%', sponsored: true, image: 'https://x/creatives/2' }

describe('withPreviewPartner', () => {
  it('moves the partner discount that uses the same banner to the top and hides other partners', () => {
    const { items, meta, previewId } = withPreviewPartner([otherPartner, plain, partner], new Map(), {
      title: '제휴',
      creativeUrl: 'https://x/creatives/1',
      destinationUrl: 'https://x',
    })
    expect(items.map((d) => d.id)).toEqual([2, 1])
    expect(previewId).toBe(2)
    expect(meta.has(2)).toBe(true)
  })

  it('adds a placeholder partner card without other partners when no discount uses the banner yet', () => {
    const { items, previewId } = withPreviewPartner([plain, partner, otherPartner], new Map(), {
      title: '새 광고',
      creativeUrl: 'https://x/creatives/9',
      destinationUrl: 'https://x',
    })
    expect(items[0]).toMatchObject({ id: PREVIEW_PARTNER_ID, brand: '새 광고', image: 'https://x/creatives/9', sponsored: true })
    expect(items.map((d) => d.id)).toEqual([PREVIEW_PARTNER_ID, 1])
    expect(previewId).toBe(PREVIEW_PARTNER_ID)
  })

  it('leaves the list alone without an image', () => {
    const { items, previewId } = withPreviewPartner([plain], new Map(), { title: '', creativeUrl: '', destinationUrl: '' })
    expect(items).toEqual([plain])
    expect(previewId).toBeNull()
  })
})
