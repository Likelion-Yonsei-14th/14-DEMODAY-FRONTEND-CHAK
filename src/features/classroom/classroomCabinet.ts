/**
 * The wooden cubby cabinet drawn into classroom-day/night.webp (right wall).
 * Measured on the 2688 × 1152 artwork: the front face is a perspective quad
 * whose vertical edges stay vertical, so each door is found by interpolating
 * between the face's top and bottom edges.
 */
const ART_W = 2688
const ART_H = 1152

const FACE = {
  left: 2268,
  right: 2597,
  topLeft: 498,
  topRight: 515,
  bottomLeft: 855,
  bottomRight: 1000,
}

/** Door column edges (x) and row edges (fraction of the face height) */
const COLUMN_EDGES = [2268, 2362, 2466, 2597]
const ROW_EDGES = [0, 0.342, 0.672, 1]

export const CABINET_COLUMNS = COLUMN_EDGES.length - 1
export const CABINET_ROWS = ROW_EDGES.length - 1
export const CABINET_CELLS = CABINET_COLUMNS * CABINET_ROWS

function faceY(x: number, fraction: number) {
  const t = (x - FACE.left) / (FACE.right - FACE.left)
  const top = FACE.topLeft + (FACE.topRight - FACE.topLeft) * t
  const bottom = FACE.bottomLeft + (FACE.bottomRight - FACE.bottomLeft) * t
  return top + (bottom - top) * fraction
}

const pct = (value: number, total: number) => `${((value / total) * 100).toFixed(2)}%`

export type CabinetCell = {
  /** CSS clip-path polygon in % of the classroom world */
  clipPath: string
  /** Where the name card goes, % of the world */
  labelLeft: string
  labelTop: string
  /** Tilt that follows the perspective of the door's top edge */
  labelAngle: number
}

/** Doors in reading order: top row left to right, then the rows below. */
export const cabinetCells: CabinetCell[] = Array.from(
  { length: CABINET_CELLS },
  (_, index) => {
    const row = Math.floor(index / CABINET_COLUMNS)
    const column = index % CABINET_COLUMNS
    // a hair inside the drawn door lines
    const inset = 3
    const x0 = COLUMN_EDGES[column]! + inset
    const x1 = COLUMN_EDGES[column + 1]! - inset
    const f0 = ROW_EDGES[row]!
    const f1 = ROW_EDGES[row + 1]!
    const points = [
      [x0, faceY(x0, f0) + inset],
      [x1, faceY(x1, f0) + inset],
      [x1, faceY(x1, f1) - inset],
      [x0, faceY(x0, f1) - inset],
    ]
    const labelFraction = f0 + (f1 - f0) * 0.2
    const midX = (x0 + x1) / 2
    const slope = (faceY(x1, labelFraction) - faceY(x0, labelFraction)) / (x1 - x0)

    return {
      clipPath: `polygon(${points
        .map(([x, y]) => `${pct(x!, ART_W)} ${pct(y!, ART_H)}`)
        .join(', ')})`,
      labelLeft: pct(midX, ART_W),
      labelTop: pct(faceY(midX, labelFraction), ART_H),
      labelAngle: Math.round((Math.atan(slope) * 180) / Math.PI),
    }
  },
)
