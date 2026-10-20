import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ALL_OUTCOMES,
  canSubmit,
  CHOICE_COUNT,
  classifyMarkingStyle,
  clearGame,
  countMarked,
  createGame,
  EXPECTED_SCORE,
  formatOdds,
  generateAnswerKey,
  gradeAnswers,
  loadGame,
  markAnswer,
  parseStoredGame,
  probabilityAtLeast,
  probabilityExactly,
  QUESTION_COUNT,
  saveGame,
  scoreAnswers,
  secureRandomInt,
  submitGame,
  waysAtLeast,
  waysExactly,
  type Choice,
  type GuessGodGame,
  type RandomInt,
} from './guessGodLogic'
import { GUESS_GOD_RESULTS, getGuessGodResult, parseSharedScore } from './guessGodResults'

/** Replays the given 1-5 answers as a random source. */
const fixedKey = (key: Choice[]): RandomInt => {
  let index = 0
  return () => key[index++ % key.length]! - 1
}

function filledGame(key: Choice[], answers: Choice[]) {
  let game = createGame(fixedKey(key))
  answers.forEach((choice, index) => {
    game = markAnswer(game, index, choice)
  })
  return game
}

beforeEach(() => clearGame())
afterEach(() => {
  clearGame()
  vi.restoreAllMocks()
})

describe('answer key', () => {
  it('has exactly 10 answers, each an integer from 1 to 5', () => {
    for (let round = 0; round < 200; round += 1) {
      const key = createGame().answerKey
      expect(key).toHaveLength(QUESTION_COUNT)
      key.forEach((answer) => {
        expect(Number.isInteger(answer)).toBe(true)
        expect(answer).toBeGreaterThanOrEqual(1)
        expect(answer).toBeLessThanOrEqual(5)
      })
    }
  })

  it('keeps runs and uneven keys exactly as drawn', () => {
    expect(generateAnswerKey(() => 0)).toEqual(Array(10).fill(1))
    const mixed: Choice[] = [2, 4, 1, 5, 3, 2, 2, 4, 1, 5]
    expect(generateAnswerKey(fixedKey(mixed))).toEqual(mixed)
  })

  it('draws every number with equal odds', () => {
    const counts = [0, 0, 0, 0, 0]
    const draws = 50_000
    for (let index = 0; index < draws; index += 1) counts[secureRandomInt(CHOICE_COUNT)]! += 1
    // Chi-square with 4 degrees of freedom; 18.47 is the 0.1% critical value.
    const expected = draws / CHOICE_COUNT
    const chiSquare = counts.reduce((sum, count) => sum + (count - expected) ** 2 / expected, 0)
    expect(chiSquare).toBeLessThan(18.47)
  })

  it('rejects the uneven top of the 32-bit range instead of folding it in', () => {
    // 2^32 % 5 = 1, so 4294967295 is the one value that would bias toward 0.
    const values = [4294967295, 7]
    vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation((buffer) => {
      ;(buffer as Uint32Array)[0] = values.shift()!
      return buffer
    })
    expect(secureRandomInt(5)).toBe(2)
    expect(values).toHaveLength(0)
  })

  it('does not change while marking, re-marking or submitting', () => {
    let game = createGame()
    const key = [...game.answerKey]
    for (let index = 0; index < QUESTION_COUNT; index += 1) {
      game = markAnswer(game, index, 1)
      game = markAnswer(game, index, ((index % 5) + 1) as Choice)
    }
    game = submitGame(game)
    expect(game.answerKey).toEqual(key)
  })

  it('starts a different game on retry', () => {
    const first = createGame()
    const second = createGame()
    expect(second.gameId).not.toBe(first.gameId)
  })
})

