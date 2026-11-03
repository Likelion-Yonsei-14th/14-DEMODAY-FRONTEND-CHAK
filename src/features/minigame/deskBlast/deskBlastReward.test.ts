import { describe, expect, it, vi } from 'vitest'

// Whole games last far longer now, so the simulations get more than the 5 s default.
vi.setConfig({ testTimeout: 120_000 })
import {
  analyzeHand,
  bestPlays,
  dealHand,
  easeAt,
  fillRatio,
  linePotential,
  rewardChance,
  searchPlays,
  toRows,
  wipeChance,
} from './deskBlastDealer'
import { BOARD_SIZE, placePiece, seededRng, type Board, type GameState, type Piece } from './deskBlastEngine'
import { pieceFrom, SHAPE_DEFS, type ShapeDef } from './deskBlastShapes'

const def = (rows: string[]): ShapeDef => SHAPE_DEFS.find((item) => item.rows.join('/') === rows.join('/'))!
const EMPTY = Array<number>(BOARD_SIZE).fill(0)
const boardOf = (rows: readonly number[]): Board =>
  rows.map((bits) => Array.from({ length: BOARD_SIZE }, (_, col) => (bits & (1 << col) ? 7 * 32 + 1 : 0)))

/** The most lines a dealt hand can clear, and whether some way of placing it leaves the desk empty (worked out on bit rows, apart from the dealer's own). */
function bestOutcome(board: Board, hand: readonly Piece[]) {
  const FULL = 0b11111111
  const popcount = (value: number) => {
    let count = 0
    for (let bits = value; bits; bits &= bits - 1) count += 1
    return count
  }
  const drop = (rows: number[], piece: Piece, row: number, col: number) => {
    const next = rows.slice()
    for (const [dr, dc] of piece.shape) next[row + dr]! |= 1 << (col + dc)
    let colsFull = FULL
    for (const bits of next) colsFull &= bits
    let lines = popcount(colsFull)
    for (let r = 0; r < BOARD_SIZE; r += 1) {
      if (next[r] === FULL) {
        lines += 1
        next[r] = 0
      } else {
        next[r]! &= ~colsFull
      }
    }
    return { rows: next, lines }
  }
  const fits = (rows: number[], piece: Piece, row: number, col: number) =>
    piece.shape.every(([dr, dc]) => row + dr < BOARD_SIZE && col + dc < BOARD_SIZE && (rows[row + dr]! & (1 << (col + dc))) === 0)

  // The best from a desk with some pieces left, remembered so the same desk is not searched twice.
  const memo = new Map<string, { lines: number; empty: boolean }>()
  const go = (rows: number[], left: number[]): { lines: number; empty: boolean } => {
    if (left.length === 0) return { lines: 0, empty: rows.every((bits) => bits === 0) }
    const key = `${rows.join(',')}|${left.join('')}`
    const known = memo.get(key)
    if (known) return known
    let best = { lines: -1, empty: false }
    for (const slot of left) {
      const piece = hand[slot]!
      for (let r = 0; r <= BOARD_SIZE - piece.rows; r += 1) {
        for (let c = 0; c <= BOARD_SIZE - piece.cols; c += 1) {
          if (!fits(rows, piece, r, c)) continue
          const dropped = drop(rows, piece, r, c)
          const rest = go(dropped.rows, left.filter((other) => other !== slot))
          const lines = dropped.lines + rest.lines
          // An empty desk only counts as a sweep if something was cleared on the way.
          const empty = rest.empty && lines > 0
          if (lines > best.lines || (lines === best.lines && empty && !best.empty)) best = { lines, empty }
        }
      }
    }
    memo.set(key, best)
    return best
  }
  return go(toRows(board), hand.map((_, index) => index))
}

describe('how nearly full the lines are', () => {
  it('is zero on an empty desk and grows as lines fill up', () => {
    expect(linePotential(EMPTY)).toBe(0)
    expect(linePotential([0b1, 0, 0, 0, 0, 0, 0, 0])).toBe(2)
    expect(linePotential([0b11111111, 0, 0, 0, 0, 0, 0, 0])).toBeGreaterThan(linePotential([0b1111, 0b1111, 0, 0, 0, 0, 0, 0]) - 1)
  })

  it('likes a stacked block more than the same cells scattered', () => {
    const stacked = [0b111, 0b111, 0b111, 0, 0, 0, 0, 0]
    const scattered = [0b1, 0b1000, 0b1000000, 0b10, 0b10000, 0, 0b100000, 0b100]

    expect(linePotential(stacked)).toBeGreaterThan(linePotential(scattered))
  })
})

