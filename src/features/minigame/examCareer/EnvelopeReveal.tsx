import { useEffect, useMemo, useRef, useState } from 'react'
import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { Button } from '@/design-system'
import { prefersReducedMotion } from './examCareerMotion'
import { Confetti } from './RevealEffects'

export type RevealTone = 'up' | 'down' | 'plain'

const WIGGLE_MS = 620
const TONE_ICON = { up: TrendingUp, down: TrendingDown, plain: Minus } as const

/**
 * An envelope that waits to be opened. The player opens it (tap or Enter),
 * it shakes, and the letter that slides out holds what the engine already
 * drew. It only shows the result; nothing here decides it, and the other
 * possible outcomes are never listed.
 */
export function EnvelopeReveal({
  title,
  caption,
  tone,
  label,
  text,
  big = false,
  continueLabel = '확인',
  onStop,
  onDone,
}: {
  title: string
  caption?: string
  tone: RevealTone
  label: string
  /** What happened, read under the envelope once it is open. */
  text: string
  /** A rare, very good result: the confetti is thrown with more force. */
  big?: boolean
  continueLabel?: string
  /** Called once, the moment the letter is out (or the envelope was skipped open). */
  onStop?: () => void
  /** Shows a button once it is open; without it the opened letter simply stays. */
  onDone?: () => void
}) {
  const reduced = useMemo(prefersReducedMotion, [])
  const [phase, setPhase] = useState<'closed' | 'shaking' | 'open'>(reduced ? 'open' : 'closed')
  const open = phase === 'open'

  // The latest onStop, so a parent re-rendering with a new callback does not call it twice.
  const stopRef = useRef(onStop)
  stopRef.current = onStop
  const reportedStop = useRef(false)

  useEffect(() => {
    if (phase === 'shaking') {
      const timer = window.setTimeout(() => setPhase('open'), WIGGLE_MS)
      return () => window.clearTimeout(timer)
    }
    if (phase === 'open' && !reportedStop.current) {
      reportedStop.current = true
      stopRef.current?.()
    }
  }, [phase])

  const Icon = TONE_ICON[tone]
  const pull = () => setPhase((current) => (current === 'closed' ? 'shaking' : current))

  return (
    <section className="exam-career-card exam-career-reveal" role="status" aria-label={title}>
      <h2 className="exam-career-reveal__title">{title}</h2>
      {caption && <p className="exam-career-reveal__caption">{caption}</p>}
      <div className="exam-career-reveal__stage">
        <button
          type="button"
          className={`exam-career-envelope exam-career-envelope--${tone}${phase === 'shaking' ? ' is-shaking' : ''}${open ? ' is-open' : ''}`}
          aria-label={open ? '열린 봉투' : '봉투 열기'}
          onClick={pull}
        >
          <span className="exam-career-envelope__back" />
          <span className="exam-career-envelope__letter">
            {open && (
              <>
                <Icon size={20} aria-hidden />
                <strong>{label}</strong>
              </>
            )}
          </span>
          <span className="exam-career-envelope__front" />
          <span className="exam-career-envelope__flap" />
        </button>
        {open && tone === 'up' && <Confetti count={big ? 30 : 10} spread={big ? 170 : 90} rise={big ? 160 : 90} />}
        {!open && <p className="exam-career-reveal__hint">봉투를 눌러 열어 보세요</p>}
      </div>
      {open && (
        <p className={`exam-career-event exam-career-event--${tone} exam-career-reveal__text`}>
          <span>{text}</span>
        </p>
      )}
      {!open ? (
        <div className="exam-career-reveal__actions">
          <Button variant="tertiary" fullWidth onClick={() => setPhase('open')}>
            건너뛰기
          </Button>
        </div>
      ) : (
        onDone && (
          <div className="exam-career-reveal__actions">
            <Button variant="brand" fullWidth onClick={onDone}>
              {continueLabel}
            </Button>
          </div>
        )
      )}
    </section>
  )
}
