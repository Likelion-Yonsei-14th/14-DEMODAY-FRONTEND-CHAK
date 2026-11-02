import { describe, expect, it } from 'vitest'
import {
  ALL_CLEAR_BONUS,
  BOARD_SIZE,
  COMBO_GRACE,
  canPlace,
  canPlaceAnywhere,
  clearScore,
  createGame,
  linesCompletedBy,
  placePiece,
  seededRng,
  type Board,
  type GameState,
  type Piece,
} from './deskBlastEngine'

const piece = (id: number, rows: string[], kind = 1): Piece => {
  const shape: Array<[number, number]> = []
  rows.forEach((line, r) => Array.from(line).forEach((char, c) => char === '#' && shape.push([r, c])))
  return { id, shape, rows: rows.length, cols: Math.max(...rows.map((line) => line.length)), kind }
}

const board = (filled: Array<[number, number]> = []): Board =>
  Array.from({ length: BOARD_SIZE }, (_, r) =>
    Array.from({ length: BOARD_SIZE }, (_, c) => (filled.some(([fr, fc]) => fr === r && fc === c) ? 2 : 0)),
  )

const rowCells = (row: number, skip: number[] = []): Array<[number, number]> =>
  Array.from({ length: BOARD_SIZE }, (_, c) => [row, c] as [number, number]).filter(([, c]) => !skip.includes(c))

const colCells = (col: number, skip: number[] = []): Array<[number, number]> =>
  Array.from({ length: BOARD_SIZE }, (_, r) => [r, col] as [number, number]).filter(([r]) => !skip.includes(r))

const withState = (overrides: Partial<GameState>): GameState => ({ ...createGame(seededRng(1)), ...overrides })

const hand = (...pieces: Array<Piece | null>) => pieces

describe('where a piece can go', () => {
  it('accepts an empty spot and refuses the edge and filled cells', () => {
    const b = board([[0, 0]])
    const bar = piece(1, ['###'])

    expect(canPlace(b, bar, 1, 0)).toBe(true)
    expect(canPlace(b, bar, 0, 0)).toBe(false)
    expect(canPlace(b, bar, 0, BOARD_SIZE - 2)).toBe(false)
    expect(canPlace(b, bar, -1, 0)).toBe(false)
    expect(canPlace(b, bar, BOARD_SIZE, 0)).toBe(false)
  })

  it('finds out whether a piece fits anywhere at all', () => {
    const full = board(Array.from({ length: BOARD_SIZE }, (_, r) => rowCells(r, r === 3 ? [4] : [])).flat())

    expect(canPlaceAnywhere(full, piece(1, ['#']))).toBe(true)
    expect(canPlaceAnywhere(full, piece(1, ['##']))).toBe(false)
  })
})

describe('clearing lines', () => {
  it('clears a row that the piece completes, and only that row', () => {
    const state = withState({ board: board(rowCells(2, [3, 4, 5])), hand: hand(piece(1, ['###']), null, null) })

    const moved = placePiece(state, 0, 2, 3)!

    expect(moved.result.clearedRows).toEqual([2])
    expect(moved.result.clearedCols).toEqual([])
    expect(moved.state.board[2]!.every((cell) => cell === 0)).toBe(true)
    expect(moved.state.lines).toBe(1)
  })

  it('clears a column the same way', () => {
    const state = withState({ board: board(colCells(6, [0, 1])), hand: hand(piece(1, ['#', '#']), null, null) })

    const moved = placePiece(state, 0, 0, 6)!

    expect(moved.result.clearedCols).toEqual([6])
    expect(moved.state.board.every((line) => line[6] === 0)).toBe(true)
  })

  it('clears a row and a column at once and counts the shared cell once', () => {
    const cross = [...rowCells(0, [0]), ...colCells(0, [0])]
    const state = withState({ board: board(cross), hand: hand(piece(1, ['#']), null, null) })

    const moved = placePiece(state, 0, 0, 0)!

    expect(moved.result.lines).toBe(2)
    expect(moved.result.clearedCells).toHaveLength(BOARD_SIZE * 2 - 1)
  })

  it('leaves the rest of the board alone', () => {
    const state = withState({ board: board([...rowCells(0, [0]), [5, 5]]), hand: hand(piece(1, ['#']), null, null) })

    const moved = placePiece(state, 0, 0, 0)!

    expect(moved.state.board[5]![5]).toBe(2)
  })

  it('tells which lines a spot would complete without placing anything', () => {
    const b = board(rowCells(4, [1, 2]))

    expect(linesCompletedBy(b, piece(1, ['##']), 4, 1)).toEqual({ rows: [4], cols: [] })
    expect(linesCompletedBy(b, piece(1, ['##']), 0, 0)).toEqual({ rows: [], cols: [] })
  })
})

