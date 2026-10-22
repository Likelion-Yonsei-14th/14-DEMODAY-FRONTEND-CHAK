import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/client'
import { rankingMode, sneakyPhoneRankingApi } from '@/api/sneakyPhoneRanking'
import { usePrototypeStore } from '@/store/prototypeStore'

// The mock waits a little to show loading states; skip that in tests.
async function settle<T>(promise: Promise<T>) {
  await vi.runAllTimersAsync()
  return promise
}

function signInAs(email: string, displayName: string) {
  usePrototypeStore.setState((state) => ({
    authSession: { status: 'authenticated', email, provider: 'password' },
    currentUser: { ...state.currentUser, displayName },
  }))
}

describe('sneaky phone ranking mock api', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    usePrototypeStore.setState({ authSession: { status: 'anonymous' } })
  })

  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  it('runs as the mock unless VITE_MINIGAME_RANKING_API=server', () => {
    expect(rankingMode).toBe('mock')
  })

  it('shows the seeded board to signed-out players without a rank of their own', async () => {
    const ranking = await settle(sneakyPhoneRankingApi.getRanking())
    expect(ranking.entries[0]).toMatchObject({ rank: 1, nickname: '야자탈출러', isMe: false })
    expect(ranking.entries.map((entry) => entry.score)).toEqual(
      [...ranking.entries.map((entry) => entry.score)].sort((a, b) => b - a),
    )
    expect(ranking.me).toBeNull()
  })

  it('needs a login to submit', async () => {
    const caught = sneakyPhoneRankingApi.submitScore(100).catch((error: unknown) => error)
    await vi.runAllTimersAsync()
    expect(await caught).toBeInstanceOf(ApiError)
  })

  it('ranks a player by their best score only', async () => {
    signInAs('jisu@example.com', '지수')
    expect(await settle(sneakyPhoneRankingApi.submitScore(4000))).toEqual({
      bestScore: 4000,
      rank: 3,
      isNewBest: true,
    })
    expect(await settle(sneakyPhoneRankingApi.submitScore(1000))).toEqual({
      bestScore: 4000,
      rank: 3,
      isNewBest: false,
    })

    const ranking = await settle(sneakyPhoneRankingApi.getRanking())
    expect(ranking.me).toEqual({ rank: 3, score: 4000 })
    expect(ranking.entries.filter((entry) => entry.isMe)).toEqual([
      { rank: 3, nickname: '지수', score: 4000, isMe: true },
    ])
  })

  it('puts the earlier record first on a tie and respects the limit', async () => {
    signInAs('jisu@example.com', '지수')
    await settle(sneakyPhoneRankingApi.submitScore(4820))
    const ranking = await settle(sneakyPhoneRankingApi.getRanking(2))
    expect(ranking.entries.map((entry) => entry.nickname)).toEqual(['야자탈출러', '지수'])
    expect(ranking.totalPlayers).toBe(11)
  })
})
