import { useEffect, useMemo, useState } from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { Button } from '@/design-system'

export type ShuffleOutcome = { tone: 'up' | 'down'; text: string }

/** How long each flip shows: fast at first, then slowing down until it settles. */
const FLIP_MS = [60, 60, 65, 70, 75, 85, 95, 110, 130, 155, 185, 225, 275, 340, 420]

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/**
 * Flips through the outcome panels of a risky pick, quicker and then slower,
 * and stops on the one the engine already drew. It only shows the result;
 * nothing here decides it.
 */
export function OutcomeShuffle({
  title,
  caption,
  outcomes,
  targetIndex,
  onDone,
}: {
  title: string
  caption?: string
  /** Every outcome the pick could have had; the target's text is the one that really happened. */
  outcomes: ShuffleOutcome[]
  targetIndex: number
  onDone: () => void
}) {
  const reduced = useMemo(prefersReducedMotion, [])
  const total = outcomes.length
  // Count back from the target so the last flip lands on it.
  const indexAt = (flip: number) => (((targetIndex - (FLIP_MS.length - flip)) % total) + total) % total
  const [flip, setFlip] = useState(reduced ? FLIP_MS.length : 0)
  const stopped = flip >= FLIP_MS.length

  useEffect(() => {
    if (stopped) return
    const timer = window.setTimeout(() => setFlip(flip + 1), FLIP_MS[flip])
    return () => window.clearTimeout(timer)
  }, [flip, stopped])

  const shown = outcomes[stopped ? targetIndex : indexAt(flip)]!

  return (
    <section className="exam-career-card exam-career-shuffle" role="status" aria-label={title}>
      <h2 className="exam-career-shuffle__title">{title}</h2>
      {caption && <p className="exam-career-shuffle__caption">{caption}</p>}
      <div
        key={stopped ? 'stopped' : flip}
        className={`exam-career-event exam-career-event--${shown.tone} exam-career-shuffle__panel${stopped ? ' is-stopped' : ''}`}
        aria-hidden={!stopped}
      >
        {shown.tone === 'up' ? <TrendingUp size={16} aria-hidden /> : <TrendingDown size={16} aria-hidden />}
        <span>
          <strong>{shown.tone === 'up' ? '잘 풀렸어요' : '꼬였어요'}</strong>
          {shown.text}
        </span>
      </div>
      <div className="exam-career-shuffle__actions">
        {stopped ? (
          <Button variant="brand" fullWidth onClick={onDone}>
            확인
          </Button>
        ) : (
          <Button variant="tertiary" fullWidth onClick={() => setFlip(FLIP_MS.length)}>
            건너뛰기
          </Button>
        )}
      </div>
    </section>
  )
}