describe('marking', () => {
  it('keeps one answer per question and lets it change before submit', () => {
    let game = createGame()
    game = markAnswer(game, 0, 3)
    game = markAnswer(game, 0, 5)
    expect(game.userAnswers[0]).toBe(5)
    expect(countMarked(game)).toBe(1)
  })

  it('ignores out-of-range questions and choices', () => {
    const game = createGame()
    expect(markAnswer(game, 10, 1)).toBe(game)
    expect(markAnswer(game, -1, 1)).toBe(game)
    expect(markAnswer(game, 0, 6 as Choice)).toBe(game)
    expect(markAnswer(game, 0, 0 as Choice)).toBe(game)
  })

  it('only allows submitting once all 10 are marked', () => {
    const answers: Choice[] = [1, 1, 1, 1, 1, 1, 1, 1, 1]
    const partial = filledGame(Array(10).fill(1), answers)
    expect(canSubmit(partial)).toBe(false)
    expect(submitGame(partial)).toBe(partial)

    const full = markAnswer(partial, 9, 2)
    expect(canSubmit(full)).toBe(true)
  })

  it('locks answers after submit and ignores a second submit', () => {
    const game = submitGame(filledGame(Array(10).fill(1), Array(10).fill(1)))
    expect(game.gameStatus).toBe('submitted')
    expect(markAnswer(game, 0, 2)).toBe(game)
    expect(submitGame(game)).toBe(game)
  })
})

describe('grading', () => {
  it('matches the worked example: 5 of 10', () => {
    const key: Choice[] = [1, 3, 5, 2, 4, 1, 2, 5, 3, 4]
    const answers: Choice[] = [1, 2, 5, 3, 4, 2, 1, 5, 3, 1]
    expect(scoreAnswers(key, answers)).toBe(5)
    expect(gradeAnswers(key, answers)).toEqual([
      true, false, true, false, true, false, false, true, true, false,
    ])
    const game = submitGame(filledGame(key, answers))
    expect(game.score).toBe(5)
    expect(game.resultTitle).toBe('찍기 고수')
  })

  it('handles every score from 0 to 10', () => {
    const key: Choice[] = Array(10).fill(1)
    for (let score = 0; score <= 10; score += 1) {
      const answers = key.map((answer, index) => (index < score ? answer : 2)) as Choice[]
      expect(submitGame(filledGame(key, answers)).score).toBe(score)
    }
  })

  it('maps each score to its title band', () => {
    const expected = [
      '찍신 휴무일',
      '오늘은 감이 안 오는 날',
      '오늘은 감이 안 오는 날',
      '찍기 유망주',
      '찍기 유망주',
      '찍기 고수',
      '찍기 고수',
      '수능 찍기 장인',
      '수능 찍기 장인',
      '전설의 찍신',
      '전설의 찍신',
    ]
    expected.forEach((title, score) => expect(getGuessGodResult(score).title).toBe(title))
    expect(GUESS_GOD_RESULTS).toHaveLength(6)
  })

  it('accepts only whole scores 0-10 from a shared link', () => {
    expect(parseSharedScore('0')).toBe(0)
    expect(parseSharedScore('10')).toBe(10)
    ;['11', '-1', '3.5', '07', 'abc', '', undefined].forEach((value) =>
      expect(parseSharedScore(value)).toBeNull(),
    )
  })
})

describe('probability', () => {
  it('uses exact binomial odds for 10 five-choice guesses', () => {
    expect(ALL_OUTCOMES).toBe(9_765_625)
    expect(EXPECTED_SCORE).toBe(2)
    expect(waysExactly(10)).toBe(1)
    expect(probabilityExactly(10)).toBe(1 / 9_765_625)
    expect(waysExactly(0)).toBe(4 ** 10)
    expect(waysAtLeast(0)).toBe(ALL_OUTCOMES)
    expect(probabilityAtLeast(5)).toBeCloseTo(0.03279, 5)

    const mean = Array.from({ length: 11 }, (_, k) => k * probabilityExactly(k)).reduce(
      (sum, value) => sum + value,
    )
    expect(mean).toBeCloseTo(2, 10)
  })

  it('formats odds as a percent, or as "N분의 1" once tiny', () => {
    expect(formatOdds(waysAtLeast(0))).toBe('100%')
    expect(formatOdds(waysAtLeast(5))).toBe('3.3%')
    expect(formatOdds(waysExactly(0))).toBe('10.7%')
    expect(formatOdds(waysAtLeast(7))).toBe('약 1,157분의 1')
    expect(formatOdds(waysExactly(10))).toBe('9,765,625분의 1')
  })
})

