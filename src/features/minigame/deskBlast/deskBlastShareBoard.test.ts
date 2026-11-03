import { describe, expect, it, vi } from 'vitest'
import { BOARD_SIZE, type Board, type PlacedPiece } from './deskBlastEngine'
import { boardGeometry, drawBoard, livePieces, MATS, pieceDataUrl, placedBox } from './deskBlastShareBoard'
import { CARD, cardLayout, fitBoardSize } from './deskBlastShareImage'
import { encodeCell } from './deskBlastShapes'

const SHARE_HEIGHT = 1920

const emptyBoard = (): Board => Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0))

/** A board with the pieces' cells filled in as the game would leave them. */
function boardWith(pieces: readonly PlacedPiece[], gone: ReadonlyArray<readonly [number, number]> = []): Board {
  const board = emptyBoard().map((line) => [...line])
  for (const piece of pieces) for (const [r, c] of piece.cells) board[r]![c] = encodeCell(piece.id, piece.kind)
  for (const [r, c] of gone) board[r]![c] = 0
  return board
}

const pencil: PlacedPiece = { id: 1, kind: 4, cells: [[0, 0], [0, 1], [0, 2], [0, 3]] }
const sticky: PlacedPiece = { id: 2, kind: 6, cells: [[2, 3], [2, 4], [3, 3], [3, 4]] }

function fakeContext() {
  const calls: Array<{ name: string; args: unknown[] }> = []
  const record = (name: string) => (...args: unknown[]) => {
    calls.push({ name, args })
  }
  const context = {
    save: record('save'),
    restore: record('restore'),
    beginPath: record('beginPath'),
    fill: record('fill'),
    stroke: record('stroke'),
    drawImage: record('drawImage'),
    moveTo: record('moveTo'),
    arcTo: record('arcTo'),
    closePath: record('closePath'),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    shadowColor: '',
    shadowBlur: 0,
    shadowOffsetY: 0,
  }
  return { context, calls }
}

describe('where things lie on the share card desk', () => {
  it('puts the 64 cells inside the frame with a gap between them', () => {
    const geometry = boardGeometry(700)
    const last = geometry.box(BOARD_SIZE - 1, BOARD_SIZE - 1, 1, 1)

    expect(geometry.box(0, 0, 1, 1).x).toBe(geometry.padding)
    expect(last.x + last.width + geometry.padding).toBeCloseTo(700, 5)
    expect(last.y + last.height + geometry.padding).toBeCloseTo(700, 5)
    expect(geometry.box(0, 1, 1, 1).x - (geometry.box(0, 0, 1, 1).x + geometry.cell)).toBeCloseTo(geometry.gap, 5)
  })

  it('makes a piece cover its cells and the gaps between them', () => {
    const geometry = boardGeometry(700)
    const box = geometry.box(0, 0, 1, 4)

    expect(box.width).toBeCloseTo(4 * geometry.cell + 3 * geometry.gap, 5)
    expect(box.height).toBeCloseTo(geometry.cell, 5)
  })

  it('measures a piece by the cells it was put on', () => {
    expect(placedBox(pencil)).toEqual({ row: 0, col: 0, rows: 1, cols: 4 })
    expect(placedBox(sticky)).toEqual({ row: 2, col: 3, rows: 2, cols: 2 })
  })

  it('has a mat for each of the game\'s two looks', () => {
    expect(Object.keys(MATS).sort()).toEqual(['arcade', 'objects'])
  })
})

describe('which pieces are left on the desk', () => {
  it('keeps every piece that still has a cell, with the cells it keeps', () => {
    const board = boardWith([pencil, sticky], [[0, 2], [0, 3]])

    const live = livePieces(board, [pencil, sticky])

    expect(live.map((item) => item.piece.id)).toEqual([1, 2])
    expect([...live[0]!.visible].sort()).toEqual(['0,0', '0,1'])
    expect(live[1]!.visible.size).toBe(4)
  })

  it('drops a piece whose cells are all gone', () => {
    const board = boardWith([pencil, sticky], pencil.cells)

    expect(livePieces(board, [pencil, sticky]).map((item) => item.piece.id)).toEqual([2])
  })

  it('shows nothing for an empty desk', () => {
    expect(livePieces(emptyBoard(), [])).toEqual([])
  })
})

describe('an object as a picture', () => {
  it('is an SVG data address a canvas can draw, at the size it will be drawn', async () => {
    const url = await pieceDataUrl(pencil, new Set(pencil.cells.map(([r, c]) => `${r},${c}`)), 320.4, 80.2)

    expect(url.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true)
    const svg = decodeURIComponent(url.slice('data:image/svg+xml;charset=utf-8,'.length))
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="80" ')).toBe(true)
    expect(svg).toContain('data-kind="pencil"')
    expect(svg).toContain('viewBox="0 0 4 1"')
  })

  it('draws only what is left of a piece, through a clip', async () => {
    const url = await pieceDataUrl(pencil, new Set(['0,0', '0,1']), 320, 80)
    const svg = decodeURIComponent(url.slice(url.indexOf(',') + 1))

    expect(svg).toContain('<clipPath')
  })
})

