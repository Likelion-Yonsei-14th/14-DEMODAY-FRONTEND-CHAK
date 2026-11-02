import { cellKind, cellPieceId, itemOf, type Board, type Piece } from './deskBlastShapes'

export type Joins = { top: boolean; right: boolean; bottom: boolean; left: boolean }

/** Class names that draw one cell of a piece as a part of its stationery. */
export function itemClasses(kind: number, joins: Joins): string {
  const classes = ['blast-item', `blast-item--${itemOf(kind).id}`]
  if (joins.top) classes.push('j-t')
  if (joins.right) classes.push('j-r')
  if (joins.bottom) classes.push('j-b')
  if (joins.left) classes.push('j-l')
  return classes.join(' ')
}

/** Which neighbors of a board cell belong to the same piece, so the cells read as one object. */
export function boardJoins(board: Board, row: number, col: number): Joins {
  const id = cellPieceId(board[row]![col]!)
  const same = (r: number, c: number) => {
    const cell = board[r]?.[c]
    return cell !== undefined && cell !== 0 && cellPieceId(cell) === id
  }
  return { top: same(row - 1, col), right: same(row, col + 1), bottom: same(row + 1, col), left: same(row, col - 1) }
}

/** The same for a piece's own cells (in the tray, under the finger, as a landing spot). */
export function pieceJoins(piece: Piece, row: number, col: number): Joins {
  const has = (r: number, c: number) => piece.shape.some(([pr, pc]) => pr === r && pc === c)
  return { top: has(row - 1, col), right: has(row, col + 1), bottom: has(row + 1, col), left: has(row, col - 1) }
}

export const boardCellKind = (board: Board, row: number, col: number) => cellKind(board[row]![col]!)
