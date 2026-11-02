import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/design-system'
import { layoutSlices, SLICE_COUNT } from './wheelLayout'

export type WheelSegment = {
  id: string
  label: string
  /** The real odds; the wheel hands out whole slices in this proportion. */
  weight: number
  tone: 'up' | 'down' | 'plain'
  /** Slice colour. Plain segments alternate between this and a lighter shade. */
  color: string
  /** A mark painted on each of the segment's slices, so rare outcomes can be spotted while it spins. */
  glyph?: string
}

const SPIN_MS = 3800
const SPIN_TURNS = 5
const CENTER = { x: 100, y: 108 }
const RIM_OUTER = 96
const SLICE_OUTER = 84
const SLICE_INNER = 30
const PEG_RADIUS = 90

const STEP = 360 / SLICE_COUNT

function polar(angle: number, radius: number) {
  const radians = ((angle - 90) * Math.PI) / 180
  return [CENTER.x + radius * Math.cos(radians), CENTER.y + radius * Math.sin(radians)] as const
}

function sectorPath(from: number, to: number) {
  const [ox1, oy1] = polar(from, SLICE_OUTER)
  const [ox2, oy2] = polar(to, SLICE_OUTER)
  const [ix1, iy1] = polar(to, SLICE_INNER)
  const [ix2, iy2] = polar(from, SLICE_INNER)
  return `M${ox1} ${oy1}A${SLICE_OUTER} ${SLICE_OUTER} 0 0 1 ${ox2} ${oy2}L${ix1} ${iy1}A${SLICE_INNER} ${SLICE_INNER} 0 0 0 ${ix2} ${iy2}Z`
}

