import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  advanceTo,
  boardDurationAt,
  createGame,
  FEINT_MS,
  FEINT_WINDOW_MS,
  GAME_MS,
  getResult,
  loadBestScore,
  multiplierFor,
  pointsForStreak,
  RETURNING_MS,
  saveBestScore,
  secondsLeft,
  setPhone,
  SURVIVAL_BONUS,
  WARNING_MS,
  type SneakyPhoneState,
} from './sneakyPhoneEngine'

/**
 * random() = 0 picks the shortest of every range, so the first cycle is:
 * board 0–2400, warning 2400–2800, watching 2800–3800, returning 3800–4150.
 */
const shortest = () => 0
const longest = () => 0.999_999

const start = (random = shortest) => createGame(random)

// Every later phase draws from Math.random too; pin it to the shortest.
beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0)
})
afterEach(() => {
  window.localStorage.clear()
  vi.restoreAllMocks()
})

describe('score', () => {
  it('shows whole points without float drift', async () => {
    const { wholePoints } = await import('./sneakyPhoneEngine')
    expect(wholePoints(409.99999999)).toBe(410)
    expect(wholePoints(409.6)).toBe(409)
  })

  it('pays each tier only for the time spent in it', () => {
    expect(pointsForStreak(0, 1_000)).toBeCloseTo(100, 9)
    expect(pointsForStreak(0, 2_000)).toBeCloseTo(250, 9)
    expect(pointsForStreak(0, 3_000)).toBeCloseTo(450, 9)
    expect(pointsForStreak(0, 4_000)).toBeCloseTo(750, 9)
    expect(pointsForStreak(1_500, 2_500)).toBeCloseTo(75 + 100, 9)
  })

  it('steps the multiplier at 1, 2 and 3 seconds', () => {
    expect([0, 999, 1_000, 1_999, 2_000, 2_999, 3_000, 9_000].map(multiplierFor)).toEqual([
      1, 1, 1.5, 1.5, 2, 2, 3, 3,
    ])
  })

  it('earns the same in-game for one long hold, whatever the frame rate', () => {
    const random = longest
    const held = setPhone(start(random), true, 0, random)
    const oneStep = advanceTo(held, 3_900, random)
    let manySteps = held
    for (let at = 7; at <= 3_900; at += 7) manySteps = advanceTo(manySteps, at, random)
    manySteps = advanceTo(manySteps, 3_900, random)
    expect(oneStep.status).toBe('playing')
    expect(oneStep.score).toBeCloseTo(pointsForStreak(0, 3_900), 6)
    expect(manySteps.score).toBeCloseTo(oneStep.score, 6)
  })

  it('resets the streak when the phone is hidden but keeps the points', () => {
    let game = setPhone(start(), true, 0)
    game = setPhone(game, false, 1_500)
    expect(game.score).toBeCloseTo(175, 9)
    expect(game.streakMs).toBe(0)
    game = setPhone(game, true, 1_800)
    game = advanceTo(game, 2_300)
    // Back to ×1 for the new stretch: 0.5s × 100.
    expect(game.score).toBeCloseTo(225, 9)
    expect(game.totalPhoneMs).toBe(2_000)
  })
})

describe('teacher and catching', () => {
  it('cycles board → warning → watching → returning → board', () => {
    const phases = [0, 2_399, 2_400, 2_799, 2_800, 3_799, 3_800, 4_149, 4_150].map(
      (at) => advanceTo(start(), at).phase,
    )
    expect(phases).toEqual([
      'board', 'board', 'warning', 'warning', 'watching', 'watching', 'returning', 'returning', 'board',
    ])
  })

  it('keeps the tell at 0.4s and shortens board time as the round goes on', () => {
    expect(boardDurationAt(0, shortest)).toBe(2_400)
    expect(boardDurationAt(9_999, longest)).toBeCloseTo(4_000, 0)
    expect(boardDurationAt(10_000, shortest)).toBe(1_800)
    expect(boardDurationAt(20_000, shortest)).toBe(1_200)
    expect(boardDurationAt(29_000, longest)).toBeCloseTo(2_400, 0)
    expect(WARNING_MS).toBe(400)
  })

  it('does not catch during the tell', () => {
    let game = setPhone(start(), true, 2_000)
    game = advanceTo(game, 2_799)
    expect(game.phase).toBe('warning')
    expect(game.status).toBe('playing')
    game = setPhone(game, false, 2_799)
    game = advanceTo(game, 3_000)
    expect(game.status).toBe('playing')
  })

  // 1. Holding the phone at the exact instant the teacher turns round.
  it('catches at the exact turn and pays nothing past it', () => {
    const game = advanceTo(setPhone(start(), true, 0), 5_000)
    expect(game.status).toBe('caught')
    expect(game.endedAt).toBe(2_800)
    expect(game.score).toBeCloseTo(pointsForStreak(0, 2_800), 9)
    expect(getResult(game)).toMatchObject({ baseScore: 410, bonus: 0, finalScore: 410 })
  })

  // 2. Taking the phone out while the teacher is looking.
  it('catches a press while the teacher is watching, on the spot', () => {
    const watching = advanceTo(start(), 3_000)
    const game = setPhone(watching, true, 3_000)
    expect(game.status).toBe('caught')
    expect(game.endedAt).toBe(3_000)
    expect(game.score).toBe(0)
  })

  it('still sees you while turning back, and is safe once at the board', () => {
    expect(setPhone(advanceTo(start(), 3_900), true, 3_900).status).toBe('caught')
    const safe = setPhone(advanceTo(start(), 3_800 + RETURNING_MS), true, 3_800 + RETURNING_MS)
    expect(safe.status).toBe('playing')
    expect(safe.phase).toBe('board')
  })

  it('stops scoring once caught, and further input changes nothing', () => {
    const caught = advanceTo(setPhone(start(), true, 0), 2_800)
    expect(advanceTo(caught, 10_000)).toBe(caught)
    expect(setPhone(caught, false, 10_000)).toBe(caught)
    expect(setPhone(caught, true, 10_000)).toBe(caught)
  })
})

