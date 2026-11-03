/**
 * Deals the three pieces. The rule that makes it feel right: **every hand can be
 * fully placed**, in some order and somewhere on the desk, counting the lines
 * that clear along the way. On an open desk it hands out anything; as the desk
 * fills up it starts choosing hands that clear lines, and late in the game it
 * prefers hands with only a few ways to place all three, so the player has to
 * use them well, without ever being dealt something that cannot be done.
 *
 * On top of that, now and then it deals a **reward hand**: it plays the three
 * pieces out on the current desk, looking for the way that clears the most
 * lines at once and, when the desk is small enough, wipes it clean. How often
 * that happens rises as the desk fills and as the player goes without a big
 * clear, and falls as the score climbs, so the game builds up, pays off in a
 * sweep, and gets harder.
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
  // An open desk gets big pieces, which fill it up and make the game tense; a crowded one gets small pieces to work with.
  // Bars and rectangles pack into whole lines; zigzags and T-shapes leave holes, so they come less while the desk has room.
  const packs = (def: ShapeDef) => (def.kind <= 8 ? 1.5 : def.kind >= 12 && fill < 0.5 ? 0.5 : 1)
  const weight = (def: ShapeDef) =>
    def.weight * packs(def) * (fill < 0.35 ? 1 + def.shape.length * 0.45 : def.shape.length <= 3 ? 1 + fill * 2 : 1)
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

/** What the engine tells the dealer about how the game has gone. */
export type DealContext = {
  /** Hands dealt since the last big clear (three lines at once, or an empty desk). */
  dryHands?: number
  score?: number
}

type Play = { picks: ShapeDef[]; lines: number; allClear: boolean; fill: number; value: number }

const REWARD_BEAM = 14
/** The reward search tries this many small handfuls of shapes; a beam over all of them at once fills up with look-alikes. */
const REWARD_POOLS = 4
const SWEEP_POOLS = 8
const REWARD_POOL_SIZE = 7

type Step = { rows: number[]; picks: ShapeDef[]; lines: number; sq: number }

const popcountRows = (rows: Rows) => rows.reduce((sum, row) => sum + popcount(row), 0)

/**
 * How close the lines of a desk are to being full: squares of how many cells each
 * row and column holds. Many nearly full lines score high, so it rewards stacking
 * the pieces so that a few more will clear a lot, instead of scattering them.
 */
export function linePotential(rows: Rows): number {
  let total = 0
  for (const bits of rows) {
    const count = popcount(bits)
    total += count * count
  }
  for (let col = 0; col < BOARD_SIZE; col += 1) {
    let count = 0
    for (const bits of rows) if (bits & (1 << col)) count += 1
    total += count * count
  }
  return total
}

/**
 * Plays three pieces out on `rows`, trying many shapes and places and keeping
 * the most promising partial plays at each step (a beam search that ranks them
 * by how close they leave the lines to full), and returns the finished plays
 * that clear the most. Each play is a real solution, so its hand can always be
 * placed. A play that clears several lines with one piece is worth more than
 * the same lines spread over three, and one that leaves the desk empty is worth
 * the most.
 */