describe('scoring', () => {
  it('gives one point per placed cell when nothing clears', () => {
    const state = withState({ hand: hand(piece(1, ['###']), null, null) })

    const moved = placePiece(state, 0, 0, 0)!

    expect(moved.result.gained).toBe(3)
    expect(moved.state.score).toBe(3)
    expect(moved.state.combo).toBe(0)
  })

  it('pays more for several lines at once, and more again as the combo grows', () => {
    expect(clearScore(1, 1)).toBe(10)
    expect(clearScore(2, 1)).toBe(40)
    expect(clearScore(3, 1)).toBe(90)
    expect(clearScore(1, 2)).toBe(20)
    expect(clearScore(2, 3)).toBe(120)
  })

  it('adds the placed cells to the clear score', () => {
    const state = withState({ board: board([...rowCells(0, [0, 1]), [7, 7]]), hand: hand(piece(1, ['##']), null, null) })

    const moved = placePiece(state, 0, 0, 0)!

    expect(moved.result.gained).toBe(2 + clearScore(1, 1))
  })

  it('pays a bonus for an empty desk', () => {
    const state = withState({ board: board(rowCells(0, [0])), hand: hand(piece(1, ['#']), null, null) })

    const moved = placePiece(state, 0, 0, 0)!

    expect(moved.result.allClear).toBe(true)
    expect(moved.result.gained).toBe(1 + clearScore(1, 1) + ALL_CLEAR_BONUS)
  })

  it('does not call a desk with leftovers empty', () => {
    const state = withState({ board: board([...rowCells(0, [0]), [7, 7]]), hand: hand(piece(1, ['#']), null, null) })

    expect(placePiece(state, 0, 0, 0)!.result.allClear).toBe(false)
  })
})

describe('combo', () => {
  // A leftover cell keeps these from counting as an empty desk.
  const clearingState = (overrides: Partial<GameState> = {}) =>
    withState({ board: board([...rowCells(0, [0]), [7, 7]]), hand: hand(piece(1, ['#']), piece(2, ['#']), piece(3, ['#'])), ...overrides })

  it('grows with each clearing placement and keeps the best one', () => {
    const first = placePiece(clearingState(), 0, 0, 0)!
    expect(first.result.combo).toBe(1)

    const again = placePiece(
      { ...first.state, board: board([...rowCells(1, [0]), [7, 7]]) },
      1,
      1,
      0,
    )!
    expect(again.result.combo).toBe(2)
    expect(again.state.bestCombo).toBe(2)
    expect(again.result.gained).toBe(1 + clearScore(1, 2))
  })

  it('survives a couple of placements that clear nothing, then breaks', () => {
    let state = placePiece(clearingState({ hand: hand(piece(1, ['#']), piece(2, ['#']), piece(3, ['#'])) }), 0, 0, 0)!.state
    expect(state.combo).toBe(1)

    const spots = [
      [3, 3],
      [5, 5],
      [6, 2],
    ] as const
    const broken: boolean[] = []
    for (let i = 0; i < COMBO_GRACE + 1; i += 1) {
      state = { ...state, hand: hand(piece(10 + i, ['#']), null, null) }
      const moved = placePiece(state, 0, spots[i]![0], spots[i]![1])!
      broken.push(moved.result.comboBroken)
      state = moved.state
    }

    expect(broken).toEqual([false, false, true])
    expect(state.combo).toBe(0)
    expect(state.bestCombo).toBe(1)
  })

  it('a clear inside the grace period continues the combo', () => {
    let state = placePiece(clearingState(), 0, 0, 0)!.state
    state = { ...state, hand: hand(piece(10, ['#']), null, null) }
    state = placePiece(state, 0, 4, 4)!.state
    expect(state.combo).toBe(1)

    state = { ...state, board: board(rowCells(2, [0])), hand: hand(piece(11, ['#']), null, null) }
    const moved = placePiece(state, 0, 2, 0)!

    expect(moved.result.combo).toBe(2)
  })
})

describe('hands', () => {
  it('deals a new hand of three after the last piece is used', () => {
    let state = createGame(seededRng(7))
    const rng = seededRng(8)
    for (let slot = 0; slot < 3; slot += 1) {
      const target = state.hand[slot]!
      let placed = false
      for (let r = 0; r < BOARD_SIZE && !placed; r += 1) {
        for (let c = 0; c < BOARD_SIZE && !placed; c += 1) {
          const moved = placePiece(state, slot, r, c, rng)
          if (moved) {
            state = moved.state
            placed = true
          }
        }
      }
      expect(placed, `piece ${target.id} should fit`).toBe(true)
    }

    expect(state.hand.every((item) => item !== null)).toBe(true)
    expect(state.nextPieceId).toBe(7)
    expect(new Set(state.hand.map((item) => item!.id)).size).toBe(3)
  })

  it('always deals a hand where at least one piece fits while the desk allows it', () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      const state = createGame(seededRng(seed))

      expect(state.hand.some((item) => item && canPlaceAnywhere(state.board, item))).toBe(true)
    }
  })

  it('refuses a used slot, a filled spot, and moves after the game is over', () => {
    const state = withState({ board: board([[0, 0]]), hand: hand(piece(1, ['#']), null, null) })

    expect(placePiece(state, 1, 3, 3)).toBeNull()
    expect(placePiece(state, 0, 0, 0)).toBeNull()
    expect(placePiece({ ...state, status: 'over' }, 0, 3, 3)).toBeNull()
  })
})