describe('fake turn', () => {
  /** Every phase entered over a whole round, with when it started. */
  const phasesOverRound = (random: () => number) => {
    const seen: Array<{ phase: string; at: number }> = []
    let game = createGame(random)
    for (let at = 0; at <= GAME_MS; at += 10) {
      game = advanceTo(game, at, random)
      if (seen.at(-1)?.at !== game.phaseStartedAt) seen.push({ phase: game.phase, at: game.phaseStartedAt })
    }
    return seen
  }

  // Shortest draws: feintAfter = 6000. The first watching ending past it is
  // 6950–7950, so 7950–8550 is the fake turn, then watching again until 9550
  // and only then the real turn back.
  const FAKE_AT = 7_950
  const WATCH_AGAIN_AT = FAKE_AT + FEINT_MS

  it('starts to turn back, then keeps watching the class instead', () => {
    const phases = [FAKE_AT - 1, FAKE_AT, WATCH_AGAIN_AT - 1, WATCH_AGAIN_AT, WATCH_AGAIN_AT + 999, WATCH_AGAIN_AT + 1_000].map(
      (at) => advanceTo(start(), at).phase,
    )
    expect(phases).toEqual(['watching', 'feint', 'feint', 'watching', 'watching', 'returning'])
    expect(advanceTo(start(), WATCH_AGAIN_AT + 1_000 + RETURNING_MS).phase).toBe('board')
  })

  it('catches a phone taken out during the fake turn', () => {
    const game = setPhone(advanceTo(start(), FAKE_AT + 300), true, FAKE_AT + 300)
    expect(game.status).toBe('caught')
    expect(game.endedAt).toBe(FAKE_AT + 300)
  })

  it('leaves a player who waits for the back to turn safe', () => {
    const atBoard = WATCH_AGAIN_AT + 1_000 + RETURNING_MS
    const game = advanceTo(setPhone(advanceTo(start(), atBoard), true, atBoard), atBoard + 500)
    expect(game.status).toBe('playing')
  })

  it.each([
    ['shortest', shortest],
    ['longest', longest],
  ])('happens exactly once a round, inside its window (%s draws)', (_, random) => {
    const feints = phasesOverRound(random).filter((entry) => entry.phase === 'feint')
    expect(feints).toHaveLength(1)
    expect(feints[0]!.at).toBeGreaterThanOrEqual(FEINT_WINDOW_MS.from)
    expect(feints[0]!.at).toBeLessThan(GAME_MS)
  })
})

describe('end of the round', () => {
  it('pays the survival bonus after 30 seconds without being caught', () => {
    let game = setPhone(start(), true, 0)
    game = setPhone(game, false, 1_000)
    game = advanceTo(game, 40_000)
    expect(game.status).toBe('survived')
    expect(game.endedAt).toBe(GAME_MS)
    expect(game.elapsed).toBe(GAME_MS)
    expect(secondsLeft(game)).toBe(0)
    expect(getResult(game)).toEqual({
      status: 'survived',
      baseScore: 100,
      bonus: SURVIVAL_BONUS,
      finalScore: 600,
      totalPhoneMs: 1_000,
      endedAt: GAME_MS,
    })
  })

  // 7. The bell and the teacher's turn on the same instant: the bell wins, once.
  it('lets the bell win when it rings on the same instant the teacher turns', () => {
    const lastTell: SneakyPhoneState = {
      ...start(),
      elapsed: 29_700,
      phase: 'warning',
      phaseStartedAt: 29_600,
      phaseEndsAt: GAME_MS,
      using: true,
      streakMs: 0,
    }
    const ended = advanceTo(lastTell, 30_500)
    expect(ended.status).toBe('survived')
    expect(ended.phase).toBe('warning')
    expect(ended.endedAt).toBe(GAME_MS)
    expect(advanceTo(ended, 31_000)).toBe(ended)
    expect(getResult(ended)?.bonus).toBe(SURVIVAL_BONUS)
  })

  it('catches a turn that lands just before the bell', () => {
    const lastTell: SneakyPhoneState = {
      ...start(),
      elapsed: 29_700,
      phase: 'warning',
      phaseStartedAt: 29_600,
      phaseEndsAt: 29_999,
      using: true,
    }
    const ended = advanceTo(lastTell, 30_500)
    expect(ended.status).toBe('caught')
    expect(ended.endedAt).toBe(29_999)
  })

  // 6. A fresh round right after one ends starts from nothing.
  it('starts every round clean', () => {
    const fresh = start()
    expect(fresh).toMatchObject({
      status: 'playing',
      elapsed: 0,
      phase: 'board',
      using: false,
      score: 0,
      streakMs: 0,
      totalPhoneMs: 0,
      endedAt: null,
    })
    expect(getResult(fresh)).toBeNull()
  })
})

describe('best score', () => {
  it('keeps the highest score and survives a reload', () => {
    expect(loadBestScore()).toBe(0)
    expect(saveBestScore(410)).toBe(true)
    expect(saveBestScore(300)).toBe(false)
    expect(saveBestScore(410)).toBe(false)
    expect(loadBestScore()).toBe(410)
  })

  it('ignores damaged or foreign data', () => {
    ;['nope', '{"version":2,"best":10}', '{"version":1,"best":-1}', '{"version":1,"best":1.5}'].forEach(
      (raw) => {
        window.localStorage.setItem('sneaky-phone-best', raw)
        expect(loadBestScore()).toBe(0)
      },
    )
  })
})
