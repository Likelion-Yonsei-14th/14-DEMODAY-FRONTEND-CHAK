import type { Canonical } from './deskBlastShapes'

export type Cells = readonly (readonly [number, number])[]

/** SVG matrix(a b c d e f): x' = a·x + c·y + e, y' = b·x + d·y + f. */
export type Matrix = readonly [number, number, number, number, number, number]

export type Placement = {
  /** 0 is as drawn; 1-3 turn it a quarter, half and three quarters; 4-7 are the same four after flipping it. */
  turn: number
  matrix: Matrix
  width: number
  height: number
}

/** The eight ways to turn and flip a drawing that is `w` wide and `h` tall. */
function matrices(w: number, h: number): ReadonlyArray<{ matrix: Matrix; width: number; height: number }> {
  return [
    { matrix: [1, 0, 0, 1, 0, 0], width: w, height: h },
    { matrix: [0, 1, -1, 0, h, 0], width: h, height: w },
    { matrix: [-1, 0, 0, -1, w, h], width: w, height: h },
    { matrix: [0, -1, 1, 0, 0, w], width: h, height: w },
    { matrix: [-1, 0, 0, 1, w, 0], width: w, height: h },
    { matrix: [0, -1, -1, 0, h, w], width: h, height: w },
    { matrix: [1, 0, 0, -1, 0, h], width: w, height: h },
    { matrix: [0, 1, 1, 0, 0, 0], width: h, height: w },
  ]
}

const key = (r: number, c: number) => `${r},${c}`

/** Moves a set of cells so its top left is at 0,0. */
export function normalize(cells: Cells): { cells: Array<[number, number]>; height: number; width: number } {
  const top = Math.min(...cells.map(([r]) => r))
  const left = Math.min(...cells.map(([, c]) => c))
  const moved = cells.map(([r, c]) => [r - top, c - left] as [number, number])
  return {
    cells: moved,
    height: Math.max(...moved.map(([r]) => r)) + 1,
    width: Math.max(...moved.map(([, c]) => c)) + 1,
  }
}

/**
 * How to turn and flip an object drawn upright so it covers exactly `actual`
 * (a block in any of its orientations). Prefers the drawing as it is, then
 * turns, then flips. Returns null when no way fits, which means the block and
 * the object do not belong together.
 */
export function findTransform(canonical: Canonical, actual: Cells): Placement | null {
  const target = normalize(actual)
  const wanted = new Set(target.cells.map(([r, c]) => key(r, c)))
  const options = matrices(canonical.width, canonical.height)

  for (let turn = 0; turn < options.length; turn += 1) {
    const { matrix, width, height } = options[turn]!
    if (width !== target.width || height !== target.height) continue
    const [a, b, c, d, e, f] = matrix
    const moved = new Set<string>()
    for (const [row, col] of canonical.cells) {
      const cx = col + 0.5
      const cy = row + 0.5
      const x = a * cx + c * cy + e
      const y = b * cx + d * cy + f
      moved.add(key(Math.floor(y), Math.floor(x)))
    }
    if (moved.size === wanted.size && [...moved].every((cell) => wanted.has(cell))) {
      return { turn, matrix, width, height }
    }
  }
  return null
}
