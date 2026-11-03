/**
 * 수능 블라스트 rules, with no UI in it: an 8x8 desk, three pieces at a time,
 * a full row or column clears. Pieces are never rotated. Everything random goes
 * through an injected `rng`, so a game can be replayed in tests.
 */

import { dealHand } from './deskBlastDealer'
import { BOARD_SIZE, HAND_SIZE, cellPieceId, encodeCell, type Board, type Cell, type Piece, type Rng } from './deskBlastShapes'

export { BOARD_SIZE, HAND_SIZE }
export type { Board, Cell, Piece, Rng }
export type { Shape } from './deskBlastShapes'

/** Points a cleared line is worth before the multi-line and combo multipliers. */
export const LINE_BASE = 10
/** Extra for leaving the whole desk empty. */
export const ALL_CLEAR_BONUS = 300
/** A combo survives this many placements that clear nothing, then it is lost. */
export const COMBO_GRACE = 2

export type GameStatus = 'playing' | 'over'

/** A piece that has been put on the desk, with where its cells went. Kept so it can be drawn whole. */
export type PlacedPiece = {
  id: number
  kind: number
  /** The cells it covered when it was put down; some may have been cleared since. */
  cells: readonly (readonly [number, number])[]
}

export type GameState = {
  board: Board
  /** The pieces on the desk that still have a cell left, oldest first. */
  placed: readonly PlacedPiece[]
  /** A used slot is null; a new hand of three is dealt once all three are used. */
  hand: readonly (Piece | null)[]
  score: number
  /** Clears in a row; 0 when none is running. */
  combo: number
  /** Placements since the last clear, while a combo is running. */
  missStreak: number
  bestCombo: number
  lines: number
  placements: number
  status: GameStatus
  nextPieceId: number
  /** Hands dealt since the last big clear (three lines at once, or an empty desk). */
  dryHands: number
  /** A big clear happened while this hand was being placed. */
  bigClearInHand: boolean
}

export type PlaceResult = {
  placedCells: number
  clearedRows: readonly number[]
  clearedCols: readonly number[]
  /** Every cell that went away, with what it held, for the clearing animation. */
  clearedCells: readonly { row: number; col: number; cell: Cell }[]
  /** Clears of this placement; 0 when it cleared nothing. */
  lines: number
  /** The combo this clear reached; 0 when it cleared nothing. */
  combo: number
  /** The combo that was running before this placement, lost if it did not clear. */
  comboBroken: boolean
  allClear: boolean
  gained: number
}

const emptyBoard = (): Board => Array.from({ length: BOARD_SIZE }, () => Array<Cell>(BOARD_SIZE).fill(0))

/** mulberry32, for replayable games in tests. */
export function seededRng(seed: number): Rng {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function canPlace(board: Board, piece: Piece, row: number, col: number): boolean {
  return piece.shape.every(([dr, dc]) => {
    const r = row + dr
    const c = col + dc
    return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r]![c] === 0
  })
}

export function canPlaceAnywhere(board: Board, piece: Piece): boolean {
  for (let row = 0; row <= BOARD_SIZE - piece.rows; row += 1) {
    for (let col = 0; col <= BOARD_SIZE - piece.cols; col += 1) {
      if (canPlace(board, piece, row, col)) return true
    }
  }
  return false
}

const handCanMove = (board: Board, hand: readonly (Piece | null)[]) =>
  hand.some((piece) => piece !== null && canPlaceAnywhere(board, piece))

export function createGame(rng: Rng = Math.random): GameState {
  const board = emptyBoard()
  return {
    board,
    placed: [],
    hand: dealHand(board, rng, 1),
    score: 0,
    combo: 0,
    missStreak: 0,
    bestCombo: 0,
    lines: 0,
    placements: 0,
    status: 'playing',
    nextPieceId: 1 + HAND_SIZE,
    dryHands: 0,
    bigClearInHand: false,
  }
}

/** The rows and columns that would be full if `piece` were put at (row, col). */
export function linesCompletedBy(board: Board, piece: Piece, row: number, col: number) {
  const filled = new Set(piece.shape.map(([dr, dc]) => `${row + dr},${col + dc}`))
  const isFull = (r: number, c: number) => board[r]![c] !== 0 || filled.has(`${r},${c}`)
  const rows: number[] = []
  const cols: number[] = []
  for (let index = 0; index < BOARD_SIZE; index += 1) {
    if (Array.from({ length: BOARD_SIZE }, (_, c) => isFull(index, c)).every(Boolean)) rows.push(index)
    if (Array.from({ length: BOARD_SIZE }, (_, r) => isFull(r, index)).every(Boolean)) cols.push(index)
  }
  return { rows, cols }
}

