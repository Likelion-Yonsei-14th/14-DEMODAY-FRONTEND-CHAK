import { useEffect, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/design-system'
import { attemptLabel, type UniversityTierId } from './examCareerConfig'
import { universityLabel, type AdmissionRecord } from './examCareerEngine'
import { prefersReducedMotion } from './examCareerMotion'
import { Confetti } from './RevealEffects'

/** The pause before the last application opens. */
const LAST_BEAT_MS = 950
/** How long the finale plays before the career moves on to its summary. */
const FINALE_MS = 1700
/** After the last flip, how long until the choice below appears. */
const SETTLE_MS = 700

const TOP_TIERS: readonly UniversityTierId[] = ['sky']
const STRONG_TIERS: readonly UniversityTierId[] = ['sky', 'seoul-upper']

/**
 * The admission results as three applications lying face down. The player
 * turns each one over; the last one takes a beat. Whatever was accepted can
 * then be enrolled at, and the bigger the school, the bigger the finale. The
 * results were drawn by the engine already; this only shows them.
 */
export function AdmissionReveal({
  record,
  major,
  attempt,
  onEnroll,
  onRetake,
}: {
  record: AdmissionRecord
  major: string
  attempt: number
  onEnroll: (tierId: UniversityTierId | null) => void
  onRetake: () => void
}) {
  const reduced = useRef(prefersReducedMotion()).current
  const { applications } = record
  const accepted = [...new Set(applications.filter((item) => item.accepted).map((item) => item.tierId))]

  const [flipped, setFlipped] = useState<ReadonlySet<number>>(() =>
    reduced ? new Set(applications.map((_, index) => index)) : new Set(),
  )
  const [beating, setBeating] = useState<number | null>(null)
  const [settled, setSettled] = useState(reduced)
  const [finale, setFinale] = useState<UniversityTierId | null>(null)
  const allOpen = flipped.size === applications.length

  // Give the last stamp a moment to land before the choice shows.
  useEffect(() => {
    if (!allOpen || settled) return
    const timer = window.setTimeout(() => setSettled(true), SETTLE_MS)
    return () => window.clearTimeout(timer)
  }, [allOpen, settled])

  // The finale plays, then the career moves on to its summary.
  const enrollRef = useRef(onEnroll)
  enrollRef.current = onEnroll
  useEffect(() => {
    if (!finale) return
    const timer = window.setTimeout(() => enrollRef.current(finale), reduced ? 0 : FINALE_MS)
    return () => window.clearTimeout(timer)
  }, [finale, reduced])

  const flip = (indices: number[]) => setFlipped((current) => new Set([...current, ...indices]))

  const open = (index: number) => {
    if (flipped.has(index) || beating !== null) return
    const isLast = flipped.size === applications.length - 1
    if (!isLast || reduced) {
      flip([index])
      return
    }
    setBeating(index)
    window.setTimeout(() => {
      setBeating(null)
      flip([index])
    }, LAST_BEAT_MS)
  }
  const openAll = () => {
    if (beating !== null) return
    flip(applications.map((_, index) => index))
  }

  const headline = !allOpen
    ? '합격 발표'
    : accepted.length > 0
      ? '합격 발표가 났어요!'
      : '아쉽게도 모두 불합격이에요'
  const hint = !allOpen
    ? beating !== null
      ? '마지막 원서예요…'
      : '원서를 눌러 결과를 확인하세요'
    : accepted.length > 0
      ? `합격한 곳이 ${accepted.length}곳 있어요`
      : '이번에는 인연이 닿지 않았어요'

  const strong = finale ? STRONG_TIERS.includes(finale) : false
  const top = finale ? TOP_TIERS.includes(finale) : false

  return (
    <section
      className={`exam-career-section exam-career-admission${allOpen && accepted.length === 0 ? ' is-dim' : ''}${top && finale ? ' is-flash' : ''}`}
      aria-labelledby="exam-career-admission-title"
    >
      <h2 id="exam-career-admission-title">{headline}</h2>
      <p className="exam-career-section__note">{hint}</p>
      <ul className="exam-career-apps">
        {applications.map((item, index) => {
          const isOpen = flipped.has(index)
          return (
            <li key={item.group} className="exam-career-app">
              <button
                type="button"
                className={`exam-career-app__card${isOpen ? ' is-flipped' : ''}${beating === index ? ' is-beating' : ''}`}
                aria-label={isOpen ? `${item.group} ${universityLabel(item.tierId)} ${item.accepted ? '합격' : '불합격'}` : `${item.group} 원서 열기`}
                onClick={() => open(index)}
              >
                <span className="exam-career-app__inner">
                  <span className="exam-career-app__face exam-career-app__face--front">
                    <small>{item.group}</small>
                    <strong>{universityLabel(item.tierId)}</strong>
                    <em>눌러서 열기</em>
                  </span>
                  <span className={`exam-career-app__face exam-career-app__face--back ${item.accepted ? 'is-accepted' : 'is-rejected'}`}>
                    <small>
                      {item.group} · {universityLabel(item.tierId)}
                    </small>
                    <span className="exam-career-app__stamp">{item.accepted ? '합격' : '불합격'}</span>
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {!allOpen && (
        <Button variant="tertiary" fullWidth onClick={openAll} disabled={beating !== null}>
          모두 열기
        </Button>
      )}

      {settled && !finale && (
        <div className="exam-career-actions exam-career-admission__choices">
          {accepted.length === 0 && (
            <p className="exam-career-admission__soft">
              정말 고생 많았어요.
              <br />
              한 번 더 도전할지, 여기서 마무리할지는 천천히 정해도 돼요.
            </p>
          )}
          {accepted.map((tierId) => (
            <Button key={tierId} variant="brand" fullWidth onClick={() => setFinale(tierId)}>
              {universityLabel(tierId)} {major} 진학하기
            </Button>
          ))}
          <Button variant="secondary" fullWidth leadingIcon={<RotateCcw size={18} aria-hidden />} onClick={onRetake}>
            {attemptLabel(attempt + 1)} 도전하기
          </Button>
          {accepted.length === 0 && (
            <Button variant="secondary" fullWidth onClick={() => onEnroll(null)}>
              진학하지 않고 마무리하기
            </Button>
          )}
        </div>
      )}

      {finale && (
        <div className="exam-career-finale" role="status">
          <span className={`exam-career-finale__stamp${strong ? '' : ' is-calm'}`}>
            {universityLabel(finale)} 진학 확정
          </span>
          {strong && <Confetti count={top ? 36 : 16} spread={top ? 240 : 150} rise={top ? 190 : 120} />}
        </div>
      )}
    </section>
  )
}
