import { describe, expect, it } from 'vitest'
import {
  answerQuestion,
  buildQuestionOrder,
  computeOutcome,
  createSession,
  goToQuestion,
  isSessionComplete,
  longestDimensionRun,
  parseStoredSession,
  type Answers,
  type DimensionResult,
  type Random,
} from './studyTypeLogic'
import {
  DIMENSION_TRAITS,
  DIMENSIONS,
  STUDY_TYPE_DATA_VERSION,
  STUDY_TYPE_QUESTIONS,
  type Dimension,
  type Trait,
} from './studyTypeQuestions'
import { STUDY_TYPE_CODES, STUDY_TYPE_RESULTS } from './studyTypeResults'
import { getCharacterSrc } from './studyTypeCharacters'
import { wrapText } from './studyTypeShareImage'

function seeded(seed: number): Random {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const idsOf = (dimension: Dimension) =>
  STUDY_TYPE_QUESTIONS.filter((q) => q.dimension === dimension).map((q) => q.id)

/** Answers each dimension so the trait in `code` gets `winnerCounts` of its 7 questions. */
function answersFor(code: string, winnerCounts: Record<Dimension, number>): Answers {
  const answers: Answers = {}
  DIMENSIONS.forEach((dimension, position) => {
    const [first, second] = DIMENSION_TRAITS[dimension]
    const winner = code[position] as Trait
    const winnerCount = winnerCounts[dimension]
    idsOf(dimension).forEach((id, index) => {
      const loser = winner === first ? second : first
      answers[id] = index < winnerCount ? winner : loser
    })
  })
  return answers
}

describe('question data', () => {
  it('has 21 questions with unique ids', () => {
    expect(STUDY_TYPE_QUESTIONS).toHaveLength(21)
    expect(new Set(STUDY_TYPE_QUESTIONS.map((q) => q.id)).size).toBe(21)
  })

  it('has exactly 7 questions per dimension, each offering both traits', () => {
    DIMENSIONS.forEach((dimension) => {
      const questions = STUDY_TYPE_QUESTIONS.filter((q) => q.dimension === dimension)
      expect(questions).toHaveLength(7)
      questions.forEach((question) => {
        expect(question.options.map((o) => o.trait).sort()).toEqual(
          [...DIMENSION_TRAITS[dimension]].sort(),
        )
      })
    })
  })

  it('never shows trait codes in the option text', () => {
    STUDY_TYPE_QUESTIONS.forEach((question) => {
      question.options.forEach((option) => {
        expect(option.label).not.toMatch(/\b[PLSFAN]\b|^[PLSFAN]:/)
      })
    })
  })
})

describe('question order', () => {
  it('is a permutation with no dimension more than twice in a row', () => {
    for (let seed = 1; seed <= 300; seed += 1) {
      const order = buildQuestionOrder(seeded(seed))
      expect([...order].sort()).toEqual(STUDY_TYPE_QUESTIONS.map((q) => q.id).sort())
      expect(longestDimensionRun(order)).toBeLessThanOrEqual(2)
    }
  })

  it('differs between test runs', () => {
    const orders = new Set(
      [1, 2, 3, 4, 5].map((seed) => buildQuestionOrder(seeded(seed)).join()),
    )
    expect(orders.size).toBeGreaterThan(1)
  })

  it('shuffles option positions per question and keeps them in the session', () => {
    const session = createSession(seeded(7))
    const orders = Object.values(session.optionOrder).map((order) => order.join())
    expect(new Set(orders)).toEqual(new Set(['0,1', '1,0']))

    const moved = goToQuestion(answerQuestion(session, session.questionOrder[0]!, 'P'), 0)
    expect(moved.questionOrder).toEqual(session.questionOrder)
    expect(moved.optionOrder).toEqual(session.optionOrder)
  })
})

describe('computeOutcome', () => {
  it.each(STUDY_TYPE_CODES)('judges %s', (code) => {
    const outcome = computeOutcome(answersFor(code, { plan: 5, environment: 4, mental: 6 }))
    expect(outcome?.typeCode).toBe(code)
  })

  it('returns null until every question is answered', () => {
    const answers = answersFor('PSN', { plan: 7, environment: 7, mental: 7 })
    delete answers.q21
    expect(computeOutcome(answers)).toBeNull()
  })

  it('reports answer shares per dimension', () => {
    const outcome = computeOutcome(answersFor('PSN', { plan: 5, environment: 4, mental: 5 }))!
    const [plan, environment, mental] = outcome.dimensions as [
      DimensionResult,
      DimensionResult,
      DimensionResult,
    ]
    expect(plan.percents).toEqual([71, 29])
    expect(plan.balanced).toBe(false)
    expect(environment.percents).toEqual([57, 43])
    expect(environment.balanced).toBe(true)
    expect(mental.counts).toEqual([2, 5])
    expect(mental.percents).toEqual([29, 71])
  })

  it('handles a unanimous dimension', () => {
    const outcome = computeOutcome(answersFor('LFA', { plan: 7, environment: 7, mental: 7 }))!
    expect(outcome.dimensions[0]!.percents).toEqual([0, 100])
  })

  it('scores by trait, whatever order questions and options were shown in', () => {
    const target = answersFor('LSA', { plan: 4, environment: 6, mental: 5 })
    for (let seed = 1; seed <= 20; seed += 1) {
      let session = createSession(seeded(seed))
      session.questionOrder.forEach((id) => {
        session = answerQuestion(session, id, target[id]!)
      })
      expect(isSessionComplete(session)).toBe(true)
      expect(computeOutcome(session.answers)?.typeCode).toBe('LSA')
    }
  })
})

describe('answerQuestion', () => {
  it('replaces an earlier answer instead of counting it twice', () => {
    let session = createSession(seeded(3))
    const target = answersFor('PSA', { plan: 4, environment: 4, mental: 4 })
    session.questionOrder.forEach((id) => {
      session = answerQuestion(session, id, target[id]!)
    })
    expect(computeOutcome(session.answers)?.typeCode).toBe('PSA')

    // Flip one P answer to L: P 4:3 becomes L 4:3.
    const planId = idsOf('plan').find((id) => session.answers[id] === 'P')!
    session = goToQuestion(session, session.questionOrder.indexOf(planId))
    session = answerQuestion(session, planId, 'L')
    session = answerQuestion(session, planId, 'L')

    const outcome = computeOutcome(session.answers)!
    expect(outcome.typeCode).toBe('LSA')
    expect(outcome.dimensions[0]!.counts).toEqual([3, 4])
    expect(Object.keys(session.answers)).toHaveLength(21)
  })

  it('moves to the next question but stays on the last one', () => {
    const firstTrait = (id: string) =>
      STUDY_TYPE_QUESTIONS.find((q) => q.id === id)!.options[0].trait
    let session = createSession(seeded(4))
    const firstId = session.questionOrder[0]!
    session = answerQuestion(session, firstId, firstTrait(firstId))
    expect(session.currentIndex).toBe(1)

    session = goToQuestion(session, 20)
    const lastId = session.questionOrder[20]!
    expect(answerQuestion(session, lastId, firstTrait(lastId)).currentIndex).toBe(20)
  })

  it('ignores a trait that does not belong to the question', () => {
    const session = createSession(seeded(5))
    const planId = idsOf('plan')[0]!
    expect(answerQuestion(session, planId, 'A')).toBe(session)
  })
})

describe('parseStoredSession', () => {
  const session = answerQuestion(createSession(seeded(9)), 'q1', 'P')

  it('restores a saved session', () => {
    expect(parseStoredSession(JSON.stringify(session))).toEqual(session)
  })

  it('discards data from another version', () => {
    const old = { ...session, version: STUDY_TYPE_DATA_VERSION + 1 }
    expect(parseStoredSession(JSON.stringify(old))).toBeNull()
  })

  it('discards unknown question ids, bad traits and broken JSON', () => {
    const renamed = { ...session, questionOrder: ['q99', ...session.questionOrder.slice(1)] }
    expect(parseStoredSession(JSON.stringify(renamed))).toBeNull()
    expect(
      parseStoredSession(JSON.stringify({ ...session, answers: { q1: 'A' } })),
    ).toBeNull()
    expect(parseStoredSession('{not json')).toBeNull()
    expect(parseStoredSession(null)).toBeNull()
  })
})

describe('result data', () => {
  it.each(STUDY_TYPE_CODES)('%s has complete content', (code) => {
    const result = STUDY_TYPE_RESULTS[code]
    expect(result.typeCode).toBe(code)
    expect(result.typeName && result.tagline && result.description).toBeTruthy()
    expect(result.relatableMoments).toHaveLength(4)
    expect(result.strengths.length).toBeGreaterThanOrEqual(2)
    expect(result.strengths.length).toBeLessThanOrEqual(3)
    expect(result.cautions).toHaveLength(2)
    expect(result.studyTips).toHaveLength(3)
    expect(result.compatibleType.typeCode).not.toBe(code)
    expect(STUDY_TYPE_CODES).toContain(result.compatibleType.typeCode)
    expect(getCharacterSrc(code)).toMatch(/^data:image\/svg\+xml|^\//)
  })

  it('uses distinct names, taglines and relatable moments', () => {
    const results = Object.values(STUDY_TYPE_RESULTS)
    expect(new Set(results.map((r) => r.typeName)).size).toBe(8)
    expect(new Set(results.map((r) => r.tagline)).size).toBe(8)
    expect(new Set(results.map((r) => r.slug)).size).toBe(8)
    results.forEach((r) => expect(r.slug.toUpperCase()).not.toContain(r.typeCode))
    const moments = results.flatMap((r) => r.relatableMoments)
    expect(new Set(moments).size).toBe(moments.length)
  })
})

describe('wrapText', () => {
  const measure = (text: string) => text.length * 10

  it('breaks at spaces first', () => {
    expect(wrapText(measure, '오늘도 어제처럼 내 페이스대로', 90)).toEqual([
      '오늘도 어제처럼',
      '내 페이스대로',
    ])
  })

  it('breaks inside a word that is too long', () => {
    expect(wrapText(measure, '가나다라마바사', 30)).toEqual(['가나다', '라마바', '사'])
  })
})
