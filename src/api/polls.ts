import { apiFetch } from '@/api/client'
import { getVisitorGeo } from '@/api/geo'

export type PollOption = { id: number; label: string }

/** 지역 하나의 결과. counts는 options와 같은 순서. */
export type PollRegionResult = { region: string; total: number; counts: number[] }

/** 투표했거나 닫힌 질문에만 온다. regions는 표가 일정 수 이상 모인 지역만, 많은 순서. */
export type PollResults = { total: number; counts: number[]; regions: PollRegionResult[] }

export type PollStatus = 'upcoming' | 'open' | 'closed'

export type Poll = {
  id: number
  slug: string
  tag: string
  question: string
  opensAt: string
  closesAt: string | null
  status: PollStatus
  options: PollOption[]
  myOptionId: number | null
  /** 투표할 때의 시·도 이름("서울"). 위치를 몰랐으면 null. */
  myRegion: string | null
  results: PollResults | null
}

export type PollList = { now: string; polls: Poll[] }

/** 지금 열린 질문과 곧 열릴 질문, 최근에 닫힌 질문. 로그인 없이 볼 수 있다. */
export function fetchPolls() {
  return apiFetch<PollList>('/api/public/polls', { quiet: true })
}

/** 한 표를 넣고 결과를 받는다. 이미 고른 질문이면 처음 고른 답 그대로 결과만 온다. */
export async function votePoll(pollId: number, optionId: number) {
  const geo = await getVisitorGeo()
  return apiFetch<Poll>(`/api/public/polls/${pollId}/votes`, {
    method: 'POST',
    body: { optionId, geoCountry: geo?.country ?? undefined, geoRegion: geo?.region ?? undefined },
  })
}

// ---- 운영 콘솔 ----

export type AdminPoll = Omit<Poll, 'myOptionId' | 'myRegion'> & { sortOrder: number; hidden: boolean }

export type AdminPollInput = {
  slug: string
  tag: string
  question: string
  options: string[]
  opensAt: string
  closesAt: string | null
  sortOrder?: number
}

export const fetchAdminPolls = () => apiFetch<AdminPoll[]>('/api/admin/polls')

export const createAdminPoll = (input: AdminPollInput) =>
  apiFetch<AdminPoll>('/api/admin/polls', { method: 'POST', body: input })

export const updateAdminPoll = (
  pollId: number,
  patch: { hidden?: boolean; opensAt?: string; closesAt?: string; clearClosesAt?: boolean },
) => apiFetch<AdminPoll>(`/api/admin/polls/${pollId}`, { method: 'PATCH', body: patch })
