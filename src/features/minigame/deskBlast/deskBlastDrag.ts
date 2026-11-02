import { useEffect, useRef, useState } from 'react'
import { BOARD_SIZE, type Piece } from './deskBlastEngine'

/** Pixels the dragged piece floats above the finger, so the finger never covers it. */
export const DRAG_LIFT_PX = 56

export type DragState = { slot: number; x: number; y: number }

/** Where a piece being dragged would land, from where its preview sits over the board. */
export function dropTarget(
  piece: Piece,
  preview: { left: number; top: number },
  boardRect: { left: number; top: number; width: number },
): { row: number; col: number } {
  void piece
  const cell = boardRect.width / BOARD_SIZE
  return {
    row: Math.round((preview.top - boardRect.top) / cell),
    col: Math.round((preview.left - boardRect.left) / cell),
  }
}

/** The top-left cell for a piece set down by tapping a cell, with the piece centered on that cell. */
export function tapAnchor(piece: Piece, row: number, col: number) {
  const clamp = (value: number, max: number) => Math.min(Math.max(value, 0), Math.max(0, max))
  return {
    row: clamp(row - Math.floor(piece.rows / 2), BOARD_SIZE - piece.rows),
    col: clamp(col - Math.floor(piece.cols / 2), BOARD_SIZE - piece.cols),
  }
}

export type ClearEffect = {
  key: number
  cells: readonly { row: number; col: number; cell: number }[]
  /** 1 = a plain clear, up to 3 as the combo climbs. */
  level: 1 | 2 | 3
}

/** Keeps an animation's entry for `ttlMs`, then drops it. */
export function useExpiring<T extends { key: number }>(ttlMs: number) {
  const [items, setItems] = useState<readonly T[]>([])
  const timers = useRef<number[]>([])

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer))
    },
    [],
  )

  const add = (item: T) => {
    setItems((current) => [...current, item])
    timers.current.push(
      window.setTimeout(() => setItems((current) => current.filter((entry) => entry.key !== item.key)), ttlMs),
    )
  }

  return [items, add] as const
}