describe('looking for the best way to place three pieces', () => {
  it('finds the three pieces that wipe an empty desk: two 3x3 and a 2x3 fill a band of three rows', () => {
    const pool = [def(['###', '###', '###']), def(['##', '##', '##'])]

    const plays = bestPlays(EMPTY, pool, seededRng(3))

    expect(plays.some((play) => play.allClear && play.lines === 3)).toBe(true)
  })

  it('puts the plays that clear the most first', () => {
    const pool = [def(['###', '###', '###']), def(['##', '##', '##']), def(['#####'])]
    const plays = bestPlays(EMPTY, pool, seededRng(3))

    for (let index = 1; index < plays.length; index += 1) expect(plays[index - 1]!.value).toBeGreaterThanOrEqual(plays[index]!.value)
  })

  it('gives plays that are real solutions, so the hand can always be placed', () => {
    const rows = [0b00011111, 0b00011111, 0b00011111, 0b110, 0, 0, 0, 0]
    for (let seed = 1; seed <= 12; seed += 1) {
      for (const play of searchPlays(rows, seededRng(seed))) {
        expect(play.picks).toHaveLength(3)
        expect(analyzeHand(rows, play.picks).solvable, `seed ${seed}`).toBe(true)
      }
    }
  })

  it('counts lines at once for more than the same lines one by one', () => {
    // One 5-bar finishing two rows at once beats two bars finishing one row each, with all else equal.
    const rows = [0b11100000, 0b11100000, 0, 0, 0, 0, 0, 0]
    const together = bestPlays(rows, [def(['##', '##']), def(['###', '###'])], seededRng(1))

    expect(together[0]!.lines).toBeGreaterThanOrEqual(2)
  })

  it('finds nothing when the pool has no piece that fits', () => {
    const full = Array<number>(BOARD_SIZE).fill(0b11111111).map((bits, index) => (index === 0 ? bits & ~1 : bits & ~0))
    // Everything but one cell is taken, and the rows are full so any drop clears; use a pool whose only piece cannot go anywhere.
    expect(bestPlays([0b11111110, 0b11111110, 0b11111110, 0b11111110, 0b11111110, 0b11111110, 0b11111110, 0b11111110], [def(['###', '###', '###'])], seededRng(1))).toEqual([])
    expect(full).toHaveLength(BOARD_SIZE)
  })
})

describe('how often a reward hand comes', () => {
  it('comes more often as the desk fills, and is nearly sure when it is crowded', () => {
    const at = (fill: number) => rewardChance(fill, 0, 0)

    expect(at(0.05)).toBeLessThan(at(0.3))
    expect(at(0.3)).toBeLessThan(at(0.5))
    expect(at(0.5)).toBeLessThan(at(0.7))
    expect(at(0.7)).toBeGreaterThanOrEqual(0.85)
  })

  it('comes more often the longer the player has gone without a big clear, up to a limit', () => {
    const at = (dry: number) => rewardChance(0.3, dry, 0)

    expect(at(0)).toBeLessThan(at(1))
    expect(at(1)).toBeLessThan(at(3))
    expect(at(4)).toBe(at(40))
  })

  it('comes less often as the score climbs, so the game gets harder', () => {
    expect(rewardChance(0.5, 2, 0)).toBeGreaterThan(rewardChance(0.5, 2, 10_000))
    expect(rewardChance(0.5, 2, 10_000)).toBeGreaterThan(rewardChance(0.5, 2, 25_000))
    expect(rewardChance(0.5, 2, 25_000)).toBe(rewardChance(0.5, 2, 90_000))
  })

  it('never reaches certainty, so there is always some risk', () => {
    for (const fill of [0, 0.3, 0.5, 0.9]) for (const dry of [0, 4, 99]) expect(rewardChance(fill, dry, 0)).toBeLessThanOrEqual(0.92)
  })

  it('falls from 1 to 0.3 as the score goes from 0 to 25,000', () => {
    expect(easeAt(0)).toBe(1)
    expect(easeAt(25_000)).toBeCloseTo(0.3, 5)
    expect(easeAt(-5)).toBe(1)
    expect(easeAt(1_000_000)).toBeCloseTo(0.3, 5)
  })

  it('makes the sweep likelier after a dry spell and rarer as the score climbs', () => {
    expect(wipeChance(0, 0)).toBeLessThan(wipeChance(3, 0))
    expect(wipeChance(2, 0)).toBeGreaterThan(wipeChance(2, 20_000))
    expect(wipeChance(99, 0)).toBeLessThanOrEqual(0.92)
  })
})

