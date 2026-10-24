import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createGame, markAnswer, parseStoredGame, type GuessGodGame } from './guessGodLogic'
import { applyServerGrade } from './guessGodLogic'
import { gradeOnServer, SERVER_GRADE_TIMEOUT_MS } from './guessGodServer'

const submitRound = vi.fn()

vi.mock('@/api/minigames', () => ({
  submitGuessGodRound: (...args: unknown[]) => submitRound(...args),
}))

const SERVER_KEY = [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]

/** A finished sheet that marked 1..5 repeating, so the server key above scores 10. */
function filledGame(roundId?: string): GuessGodGame {
  let game: GuessGodGame = { ...createGame(), ...(roundId ? { roundId } : {}) }
  SERVER_KEY.forEach((choice, index) => {
    game = markAnswer(game, index, choice as 1 | 2 | 3 | 4 | 5)
  })
  return game
}

beforeEach(() => {
  submitRound.mockReset()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('grading on the server', () => {
  it('replaces the local key with the server key and keeps the ranking info', async () => {
    submitRound.mockResolvedValue({
      score: 10,
      questionCount: 10,
      answerKey: SERVER_KEY,
      ranked: true,
      rank: { daily: 2, overall: 5, bestScoreToday: 10, bestScoreOverall: 10 },
      betterThanPercent: 99,
    })
    const graded = await gradeOnServer(filledGame('round-1'))

    expect(submitRound).toHaveBeenCalledWith('round-1', SERVER_KEY)
    expect(graded?.answerKey).toEqual(SERVER_KEY)
    expect(graded?.score).toBe(10)
    expect(graded?.gameStatus).toBe('submitted')
    expect(graded?.server).toEqual({
      ranked: true,
      rank: { daily: 2, overall: 5, bestScoreToday: 10, bestScoreOverall: 10 },
      betterThanPercent: 99,
    })
  })

  it('falls back to this device when there is no round, the server fails, or it answers too late', async () => {
    expect(await gradeOnServer(filledGame())).toBeNull()
    expect(submitRound).not.toHaveBeenCalled()

    submitRound.mockRejectedValue(new Error('offline'))
    expect(await gradeOnServer(filledGame('round-2'))).toBeNull()

    vi.useFakeTimers()
    submitRound.mockReturnValue(new Promise(() => {}))
    const pending = gradeOnServer(filledGame('round-3'))
    await vi.advanceTimersByTimeAsync(SERVER_GRADE_TIMEOUT_MS + 1)
    expect(await pending).toBeNull()
  })

  it('refuses a server key that is not ten choices of 1 to 5', () => {
    const game = filledGame('round-4')
    const grade = { ranked: false, rank: null, betterThanPercent: 0 }
    expect(applyServerGrade(game, { ...grade, answerKey: [1, 2, 3] })).toBeNull()
    expect(applyServerGrade(game, { ...grade, answerKey: [...SERVER_KEY.slice(0, 9), 6] })).toBeNull()
  })

  it('keeps the round id and the server standing when the game is read back from storage', () => {
    const graded = applyServerGrade(filledGame('round-5'), {
      answerKey: SERVER_KEY,
      ranked: false,
      rank: null,
      betterThanPercent: 40,
    })!
    const restored = parseStoredGame(JSON.stringify(graded))
    expect(restored?.roundId).toBe('round-5')
    expect(restored?.server).toEqual({ ranked: false, rank: null, betterThanPercent: 40 })
    expect(restored?.score).toBe(10)
  })
})