/** A stable 0-1 number for a key, so the same career always lands on the same spot of the same slice. */
function unit(key: string) {
  let hash = 2166136261
  for (let index = 0; index < key.length; index += 1) hash = Math.imul(hash ^ key.charCodeAt(index), 16777619)
  return ((hash >>> 0) % 1000) / 1000
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/**
 * A spinner that lands on a result the engine already drew. Slices are handed
 * out by the real odds, so a risky pick looks risky without any hint text. It
 * only shows the result; nothing here decides it.
 */
export function ChanceWheel({
  title,
  caption,
  segments,
  targetId,
  seedKey,
  resultText,
  continueLabel = '확인',
  onDone,
  onSkipAll,
}: {
  title: string
  caption?: string
  segments: WheelSegment[]
  targetId: string
  seedKey: string
  /** The line shown once it stops, e.g. "합격!". */
  resultText: (segment: WheelSegment) => string
  continueLabel?: string
  onDone: () => void
  /** When several wheels come in a row: skips the rest too. */
  onSkipAll?: () => void
}) {
  const reduced = useMemo(prefersReducedMotion, [])
  const owners = useMemo(() => layoutSlices(segments), [segments])
  const targetIndex = Math.max(0, segments.findIndex((segment) => segment.id === targetId))
  const target = segments[targetIndex]!

  // Land inside one of the target's slices, away from its edges, under the top flap.
  const landing = useMemo(() => {
    const own = owners.map((owner, slice) => (owner === targetIndex ? slice : -1)).filter((slice) => slice >= 0)
    const slice = own[Math.floor(unit(seedKey) * own.length)] ?? 0
    return slice * STEP + STEP * (0.25 + 0.5 * unit(`${seedKey}:offset`))
  }, [owners, targetIndex, seedKey])
  const finalRotation = SPIN_TURNS * 360 + (360 - landing)

  const wheelRef = useRef<SVGGElement>(null)
  const flapRef = useRef<SVGGElement>(null)
  const frame = useRef<number | undefined>(undefined)
  const [stopped, setStopped] = useState(reduced)
  const [hitSlice, setHitSlice] = useState<number | null>(null)

  const paint = (rotation: number, flap: number) => {
    wheelRef.current?.setAttribute('transform', `rotate(${rotation} ${CENTER.x} ${CENTER.y})`)
    flapRef.current?.setAttribute('transform', `rotate(${flap} 100 8)`)
  }

  const finish = () => {
    paint(finalRotation, 0)
    const slice = Math.floor((((360 - (finalRotation % 360)) % 360) + 360) % 360 / STEP)
    setHitSlice(slice)
    setStopped(true)
  }

  useEffect(() => {
    if (reduced) {
      finish()
      return
    }
    let start = 0
    const tick = (now: number) => {
      if (!start) start = now
      const progress = Math.min(1, (now - start) / SPIN_MS)
      const eased = 1 - Math.pow(1 - progress, 3.2)
      const rotation = finalRotation * eased
      // A peg catches the flap as it comes round, then lets it snap back.
      const phase = (rotation % STEP) / STEP
      const flap = progress < 1 ? 26 * Math.pow(phase, 2.6) : 0
      paint(rotation, flap)
      if (progress < 1) frame.current = window.requestAnimationFrame(tick)
      else finish()
    }
    frame.current = window.requestAnimationFrame(tick)
    return () => {
      if (frame.current !== undefined) window.cancelAnimationFrame(frame.current)
    }
    // finish and paint only read refs and constants of this render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalRotation, reduced])

  const skip = () => {
    if (frame.current !== undefined) window.cancelAnimationFrame(frame.current)
    finish()
  }

  const counts = segments.map((_, index) => owners.filter((owner) => owner === index).length)

  return (
    <section className="exam-career-card exam-career-wheel" role="status" aria-live="polite" aria-label={title}>
      <h2 className="exam-career-wheel__title">{title}</h2>
      {caption && <p className="exam-career-wheel__caption">{caption}</p>}
      <div className="exam-career-wheel__stage">
        <svg viewBox="0 0 200 208" className="exam-career-wheel__disc" aria-hidden>
          <defs>
            <radialGradient id="wheel-rim" cx="50%" cy="40%" r="70%">
              <stop offset="0%" stopColor="#d3a56d" />
              <stop offset="100%" stopColor="#8f6636" />
            </radialGradient>
          </defs>
          <circle cx={CENTER.x} cy={CENTER.y} r={RIM_OUTER} fill="url(#wheel-rim)" />
          <circle cx={CENTER.x} cy={CENTER.y} r={SLICE_OUTER + 1.5} fill="#fffdf6" />
          <g ref={wheelRef}>
            {owners.map((owner, slice) => {
              const segment = segments[owner]!
              const from = slice * STEP
              const to = from + STEP
              const plainShade = segment.tone === 'plain' && slice % 2 === 1
              const [gx, gy] = polar(from + STEP / 2, 72)
              return (
                <g key={slice} className={hitSlice === slice ? 'exam-career-wheel__slice is-hit' : 'exam-career-wheel__slice'}>
                  <path d={sectorPath(from, to)} fill={segment.color} opacity={plainShade ? 0.78 : 1} />
                  {segment.glyph && (
                    <text
                      x={gx}
                      y={gy}
                      fontSize="9"
                      fontWeight="800"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#fffdf6"
                      transform={`rotate(${from + STEP / 2} ${gx} ${gy})`}
                    >
                      {segment.glyph}
                    </text>
                  )}
                </g>
              )
            })}
            {owners.map((_, slice) => {
              const [px, py] = polar(slice * STEP, PEG_RADIUS)
              return <circle key={`peg-${slice}`} cx={px} cy={py} r="2.1" fill="#fffdf6" stroke="#6b4a24" strokeWidth="0.8" />
            })}
          </g>
          <circle cx={CENTER.x} cy={CENTER.y} r={SLICE_INNER - 1} fill="#fffdf6" stroke="#b98b56" strokeWidth="3" />
          <circle cx={CENTER.x} cy={CENTER.y} r="10" fill="#2f5b48" />
          <g ref={flapRef} transform="rotate(0 100 8)">
            <path d="M93 3h14l-4 21q-3 5-6 0z" fill="#d03d20" stroke="#fffdf6" strokeWidth="1.6" strokeLinejoin="round" />
            <circle cx="100" cy="8" r="2.6" fill="#fffdf6" />
          </g>
        </svg>
      </div>
      <ul className="exam-career-wheel__legend">
        {segments.map((segment, index) => {
          const share = segment.weight / segments.reduce((sum, item) => sum + item.weight, 0)
          return (
            <li key={segment.id} className={stopped && segment === target ? 'is-hit' : undefined}>
              <i style={{ background: segment.color }} aria-hidden>
                {segment.glyph}
              </i>
              <span>{segment.label}</span>
              <small>
                {share >= 0.1 ? Math.round(share * 100) : (Math.round(share * 1000) / 10).toString()}%
                <span className="exam-career-wheel__slices"> · {counts[index]}칸</span>
              </small>
            </li>
          )
        })}
      </ul>
      <p className={`exam-career-wheel__result${stopped ? ' is-visible' : ''} exam-career-wheel__result--${stopped ? target.tone : 'plain'}`}>
        {stopped ? resultText(target) : ' '}
      </p>
      <div className="exam-career-wheel__actions">
        {stopped ? (
          <Button variant="brand" fullWidth onClick={onDone}>
            {continueLabel}
          </Button>
        ) : (
          <Button variant="tertiary" fullWidth onClick={skip}>
            건너뛰기
          </Button>
        )}
        {onSkipAll && !stopped && (
          <Button variant="tertiary" fullWidth onClick={onSkipAll}>
            남은 것도 모두 건너뛰기
          </Button>
        )}
      </div>
    </section>
  )
}
