/**
 * The pieces of 수능 블라스트. Each shape is one piece of desk stationery: an
 * eraser, a paper clip, a highlighter, a pencil and a ruler for the straight ones,
 * a sticky note, an exam ticket and a workbook for the rectangles, and a set
 * square, an L-square, scissors, a stamp and a folded note for the bent ones.
 * Nothing here depends on the board, so the dealer and the engine can both use it.
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
  { kind: 2, id: 'clip', name: '종이클립' },
  { kind: 3, id: 'highlighter', name: '형광펜' },
  { kind: 4, id: 'pencil', name: '연필' },
  { kind: 5, id: 'ruler', name: '자' },
  { kind: 6, id: 'sticky', name: '포스트잇' },
  { kind: 7, id: 'ticket', name: '수험표' },
  { kind: 8, id: 'workbook', name: '문제집' },
  { kind: 9, id: 'triangle', name: '삼각자' },
  { kind: 10, id: 'square', name: '곱자' },
  { kind: 11, id: 'scissors', name: '가위' },
  { kind: 12, id: 'stamp', name: '도장' },
  { kind: 13, id: 'notefold', name: '접이 메모' },
]

/** The main color of each item, for the bits that are not drawn as the whole object (cleared pieces, the share card). */
export const ITEM_COLORS: readonly string[] = [
  '#3b63c9', '#aeb6c4', '#c4e03a', '#f6c93a', '#7ea6f0', '#ffd84a', '#f4efe3', '#e9503c', '#4ec9b8', '#8d97a8', '#e0525a', '#c2402f', '#a78bff',
]

export const itemColor = (kind: ItemKind): string => ITEM_COLORS[kind - 1] ?? ITEM_COLORS[0]!

/** One of the object's shapes, as drawn: where its cells are when the object is upright. */
export type Canonical = { width: number; height: number; cells: readonly (readonly [number, number])[] }

const rect = (width: number, height: number): Canonical => ({
  width,
  height,
  cells: Array.from({ length: width * height }, (_, index) => [Math.floor(index / width), index % width] as [number, number]),
})

/** The upright shape of each object. Every other orientation of a block is this one turned or flipped. */
export const CANONICAL: Readonly<Record<ItemKind, Canonical>> = {
  1: rect(1, 1),
  2: rect(2, 1),
  3: rect(3, 1),
  4: rect(4, 1),
  5: rect(5, 1),
  6: rect(2, 2),
  7: rect(3, 2),
  8: rect(3, 3),
  // Set square: the right angle top left.
  9: { width: 2, height: 2, cells: [[0, 0], [0, 1], [1, 0]] },
  // L-square: the corner top left, arms of three.
  10: { width: 3, height: 3, cells: [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]] },
  // Scissors: the blades up the left, the two finger rings along the bottom.
  11: { width: 2, height: 3, cells: [[0, 0], [1, 0], [2, 0], [2, 1]] },
  // Stamp: the grip up, the wide base below.
  12: { width: 3, height: 2, cells: [[0, 1], [1, 0], [1, 1], [1, 2]] },
  // Folded note: a zigzag.
  13: { width: 3, height: 2, cells: [[0, 1], [0, 2], [1, 0], [1, 1]] },
}

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
  // Set square: three cells in a corner, four ways round.
  { kind: 9, rows: ['##', '#.'], weight: 2 },
  { kind: 9, rows: ['##', '.#'], weight: 2 },
  { kind: 9, rows: ['#.', '##'], weight: 2 },
  { kind: 9, rows: ['.#', '##'], weight: 2 },
  // L-square: five cells in a big corner.
  { kind: 10, rows: ['#..', '#..', '###'], weight: 1 },
  { kind: 10, rows: ['..#', '..#', '###'], weight: 1 },
  { kind: 10, rows: ['###', '#..', '#..'], weight: 1 },
  { kind: 10, rows: ['###', '..#', '..#'], weight: 1 },
  // Scissors: four cells, a long bent one.
  { kind: 11, rows: ['#.', '#.', '##'], weight: 2 },
  { kind: 11, rows: ['.#', '.#', '##'], weight: 2 },
  { kind: 11, rows: ['##', '#.', '#.'], weight: 2 },
  { kind: 11, rows: ['##', '.#', '.#'], weight: 2 },
  // Stamp: a T.
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
