import { useEffect, useMemo, useRef, useState } from 'react'
import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { Button } from '@/design-system'

export type ShuffleOutcome = { tone: 'up' | 'down' | 'plain'; label: string; text: string }

/** How long each flip shows: fast at first, then slowing down until it settles. */
const FLIP_MS = [60, 60, 65, 70, 75, 85, 95, 110, 130, 155, 185, 225, 275, 340, 420]

const TONE_ICON = { up: TrendingUp, down: TrendingDown, plain: Minus } as const

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/**
 * Flips through the outcome panels a draw could have had, quicker and then
 * slower, and stops on the one the engine already drew. It only shows the
 * result; nothing here decides it.
 */
export function OutcomeShuffle({
  title,
  caption,
  outcomes,
  targetIndex,
  continueLabel = '확인',
  onStop,
  onDone,
}: {
  title: string
  caption?: string
  /** Every outcome the draw could have had; the target's text is the one that really happened. */
  outcomes: ShuffleOutcome[]
  targetIndex: number
  continueLabel?: string
  /** Shows a button once it stops; without it the settled panel simply stays. */
  onDone?: () => void
  /** Called once, the moment it stops (or is skipped to the end). */
  onStop?: () => void
}) {
  const reduced = useMemo(prefersReducedMotion, [])
  const total = outcomes.length
  // Count back from the target so the last flip lands on it.
  const indexAt = (flip: number) => (((targetIndex - (FLIP_MS.length - flip)) % total) + total) % total
  const [flip, setFlip] = useState(reduced ? FLIP_MS.length : 0)
  const stopped = flip >= FLIP_MS.length

  // The latest onStop, so a parent re-rendering with a new callback does not call it twice.
  const stopRef = useRef(onStop)
  stopRef.current = onStop
  const reportedStop = useRef(false)

  useEffect(() => {
    if (stopped) {
      if (!reportedStop.current) {
        reportedStop.current = true
        stopRef.current?.()
      }
      return
    }
    const timer = window.setTimeout(() => setFlip(flip + 1), FLIP_MS[flip])
    return () => window.clearTimeout(timer)
  }, [flip, stopped])

  const shown = outcomes[stopped ? targetIndex : indexAt(flip)]!
  const Icon = TONE_ICON[shown.tone]

  return (
    <section className="exam-career-card exam-career-shuffle" role="status" aria-label={title}>
      <h2 className="exam-career-shuffle__title">{title}</h2>
      {caption && <p className="exam-career-shuffle__caption">{caption}</p>}
      <div
        key={stopped ? 'stopped' : flip}
        className={`exam-career-event exam-career-event--${shown.tone} exam-career-shuffle__panel${stopped ? ' is-stopped' : ''}`}
        aria-hidden={!stopped}
      >
        <Icon size={16} aria-hidden />
        <span>
          <strong>{shown.label}</strong>
          {shown.text}
        </span>
      </div>
      {!stopped ? (
        <div className="exam-career-shuffle__actions">
          <Button variant="tertiary" fullWidth onClick={() => setFlip(FLIP_MS.length)}>
            건너뛰기
          </Button>
        </div>
      ) : (
        onDone && (
          <div className="exam-career-shuffle__actions">
            <Button variant="brand" fullWidth onClick={onDone}>
              {continueLabel}
            </Button>
          </div>
        )
      )}
    </section>
  )
}