describe('game over', () => {
  it('ends when none of the remaining pieces fits anywhere', () => {
    // A checkerboard: no two empty cells touch and no line is full, so a pair fits nowhere.
    const crowded = board(
      Array.from({ length: BOARD_SIZE }, (_, r) => rowCells(r)).flat().filter(([r, c]) => (r + c) % 2 === 0),
    )
    const state = withState({ board: crowded, hand: hand(piece(1, ['#']), piece(2, ['##']), null) })

    const moved = placePiece(state, 0, 0, 1)!

    expect(moved.state.status).toBe('over')
  })

  it('does not end while a piece still fits', () => {
    const state = withState({ hand: hand(piece(1, ['#']), piece(2, ['##']), null) })

    expect(placePiece(state, 0, 0, 0)!.state.status).toBe('playing')
  })

  it('a clear that frees space keeps the game going', () => {
    const almost = board([...rowCells(0, [0]), ...rowCells(1), ...rowCells(2), ...rowCells(3)])
    const state = withState({ board: almost, hand: hand(piece(1, ['#']), piece(2, ['##']), null) })

    expect(placePiece(state, 0, 0, 0)!.state.status).toBe('playing')
  })
})

describe('whole games', () => {
  /** Puts each piece where it clears the most, otherwise the first spot that fits. */
  function play(seed: number) {
    const rng = seededRng(seed)
    let state = createGame(rng)
    let moves = 0
    while (state.status === 'playing' && moves < 5000) {
      let best: { slot: number; row: number; col: number; lines: number } | null = null
      state.hand.forEach((item, slot) => {
        if (!item) return
        for (let r = 0; r <= BOARD_SIZE - item.rows; r += 1) {
          for (let c = 0; c <= BOARD_SIZE - item.cols; c += 1) {
            if (!canPlace(state.board, item, r, c)) continue
            const { rows, cols } = linesCompletedBy(state.board, item, r, c)
            const lines = rows.length + cols.length
            if (!best || lines > best.lines) best = { slot, row: r, col: c, lines }
          }
        }
      })
      if (!best) break
      const { slot, row, col } = best as { slot: number; row: number; col: number }
      state = placePiece(state, slot, row, col, rng)!.state
      moves += 1
    }
    return { state, moves }
  }

  it('always ends, with a score that adds up and cells that are consistent', () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const { state, moves } = play(seed)

      expect(state.status).toBe('over')
      expect(state.placements).toBe(moves)
      expect(state.score).toBeGreaterThan(0)
      expect(state.board.every((line) => line.every((cell) => cell >= 0))).toBe(true)
    }
  })

  it('never produces numbers the server would refuse (same limits as DeskBlastRules on the backend)', () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const { state } = play(seed)
      const p = state.placements
      const maxLines = Math.min(6 * p, Math.floor((9 * p * 2) / 8))

      expect(state.lines, `seed ${seed} lines`).toBeLessThanOrEqual(maxLines)
      expect(state.bestCombo).toBeLessThanOrEqual(Math.min(state.lines, p))
      expect(state.score).toBeGreaterThanOrEqual(p)
      expect(state.score).toBeLessThanOrEqual(9 * p + 60 * state.bestCombo * state.lines + 300 * state.lines)
    }
  })

  it('never clears more than six lines with one piece', () => {
    for (let seed = 1; seed <= 10; seed += 1) {
      const rng = seededRng(seed)
      let state = createGame(rng)
      let guard = 0
      while (state.status === 'playing' && guard < 3000) {
        guard += 1
        let moved = null as ReturnType<typeof placePiece>
        outer: for (let slot = 0; slot < 3; slot += 1) {
          const item = state.hand[slot]
          if (!item) continue
          for (let r = 0; r <= BOARD_SIZE - item.rows; r += 1) {
            for (let c = 0; c <= BOARD_SIZE - item.cols; c += 1) {
              if (!canPlace(state.board, item, r, c)) continue
              moved = placePiece(state, slot, r, c, rng)
              break outer
            }
          }
        }
        if (!moved) break
        expect(moved.result.lines).toBeLessThanOrEqual(6)
        state = moved.state
      }
    }
  })

  it('replays the same game from the same seed', () => {
    expect(play(42).state.score).toBe(play(42).state.score)
  })
})
