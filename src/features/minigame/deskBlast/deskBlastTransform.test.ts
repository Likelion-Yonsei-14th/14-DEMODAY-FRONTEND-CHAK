import { describe, expect, it } from 'vitest'
import { findTransform, normalize } from './deskBlastTransform'
import { CANONICAL, ITEMS, SHAPE_DEFS, itemOf } from './deskBlastShapes'

const key = (r: number, c: number) => `${r},${c}`

/** Where the cells of the upright drawing land after the placement's matrix, as a set. */
function moved(kind: number, matrix: readonly number[]) {
  const [a, b, c, d, e, f] = matrix as [number, number, number, number, number, number]
  const set = new Set<string>()
  for (const [row, col] of CANONICAL[kind]!.cells) {
    const x = col + 0.5
    const y = row + 0.5
    set.add(key(Math.floor(b * x + d * y + f), Math.floor(a * x + c * y + e)))
  }
  return set
}

describe('turning an object to fit a block', () => {
  it('finds a way for every block of the game, so every block gets its object', () => {
    for (const def of SHAPE_DEFS) {
      const placement = findTransform(CANONICAL[def.kind]!, def.shape)

      expect(placement, `${itemOf(def.kind).id} ${def.rows.join('/')}`).not.toBeNull()
    }
  })

  it('covers exactly the cells of the block after the turn', () => {
    for (const def of SHAPE_DEFS) {
      const placement = findTransform(CANONICAL[def.kind]!, def.shape)!
      const want = new Set(def.shape.map(([r, c]) => key(r, c)))
      const got = moved(def.kind, placement.matrix)

      expect([...got].sort(), `${itemOf(def.kind).id} ${def.rows.join('/')}`).toEqual([...want].sort())
      expect(placement.width).toBe(def.width)
      expect(placement.height).toBe(def.height)
    }
  })

  it('draws an object upright when the block already is upright', () => {
    for (const kind of [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13]) {
      const upright = CANONICAL[kind]!
      const placement = findTransform(upright, upright.cells)!

      expect(placement.turn).toBe(0)
      expect(placement.matrix).toEqual([1, 0, 0, 1, 0, 0])
    }
  })

  it('stands a bar up with a quarter turn', () => {
    const placement = findTransform(CANONICAL[4]!, [[0, 0], [1, 0], [2, 0], [3, 0]])!

    expect(placement.turn).toBe(1)
    expect(placement.width).toBe(1)
    expect(placement.height).toBe(4)
  })

  it('flips instead of turning when only a flip fits', () => {
    // The zigzag drawn one way and the block the other way.
    const placement = findTransform(CANONICAL[12]!, [[0, 0], [0, 1], [1, 1], [1, 2]])!

    expect(placement.turn).toBeGreaterThanOrEqual(4)
  })

  it('says so when the object does not belong to the block', () => {
    expect(findTransform(CANONICAL[4]!, [[0, 0], [0, 1], [0, 2]])).toBeNull()
    expect(findTransform(CANONICAL[6]!, [[0, 0], [0, 1], [1, 0]])).toBeNull()
  })

  it('does not care where on the desk the block is', () => {
    const away = findTransform(CANONICAL[10]!, [[3, 4], [3, 5], [3, 6], [4, 4], [5, 4]])!

    expect(away.turn).toBe(0)
  })

  it('moves a set of cells to the corner and measures it', () => {
    expect(normalize([[2, 3], [2, 4], [3, 3]])).toEqual({ cells: [[0, 0], [0, 1], [1, 0]], height: 2, width: 2 })
  })

  it('has a drawing for every item, and every drawing is a connected shape', () => {
    expect(Object.keys(CANONICAL)).toHaveLength(ITEMS.length)
    for (const item of ITEMS) {
      const cells = CANONICAL[item.kind]!.cells
      const seen = new Set<string>([key(...(cells[0] as [number, number]))])
      const queue = [cells[0]!]
      while (queue.length) {
        const [r, c] = queue.pop()!
        for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]] as const) {
          if (cells.some(([cr, cc]) => cr === nr && cc === nc) && !seen.has(key(nr, nc))) {
            seen.add(key(nr, nc))
            queue.push([nr, nc])
          }
        }
      }

      expect(seen.size, item.id).toBe(cells.length)
    }
  })
})