/** Points for clearing `lines` lines as the `combo`-th clear in a row. */
export function clearScore(lines: number, combo: number) {
  return LINE_BASE * lines * lines * combo
}

/**
 * Puts the piece in `slot` at (row, col). Returns null when the move is not
 * allowed (empty slot, off the desk, on a filled cell, game over).
 */
export function placePiece(
  state: GameState,
  slot: number,
  row: number,
  col: number,
  rng: Rng = Math.random,
): { state: GameState; result: PlaceResult } | null {
  if (state.status !== 'playing') return null
  const piece = state.hand[slot]
  if (!piece || !canPlace(state.board, piece, row, col)) return null

  const { rows: fullRows, cols: fullCols } = linesCompletedBy(state.board, piece, row, col)

  const next: Cell[][] = state.board.map((line) => [...line])
  const mark = encodeCell(piece.id, piece.kind)
  for (const [dr, dc] of piece.shape) next[row + dr]![col + dc] = mark

  const clearedCells: Array<{ row: number; col: number; cell: Cell }> = []
  const seen = new Set<string>()
  const collect = (r: number, c: number) => {
    const key = `${r},${c}`
    if (seen.has(key)) return
    seen.add(key)
    clearedCells.push({ row: r, col: c, cell: next[r]![c]! })
  }
  for (const r of fullRows) for (let c = 0; c < BOARD_SIZE; c += 1) collect(r, c)
  for (const c of fullCols) for (let r = 0; r < BOARD_SIZE; r += 1) collect(r, c)
  for (const { row: r, col: c } of clearedCells) next[r]![c] = 0

  const lines = fullRows.length + fullCols.length
  const placedCells = piece.shape.length
  const allClear = lines > 0 && next.every((line) => line.every((cell) => cell === 0))

  let combo = state.combo
  let missStreak = state.missStreak
  let comboBroken = false
  let gained = placedCells
  if (lines > 0) {
    combo += 1
    missStreak = 0
    gained += clearScore(lines, combo) + (allClear ? ALL_CLEAR_BONUS : 0)
  } else if (combo > 0) {
    missStreak += 1
    if (missStreak > COMBO_GRACE) {
      combo = 0
      missStreak = 0
      comboBroken = true
    }
  }

  let hand: readonly (Piece | null)[] = state.hand.map((item, index) => (index === slot ? null : item))
  let nextPieceId = state.nextPieceId
  let dryHands = state.dryHands
  let bigClearInHand = state.bigClearInHand || lines >= 3 || allClear
  if (hand.every((item) => item === null)) {
    dryHands = bigClearInHand ? 0 : dryHands + 1
    bigClearInHand = false
    hand = dealHand(next, rng, nextPieceId, { dryHands, score: state.score + gained })
    nextPieceId += HAND_SIZE
  }

  // Only pieces that still have a cell on the desk are kept, and the new one joins them.
  const alive = new Set<number>()
  for (const line of next) for (const cell of line) if (cell !== 0) alive.add(cellPieceId(cell))
  const placed = [
    ...state.placed,
    { id: piece.id, kind: piece.kind, cells: piece.shape.map(([dr, dc]) => [row + dr, col + dc] as const) },
  ].filter((entry) => alive.has(entry.id))

  const over = !handCanMove(next, hand)
  const after: GameState = {
    board: next,
    placed,
    hand,
    score: state.score + gained,
    combo,
    missStreak,
    bestCombo: Math.max(state.bestCombo, combo),
    lines: state.lines + lines,
    placements: state.placements + 1,
    status: over ? 'over' : 'playing',
    nextPieceId,
    dryHands,
    bigClearInHand,
  }

  return {
    state: after,
    result: {
      placedCells,
      clearedRows: fullRows,
      clearedCols: fullCols,
      clearedCells,
      lines,
      combo: lines > 0 ? combo : 0,
      comboBroken,
      allClear,
      gained,
    },
  }
}
