/** Equal slices all the way round, like a board-game spinner: each is 2.5 % of the odds. */
export const SLICE_COUNT = 40

/**
 * Hands the slices out in proportion to the odds (every outcome gets at least
 * one), then spreads the smaller outcomes evenly round the wheel so the rare
 * ones stand out like pins on a spinner instead of sitting in one lump.
 */
export function layoutSlices(segments: readonly { weight: number }[], count = SLICE_COUNT): number[] {
  const total = segments.reduce((sum, segment) => sum + segment.weight, 0)
  const counts = segments.map((segment) => Math.max(1, Math.round((segment.weight / total) * count)))
  const biggest = counts.indexOf(Math.max(...counts))
  counts[biggest]! += count - counts.reduce((sum, value) => sum + value, 0)

  const slots: number[] = Array.from({ length: count }, () => -1)
  const order = counts
    .map((value, index) => ({ value, index }))
    .filter((item) => item.index !== biggest)
    .sort((a, b) => b.value - a.value || a.index - b.index)
  order.forEach(({ value, index }, rank) => {
    for (let place = 0; place < value; place += 1) {
      const ideal = Math.floor(((place + 0.5) * count) / value + rank * 3) % count
      let offset = 0
      while (slots[(ideal + offset) % count] !== -1) offset += 1
      slots[(ideal + offset) % count] = index
    }
  })
  return slots.map((slot) => (slot === -1 ? biggest : slot))
}
