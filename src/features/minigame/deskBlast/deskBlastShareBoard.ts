import { createElement } from 'react'
import { PieceArt } from './DeskBlastArt'
import { BOARD_SIZE, type Board, type PlacedPiece } from './deskBlastEngine'
import type { BlastLook } from './deskBlastLook'
import { cellPieceId } from './deskBlastShapes'

/**
 * The last desk, drawn onto the share card: the board with every object that
 * was still lying on it. The objects are the same drawings the game shows
 * (DeskBlastArt), turned into pictures and placed over the grid.
 */

const GAP = 6
const PADDING = 14

/** The two desks, as the game paints them. */
export const MATS: Record<BlastLook, { frame: string; mat: string; cell: string; cellLine: string }> = {
  arcade: { frame: '#3a3446', mat: '#0d0c12', cell: '#1a1822', cellLine: 'rgba(255,255,255,.05)' },
  objects: { frame: '#e7dfce', mat: '#2d5545', cell: 'rgba(255,255,255,.08)', cellLine: 'rgba(255,255,255,.16)' },
}

/** Where cells lie when the board is `size` pixels across. */
export function boardGeometry(size: number) {
  const cell = (size - 2 * PADDING - (BOARD_SIZE - 1) * GAP) / BOARD_SIZE
  const at = (index: number) => PADDING + index * (cell + GAP)
  return {
    cell,
    gap: GAP,
    padding: PADDING,
    /** The box of `cols` x `rows` cells whose top left cell is (row, col), joining the gaps between them. */
    box: (row: number, col: number, rows: number, cols: number) => ({
      x: at(col),
      y: at(row),
      width: cols * cell + (cols - 1) * GAP,
      height: rows * cell + (rows - 1) * GAP,
    }),
  }
}

/** One piece as it is on the board, and which of its cells are left. */
export function placedBox(piece: PlacedPiece) {
  const top = Math.min(...piece.cells.map(([r]) => r))
  const left = Math.min(...piece.cells.map(([, c]) => c))
  const rows = Math.max(...piece.cells.map(([r]) => r)) - top + 1
  const cols = Math.max(...piece.cells.map(([, c]) => c)) - left + 1
  return { row: top, col: left, rows, cols }
}

/** The pieces that still have a cell on the board, with the cells they keep. */
export function livePieces(board: Board, placed: readonly PlacedPiece[]) {
  const left = new Map<number, Set<string>>()
  board.forEach((line, row) =>
    line.forEach((cell, col) => {
      if (cell === 0) return
      const id = cellPieceId(cell)
      const set = left.get(id) ?? new Set<string>()
      set.add(`${row},${col}`)
      left.set(id, set)
    }),
  )
  return placed.flatMap((piece) => {
    const visible = left.get(piece.id)
    return visible ? [{ piece, visible }] : []
  })
}

/** An object as an SVG picture a canvas can draw, `width` x `height` pixels. */
export async function pieceDataUrl(
  piece: PlacedPiece,
  visible: ReadonlySet<string>,
  width: number,
  height: number,
): Promise<string> {
  const { renderToStaticMarkup } = await import('react-dom/server')
  const markup = renderToStaticMarkup(
    createElement(PieceArt, { kind: piece.kind, cells: piece.cells, visible }),
  )
  const svg = markup.replace(
    /^<svg /,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(width)}" height="${Math.round(height)}" `,
  )
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

type Ctx = Pick<
  CanvasRenderingContext2D,
  'save' | 'restore' | 'beginPath' | 'fill' | 'stroke' | 'drawImage' | 'fillStyle' | 'strokeStyle' | 'lineWidth' | 'shadowColor' | 'shadowBlur' | 'shadowOffsetY' | 'moveTo' | 'arcTo' | 'closePath'
>

function roundedRect(ctx: Ctx, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + width, y, x + width, y + height, radius)
  ctx.arcTo(x + width, y + height, x, y + height, radius)
  ctx.arcTo(x, y + height, x, y, radius)
  ctx.arcTo(x, y, x + width, y, radius)
  ctx.closePath()
}

export type LoadPicture = (url: string) => Promise<CanvasImageSource>

const loadPicture: LoadPicture = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('picture failed to load'))
    image.src = url
  })

/**
 * Draws the board at (x, y), `size` pixels across: the frame, the mat, the 64
 * cells, then each object over them. A picture that fails to load is skipped, so
 * one bad drawing never costs the whole share card.
 */
export async function drawBoard(
  ctx: Ctx,
  at: { x: number; y: number; size: number },
  state: { board: Board; placed: readonly PlacedPiece[]; look: BlastLook },
  load: LoadPicture = loadPicture,
) {
  const { x, y, size } = at
  const colors = MATS[state.look]
  const geometry = boardGeometry(size)

  ctx.save()
  ctx.shadowColor = 'rgba(30, 20, 10, .35)'
  ctx.shadowBlur = 36
  ctx.shadowOffsetY = 14
  ctx.fillStyle = colors.frame
  roundedRect(ctx, x - 8, y - 8, size + 16, size + 16, 44)
  ctx.fill()
  ctx.restore()

  ctx.fillStyle = colors.mat
  roundedRect(ctx, x, y, size, size, 36)
  ctx.fill()

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const box = geometry.box(row, col, 1, 1)
      ctx.fillStyle = colors.cell
      roundedRect(ctx, x + box.x, y + box.y, box.width, box.height, 12)
      ctx.fill()
    }
  }

  const live = livePieces(state.board, state.placed)
  const pictures = await Promise.all(
    live.map(async ({ piece, visible }) => {
      const area = placedBox(piece)
      const box = geometry.box(area.row, area.col, area.rows, area.cols)
      try {
        const picture = await load(await pieceDataUrl(piece, visible, box.width, box.height))
        return { picture, box }
      } catch {
        return null
      }
    }),
  )

  for (const item of pictures) {
    if (!item) continue
    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, .5)'
    ctx.shadowBlur = 8
    ctx.shadowOffsetY = 4
    ctx.drawImage(item.picture, x + item.box.x, y + item.box.y, item.box.width, item.box.height)
    ctx.restore()
  }
  return live.length
}
