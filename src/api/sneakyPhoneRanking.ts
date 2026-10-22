import { ApiError, apiFetch } from '@/api/client'
import { usePrototypeStore } from '@/store/prototypeStore'

/**
 * Every 몰폰 ranking call the screens make goes through `sneakyPhoneRankingApi`.
 *
 * VITE_MINIGAME_RANKING_API=server talks to the backend; anything else (the
 * default) runs the mock below on localStorage with the same shapes and
 * error codes, so switching needs no screen changes. Paths and shapes are
 * proposals for the backend spec - change them here only.
 */
export const rankingMode: 'mock' | 'server' =
  import.meta.env.VITE_MINIGAME_RANKING_API === 'server' ? 'server' : 'mock'

const PATHS = {
  scores: '/api/minigames/sneaky-phone/scores',
  rankings: '/api/minigames/sneaky-phone/rankings',
} as const

/** How many players the board lists. */
export const RANKING_LIMIT = 20

export type RankingEntry = {
  rank: number
  nickname: string
  score: number
  isMe: boolean
}

export type SneakyPhoneRanking = {
  entries: RankingEntry[]
  /** Null when signed out or before a first submitted score. */
  me: { rank: number; score: number } | null
  totalPlayers: number
}

export type ScoreSubmission = {
  /** The player's best after this round, which is what the board ranks. */
  bestScore: number
  rank: number
  isNewBest: boolean
}

type SneakyPhoneRankingApi = {
  /** Login required. The server keeps each player's best. */
  submitScore: (score: number) => Promise<ScoreSubmission>
  /** Public; `me` is filled when a token is sent. */
  getRanking: (limit?: number) => Promise<SneakyPhoneRanking>
}

const serverApi: SneakyPhoneRankingApi = {
  submitScore: (score) =>
    apiFetch<ScoreSubmission>(PATHS.scores, { method: 'POST', body: { score } }),
  getRanking: (limit = RANKING_LIMIT) =>
    apiFetch<SneakyPhoneRanking>(PATHS.rankings, { query: { limit } }),
}

// ---------- mock (localStorage) ----------

const MOCK_KEY = 'sneaky-phone-ranking:mock'

type MockPlayer = { nickname: string; score: number; at: number }
type MockState = Record<string, MockPlayer>

/** Classmates already on the board, so the mock never starts empty. */
const SEEDED: MockState = {
  'seed-1': { nickname: '야자탈출러', score: 4820, at: 1 },
  'seed-2': { nickname: '칠판감시자', score: 4310, at: 2 },
  'seed-3': { nickname: '몰폰장인', score: 3970, at: 3 },
  'seed-4': { nickname: '뒷자리지수', score: 3540, at: 4 },
  'seed-5': { nickname: '수능D-day', score: 3120, at: 5 },
  'seed-6': { nickname: '매점가는길', score: 2780, at: 6 },
  'seed-7': { nickname: '졸음참는중', score: 2350, at: 7 },
  'seed-8': { nickname: '단어장펼침', score: 1890, at: 8 },
  'seed-9': { nickname: '조용한민수', score: 1420, at: 9 },
  'seed-10': { nickname: '첫도전', score: 760, at: 10 },
}

function loadMock(): MockState {
  try {
    const raw = localStorage.getItem(MOCK_KEY)
    if (raw) return JSON.parse(raw) as MockState
  } catch {
    // Unreadable storage starts the mock from scratch.
  }
  return { ...SEEDED }
}

function saveMock(state: MockState) {
  try {
    localStorage.setItem(MOCK_KEY, JSON.stringify(state))
  } catch {
    // Private mode: the mock board just won't survive a reload.
  }
}

function mockUser() {
  const { authSession, currentUser } = usePrototypeStore.getState()
  if (authSession.status !== 'authenticated') return null
  return {
    id: authSession.userId ? `user-${authSession.userId}` : authSession.email,
    nickname: currentUser.displayName,
  }
}

/** Higher score first; on a tie, whoever got there first. */
function ranked(state: MockState) {
  return Object.entries(state)
    .sort(([, a], [, b]) => b.score - a.score || a.at - b.at)
    .map(([id, player], index) => ({ id, rank: index + 1, ...player }))
}

// A short wait so loading states show up in mock mode too.
const mockDelay = () => new Promise((resolve) => setTimeout(resolve, 300))

const mockApi: SneakyPhoneRankingApi = {
  async submitScore(score) {
    await mockDelay()
    const user = mockUser()
    if (!user) {
      throw new ApiError(401, { code: 'LOGIN_REQUIRED', message: '로그인이 필요해요.' })
    }
    if (!Number.isInteger(score) || score < 0) {
      throw new ApiError(400, { code: 'INVALID_SCORE', message: '올바르지 않은 점수예요.' })
    }
    const state = loadMock()
    const previous = state[user.id]
    const isNewBest = !previous || score > previous.score
    state[user.id] = isNewBest
      ? { nickname: user.nickname, score, at: Date.now() }
      : { ...previous, nickname: user.nickname }
    saveMock(state)
    const mine = ranked(state).find((player) => player.id === user.id)!
    return { bestScore: mine.score, rank: mine.rank, isNewBest }
  },

  async getRanking(limit = RANKING_LIMIT) {
    await mockDelay()
    const user = mockUser()
    const players = ranked(loadMock())
    const mine = user ? players.find((player) => player.id === user.id) : undefined
    return {
      entries: players.slice(0, limit).map((player) => ({
        rank: player.rank,
        nickname: player.nickname,
        score: player.score,
        isMe: player.id === mine?.id,
      })),
      me: mine ? { rank: mine.rank, score: mine.score } : null,
      totalPlayers: players.length,
    }
  },
}

export const sneakyPhoneRankingApi: SneakyPhoneRankingApi =
  rankingMode === 'server' ? serverApi : mockApi
