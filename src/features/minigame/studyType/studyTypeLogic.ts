import {
  DIMENSION_TRAITS,
  DIMENSIONS,
  STUDY_TYPE_DATA_VERSION,
  STUDY_TYPE_QUESTIONS,
  type Dimension,
  type StudyTypeQuestion,
  type Trait,
} from './studyTypeQuestions'
import { isStudyTypeCode, type StudyTypeCode } from './studyTypeResults'

export type Random = () => number

/** Display order of a question's two options, as indexes into `options`. */
export type OptionOrder = readonly [0, 1] | readonly [1, 0]

export type Answers = Record<string, Trait>

/**
 * Everything needed to resume a test after a refresh. Question and option
 * order are fixed when the test starts so going back never reshuffles.
 */
export type StudyTypeSession = {
  version: number
  questionOrder: string[]
  optionOrder: Record<string, OptionOrder>
  answers: Answers
  currentIndex: number
}

export type DimensionResult = {
  dimension: Dimension
  traits: readonly [Trait, Trait]
  counts: readonly [number, number]
  /** Share of answers in this test, not a measure of accuracy or strength. */
  percents: readonly [number, number]
  winner: Trait
  /** True for a one-answer gap such as 4:3, where both sides show up. */
  balanced: boolean
}

export type StudyTypeOutcome = {
  typeCode: StudyTypeCode
  dimensions: DimensionResult[]
}

const MAX_SAME_DIMENSION_RUN = 2
const ORDER_ATTEMPTS = 20

const questionsById = new Map(
  STUDY_TYPE_QUESTIONS.map((question) => [question.id, question]),
)

export function getQuestion(id: string): StudyTypeQuestion | undefined {
  return questionsById.get(id)
}

export function shuffle<T>(items: readonly T[], random: Random = Math.random) {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1))
    const held = result[index]!
    result[index] = result[swap]!
    result[swap] = held
  }
  return result
}

export function longestDimensionRun(
  order: readonly string[],
  questions: readonly StudyTypeQuestion[] = STUDY_TYPE_QUESTIONS,
) {
  const dimensionOf = new Map(questions.map((q) => [q.id, q.dimension]))
  let longest = 0
  let run = 0
  let previous: Dimension | undefined

  order.forEach((id) => {
    const dimension = dimensionOf.get(id)
    run = dimension === previous ? run + 1 : 1
    previous = dimension
    longest = Math.max(longest, run)
  })

  return longest
}

function interleaveOnce(
  questions: readonly StudyTypeQuestion[],
  random: Random,
) {
  const pools = new Map<Dimension, string[]>()
  DIMENSIONS.forEach((dimension) => {
    pools.set(
      dimension,
      shuffle(
        questions.filter((q) => q.dimension === dimension).map((q) => q.id),
        random,
      ),
    )
  })

  const order: string[] = []
  const picked: Dimension[] = []

  while (order.length < questions.length) {
    const remaining = DIMENSIONS.filter(
      (dimension) => (pools.get(dimension)?.length ?? 0) > 0,
    )
    const recent = picked.slice(-MAX_SAME_DIMENSION_RUN)
    const capped =
      recent.length === MAX_SAME_DIMENSION_RUN &&
      recent.every((dimension) => dimension === recent[0])
        ? recent[0]
        : undefined
    const allowed = remaining.filter((dimension) => dimension !== capped)
    const candidates = allowed.length > 0 ? allowed : remaining

    // Weighting by what is left keeps the three dimensions evenly spread.
    const total = candidates.reduce(
      (sum, dimension) => sum + (pools.get(dimension)?.length ?? 0),
      0,
    )
    let roll = random() * total
    let chosen = candidates[candidates.length - 1]!
    for (const dimension of candidates) {
      roll -= pools.get(dimension)?.length ?? 0
      if (roll < 0) {
        chosen = dimension
        break
      }
    }

    order.push(pools.get(chosen)!.pop()!)
    picked.push(chosen)
  }

  return order
}

/**
 * Shuffles the questions so the three dimensions are mixed and the same
 * dimension never appears more than twice in a row.
 */
export function buildQuestionOrder(
  random: Random = Math.random,
  questions: readonly StudyTypeQuestion[] = STUDY_TYPE_QUESTIONS,
) {
  let order = interleaveOnce(questions, random)
  for (
    let attempt = 1;
    attempt < ORDER_ATTEMPTS &&
    longestDimensionRun(order, questions) > MAX_SAME_DIMENSION_RUN;
    attempt += 1
  ) {
    order = interleaveOnce(questions, random)
  }
  return order
}

export function createSession(random: Random = Math.random): StudyTypeSession {
  const questionOrder = buildQuestionOrder(random)
  const optionOrder: Record<string, OptionOrder> = {}
  questionOrder.forEach((id) => {
    optionOrder[id] = random() < 0.5 ? [0, 1] : [1, 0]
  })

  return {
    version: STUDY_TYPE_DATA_VERSION,
    questionOrder,
    optionOrder,
    answers: {},
    currentIndex: 0,
  }
}