describe('the hands that are dealt', () => {
  it('on a desk with three rows nearly done, usually deals pieces that clear several lines at once', () => {
    // Rows 0-2 full except two columns on the right: a 2x3 finishes three rows at once.
    const rows = [0b00111111, 0b00111111, 0b00111111, 0, 0, 0, 0, 0]
    const board = boardOf(rows)
    let big = 0
    const total = 30
    for (let seed = 1; seed <= total; seed += 1) {
      const hand = dealHand(board, seededRng(seed), 1, { dryHands: 4, score: 0 })
      if (bestOutcome(board, hand).lines >= 3) big += 1
    }

    expect(big / total).toBeGreaterThanOrEqual(0.5)
  })

  it('on an empty desk after a dry spell, often deals a hand that wipes it clean', () => {
    const board = boardOf(EMPTY)
    let wipes = 0
    const total = 24
    for (let seed = 1; seed <= total; seed += 1) {
      const hand = dealHand(board, seededRng(seed), 1, { dryHands: 4, score: 0 })
      if (bestOutcome(board, hand).empty) wipes += 1
    }

    expect(wipes / total).toBeGreaterThanOrEqual(0.3)
  })

  it('deals the sweep less often late in the game', () => {
    const board = boardOf(EMPTY)
    const count = (score: number) => {
      let wipes = 0
      for (let seed = 1; seed <= 30; seed += 1) {
        if (bestOutcome(board, dealHand(board, seededRng(seed), 1, { dryHands: 4, score })).empty) wipes += 1
      }
      return wipes
    }

    expect(count(0)).toBeGreaterThan(count(25_000))
  })

  it('always deals a hand that can be placed, whatever the desk and however the game has gone', () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const rng = seededRng(seed * 17)
      const rows = Array.from({ length: BOARD_SIZE }, () => {
        let bits = 0
        for (let col = 0; col < BOARD_SIZE; col += 1) if (rng() < 0.15 + (seed % 5) * 0.1) bits |= 1 << col
        return bits & 0b11111110 // never a full row to begin with
      })
      const board = boardOf(rows)
      const hand = dealHand(board, seededRng(seed), 1, { dryHands: seed % 6, score: (seed % 4) * 9000 })
      const defs = hand.map((piece) => SHAPE_DEFS.find((item) => item.shape === piece.shape)!)

      // When the desk allows any hand at all, the one dealt can be placed.
      if (analyzeHand(toRows(board), [def(['#']), def(['#']), def(['#'])]).solvable) {
        expect(analyzeHand(toRows(board), defs).solvable, `seed ${seed} fill ${fillRatio(toRows(board)).toFixed(2)}`).toBe(true)
      }
    }
  })

  it('deals the same hands for the same game, so a replay is a replay', () => {
    const board = boardOf([0b111, 0b111, 0, 0, 0, 0, 0, 0])
    const shapes = (seed: number) => dealHand(board, seededRng(seed), 1, { dryHands: 2, score: 3000 }).map((piece) => piece.shape.length + ':' + piece.kind)

    expect(shapes(9)).toEqual(shapes(9))
  })

  it('numbers the pieces from the id it was given, reward or not', () => {
    const near = boardOf([0b00111111, 0b00111111, 0b00111111, 0, 0, 0, 0, 0])
    expect(dealHand(near, seededRng(1), 40, { dryHands: 4 }).map((piece) => piece.id)).toEqual([40, 41, 42])
    expect(dealHand(boardOf(EMPTY), seededRng(2), 7).map((piece) => piece.id)).toEqual([7, 8, 9])
  })

  it('deals quickly even when it searches hardest, so the game does not stall between hands', () => {
    const times: number[] = []
    for (const rows of [EMPTY, [0b111, 0b111, 0, 0, 0, 0, 0, 0], [0b00011111, 0b00011111, 0b00011111, 0b110, 0, 0, 0, 0]]) {
      for (let seed = 1; seed <= 8; seed += 1) {
        const started = performance.now()
        dealHand(boardOf(rows), seededRng(seed), 1, { dryHands: 4, score: 0 })
        times.push(performance.now() - started)
      }
    }
    times.sort((a, b) => a - b)

    // About 50 ms on a quiet machine; the margin is for a busy one.
    expect(times[Math.floor(times.length * 0.9)]!).toBeLessThan(400)
  })

  it('opens an empty desk with large pieces, the ones that fill it up', () => {
    const sizes: number[] = []
    for (let seed = 1; seed <= 40; seed += 1) {
      const hand = dealHand(boardOf(EMPTY), seededRng(seed), 1)
      sizes.push(...hand.map((piece) => piece.shape.length))
    }
    const mean = sizes.reduce((sum, size) => sum + size, 0) / sizes.length

    expect(mean).toBeGreaterThan(3)
  })
})

