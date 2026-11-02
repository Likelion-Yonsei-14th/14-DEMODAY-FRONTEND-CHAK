/**
 * Deals the three pieces. The rule that makes it feel right: **every hand can be
 * fully placed**, in some order and somewhere on the desk, counting the lines
 * that clear along the way. On an open desk it hands out anything; as the desk
 * fills up it starts choosing hands that clear lines, and late in the game it
 * prefers hands with only a few ways to place all three, so the player has to
 * use them well, without ever being dealt something that cannot be done.
 *
 * Works on bit rows (one byte per row) instead of the board, so checking
 * thousands of placements is cheap.
 */
import { BOARD_SIZE, HAND_SIZE, pieceFrom, SHAPE_DEFS, type Board, type Piece, type Rng, type ShapeDef } from './deskBlastShapes'

const FULL_ROW = (1 << BOARD_SIZE) - 1

type Rows = readonly number[]

type Masked = { def: ShapeDef; masks: ReadonlyArray<readonly number[]> }

/** For each shape, its rows as bit masks at every column it can start in. */
const MASKED: readonly Masked[] = SHAPE_DEFS.map((def) => {
  const masks: number[][] = []
  for (let col = 0; col + def.width <= BOARD_SIZE; col += 1) {
    const rows = Array<number>(def.height).fill(0)
    for (const [r, c] of def.shape) rows[r]! |= 1 << (c + col)
    masks.push(rows)
  }
  return { def, masks }
})

const MASKED_BY_DEF = new Map<ShapeDef, Masked>(MASKED.map((item) => [item.def, item]))

export function toRows(board: Board): number[] {
  return board.map((line) => line.reduce<number>((bits, cell, col) => (cell !== 0 ? bits | (1 << col) : bits), 0))
}

const popcount = (value: number) => {
  let count = 0
  for (let bits = value; bits; bits &= bits - 1) count += 1
  return count
}

export const fillRatio = (rows: Rows) => rows.reduce((sum, row) => sum + popcount(row), 0) / (BOARD_SIZE * BOARD_SIZE)

function fits(rows: Rows, item: Masked, row: number, col: number) {
  const masks = item.masks[col]!
  for (let index = 0; index < masks.length; index += 1) {
    if ((rows[row + index]! & masks[index]!) !== 0) return false
  }
  return true
}

/** The desk after the piece goes down, with every full row and column cleared. */
function drop(rows: Rows, item: Masked, row: number, col: number): { rows: number[]; lines: number } {
  const next = rows.slice()
  const masks = item.masks[col]!
  for (let index = 0; index < masks.length; index += 1) next[row + index]! |= masks[index]!

  let colsFull = FULL_ROW
  for (const bits of next) colsFull &= bits
  let lines = popcount(colsFull)
  for (let r = 0; r < BOARD_SIZE; r += 1) {
    if (next[r] === FULL_ROW) {
      lines += 1
      next[r] = 0
    } else {
      next[r]! &= ~colsFull
    }
  }
  return { rows: next, lines }
}

type Search = { nodes: number; budget: number; found: number; cap: number }

/**
 * Counts the ways to place all of `left`, one after another in any order, up to
 * `search.cap`. Stops early once the budget of positions looked at is spent.
 */
function countWays(rows: Rows, left: readonly Masked[], search: Search): void {
  if (left.length === 0) {
    search.found += 1
    return
  }
  for (let pick = 0; pick < left.length; pick += 1) {
    const item = left[pick]!
    // Two equal pieces in one hand would count every way twice.
    if (left.findIndex((other) => other.def === item.def) !== pick) continue
    const rest = left.filter((_, index) => index !== pick)
    for (let row = 0; row + item.def.height <= BOARD_SIZE; row += 1) {
      for (let col = 0; col < item.masks.length; col += 1) {
        if (search.found >= search.cap || search.nodes >= search.budget) return
        if (!fits(rows, item, row, col)) continue
        search.nodes += 1
        countWays(drop(rows, item, row, col).rows, rest, search)
      }
    }
  }
}

export type HandInfo = {
  /** Every piece can be placed, in some order. */
  solvable: boolean
  /** How many ways there are (capped), a measure of how tight the hand is. */
  ways: number
  /** Some piece finishes a line right now. */
  clearsNow: boolean
}

