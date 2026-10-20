import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  calculateResultStats,
  clearGameState,
  countDrawn,
  createGame,
  decodeGrades,
  drawRemainingGrades,
  drawSubjectGrade,
  drawWeightedGrade,
  encodeGrades,
  formatAverage,
  getDrawnGrades,
  getGrades,
  GRADE_WEIGHTS,
  gradeFromRoll,
  parseStoredGame,
  resetGame,
  restoreGameState,
  saveGameState,
  secureRandomInt,
  SUBJECTS,
  TOTAL_WEIGHT,
  totalWeight,
  type Grade,
  type RandomInt,
} from './gradeDrawLogic'
import { getResultComments } from './gradeDrawResults'

/** Small seeded PRNG so the frequency check gives the same answer every run. */
function mulberry32(seed: number): RandomInt {
  let state = seed >>> 0
  return (maxExclusive) => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    const unit = ((value ^ (value >>> 14)) >>> 0) / 4294967296
    return Math.floor(unit * maxExclusive)
  }
}

/** Replays fixed rolls in order, one per draw. */
const rolls = (...values: number[]): RandomInt => {
  const queue = [...values]
  return () => {
    const next = queue.shift()
    if (next === undefined) throw new Error('ran out of rolls')
    return next
  }
}

/** A roll that lands in the given grade's band (its first slot). */
const rollFor = (grade: Grade) =>
  GRADE_WEIGHTS.filter((entry) => entry.grade < grade).reduce((sum, entry) => sum + entry.weight, 0)

const completedWith = (grades: Grade[]) =>
  drawRemainingGrades(createGame(), rolls(...grades.map(rollFor)))

beforeEach(() => clearGameState())
afterEach(() => {
  clearGameState()
  vi.restoreAllMocks()
})