describe('marking style', () => {
  it('tells a single line from an even spread and anything else', () => {
    expect(classifyMarkingStyle(Array(10).fill(3))).toBe('one-line')
    expect(classifyMarkingStyle([1, 2, 3, 4, 5, 1, 2, 3, 4, 5])).toBe('spread')
    expect(classifyMarkingStyle([5, 5, 4, 4, 3, 3, 2, 2, 1, 1])).toBe('spread')
    expect(classifyMarkingStyle([1, 1, 1, 2, 3, 4, 5, 5, 5, 5])).toBe('mixed')
    expect(classifyMarkingStyle([3, 3, 3, 3, 3, 3, 3, 3, 3, null])).toBe('mixed')
  })

  it('gives one line and an even spread exactly the same odds over every possible key', () => {
    // Walks all 5^10 answer keys and counts scores for both markings.
    const oneLine: Choice[] = Array(10).fill(3)
    const spread: Choice[] = [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]
    const lineCounts = Array(11).fill(0)
    const spreadCounts = Array(11).fill(0)
    const key = Array<number>(10).fill(1)
    for (let index = 0; index < ALL_OUTCOMES; index += 1) {
      let lineScore = 0
      let spreadScore = 0
      for (let question = 0; question < 10; question += 1) {
        if (key[question] === oneLine[question]) lineScore += 1
        if (key[question] === spread[question]) spreadScore += 1
      }
      lineCounts[lineScore] += 1
      spreadCounts[spreadScore] += 1
      for (let digit = 0; digit < 10; digit += 1) {
        if (key[digit]! < 5) {
          key[digit]! += 1
          break
        }
        key[digit] = 1
      }
    }
    expect(spreadCounts).toEqual(lineCounts)
    lineCounts.forEach((count, score) => expect(count).toBe(waysExactly(score)))
  }, 30_000)
})

describe('storage', () => {
  it('restores a game in progress and a submitted one unchanged', () => {
    const playing = markAnswer(createGame(), 2, 4)
    saveGame(playing)
    expect(loadGame()).toEqual(playing)

    const submitted = submitGame(filledGame(Array(10).fill(3), Array(10).fill(3)))
    saveGame(submitted)
    expect(loadGame()).toEqual(submitted)
  })

  it('recomputes a tampered score instead of trusting it', () => {
    const submitted = submitGame(filledGame(Array(10).fill(3), Array(10).fill(1)))
    const raw = JSON.stringify({ ...submitted, score: 10, resultTitle: '전설의 찍신' })
    const parsed = parseStoredGame(raw)!
    expect(parsed.score).toBe(0)
    expect(parsed.resultTitle).toBe('찍신 휴무일')
  })

  it('drops damaged data and starts clean', () => {
    const valid = createGame()
    const broken: unknown[] = [
      'not json',
      'null',
      JSON.stringify({ ...valid, version: 99 }),
      JSON.stringify({ ...valid, answerKey: valid.answerKey.slice(0, 9) }),
      JSON.stringify({ ...valid, answerKey: [...valid.answerKey.slice(0, 9), 6] }),
      JSON.stringify({ ...valid, userAnswers: [1.5, ...valid.userAnswers.slice(1)] }),
      JSON.stringify({ ...valid, gameStatus: 'submitted' }),
      JSON.stringify({ ...valid, gameStatus: 'weird' }),
    ]
    broken.forEach((raw) => expect(parseStoredGame(raw as string)).toBeNull())

    window.localStorage.setItem('guess-god-game', 'not json')
    expect(loadGame()).toBeNull()
    expect(window.localStorage.getItem('guess-god-game')).toBeNull()
  })

  it('still works for this visit when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const game: GuessGodGame = markAnswer(createGame(), 0, 2)
    expect(() => saveGame(game)).not.toThrow()
    expect(loadGame()).toEqual(game)
  })
})
