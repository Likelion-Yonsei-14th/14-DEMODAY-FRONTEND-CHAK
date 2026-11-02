import { describe, expect, it } from 'vitest'
import { layoutSlices, SLICE_COUNT } from './wheelLayout'

describe('wheel layout', () => {
  it('hands out every slice, in proportion to the odds, and gives each outcome at least one', () => {
    const odds = [85, 6.7, 5.3, 1.7, 1.3].map((weight) => ({ weight }))
    const owners = layoutSlices(odds)
    expect(owners).toHaveLength(SLICE_COUNT)
    const counts = odds.map((_, index) => owners.filter((owner) => owner === index).length)
    expect(counts.reduce((sum, value) => sum + value, 0)).toBe(SLICE_COUNT)
    for (const [index, count] of counts.entries()) {
      expect(count).toBeGreaterThanOrEqual(1)
      // Within one slice (2.5 points) of the true share.
      expect(Math.abs((count / SLICE_COUNT) * 100 - odds[index]!.weight)).toBeLessThanOrEqual(2.6)
    }
  })

  it('spreads the rarer outcomes round the wheel instead of lumping them', () => {
    const owners = layoutSlices([{ weight: 73 }, { weight: 27 }])
    const rare = owners.map((owner, slice) => (owner === 1 ? slice : -1)).filter((slice) => slice >= 0)
    expect(rare.length).toBe(11)
    const gaps = rare.map((slice, index) => (rare[(index + 1) % rare.length]! - slice + SLICE_COUNT) % SLICE_COUNT)
    expect(Math.max(...gaps)).toBeLessThanOrEqual(6)
  })
})