describe('drawing the last desk onto the card', () => {
  const state = (look: 'arcade' | 'objects' = 'objects') => ({ board: boardWith([pencil, sticky]), placed: [pencil, sticky], look })

  it('draws the frame, the mat, all 64 cells, then each object over them', async () => {
    const { context, calls } = fakeContext()
    const picture = {} as CanvasImageSource
    const load = vi.fn().mockResolvedValue(picture)

    const drawn = await drawBoard(context, { x: 100, y: 200, size: 700 }, state(), load)

    expect(drawn).toBe(2)
    expect(load).toHaveBeenCalledTimes(2)
    // frame + mat + 64 cells, each a rounded rectangle that is filled
    expect(calls.filter((call) => call.name === 'fill')).toHaveLength(66)
    const images = calls.filter((call) => call.name === 'drawImage')
    expect(images).toHaveLength(2)
    const geometry = boardGeometry(700)
    const box = geometry.box(0, 0, 1, 4)
    expect(images[0]!.args).toEqual([picture, 100 + box.x, 200 + box.y, box.width, box.height])
    // The objects come last, so they lie on top of the cells.
    expect(calls.findIndex((call) => call.name === 'drawImage')).toBeGreaterThan(calls.map((call) => call.name).lastIndexOf('fill'))
  })

  it('paints the mat of the chosen look', async () => {
    const fills: string[] = []
    for (const look of ['arcade', 'objects'] as const) {
      const { context } = fakeContext()
      let mat = ''
      Object.defineProperty(context, 'fillStyle', {
        set(value: string) {
          if (value === MATS[look].mat) mat = value
        },
        get: () => '',
      })

      await drawBoard(context, { x: 0, y: 0, size: 700 }, state(look), vi.fn().mockResolvedValue({}))
      fills.push(mat)
    }

    expect(fills).toEqual([MATS.arcade.mat, MATS.objects.mat])
  })

  it('skips a picture that fails to load and still draws the rest', async () => {
    const { context, calls } = fakeContext()
    const picture = {} as CanvasImageSource
    const load = vi.fn().mockRejectedValueOnce(new Error('bad picture')).mockResolvedValue(picture)

    await drawBoard(context, { x: 0, y: 0, size: 700 }, state(), load)

    expect(calls.filter((call) => call.name === 'drawImage')).toHaveLength(1)
  })

  it('draws just the mat and cells for an empty desk', async () => {
    const { context, calls } = fakeContext()
    const load = vi.fn()

    const drawn = await drawBoard(context, { x: 0, y: 0, size: 700 }, { board: emptyBoard(), placed: [], look: 'objects' }, load)

    expect(drawn).toBe(0)
    expect(load).not.toHaveBeenCalled()
    expect(calls.filter((call) => call.name === 'drawImage')).toHaveLength(0)
  })
})

describe('fitting the desk and the text on one card', () => {
  const cases: Array<[number, number, boolean]> = [
    [1, 1, false],
    [1, 1, true],
    [1, 2, true],
    [2, 1, false],
    [2, 2, true],
    [3, 3, true],
  ]

  it('keeps everything, down to the web address, on the card for any amount of text', () => {
    for (const [typeLines, memeLines, newBest] of cases) {
      const size = fitBoardSize(typeLines, memeLines, newBest)

      expect(cardLayout(typeLines, memeLines, newBest, size).bottom, `${typeLines}/${memeLines}/${newBest}`).toBeLessThanOrEqual(SHARE_HEIGHT)
    }
  })

  it('draws the desk as big as it can: full size for short text, smaller only when the text needs room', () => {
    expect(fitBoardSize(1, 1, false)).toBe(CARD.boardMax)
    expect(fitBoardSize(1, 1, true)).toBe(CARD.boardMax)
    expect(fitBoardSize(2, 2, true)).toBeLessThan(CARD.boardMax)
    expect(fitBoardSize(2, 2, true)).toBeGreaterThanOrEqual(CARD.boardMin)
    expect(fitBoardSize(1, 1, false)).toBeGreaterThanOrEqual(fitBoardSize(2, 2, true))
  })

  it('stacks the parts top to bottom without overlap', () => {
    for (const [typeLines, memeLines, newBest] of cases) {
      const size = fitBoardSize(typeLines, memeLines, newBest)
      const layout = cardLayout(typeLines, memeLines, newBest, size)
      const order = [CARD.boardY + size, layout.labelBaseline, layout.scoreBaseline, layout.typeBaseline, layout.memeBaseline, layout.statBaseline, layout.ctaY, layout.urlBaseline]

      expect(order, `${typeLines}/${memeLines}/${newBest}`).toEqual([...order].sort((a, b) => a - b))
    }
  })

  it('leaves room for the "new best" tag only when there is one', () => {
    const plain = cardLayout(1, 1, false, 700)
    const best = cardLayout(1, 1, true, 700)

    expect(best.typeBaseline).toBeGreaterThan(plain.typeBaseline)
  })

  it('never puts the type name against the score', () => {
    const layout = cardLayout(1, 1, false, 700)

    expect(layout.typeBaseline - layout.scoreBaseline).toBeGreaterThan(CARD.typeSize)
  })
})