export function analyzeHand(rows: Rows, defs: readonly ShapeDef[], budget = 6000, cap = 60): HandInfo {
  const items = defs.map((def) => MASKED_BY_DEF.get(def)!)
  const search: Search = { nodes: 0, budget, found: 0, cap }
  countWays(rows, items, search)

  let clearsNow = false
  outer: for (const item of items) {
    for (let row = 0; row + item.def.height <= BOARD_SIZE; row += 1) {
      for (let col = 0; col < item.masks.length; col += 1) {
        if (fits(rows, item, row, col) && drop(rows, item, row, col).lines > 0) {
          clearsNow = true
          break outer
        }
      }
    }
  }
  return { solvable: search.found > 0, ways: search.found, clearsNow }
}

/** Is there some way to place all of these pieces? Stops at the first one found. */
export function isHandSolvable(board: Board, defs: readonly ShapeDef[]): boolean {
  return analyzeHand(toRows(board), defs, 40_000, 1).solvable
}

const TOTAL_ATTEMPTS_OPEN = 6
const TOTAL_ATTEMPTS_CROWDED = 40

function sampleDef(rng: Rng, fill: number): ShapeDef {
  // The fuller the desk, the more small pieces come up, so there is something to work with.
  const weight = (def: ShapeDef) => def.weight * (def.shape.length <= 3 ? 1 + fill * 2 : 1)
  const total = SHAPE_DEFS.reduce((sum, def) => sum + weight(def), 0)
  let roll = rng() * total
  for (const def of SHAPE_DEFS) {
    roll -= weight(def)
    if (roll < 0) return def
  }
  return SHAPE_DEFS[SHAPE_DEFS.length - 1]!
}

/** When random hands keep failing on a crowded desk, look through the small ones in order. */
function smallestSolvable(rows: Rows): ShapeDef[] | null {
  const bySize = [...SHAPE_DEFS].sort((a, b) => a.shape.length - b.shape.length)
  let tried = 0
  for (let a = 0; a < bySize.length; a += 1) {
    for (let b = a; b < bySize.length; b += 1) {
      for (let c = b; c < bySize.length; c += 1) {
        tried += 1
        if (tried > 4000) return null
        const hand = [bySize[a]!, bySize[b]!, bySize[c]!]
        if (analyzeHand(rows, hand, 4000, 1).solvable) return hand
      }
    }
  }
  return null
}

type Candidate = { defs: ShapeDef[]; info: HandInfo }

/** Picks which of the solvable hands to give, by how full the desk is. */
function choose(candidates: readonly Candidate[], fill: number, rng: Rng): Candidate {
  const pickFrom = <T,>(list: readonly T[]) => list[Math.floor(rng() * list.length)]!

  if (fill < 0.3) {
    const clearing = candidates.filter((candidate) => candidate.info.clearsNow)
    return clearing.length > 0 && rng() < 0.5 ? pickFrom(clearing) : pickFrom(candidates)
  }
  if (fill < 0.55) {
    const clearing = candidates.filter((candidate) => candidate.info.clearsNow)
    return clearing.length > 0 && rng() < 0.8 ? pickFrom(clearing) : pickFrom(candidates)
  }
  // Late game: the tightest hands first, but not always the very tightest.
  const tight = [...candidates].sort((a, b) => a.info.ways - b.info.ways)
  const pool = tight.slice(0, Math.min(3, tight.length))
  const clearing = pool.filter((candidate) => candidate.info.clearsNow)
  return clearing.length > 0 && rng() < 0.5 ? pickFrom(clearing) : pool[Math.floor(rng() * rng() * pool.length)]!
}

export function dealHand(board: Board, rng: Rng, firstId: number): Piece[] {
  const rows = toRows(board)
  const fill = fillRatio(rows)
  const attempts = fill < 0.3 ? TOTAL_ATTEMPTS_OPEN : TOTAL_ATTEMPTS_CROWDED

  const candidates: Candidate[] = []
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const defs = Array.from({ length: HAND_SIZE }, () => sampleDef(rng, fill))
    const info = analyzeHand(rows, defs)
    if (info.solvable) candidates.push({ defs, info })
  }

  let defs: ShapeDef[]
  if (candidates.length > 0) {
    defs = choose(candidates, fill, rng).defs
  } else {
    defs = smallestSolvable(rows) ?? Array.from({ length: HAND_SIZE }, () => sampleDef(rng, fill))
  }
  return defs.map((def, index) => pieceFrom(def, firstId + index))
}
