import { useMemo } from 'react'
import { prefersReducedMotion } from './examCareerMotion'

/** A stable 0-1 number for a piece of confetti, so a render never reshuffles it. */
function unit(index: number, salt: number) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453
  return value - Math.floor(value)
}

const CONFETTI_COLORS = ['#f2c94c', '#fffdf6', '#d03d20', '#7fd0a4', '#3f8f6a']

/**
 * Paper confetti thrown up from the middle of whatever holds it. Pure
 * decoration: it carries no result, and it is left out when motion is reduced.
 */
export function Confetti({ count = 24, spread = 150, rise = 150 }: { count?: number; spread?: number; rise?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length]!,
        x: (unit(index, 1) * 2 - 1) * spread,
        y: -rise * (0.3 + unit(index, 2)),
        turn: unit(index, 3) * 540 - 270,
        delay: unit(index, 4) * 120,
      })),
    [count, spread, rise],
  )
  if (prefersReducedMotion()) return null
  return (
    <span className="exam-career-confetti" aria-hidden>
      {pieces.map((piece, index) => (
        <i
          key={index}
          style={{
            background: piece.color,
            animationDelay: `${piece.delay}ms`,
            ['--x' as string]: `${piece.x}px`,
            ['--y' as string]: `${piece.y}px`,
            ['--turn' as string]: `${piece.turn}deg`,
          }}
        />
      ))}
    </span>
  )
}
