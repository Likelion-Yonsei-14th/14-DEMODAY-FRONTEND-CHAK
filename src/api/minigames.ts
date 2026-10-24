import { ApiError, apiFetch } from '@/api/client'

export type MinigameNickname = {
  /** 직접 정한 닉네임. 아직 정하지 않았으면 null. */
  nickname: string | null
  /** 정하지 않았을 때 랭킹에 보이는 이름(이름 첫 글자 + **). */
  defaultNickname: string
}

/** 서버 규칙과 같다: 앞뒤 공백을 뺀 2~12자, 한글·영문·숫자·밑줄·공백. */
export const NICKNAME_MIN = 2
export const NICKNAME_MAX = 12
const NICKNAME_PATTERN = /^[0-9A-Za-z가-힣_ ]+$/

export const fetchMinigameNickname = () =>
  apiFetch<MinigameNickname>('/api/minigames/me/nickname', { quiet: true })

export const saveMinigameNickname = (nickname: string) =>
  apiFetch<MinigameNickname>('/api/minigames/me/nickname', { method: 'PUT', body: { nickname: nickname.trim() } })

/** 서버에 보내기 전에 걸러 낼 수 있는 형식 오류. 괜찮으면 null. */
export function nicknameFormatError(raw: string): string | null {
  const nickname = raw.trim()
  if (nickname.length < NICKNAME_MIN || nickname.length > NICKNAME_MAX) {
    return `닉네임은 ${NICKNAME_MIN}~${NICKNAME_MAX}자로 입력해 주세요.`
  }
  if (!NICKNAME_PATTERN.test(nickname)) {
    return '한글, 영문, 숫자, 밑줄(_)만 쓸 수 있어요.'
  }
  return null
}

/** 닉네임 저장이 실패했을 때 사용자에게 보여 줄 문구. */
export function nicknameErrorText(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'NICKNAME_NOT_ALLOWED':
        return '쓸 수 없는 표현이 들어 있어요. 다른 닉네임을 입력해 주세요.'
      case 'INVALID_NICKNAME':
        return '한글, 영문, 숫자, 밑줄(_)만 써서 2~12자로 입력해 주세요.'
      case 'UNAUTHORIZED':
        return '로그인이 만료됐어요. 다시 로그인한 뒤 시도해 주세요.'
      case 'TOO_MANY_EVENTS':
        return '잠시 뒤에 다시 시도해 주세요.'
    }
    if (error.status === 429) return '잠시 뒤에 다시 시도해 주세요.'
  }
  return '지금은 저장하지 못했어요. 잠시 뒤에 다시 시도해 주세요.'
}

// ---------- 랭킹·통계·판 발급 ----------

export type LeaderboardPeriod = 'daily' | 'overall'

export type LeaderboardEntry = { rank: number; nickname: string; score: number; me: boolean }
export type MyStanding = { rank: number; score: number }
export type MinigameRank = { daily: number; overall: number; bestScoreToday: number; bestScoreOverall: number }

export type Leaderboard = {
  period: LeaderboardPeriod
  entries: LeaderboardEntry[]
  /** 로그인했고 이 기간에 기록이 있을 때만. */
  me: MyStanding | null
  /** 찍신만: distribution[i] = i점을 받은 판 수(비회원 포함). */
  distribution?: number[]
  totalRounds?: number
}

export type GuessGodRound = { roundId: string; questionCount: number; choiceCount: number; expiresAt: string }
export type GuessGodGrade = {
  score: number
  questionCount: number
  answerKey: number[]
  /** 로그인 회원이 낸 판만 true. */
  ranked: boolean
  rank: MinigameRank | null
  betterThanPercent: number
}

export type SneakyPhoneRound = { roundId: string; gameMs: number; expiresAt: string }
export type SneakyPhoneSubmission = {
  status: 'caught' | 'survived'
  baseScore: number
  endedAt: number
  totalPhoneMs: number
}
export type SneakyPhoneGrade = { finalScore: number; baseScore: number; bonus: number; ranked: boolean; rank: MinigameRank | null }

export type StudyTypeShare = { code: string; count: number; percent: number }
export type StudyTypeStats = { total: number; myCode: string | null; distribution: StudyTypeShare[] }

const BASE = '/api/public/minigames'

export const createGuessGodRound = () => apiFetch<GuessGodRound>(`${BASE}/guess-god/rounds`, { method: 'POST', quiet: true })

export const submitGuessGodRound = (roundId: string, answers: Array<number | null>) =>
  apiFetch<GuessGodGrade>(`${BASE}/guess-god/rounds/${encodeURIComponent(roundId)}/submit`, {
    method: 'POST',
    body: { answers },
    quiet: true,
  })

export const fetchGuessGodLeaderboard = (period: LeaderboardPeriod) =>
  apiFetch<Leaderboard>(`${BASE}/guess-god/leaderboard`, { query: { period }, quiet: true })

export const createSneakyPhoneRound = () => apiFetch<SneakyPhoneRound>(`${BASE}/sneaky-phone/rounds`, { method: 'POST', quiet: true })

export const submitSneakyPhoneRound = (roundId: string, result: SneakyPhoneSubmission) =>
  apiFetch<SneakyPhoneGrade>(`${BASE}/sneaky-phone/rounds/${encodeURIComponent(roundId)}/submit`, {
    method: 'POST',
    body: {
      status: result.status,
      baseScore: result.baseScore,
      endedAt: result.endedAt,
      totalPhoneMs: result.totalPhoneMs,
    },
    quiet: true,
  })

export const fetchSneakyPhoneLeaderboard = (period: LeaderboardPeriod) =>
  apiFetch<Leaderboard>(`${BASE}/sneaky-phone/leaderboard`, { query: { period }, quiet: true })

export const recordStudyType = (code: string) =>
  apiFetch<StudyTypeStats>(`${BASE}/study-type/results`, { method: 'POST', body: { code }, quiet: true })

export const fetchStudyTypeStats = () => apiFetch<StudyTypeStats>(`${BASE}/study-type/stats`, { quiet: true })
