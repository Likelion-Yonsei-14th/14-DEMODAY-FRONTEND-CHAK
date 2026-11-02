import { useMemo, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { DRAG_LIFT_PX, type ClearEffect } from './deskBlastDrag'
import { canPlace, linesCompletedBy, type Board, type Piece } from './deskBlastEngine'
import { boardJoins, itemClasses, pieceJoins } from './deskBlastItems'
import { cellKind, itemOf } from './deskBlastShapes'

type Props = {
  board: Board
  /** The piece being held and the cell it would drop on; null when nothing is held. */
  held: { piece: Piece; row: number; col: number } | null
  effects: readonly ClearEffect[]
  intensity: 0 | 1 | 2 | 3
  disabled: boolean
  onCellClick: (row: number, col: number) => void
  boardRef: React.RefObject<HTMLDivElement | null>
}

/** The 8x8 desk: filled cells, the spot a held piece would take, and the clearing animation. */
export function DeskBlastBoard({ board, held, effects, intensity, disabled, onCellClick, boardRef }: Props) {
  const ghost = useMemo(() => {
    if (!held || !canPlace(board, held.piece, held.row, held.col)) return null
    const cells = new Set(held.piece.shape.map(([dr, dc]) => `${held.row + dr},${held.col + dc}`))
    const { rows, cols } = linesCompletedBy(board, held.piece, held.row, held.col)
    return { cells, rows: new Set(rows), cols: new Set(cols) }
  }, [board, held])

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
          if (cell > 0) classes.push('blast-cell--filled', itemClasses(cellKind(cell), boardJoins(board, row, col)))
          if (inGhost) {
            const piece = held!.piece
            classes.push('blast-cell--ghost', itemClasses(piece.kind, pieceJoins(piece, row - held!.row, col - held!.col)))
          }
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
          className={`blast-burst__cell ${itemClasses(cellKind(cell.cell), { top: false, right: false, bottom: false, left: false })}`}
          style={
            {
              gridRow: cell.row + 1,
              gridColumn: cell.col + 1,
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
      <PieceShape piece={piece} />
    </button>
  )
}

export function PieceShape({ piece, cell }: { piece: Piece; cell?: number }) {
  const style: CSSProperties = {
    gridTemplateColumns: `repeat(${piece.cols}, var(--blast-piece-cell))`,
    gridTemplateRows: `repeat(${piece.rows}, var(--blast-piece-cell))`,
    ...(cell ? ({ '--blast-piece-cell': `${cell}px` } as CSSProperties) : {}),
  }
  return (
    <span className="blast-shape" style={style} aria-hidden>
      {piece.shape.map(([row, col]) => (
        <span
          key={`${row},${col}`}
          className={`blast-shape__cell ${itemClasses(piece.kind, pieceJoins(piece, row, col))}`}
          style={{ gridRow: row + 1, gridColumn: col + 1 }}
        />
      ))}
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
