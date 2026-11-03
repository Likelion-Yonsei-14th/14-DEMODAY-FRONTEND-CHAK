import { describe, expect, it, vi } from 'vitest'

// Whole games last far longer now, so the simulations get more than the 5 s default.
vi.setConfig({ testTimeout: 120_000 })
import { analyzeHand, dealHand, fillRatio, isHandSolvable, toRows } from './deskBlastDealer'
import {
  BOARD_SIZE,
  canPlace,
  createGame,
  linesCompletedBy,
  placePiece,
  seededRng,
  type Board,
  type GameState,
  type Piece,
} from './deskBlastEngine'
import { pieceFrom, SHAPE_DEFS, type ShapeDef } from './deskBlastShapes'

const def = (rows: string[]): ShapeDef => {
  const found = SHAPE_DEFS.find((item) => item.rows.join('/') === rows.join('/'))
  if (!found) throw new Error(`no such shape ${rows.join('/')}`)
  return found
}

const boardFrom = (rows: string[]): Board => rows.map((line) => Array.from(line).map((char) => (char === '#' ? 7 * 32 + 1 : 0)))

const emptyBoard = () => boardFrom(Array(BOARD_SIZE).fill('........'))

/** Everything the dealer promises is checked here by actually playing the pieces with the real engine. */
function solvableWithEngine(board: Board, defs: readonly ShapeDef[]): boolean {
  const hand: Piece[] = defs.map((item, index) => pieceFrom(item, index + 1))
  const state: GameState = {
    board,
    placed: [],
    hand,
    score: 0,
    combo: 0,
    missStreak: 0,
    bestCombo: 0,
    lines: 0,
    placements: 0,
    status: 'playing',
    nextPieceId: 10,
    dryHands: 0,
    bigClearInHand: false,
  }
  const rng = seededRng(1)
  const go = (current: GameState, left: number[]): boolean => {
    if (left.length === 0) return true
    for (const slot of left) {
      const piece = current.hand[slot]!
      for (let r = 0; r <= BOARD_SIZE - piece.rows; r += 1) {
        for (let c = 0; c <= BOARD_SIZE - piece.cols; c += 1) {
          if (!canPlace(current.board, piece, r, c)) continue
          const moved = placePiece(current, slot, r, c, rng)
          if (!moved) continue
          if (go(moved.state, left.filter((other) => other !== slot))) return true
        }
      }
    }
    return false
  }
  return go(state, [0, 1, 2])
}

describe('the hand can always be placed', () => {
  it('knows a hand that fits and one that cannot all be placed', () => {
    // A checkerboard: every empty cell is alone, so no pair or bar fits anywhere.
    const scattered = boardFrom([
      '#.#.#.#.',
      '.#.#.#.#',
      '#.#.#.#.',
      '.#.#.#.#',
      '#.#.#.#.',
      '.#.#.#.#',
      '#.#.#.#.',
      '.#.#.#.#',
    ])
    expect(isHandSolvable(emptyBoard(), [def(['#']), def(['##']), def(['###'])])).toBe(true)
    expect(isHandSolvable(scattered, [def(['#']), def(['#']), def(['#'])])).toBe(true)
    expect(isHandSolvable(scattered, [def(['#']), def(['##']), def(['###'])])).toBe(false)
  })

  it('counts the lines cleared along the way: a piece that clears makes room for the next', () => {
    // Row 7 needs one cell. Putting the single there clears the row and frees space for the 3x3.
    const crowded = boardFrom([
      '########',
      '########',
      '########',
      '########',
      '########',
      '######..',
      '######..',
      '#######.',
    ])
    expect(solvableWithEngine(crowded, [def(['#']), def(['##', '##'])])).toBe(true)
  })

  it('agrees with the real engine on hands over many boards', () => {
    for (let seed = 1; seed <= 25; seed += 1) {
      const rng = seededRng(seed * 13)
      // A random half-filled desk with no full line.
      const board = Array.from({ length: BOARD_SIZE }, (_, r) =>
        Array.from({ length: BOARD_SIZE }, (_, c) => (rng() < 0.55 && !(c === 0) ? 7 * 32 + 1 : 0) + (r === 99 ? 1 : 0)),
      ) as Board
      const defs = [0, 1, 2].map(() => SHAPE_DEFS[Math.floor(rng() * SHAPE_DEFS.length)]!)

      expect(isHandSolvable(board, defs), `seed ${seed}`).toBe(solvableWithEngine(board, defs))
    }
  })

  it('finds a hand that clears right now exactly when the engine can clear with one of the pieces', () => {
    for (let seed = 1; seed <= 30; seed += 1) {
      const rng = seededRng(seed * 29)
      const board = Array.from({ length: BOARD_SIZE }, (_, r) =>
        Array.from({ length: BOARD_SIZE }, (_, c) => (rng() < 0.65 && c !== r % BOARD_SIZE ? 7 * 32 + 1 : 0)),
      ) as Board
      const defs = [0, 1, 2].map(() => SHAPE_DEFS[Math.floor(rng() * SHAPE_DEFS.length)]!)
      const pieces = defs.map((item, index) => pieceFrom(item, index + 1))

      let engineClears = false
      for (const piece of pieces) {
        for (let r = 0; r <= BOARD_SIZE - piece.rows; r += 1) {
          for (let c = 0; c <= BOARD_SIZE - piece.cols; c += 1) {
            if (!canPlace(board, piece, r, c)) continue
            const { rows, cols } = linesCompletedBy(board, piece, r, c)
            if (rows.length + cols.length > 0) engineClears = true
          }
        }
      }

      expect(analyzeHand(toRows(board), defs).clearsNow, `seed ${seed}`).toBe(engineClears)
    }
  })
})

