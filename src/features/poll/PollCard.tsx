import { useState } from 'react'
import { Check, Clock3, Share2 } from 'lucide-react'
import { ApiError } from '@/api/client'
import { votePoll, type Poll } from '@/api/polls'
import { MIN_SHOWN_VOTES, opensLabel, percentages } from './pollResults'
import { sharePollResult } from './pollShare'

type Scope = { kind: 'all' } | { kind: 'region'; region: string }

/**
 * 질문 한 개. 열린 질문은 선택지를 누르면 바로 한 표가 들어가고 결과로 바뀐다.
 * 결과는 전국과, 표가 충분히 모인 시·도별로 나눠 볼 수 있다.
 */
export function PollCard({ poll, onChange, compact = false }: { poll: Poll; onChange: (next: Poll) => void; compact?: boolean }) {
  const [pending, setPending] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scope, setScope] = useState<Scope>({ kind: 'all' })
  const [shareNote, setShareNote] = useState<string | null>(null)

  const vote = async (optionId: number) => {
    if (pending !== null) return
    setPending(optionId)
    setError(null)
    try {
      onChange(await votePoll(poll.id, optionId))
    } catch (cause) {
      setError(
        cause instanceof ApiError && cause.code === 'POLL_NOT_OPEN'
          ? '지금은 투표할 수 없는 질문이에요.'
          : cause instanceof ApiError && cause.status === 429
            ? '투표가 너무 많아요. 잠시 후 다시 눌러 주세요.'
            : '투표하지 못했어요. 다시 눌러 주세요.',
      )
    } finally {
      setPending(null)
    }
  }

  const results = poll.results
  const regions = results?.regions ?? []
  const regionResult = scope.kind === 'region' ? regions.find((r) => r.region === scope.region) : undefined
  const counts = regionResult?.counts ?? results?.counts ?? []
  const total = regionResult?.total ?? results?.total ?? 0
  const percent = percentages(counts)
  // 내 지역을 맨 앞에, 나머지는 표가 많은 순서로
  const chips = [...regions].sort((a, b) => (a.region === poll.myRegion ? -1 : b.region === poll.myRegion ? 1 : 0)).slice(0, 6)

  const share = async () => {
    if (!results) return
    setShareNote(null)
    const outcome = await sharePollResult(poll, results)
    if (outcome === 'downloaded') setShareNote('결과 이미지를 저장했어요.')
    if (outcome === 'failed') setShareNote('이미지를 만들지 못했어요.')
  }

  return (
    <article className={['poll-card', compact ? 'poll-card--compact' : ''].filter(Boolean).join(' ')} aria-labelledby={`poll-${poll.id}`}>
      <header className="poll-card__head">
        <span className="poll-card__tag">{poll.tag}</span>
        {poll.status === 'closed' && <span className="poll-card__state">마감</span>}
        {poll.status === 'upcoming' && (
          <span className="poll-card__state">
            <Clock3 size={12} aria-hidden /> {opensLabel(poll.opensAt)}
          </span>
        )}
      </header>
      <h3 id={`poll-${poll.id}`} className="poll-card__question">{poll.question}</h3>

      {results ? (
        <>
          {regions.length > 0 && (
            <div className="poll-card__scopes" role="group" aria-label="결과 범위">
              <button type="button" aria-pressed={scope.kind === 'all'} onClick={() => setScope({ kind: 'all' })}>
                전국
              </button>
              {chips.map((r) => (
                <button
                  key={r.region}
                  type="button"
                  aria-pressed={scope.kind === 'region' && scope.region === r.region}
                  onClick={() => setScope({ kind: 'region', region: r.region })}
                >
                  {r.region}
                  {r.region === poll.myRegion ? ' (내 지역)' : ''}
                </button>
              ))}
            </div>
          )}
          <ol className="poll-card__results">
            {poll.options.map((option, index) => {
              const mine = option.id === poll.myOptionId
              const top = percent[index] === Math.max(...percent) && total > 0
              return (
                <li key={option.id} className={[mine ? 'is-mine' : '', top ? 'is-top' : '', top && (percent[index] ?? 0) >= 35 ? 'is-wide' : ''].filter(Boolean).join(' ')}>
                  <span className="poll-card__bar" style={{ width: `${percent[index] ?? 0}%` }} aria-hidden />
                  <span className="poll-card__label">
                    {mine && <Check size={14} aria-label="내 선택" />}
                    {option.label}
                  </span>
                  <span className="poll-card__percent">{percent[index] ?? 0}%</span>
                </li>
              )
            })}
          </ol>
          <footer className="poll-card__foot">
            <span>
              {total >= MIN_SHOWN_VOTES
                ? `${scope.kind === 'region' ? `${scope.region} ` : ''}${total.toLocaleString('ko-KR')}명 참여`
                : '아직 투표를 모으는 중이에요'}
            </span>
            {!compact && (
              <button type="button" className="poll-card__share" onClick={share}>
                <Share2 size={14} aria-hidden /> 결과 공유
              </button>
            )}
          </footer>
          {shareNote && <p className="poll-card__note">{shareNote}</p>}
        </>
      ) : (
        <ul className="poll-card__options">
          {poll.options.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                disabled={poll.status !== 'open' || pending !== null}
                aria-busy={pending === option.id}
                onClick={() => vote(option.id)}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {poll.status === 'open' && !results && <p className="poll-card__hint">투표하면 다른 수험생들의 결과가 보여요</p>}
      {error && (
        <p role="alert" className="poll-card__error">
          {error}
        </p>
      )}
    </article>
  )
}