export function bestPlays(rows: Rows, pool: readonly ShapeDef[], rng: Rng, beam = REWARD_BEAM): Array<{ picks: ShapeDef[]; lines: number; allClear: boolean; fill: number; value: number }> {
  let level: Step[] = [{ rows: rows.slice(), picks: [], lines: 0, sq: 0 }]
  for (let step = 0; step < HAND_SIZE; step += 1) {
    const last = step === HAND_SIZE - 1
    const next: Array<Step & { value: number }> = []
    for (const node of level) {
      for (const def of pool) {
        const item = MASKED_BY_DEF.get(def)!
        for (let row = 0; row + def.height <= BOARD_SIZE; row += 1) {
          for (let col = 0; col < item.masks.length; col += 1) {
            if (!fits(node.rows, item, row, col)) continue
            const dropped = drop(node.rows, item, row, col)
            const lines = node.lines + dropped.lines
            // What clearing pays: lines at once count squared, as the score does.
            const sq = node.sq + dropped.lines * dropped.lines
            const empty = dropped.lines > 0 && dropped.rows.every((bits) => bits === 0)
            // Along the way, favor desks whose lines are nearly full; at the end, favor what actually cleared.
            const value = last
              ? sq * 60 + (empty ? 2500 : 0) - popcountRows(dropped.rows) * 3 + rng() * 25
              : sq * 300 + linePotential(dropped.rows) + rng() * 8
            next.push({ rows: dropped.rows, picks: [...node.picks, def], lines, sq, value })
          }
        }
      }
    }
    if (next.length === 0) return []
    next.sort((a, b) => b.value - a.value)
    // The same desk reached by a different order of pieces is the same desk: keep one, so the beam is not full of copies.
    const seen = new Set<string>()
    const unique = next.filter((node) => {
      const key = node.rows.join(',')
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    level = last ? unique.slice(0, 6) : unique.slice(0, beam)
    if (last) {
      return (level as Array<Step & { value: number }>).map((node) => ({
        picks: node.picks,
        lines: node.lines,
        allClear: node.lines > 0 && node.rows.every((bits) => bits === 0),
        fill: fillRatio(node.rows),
        value: node.value,
      }))
    }
  }
  return []
}

/** Every play found by a few searches, each over its own small handful of shapes, best first. */
export function searchPlays(rows: Rows, rng: Rng, pools = REWARD_POOLS): Play[] {
  const found: Play[] = []
  for (let attempt = 0; attempt < pools; attempt += 1) {
    const pool = [...SHAPE_DEFS].sort(() => rng() - 0.5).slice(0, REWARD_POOL_SIZE)
    found.push(...bestPlays(rows, pool, rng))
  }
  return found.sort((a, b) => b.value - a.value)
}

/** 1 at the start, falling to 0.3 by 25,000 points: the game gets harder as it goes on. */
export const easeAt = (score: number) => 1 - 0.7 * Math.min(Math.max(score, 0) / 25_000, 1)

/** How likely a reward hand is, from the desk, the dry spell and how far the game has gone. */
export function rewardChance(fill: number, dryHands: number, score: number): number {
  const dry = Math.min(dryHands, 4)
  const base = fill >= 0.62 ? 0.9 : fill >= 0.45 ? 0.6 : fill >= 0.2 ? 0.16 + 0.12 * dry : 0.08 + 0.06 * dry
  // The further the game goes, the less often it is handed out: the game gets harder.
  const ease = easeAt(score)
  return Math.min(0.92, base * ease)
}

/** How likely the sweep (a hand that wipes the desk) is dealt, when one exists. */
export function wipeChance(dryHands: number, score: number): number {
  const ease = easeAt(score)
  return Math.min(0.92, (0.55 + 0.12 * Math.min(dryHands, 4)) * ease)
}


const asHand = (play: Play, rng: Rng) => [...play.picks].sort(() => rng() - 0.5)

export function dealHand(board: Board, rng: Rng, firstId: number, context: DealContext = {}): Piece[] {
  const rows = toRows(board)
  const fill = fillRatio(rows)
  const dry = context.dryHands ?? 0
  const score = context.score ?? 0
  const wantsReward = rng() < rewardChance(fill, dry, score)

  // Only worth the search when something can be cleared: a desk small enough to wipe, or a reward is due.
  if (fill <= 0.5 || wantsReward) {
    // A sparse desk is the one that can be wiped, so it gets the longer search.
    const plays = searchPlays(rows, rng, fill < 0.2 ? SWEEP_POOLS : REWARD_POOLS)
    // The sweep: a hand that leaves the desk empty is taken, most of the time, whenever one exists.
    const sweeps = plays.filter((play) => play.allClear)
    if (sweeps.length > 0 && rng() < wipeChance(dry, score)) {
      return asHand(sweeps[Math.floor(rng() * sweeps.length)]!, rng).map((def, index) => pieceFrom(def, firstId + index))
    }
    // A reward: the best few ways to clear lines.
    const worthIt = plays.filter((play) => play.lines >= (fill >= 0.45 ? 1 : 2))
    if (wantsReward && worthIt.length > 0) {
      const pick = worthIt.slice(0, 4)[Math.floor(rng() * Math.min(4, worthIt.length))]!
      return asHand(pick, rng).map((def, index) => pieceFrom(def, firstId + index))
    }
  }
  return dealOrdinaryHand(rows, fill, rng, firstId)
}

/** The hands that are not a reward: anything on an open desk, tighter ones as it fills. */
function dealOrdinaryHand(rows: Rows, fill: number, rng: Rng, firstId: number): Piece[] {
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
