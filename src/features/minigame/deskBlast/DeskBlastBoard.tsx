import { useMemo, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { PieceArt } from './DeskBlastArt'
import { DRAG_LIFT_PX, trayCellSize, type ClearEffect } from './deskBlastDrag'
import { canPlace, linesCompletedBy, type Board, type PlacedPiece, type Piece } from './deskBlastEngine'
import { cellKind, cellPieceId, itemColor, itemOf } from './deskBlastShapes'

type Props = {
  board: Board
  /** The pieces on the desk, each drawn whole as its object. */
  placed: readonly PlacedPiece[]
  /** The piece being held and the cell it would drop on; null when nothing is held. */
  held: { piece: Piece; row: number; col: number } | null
  effects: readonly ClearEffect[]
  intensity: 0 | 1 | 2 | 3
  disabled: boolean
  onCellClick: (row: number, col: number) => void
  boardRef: React.RefObject<HTMLDivElement | null>
}

/** Places an object over the cells it covers, using the board's own grid measure. */
function boxStyle(row: number, col: number, rows: number, cols: number): CSSProperties {
  return { '--row': row, '--col': col, '--rows': rows, '--cols': cols } as CSSProperties
}

/** The 8x8 desk: the pieces lying on it, the spot a held piece would take, and the clearing animation. */
export function DeskBlastBoard({ board, placed, held, effects, intensity, disabled, onCellClick, boardRef }: Props) {
  const ghost = useMemo(() => {
    if (!held || !canPlace(board, held.piece, held.row, held.col)) return null
    const cells = new Set(held.piece.shape.map(([dr, dc]) => `${held.row + dr},${held.col + dc}`))
    const { rows, cols } = linesCompletedBy(board, held.piece, held.row, held.col)
    return { cells, rows: new Set(rows), cols: new Set(cols) }
  }, [board, held])

  /** For each piece still on the desk, the cells of it that are left. */
  const remaining = useMemo(() => {
    const byPiece = new Map<number, Set<string>>()
    board.forEach((line, row) =>
      line.forEach((cell, col) => {
        if (cell === 0) return
        const id = cellPieceId(cell)
        const set = byPiece.get(id) ?? new Set<string>()
        set.add(`${row},${col}`)
        byPiece.set(id, set)
      }),
    )
    return byPiece
  }, [board])

  return (
    <div
      ref={boardRef}
      className={`blast-board blast-board--glow-${intensity}`}
      role="group"
      aria-label="책상 보드"
      data-testid="blast-board"
    >
      {board.map((line, row) =>
        line.map((cell, col) => {
          const key = `${row},${col}`
          const inGhost = ghost?.cells.has(key) ?? false
          const willClear = ghost !== null && (ghost.rows.has(row) || ghost.cols.has(col))
          const classes = ['blast-cell']
          if (cell > 0) classes.push('blast-cell--filled')
          if (inGhost) classes.push('blast-cell--ghost')
          if (willClear && (cell > 0 || inGhost)) classes.push('blast-cell--will-clear')
          return (
            <button
              key={key}
              type="button"
              className={classes.join(' ')}
              aria-label={`${row + 1}행 ${col + 1}열${cell > 0 ? ', 채워짐' : ''}`}
              disabled={disabled}
              onClick={() => onCellClick(row, col)}
              data-row={row}
              data-col={col}
            />
          )
        }),
      )}

      <div className="blast-art" aria-hidden>
        {placed.map((piece) => {
          const left = remaining.get(piece.id)
          if (!left) return null
          const top = Math.min(...piece.cells.map(([r]) => r))
          const start = Math.min(...piece.cells.map(([, c]) => c))
          const rows = Math.max(...piece.cells.map(([r]) => r)) - top + 1
          const cols = Math.max(...piece.cells.map(([, c]) => c)) - start + 1
          return (
            <PieceArt
              key={piece.id}
              kind={piece.kind}
              cells={piece.cells}
              visible={left}
              className="blast-art__piece"
              style={boxStyle(top, start, rows, cols)}
              data-testid={`blast-art-${itemOf(piece.kind).id}`}
            />
          )
        })}
        {held && ghost && (
          <PieceArt
            kind={held.piece.kind}
            cells={held.piece.shape.map(([dr, dc]) => [held.row + dr, held.col + dc] as const)}
            className="blast-art__piece blast-art__piece--ghost"
            style={boxStyle(held.row, held.col, held.piece.rows, held.piece.cols)}
            data-testid="blast-art-ghost"
          />
        )}
      </div>

      {effects.map((effect) => (
        <ClearBurst key={effect.key} effect={effect} />
      ))}
    </div>
  )
}

function ClearBurst({ effect }: { effect: ClearEffect }) {
  return (
    <div className={`blast-burst blast-burst--l${effect.level}`} aria-hidden>
      {effect.cells.map((cell, index) => (
        <span
          key={`${cell.row},${cell.col}`}
          className="blast-burst__cell"
          style={
            {
              gridRow: cell.row + 1,
              gridColumn: cell.col + 1,
              '--burst-color': itemColor(cellKind(cell.cell)),
              // Cells pop in a quick ripple instead of all at once.
              animationDelay: `${Math.min(index, 14) * 14}ms`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}

type PieceProps = {
  piece: Piece | null
  slot: number
  selected: boolean
  dragging: boolean
  disabled: boolean
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>, slot: number) => void
  onKeyActivate: (slot: number) => void
}

/** One of the three pieces waiting under the desk. Empty once it has been used. */
export function DeskBlastPiece({ piece, slot, selected, dragging, disabled, onPointerDown, onKeyActivate }: PieceProps) {
  if (!piece) return <div className="blast-slot blast-slot--empty" aria-hidden />
  return (
    <button
      type="button"
      className={`blast-slot${selected ? ' blast-slot--selected' : ''}${dragging ? ' blast-slot--dragging' : ''}`}
      aria-label={`블록 ${slot + 1}, ${itemOf(piece.kind).name} ${piece.shape.length}칸`}
      aria-pressed={selected}
      disabled={disabled}
      onPointerDown={(event) => onPointerDown(event, slot)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onKeyActivate(slot)
        }
      }}
      data-testid={`blast-piece-${slot}`}
    >
      <PieceShape piece={piece} cell={trayCellSize(piece)} />
    </button>
  )
}

/** A piece as its object, `cell` pixels to a cell. */
export function PieceShape({ piece, cell }: { piece: Piece; cell?: number }) {
  const style = {
    '--rows': piece.rows,
    '--cols': piece.cols,
    ...(cell ? { '--blast-piece-cell': `${cell}px` } : {}),
  } as CSSProperties
  return (
    <span className="blast-shape" style={style} aria-hidden>
      <PieceArt kind={piece.kind} cells={piece.shape} className="blast-shape__art" />
    </span>
  )
}

/** Follows the finger while a piece is dragged, at the size of the cells it will land on. */
export function DragPreview({ piece, x, y, cell }: { piece: Piece; x: number; y: number; cell: number }) {
  const width = piece.cols * cell
  const height = piece.rows * cell
  return (
    <div
      className="blast-drag"
      style={{ left: x - width / 2, top: y - height - DRAG_LIFT_PX, width, height }}
      aria-hidden
      data-testid="blast-drag"
    >
      <PieceShape piece={piece} cell={cell} />
    </div>
  )
}
