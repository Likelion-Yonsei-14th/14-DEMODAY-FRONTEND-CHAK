import { describe, expect, it } from 'vitest'
import { boardJoins, itemClasses, pieceJoins } from './deskBlastItems'
import { cellKind, cellPieceId, encodeCell, ITEMS, itemOf, pieceFrom, SHAPE_DEFS, type Board } from './deskBlastShapes'

const none = { top: false, right: false, bottom: false, left: false }

describe('stationery pieces', () => {
  it('gives every shape an item, and every item at least one shape', () => {
    for (const def of SHAPE_DEFS) expect(ITEMS.some((item) => item.kind === def.kind)).toBe(true)
    for (const item of ITEMS) expect(SHAPE_DEFS.some((def) => def.kind === item.kind)).toBe(true)
    expect(new Set(ITEMS.map((item) => item.id)).size).toBe(ITEMS.length)
  })

  it('shapes each item the way the object looks', () => {
    const shapesOf = (id: string) => SHAPE_DEFS.filter((def) => itemOf(def.kind).id === id)
    const dims = (id: string) => shapesOf(id).map((def) => `${def.height}x${def.width}`).sort()

    expect(dims('eraser')).toEqual(['1x1'])
    expect(dims('highlighter')).toEqual(['1x3', '3x1'])
    expect(dims('pencil')).toEqual(['1x4', '4x1'])
    expect(dims('ruler')).toEqual(['1x5', '5x1'])
    expect(dims('sticky')).toEqual(['2x2'])
    expect(dims('workbook')).toEqual(['3x3'])
    expect(shapesOf('stapler')).toHaveLength(4)
    expect(shapesOf('clip').every((def) => def.shape.length === 3)).toBe(true)
    expect(shapesOf('triangle').every((def) => def.shape.length === 5)).toBe(true)
  })

  it('has every shape drawn inside its own box with no loose cells', () => {
    for (const def of SHAPE_DEFS) {
      const keys = new Set(def.shape.map(([r, c]) => `${r},${c}`))
      expect(keys.size).toBe(def.shape.length)
      for (const [r, c] of def.shape) {
        expect(r).toBeLessThan(def.height)
        expect(c).toBeLessThan(def.width)
        const touching = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].some(([nr, nc]) => keys.has(`${nr},${nc}`))
        expect(touching || def.shape.length === 1).toBe(true)
      }
    }
  })

  it('remembers a cell’s piece and kind', () => {
    for (const [id, kind] of [[1, 1], [2, 13], [500, 7], [12345, 4]] as const) {
      const cell = encodeCell(id, kind)

      expect(cell).toBeGreaterThan(0)
      expect(cellKind(cell)).toBe(kind)
      expect(cellPieceId(cell)).toBe(id)
    }
  })
})

describe('drawing the cells as one object', () => {
  it('names the item and which sides touch the rest of the piece', () => {
    expect(itemClasses(3, none)).toBe('blast-item blast-item--highlighter')
    expect(itemClasses(3, { ...none, right: true, left: true })).toBe('blast-item blast-item--highlighter j-r j-l')
    expect(itemClasses(8, { top: true, right: true, bottom: true, left: true })).toBe('blast-item blast-item--workbook j-t j-r j-b j-l')
  })

  it('joins the cells inside a piece and nothing else', () => {
    const bar = pieceFrom(SHAPE_DEFS.find((def) => def.rows.join() === '###')!, 1)

    expect(pieceJoins(bar, 0, 0)).toEqual({ ...none, right: true })
    expect(pieceJoins(bar, 0, 1)).toEqual({ ...none, right: true, left: true })
    expect(pieceJoins(bar, 0, 2)).toEqual({ ...none, left: true })
  })

  it('joins a cell on the board only to neighbors of the same piece', () => {
    const board: Board = [
      [encodeCell(1, 3), encodeCell(1, 3), encodeCell(2, 3)],
      [0, 0, encodeCell(2, 3)],
    ]

    // Two highlighters side by side are two objects, not one.
    expect(boardJoins(board, 0, 0)).toEqual({ ...none, right: true })
    expect(boardJoins(board, 0, 1)).toEqual({ ...none, left: true })
    expect(boardJoins(board, 0, 2)).toEqual({ ...none, bottom: true })
    expect(boardJoins(board, 1, 2)).toEqual({ ...none, top: true })
  })

  it('lets a piece that lost cells to a cleared line close up around what is left', () => {
    const before: Board = [[encodeCell(1, 3), encodeCell(1, 3), encodeCell(1, 3)]]
    const after: Board = [[encodeCell(1, 3), 0, encodeCell(1, 3)]]

    expect(boardJoins(before, 0, 1)).toEqual({ ...none, left: true, right: true })
    expect(boardJoins(after, 0, 0)).toEqual(none)
    expect(boardJoins(after, 0, 2)).toEqual(none)
  })
})