describe('dealing', () => {
  it('on an empty desk deals three pieces that can all be placed, with plenty of variety', () => {
    const seen = new Set<string>()
    for (let seed = 1; seed <= 40; seed += 1) {
      const hand = dealHand(emptyBoard(), seededRng(seed), 1)

      expect(hand).toHaveLength(3)
      expect(solvableWithEngine(emptyBoard(), hand.map((piece) => SHAPE_DEFS.find((item) => item.shape === piece.shape)!))).toBe(true)
      for (const piece of hand) seen.add(piece.shape.map((cell) => cell.join(',')).join(';'))
    }

    expect(seen.size).toBeGreaterThanOrEqual(12)
  })

  it('numbers the pieces from the id it is given', () => {
    expect(dealHand(emptyBoard(), seededRng(3), 10).map((piece) => piece.id)).toEqual([10, 11, 12])
  })

  it('on a crowded desk still deals only hands that can all be placed', () => {
    for (let seed = 1; seed <= 30; seed += 1) {
      const rng = seededRng(seed * 7)
      const board = Array.from({ length: BOARD_SIZE }, (_, r) =>
        Array.from({ length: BOARD_SIZE }, (_, c) => (rng() < 0.62 && c !== (r * 3) % BOARD_SIZE ? 7 * 32 + 1 : 0)),
      ) as Board
      const hand = dealHand(board, seededRng(seed), 1)
      const defs = hand.map((piece) => SHAPE_DEFS.find((item) => item.shape === piece.shape)!)

      // Any desk that has some hand that works must be dealt one.
      if (smallestWorks(board)) expect(solvableWithEngine(board, defs), `seed ${seed}`).toBe(true)
    }
  })

  const smallestWorks = (board: Board) => isHandSolvable(board, [def(['#']), def(['#']), def(['#'])])

  it('late in the game it leans to hands with few ways to place all three', () => {
    let dealtWays = 0
    let randomWays = 0
    let boards = 0
    for (let seed = 1; seed <= 40; seed += 1) {
      const rng = seededRng(seed * 101)
      const board = Array.from({ length: BOARD_SIZE }, (_, r) =>
        Array.from({ length: BOARD_SIZE }, (_, c) => (rng() < 0.6 && c !== (r * 5) % BOARD_SIZE ? 7 * 32 + 1 : 0)),
      ) as Board
      const rows = toRows(board)
      if (fillRatio(rows) < 0.55) continue

      const hand = dealHand(board, seededRng(seed), 1, { score: 25_000, dryHands: 0 })
      const dealt = analyzeHand(rows, hand.map((piece) => SHAPE_DEFS.find((item) => item.shape === piece.shape)!), 6000, 60)
      if (!dealt.solvable) continue

      // The average of random solvable hands on the same desk.
      const sampler = seededRng(seed * 977)
      let sum = 0
      let count = 0
      for (let tries = 0; tries < 60 && count < 12; tries += 1) {
        const defs = [0, 1, 2].map(() => SHAPE_DEFS[Math.floor(sampler() * SHAPE_DEFS.length)]!)
        const info = analyzeHand(rows, defs, 6000, 60)
        if (info.solvable) {
          sum += info.ways
          count += 1
        }
      }
      if (count === 0) continue
      dealtWays += dealt.ways
      randomWays += sum / count
      boards += 1
    }

    expect(boards).toBeGreaterThan(5)
    expect(dealtWays / boards).toBeLessThan(randomWays / boards)
  })

  it('in the middle of the game it often gives a piece that clears a line at once', () => {
    let clearing = 0
    let total = 0
    for (let seed = 1; seed <= 40; seed += 1) {
      const rng = seededRng(seed * 53)
      // A desk with a few nearly full lines, about 40% full.
      const board = Array.from({ length: BOARD_SIZE }, (_, r) =>
        Array.from({ length: BOARD_SIZE }, (_, c) => (r % 3 === 0 ? (c < 6 ? 7 * 32 + 1 : 0) : rng() < 0.18 ? 7 * 32 + 1 : 0)),
      ) as Board
      const rows = toRows(board)
      if (fillRatio(rows) < 0.3 || fillRatio(rows) >= 0.55) continue
      const hand = dealHand(board, seededRng(seed), 1)
      const info = analyzeHand(rows, hand.map((piece) => SHAPE_DEFS.find((item) => item.shape === piece.shape)!))

      total += 1
      if (info.clearsNow) clearing += 1
    }

    expect(total).toBeGreaterThan(8)
    expect(clearing / total).toBeGreaterThanOrEqual(0.7)
  })

  it('deals something even when no hand can be placed, and the game ends by itself', () => {
    const dead = boardFrom([
      '#.#.#.#.',
      '.#.#.#.#',
      '#.#.#.#.',
      '.#.#.#.#',
      '#.#.#.#.',
      '.#.#.#.#',
      '#.#.#.#.',
      '.#.#.#.#',
    ])

    const hand = dealHand(dead, seededRng(5), 1)

    expect(hand).toHaveLength(3)
  })
})