/**
 * Records (or replaces) the answer for a question and moves on to the next
 * one. Answers are keyed by question, so changing an answer never counts twice.
 */
export function answerQuestion(
  session: StudyTypeSession,
  questionId: string,
  trait: Trait,
): StudyTypeSession {
  const question = getQuestion(questionId)
  if (!question || !question.options.some((option) => option.trait === trait)) {
    return session
  }

  const index = session.questionOrder.indexOf(questionId)
  const lastIndex = session.questionOrder.length - 1

  return {
    ...session,
    answers: { ...session.answers, [questionId]: trait },
    currentIndex: index < 0 ? session.currentIndex : Math.min(index + 1, lastIndex),
  }
}

export function goToQuestion(
  session: StudyTypeSession,
  index: number,
): StudyTypeSession {
  const clamped = Math.max(0, Math.min(index, session.questionOrder.length - 1))
  return clamped === session.currentIndex
    ? session
    : { ...session, currentIndex: clamped }
}

export function countAnswered(session: StudyTypeSession) {
  return session.questionOrder.filter((id) => session.answers[id]).length
}

export function isSessionComplete(session: StudyTypeSession) {
  return countAnswered(session) === session.questionOrder.length
}

/**
 * Turns answers into a type. Returns null unless every question is answered,
 * so a result is never shown for a half-finished test.
 */
export function computeOutcome(
  answers: Answers,
  questions: readonly StudyTypeQuestion[] = STUDY_TYPE_QUESTIONS,
): StudyTypeOutcome | null {
  if (questions.some((question) => !answers[question.id])) return null

  const dimensions = DIMENSIONS.map((dimension): DimensionResult => {
    const traits = DIMENSION_TRAITS[dimension]
    const ids = questions.filter((q) => q.dimension === dimension).map((q) => q.id)
    const first = ids.filter((id) => answers[id] === traits[0]).length
    const second = ids.filter((id) => answers[id] === traits[1]).length
    const total = first + second
    const firstPercent = total === 0 ? 0 : Math.round((first / total) * 100)

    return {
      dimension,
      traits,
      counts: [first, second],
      percents: [firstPercent, total === 0 ? 0 : 100 - firstPercent],
      // Seven questions per dimension, so there is never a tie.
      winner: first >= second ? traits[0] : traits[1],
      balanced: Math.abs(first - second) <= 1,
    }
  })

  const typeCode = dimensions.map((result) => result.winner).join('')
  if (!isStudyTypeCode(typeCode)) return null

  return { typeCode, dimensions }
}

function isOptionOrder(value: unknown): value is OptionOrder {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    ((value[0] === 0 && value[1] === 1) || (value[0] === 1 && value[1] === 0))
  )
}

/**
 * Reads saved progress, returning null for anything that doesn't match the
 * current question data (old version, edited questions, corrupted JSON).
 */
export function parseStoredSession(raw: string | null): StudyTypeSession | null {
  if (!raw) return null

  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return null
  }
  if (!value || typeof value !== 'object') return null

  const candidate = value as Partial<StudyTypeSession>
  if (candidate.version !== STUDY_TYPE_DATA_VERSION) return null

  const order = candidate.questionOrder
  if (
    !Array.isArray(order) ||
    order.length !== STUDY_TYPE_QUESTIONS.length ||
    new Set(order).size !== order.length ||
    !order.every((id) => typeof id === 'string' && questionsById.has(id))
  ) {
    return null
  }

  const optionOrder = candidate.optionOrder
  if (
    !optionOrder ||
    typeof optionOrder !== 'object' ||
    !order.every((id) => isOptionOrder((optionOrder as Record<string, unknown>)[id]))
  ) {
    return null
  }

  const answers: Answers = {}
  const storedAnswers =
    candidate.answers && typeof candidate.answers === 'object'
      ? (candidate.answers as Record<string, unknown>)
      : {}
  for (const [id, trait] of Object.entries(storedAnswers)) {
    const question = questionsById.get(id)
    if (!question || !question.options.some((option) => option.trait === trait)) {
      return null
    }
    answers[id] = trait as Trait
  }

  const index = candidate.currentIndex
  const currentIndex =
    typeof index === 'number' && Number.isInteger(index)
      ? Math.max(0, Math.min(index, order.length - 1))
      : 0

  return {
    version: STUDY_TYPE_DATA_VERSION,
    questionOrder: [...order],
    optionOrder: Object.fromEntries(
      order.map((id) => [id, (optionOrder as Record<string, OptionOrder>)[id]!]),
    ),
    answers,
    currentIndex,
  }
}

const STORAGE_KEY = 'study-type-test'

export function loadSession(): StudyTypeSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const session = parseStoredSession(raw)
    if (raw && !session) window.localStorage.removeItem(STORAGE_KEY)
    return session
  } catch {
    return null
  }
}

export function saveSession(session: StudyTypeSession) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Private mode or full storage: the test still works, it just won't resume.
  }
}

export function clearSession() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}