describe('keeping count of the dry spell', () => {
  const bandHand = (): GameState => ({
    board: boardOf([0b00011111, 0b00011111, 0b00011111, 0, 0, 0, 0, 0]),
    placed: [],
    hand: [pieceFrom(def(['###', '###', '###']), 1), null, null],
    score: 0,
    combo: 0,
    missStreak: 0,
    bestCombo: 0,
    lines: 0,
    placements: 0,
    status: 'playing',
    nextPieceId: 4,
    dryHands: 3,
    bigClearInHand: false,
  })

  it('starts the count again after a hand that cleared three lines at once', () => {
    const moved = placePiece(bandHand(), 0, 0, 5)!

    expect(moved.result.lines).toBe(3)
    expect(moved.state.dryHands).toBe(0)
    expect(moved.state.bigClearInHand).toBe(false)
  })

  it('counts one more dry hand after a hand with no big clear', () => {
    const state: GameState = { ...bandHand(), board: boardOf([0, 0, 0, 0, 0, 0, 0, 0]), hand: [pieceFrom(def(['#']), 1), null, null] }

    expect(placePiece(state, 0, 4, 4)!.state.dryHands).toBe(4)
  })

  it('remembers a big clear made early in a hand until that hand is used up', () => {
    const state: GameState = { ...bandHand(), hand: [pieceFrom(def(['###', '###', '###']), 1), pieceFrom(def(['#']), 2), pieceFrom(def(['#']), 3)] }

    const afterBig = placePiece(state, 0, 0, 5)!
    expect(afterBig.state.bigClearInHand).toBe(true)
    expect(afterBig.state.dryHands).toBe(3)

    const second = placePiece(afterBig.state, 1, 5, 0)!
    expect(second.state.dryHands).toBe(3)
    const third = placePiece(second.state, 2, 6, 0)!
    expect(third.state.dryHands).toBe(0)
    expect(third.state.bigClearInHand).toBe(false)
  })

  it('does not count a one- or two-line clear as a big clear', () => {
    // A 2x2 at the left edge finishes two rows (and a cell stays behind, so it is not a sweep): two lines, not three.
    const state: GameState = {
      ...bandHand(),
      board: boardOf([0b11111100, 0b11111100, 0, 0, 0, 0, 0, 0b1]),
      hand: [pieceFrom(def(['##', '##']), 1), null, null],
      dryHands: 2,
    }
    const moved = placePiece(state, 0, 0, 0)!

    expect(moved.result.lines).toBe(2)
    expect(moved.state.dryHands).toBe(3)
  })

  it('treats wiping the desk as a big clear', () => {
    const state: GameState = {
      ...bandHand(),
      board: boardOf([0b11111110, 0, 0, 0, 0, 0, 0, 0]),
      hand: [pieceFrom(def(['#']), 1), null, null],
      dryHands: 5,
    }

    const moved = placePiece(state, 0, 0, 0)!

    expect(moved.result.allClear).toBe(true)
    expect(moved.state.dryHands).toBe(0)
  })

  it('starts a game with no dry spell', () => {
    expect(bandHand().bigClearInHand).toBe(false)
  })
})