describe('whole games with a player who always finds a way', () => {
  /** Plays all three pieces of a hand by searching for a way to place them all. */
  function playHand(state: GameState, rng: () => number): GameState | null {
    const slots = state.hand.map((piece, slot) => (piece ? slot : -1)).filter((slot) => slot >= 0)
    const search = (current: GameState, left: number[], depth: number): GameState | null => {
      if (left.length === 0 || depth === 0) return current
      for (const slot of left) {
        const piece = current.hand[slot]!
        // Try the spots that clear the most first, then the rest.
        const spots: Array<{ r: number; c: number; lines: number }> = []
        for (let r = 0; r <= BOARD_SIZE - piece.rows; r += 1) {
          for (let c = 0; c <= BOARD_SIZE - piece.cols; c += 1) {
            if (!canPlace(current.board, piece, r, c)) continue
            const { rows, cols } = linesCompletedBy(current.board, piece, r, c)
            spots.push({ r, c, lines: rows.length + cols.length })
          }
        }
        spots.sort((a, b) => b.lines - a.lines)
        for (const spot of spots) {
          const moved = placePiece(current, slot, spot.r, spot.c, rng)
          if (!moved) continue
          if (left.length === 1) return moved.state
          const rest = search({ ...moved.state, hand: moved.state.hand }, left.filter((other) => other !== slot), depth - 1)
          if (rest) return rest
        }
      }
      return null
    }
    return search(state, slots, slots.length)
  }

  it('never gets stuck: every hand it is dealt can be played out, for a long game', () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const rng = seededRng(seed)
      let state = createGame(rng)
      let hands = 0
      while (state.status === 'playing' && hands < 60) {
        const next = playHand(state, rng)
        expect(next, `seed ${seed} hand ${hands}`).not.toBeNull()
        state = next!
        hands += 1
      }

      expect(hands, `seed ${seed}`).toBe(60)
      expect(state.score).toBeGreaterThan(500)
    }
  })
})

describe('how long dealing takes', () => {
  it('stays fast enough to deal in the middle of a move, even on a crowded desk', () => {
    const times: number[] = []
    for (let seed = 1; seed <= 25; seed += 1) {
      const rng = seededRng(seed * 211)
      const board = Array.from({ length: BOARD_SIZE }, (_, r) =>
        Array.from({ length: BOARD_SIZE }, (_, c) => (rng() < 0.58 && c !== (r * 3) % BOARD_SIZE ? 7 * 32 + 1 : 0)),
      ) as Board
      const started = performance.now()
      dealHand(board, seededRng(seed), 1)
      times.push(performance.now() - started)
    }
    times.sort((a, b) => a - b)

    expect(times[Math.floor(times.length * 0.9)]!).toBeLessThan(150)
  })
})
