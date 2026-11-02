/**
 * The pieces of 수능 블라스트. Each shape is a piece of desk stationery: the
 * single cell is an eraser, the straight bars are a chocolate, highlighter,
 * pencil and ruler, the squares are a sticky note, a memo pad and a workbook,
 * and the bent ones are a clip, a set square, a tape roll, a stapler and a
 * folded note. Nothing here depends on the board, so the dealer and the engine
 * can both use it.
 */

export const BOARD_SIZE = 8
export const HAND_SIZE = 3

/** 0 is an empty cell; any other number is a piece's cell, see `encodeCell`. */
export type Cell = number
export type Board = readonly (readonly Cell[])[]
export type Rng = () => number

export type ItemKind = number

export type Item = { kind: ItemKind; id: string; name: string }

/** Kind numbers start at 1; 0 never names an item (an empty cell has no kind). */
export const ITEMS: readonly Item[] = [
  { kind: 1, id: 'eraser', name: '지우개' },
  { kind: 2, id: 'chocolate', name: '초콜릿' },
  { kind: 3, id: 'highlighter', name: '형광펜' },
  { kind: 4, id: 'pencil', name: '연필' },
  { kind: 5, id: 'ruler', name: '자' },
  { kind: 6, id: 'sticky', name: '포스트잇' },
  { kind: 7, id: 'memo', name: '메모지' },
  { kind: 8, id: 'workbook', name: '문제집' },
  { kind: 9, id: 'clip', name: '클립' },
  { kind: 10, id: 'triangle', name: '삼각자' },
  { kind: 11, id: 'tape', name: '테이프' },
  { kind: 12, id: 'stapler', name: '스테이플러' },
  { kind: 13, id: 'notefold', name: '접이 메모' },
]

export const itemOf = (kind: ItemKind): Item => ITEMS[kind - 1] ?? ITEMS[0]!

export type Shape = readonly (readonly [number, number])[]

export type ShapeDef = {
  kind: ItemKind
  rows: readonly string[]
  weight: number
  shape: Shape
  height: number
  width: number
}

/** '#' is a filled cell. Weights favor small and medium pieces so a desk stays playable. */
const RAW: ReadonlyArray<{ kind: ItemKind; rows: readonly string[]; weight: number }> = [
  { kind: 1, rows: ['#'], weight: 3 },
  { kind: 2, rows: ['##'], weight: 4 },
  { kind: 2, rows: ['#', '#'], weight: 4 },
  { kind: 3, rows: ['###'], weight: 4 },
  { kind: 3, rows: ['#', '#', '#'], weight: 4 },
  { kind: 4, rows: ['####'], weight: 3 },
  { kind: 4, rows: ['#', '#', '#', '#'], weight: 3 },
  { kind: 5, rows: ['#####'], weight: 1 },
  { kind: 5, rows: ['#', '#', '#', '#', '#'], weight: 1 },
  { kind: 6, rows: ['##', '##'], weight: 5 },
  { kind: 7, rows: ['###', '###'], weight: 2 },
  { kind: 7, rows: ['##', '##', '##'], weight: 2 },
  { kind: 8, rows: ['###', '###', '###'], weight: 1 },
  // Clip: three cells in a corner, four ways round.
  { kind: 9, rows: ['##', '#.'], weight: 2 },
  { kind: 9, rows: ['##', '.#'], weight: 2 },
  { kind: 9, rows: ['#.', '##'], weight: 2 },
  { kind: 9, rows: ['.#', '##'], weight: 2 },
  // Set square: five cells in a big corner.
  { kind: 10, rows: ['#..', '#..', '###'], weight: 1 },
  { kind: 10, rows: ['..#', '..#', '###'], weight: 1 },
  { kind: 10, rows: ['###', '#..', '#..'], weight: 1 },
  { kind: 10, rows: ['###', '..#', '..#'], weight: 1 },
  // Tape: four cells, a long bent one.
  { kind: 11, rows: ['#.', '#.', '##'], weight: 2 },
  { kind: 11, rows: ['.#', '.#', '##'], weight: 2 },
  { kind: 11, rows: ['##', '#.', '#.'], weight: 2 },
  { kind: 11, rows: ['##', '.#', '.#'], weight: 2 },
  // Stapler: a T.
  { kind: 12, rows: ['###', '.#.'], weight: 2 },
  { kind: 12, rows: ['.#.', '###'], weight: 2 },
  { kind: 12, rows: ['#.', '##', '#.'], weight: 2 },
  { kind: 12, rows: ['.#', '##', '.#'], weight: 2 },
  // Folded note: S and Z.
  { kind: 13, rows: ['.##', '##.'], weight: 2 },
  { kind: 13, rows: ['##.', '.##'], weight: 2 },
  { kind: 13, rows: ['#.', '##', '.#'], weight: 2 },
  { kind: 13, rows: ['.#', '##', '#.'], weight: 2 },
]

export const SHAPE_DEFS: readonly ShapeDef[] = RAW.map(({ kind, rows, weight }) => {
  const cells: Array<[number, number]> = []
  rows.forEach((line, r) => {
    Array.from(line).forEach((char, c) => {
      if (char === '#') cells.push([r, c])
    })
  })
  return { kind, rows, weight, shape: cells, height: rows.length, width: Math.max(...rows.map((line) => line.length)) }
})

export type Piece = {
  /** Unique within a game, so the UI can tell a fresh piece from the same shape. */
  id: number
  shape: Shape
  rows: number
  cols: number
  /** Which stationery it is; decides how its cells look. */
  kind: ItemKind
}

export const pieceFrom = (def: ShapeDef, id: number): Piece => ({
  id,
  shape: def.shape,
  rows: def.height,
  cols: def.width,
  kind: def.kind,
})

/** A cell on the board remembers its piece and its kind: `pieceId * 32 + kind`, never 0. */
const KIND_SPAN = 32
export const encodeCell = (pieceId: number, kind: ItemKind) => pieceId * KIND_SPAN + kind
export const cellKind = (cell: number): ItemKind => cell % KIND_SPAN
export const cellPieceId = (cell: number) => Math.floor(cell / KIND_SPAN)