describe('grade odds', () => {
  it('uses integer weights that add up to exactly 10,000', () => {
    expect(TOTAL_WEIGHT).toBe(10_000)
    expect(totalWeight(GRADE_WEIGHTS)).toBe(10_000)
    GRADE_WEIGHTS.forEach((entry) => expect(Number.isInteger(entry.weight)).toBe(true))
  })

  it('matches the configured probability for every grade', () => {
    const expected = [0.08, 0.16, 0.23, 0.23, 0.16, 0.09, 0.03, 0.015, 0.005]
    expect(GRADE_WEIGHTS.map((entry) => entry.grade)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    GRADE_WEIGHTS.forEach((entry, index) => {
      expect(entry.probability).toBeCloseTo(expected[index]!, 10)
      expect(entry.probability).toBe(entry.weight / TOTAL_WEIGHT)
    })
  })

  it('maps rolls onto the cumulative bands, edges included', () => {
    const edges: Array<[number, Grade]> = [
      [0, 1], [799, 1],
      [800, 2], [2399, 2],
      [2400, 3], [4699, 3],
      [4700, 4], [6999, 4],
      [7000, 5], [8599, 5],
      [8600, 6], [9499, 6],
      [9500, 7], [9799, 7],
      [9800, 8], [9949, 8],
      [9950, 9], [9999, 9],
    ]
    edges.forEach(([roll, grade]) => expect(gradeFromRoll(roll)).toBe(grade))
  })

  it('counts exactly the weight of slots for each grade', () => {
    const counts = new Map<Grade, number>()
    for (let roll = 0; roll < TOTAL_WEIGHT; roll += 1) {
      const grade = gradeFromRoll(roll)
      counts.set(grade, (counts.get(grade) ?? 0) + 1)
    }
    GRADE_WEIGHTS.forEach((entry) => expect(counts.get(entry.grade)).toBe(entry.weight))
  })

  it('never yields anything outside 1-9 and rejects bad rolls', () => {
    ;[-1, 10_000, 1.5, Number.NaN].forEach((roll) => expect(() => gradeFromRoll(roll)).toThrow())
    for (let index = 0; index < 2_000; index += 1) {
      const grade = drawWeightedGrade()
      expect(Number.isInteger(grade) && grade >= 1 && grade <= 9).toBe(true)
    }
  })

  it('asks for a roll in [0, 10000), not a uniform 1-9 pick', () => {
    const randomInt = vi.fn<RandomInt>(() => 9_999)
    expect(drawWeightedGrade(randomInt)).toBe(9)
    expect(randomInt).toHaveBeenCalledWith(10_000)
  })

  it('lands close to the configured odds over many draws', () => {
    const random = mulberry32(20261120)
    const draws = 200_000
    const counts = new Map<Grade, number>()
    for (let index = 0; index < draws; index += 1) {
      const grade = drawWeightedGrade(random)
      counts.set(grade, (counts.get(grade) ?? 0) + 1)
    }
    GRADE_WEIGHTS.forEach((entry) => {
      const observed = (counts.get(entry.grade) ?? 0) / draws
      expect(Math.abs(observed - entry.probability)).toBeLessThan(0.005)
    })
  })

  it('rejects the uneven top of the 32-bit range instead of folding it in', () => {
    // 2^32 % 10000 = 7296, so values from 4294960000 up would bias low grades.
    const values = [4_294_967_295, 4_294_960_000, 123]
    vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation((buffer) => {
      ;(buffer as Uint32Array)[0] = values.shift()!
      return buffer
    })
    expect(secureRandomInt(10_000)).toBe(123)
    expect(values).toHaveLength(0)
  })
})

describe('drawing', () => {
  it('gives every subject the same odds table', () => {
    expect(SUBJECTS.map((subject) => subject.subjectName)).toEqual([
      '국어', '수학', '영어', '한국사', '탐구 1', '탐구 2',
    ])
    SUBJECTS.forEach((subject) => expect(subject.gradeWeights).toBe(GRADE_WEIGHTS))
  })

  it('uses one fresh roll per subject, so subjects are independent', () => {
    const randomInt = vi.fn<RandomInt>(() => 0)
    const game = drawRemainingGrades(createGame(), randomInt)
    // Plus 0 for the game id when randomUUID is missing; ignore those calls.
    const gradeRolls = randomInt.mock.calls.filter(([max]) => max === TOTAL_WEIGHT)
    expect(gradeRolls).toHaveLength(6)
    expect(getGrades(game)).toEqual([1, 1, 1, 1, 1, 1])

    // The same roll gives the same grade whatever was drawn before it.
    const afterNine = drawSubjectGrade(
      drawSubjectGrade(createGame(), 'korean', rolls(9_999)),
      'math',
      rolls(800),
    )
    const alone = drawSubjectGrade(createGame(), 'math', rolls(800))
    expect(getDrawnGrades(afterNine).math).toBe(getDrawnGrades(alone).math)
  })

  it('draws one subject and never re-draws it', () => {
    let game = createGame()
    game = drawSubjectGrade(game, 'korean', rolls(rollFor(1)))
    expect(getDrawnGrades(game)).toEqual({ korean: 1 })
    expect(countDrawn(game)).toBe(1)

    const again = drawSubjectGrade(game, 'korean', rolls(rollFor(9)))
    expect(again).toBe(game)
    expect(getDrawnGrades(again).korean).toBe(1)
  })

  it('draws only the remaining subjects and keeps the ones already set', () => {
    let game = createGame()
    game = drawSubjectGrade(game, 'korean', rolls(rollFor(1)))
    game = drawSubjectGrade(game, 'math', rolls(rollFor(3)))
    const randomInt = vi.fn(rolls(rollFor(2), rollFor(4), rollFor(5), rollFor(6)))
    game = drawRemainingGrades(game, randomInt)
    expect(randomInt).toHaveBeenCalledTimes(4)
    expect(getGrades(game)).toEqual([1, 3, 2, 4, 5, 6])
  })

  it('completes only once all six are drawn, then changes no more', () => {
    let game = createGame()
    for (const subject of SUBJECTS.slice(0, 5)) {
      game = drawSubjectGrade(game, subject.subjectId, rolls(rollFor(4)))
      expect(game.gameStatus).toBe('drawing')
      expect(game.completedAt).toBeNull()
    }
    game = drawSubjectGrade(game, 'inquiry2', rolls(rollFor(4)))
    expect(game.gameStatus).toBe('completed')
    expect(game.completedAt).not.toBeNull()
    expect(drawRemainingGrades(game)).toBe(game)
  })
})

describe('result stats', () => {
  it('counts 1s and finds best, worst and the plain average', () => {
    const stats = calculateResultStats([1, 7, 2, 4, 1, 4])
    expect(stats).toEqual({ firstGradeCount: 2, bestGrade: 1, worstGrade: 7, averageGrade: 19 / 6 })
    expect(formatAverage(stats.averageGrade)).toBe('3.17')
    expect(formatAverage(3.5)).toBe('3.5')
    expect(formatAverage(4)).toBe('4')
  })

  it('writes comments from the grades actually drawn', () => {
    expect(getResultComments(calculateResultStats([1, 1, 1, 2, 3, 2]))).toContain('1등급이 3개나 나왔어요!')
    expect(getResultComments(calculateResultStats([1, 7, 3, 4, 2, 3]))).toContain('과목 간 등급 차이가 꽤 크네요.')
    expect(getResultComments(calculateResultStats([3, 4, 5, 3, 4, 5]))).toEqual([
      '오늘은 전체적으로 안정적인 성적표가 나왔어요.',
    ])
    expect(getResultComments(calculateResultStats([2, 5, 4, 3, 5, 6]))).toEqual([
      '과목마다 개성이 살아 있는 성적표예요.',
    ])
  })
})

describe('share link', () => {
  it('round-trips six grades and rejects anything else', () => {
    expect(encodeGrades([1, 4, 3, 2, 2, 5])).toBe('143225')
    expect(decodeGrades('143225')).toEqual([1, 4, 3, 2, 2, 5])
    ;['14322', '1432250', '143205', '14322a', '', undefined, '1-3225'].forEach((value) =>
      expect(decodeGrades(value)).toBeNull(),
    )
  })
})

describe('storage', () => {
  it('restores a game in progress and a finished one', () => {
    const partial = drawSubjectGrade(createGame(), 'english', rolls(rollFor(2)))
    saveGameState(partial)
    expect(restoreGameState()).toEqual(partial)

    const done = completedWith([1, 2, 3, 4, 5, 6])
    saveGameState(done)
    expect(restoreGameState()).toEqual(done)
  })

  it('resets to a new game with every subject undrawn', () => {
    saveGameState(completedWith([1, 2, 3, 4, 5, 6]))
    const fresh = resetGame()
    expect(countDrawn(fresh)).toBe(0)
    expect(restoreGameState()).toEqual(fresh)
  })

  it('drops damaged, stale or out-of-range data', () => {
    const valid = completedWith([1, 2, 3, 4, 5, 6])
    const withSubject = (index: number, patch: object) => ({
      ...valid,
      subjects: valid.subjects.map((subject, i) => (i === index ? { ...subject, ...patch } : subject)),
    })
    const broken = [
      'not json',
      '[]',
      JSON.stringify({ ...valid, version: 0 }),
      JSON.stringify(withSubject(0, { grade: 10 })),
      JSON.stringify(withSubject(0, { grade: 0 })),
      JSON.stringify(withSubject(0, { grade: 2.5 })),
      JSON.stringify(withSubject(1, { subjectId: 'science' })),
      JSON.stringify(withSubject(2, { isDrawn: false })),
      JSON.stringify({ ...valid, subjects: valid.subjects.slice(0, 5) }),
      JSON.stringify({ ...valid, gameStatus: 'drawing' }),
    ]
    broken.forEach((raw) => expect(parseStoredGame(raw)).toBeNull())

    window.localStorage.setItem('grade-draw-game', '{oops')
    expect(restoreGameState()).toBeNull()
    expect(window.localStorage.getItem('grade-draw-game')).toBeNull()
  })

  it('keeps working for this visit when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const game = drawSubjectGrade(createGame(), 'korean', rolls(rollFor(3)))
    expect(() => saveGameState(game)).not.toThrow()
    expect(restoreGameState()).toEqual(game)
  })
})
