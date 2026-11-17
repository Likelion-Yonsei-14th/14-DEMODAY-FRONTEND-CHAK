import type { Poll, PollResults } from '@/api/polls'

/** 이보다 적게 모이면 비율이 튀어 보여서, 표 수 대신 "아직 모으는 중"이라고만 알린다. */
export const MIN_SHOWN_VOTES = 30

/**
 * 표 수를 합이 정확히 100이 되는 정수 비율로 바꾼다(가장 큰 나머지 방식).
 * 표가 하나도 없으면 모두 0.
 */
export function percentages(counts: readonly number[]): number[] {
  const total = counts.reduce((sum, n) => sum + n, 0)
  if (total === 0) return counts.map(() => 0)
  const exact = counts.map((n) => (n * 100) / total)
  const floors = exact.map(Math.floor)
  let left = 100 - floors.reduce((sum, n) => sum + n, 0)
  const order = exact
    .map((value, index) => ({ index, rest: value - floors[index]! }))
    .sort((a, b) => b.rest - a.rest || a.index - b.index)
  for (const { index } of order) {
    if (left <= 0) break
    floors[index]! += 1
    left -= 1
  }
  return floors
}

/** 가장 많이 고른 선택지의 위치. 같으면 앞의 것. 표가 없으면 -1. */
export function leaderIndex(counts: readonly number[]): number {
  let best = -1
  counts.forEach((n, index) => {
    if (n > 0 && (best === -1 || n > counts[best]!)) best = index
  })
  return best
}

/** 결과 한 줄 요약: "불수능 72% · 3,214명 참여". */
export function headline(poll: Poll, results: PollResults): string {
  const lead = leaderIndex(results.counts)
  if (lead === -1) return '아직 아무도 투표하지 않았어요'
  const percent = percentages(results.counts)[lead]
  const label = poll.options[lead]?.label ?? ''
  return results.total >= MIN_SHOWN_VOTES
    ? `${label} ${percent}% · ${results.total.toLocaleString('ko-KR')}명 참여`
    : `${label} ${percent}% · 아직 투표를 모으는 중`
}

/** 질문을 보여 줄 순서: 지금 투표할 수 있는 것, 곧 열리는 것, 닫힌 것. 같은 묶음은 서버가 준 순서 그대로. */
export function sortForDisplay(polls: readonly Poll[]): Poll[] {
  const rank = { open: 0, upcoming: 1, closed: 2 } as const
  return polls
    .map((poll, index) => ({ poll, index }))
    .sort((a, b) => {
      const byStatus = rank[a.poll.status] - rank[b.poll.status]
      if (byStatus !== 0) return byStatus
      // 곧 열리는 것은 먼저 열리는 순서로
      if (a.poll.status === 'upcoming') return a.poll.opensAt.localeCompare(b.poll.opensAt) || a.index - b.index
      return a.index - b.index
    })
    .map(({ poll }) => poll)
}

/** "11월 19일 오후 4:40에 열려요" (한국 시각). */
export function opensLabel(iso: string): string {
  const date = new Date(iso)
  const text = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
  return `${text}에 열려요`
}
