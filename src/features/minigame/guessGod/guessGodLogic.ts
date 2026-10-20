import { getGuessGodResult, type GuessGodResult } from './guessGodResults'

export const QUESTION_COUNT = 10
export const CHOICE_COUNT = 5
export const GUESS_GOD_DATA_VERSION = 1

export type Choice = 1 | 2 | 3 | 4 | 5
export type Mark = Choice | null
export type GameStatus = 'playing' | 'submitted'

/** Returns an integer in [0, maxExclusive). */
export type RandomInt = (maxExclusive: number) => number

/**
 * One round of the game. The answer key is fixed when the round starts and
 * never changes afterwards - marks are graded against it as it was drawn.
 */
export type GuessGodGame = {
  version: number
  gameId: string
  answerKey: Choice[]
  userAnswers: Mark[]
  gameStatus: GameStatus
  /** Set on submit; null while playing. */
  score: number | null
  resultTitle: string | null
  createdAt: string
  submittedAt: string | null
}

export const CHOICES: readonly Choice[] = [1, 2, 3, 4, 5]

export function isChoice(value: unknown): value is Choice {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= CHOICE_COUNT
}

/**
 * Uniform integer from the browser's CSPRNG. Rejection sampling drops the top
 * slice of the 32-bit range so no value is more likely than another.
 */
export const secureRandomInt: RandomInt = (maxExclusive) => {
  const cryptoApi = globalThis.crypto
  if (!cryptoApi?.getRandomValues) return Math.floor(Math.random() * maxExclusive)

  const range = 2 ** 32
  const limit = range - (range % maxExclusive)
  const buffer = new Uint32Array(1)
  for (;;) {
    cryptoApi.getRandomValues(buffer)
    const value = buffer[0]!
    if (value < limit) return value % maxExclusive
  }
}

/**
 * Each question is drawn on its own with equal odds. Runs like 1,1,1,... and
 * uneven counts are left as they come - nothing evens the key out.
 */
export function generateAnswerKey(randomInt: RandomInt = secureRandomInt): Choice[] {
  return Array.from({ length: QUESTION_COUNT }, () => (randomInt(CHOICE_COUNT) + 1) as Choice)
}

function createGameId(randomInt: RandomInt) {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID()
  return Array.from({ length: 16 }, () => randomInt(16).toString(16)).join('')
}

export function createGame(
  randomInt: RandomInt = secureRandomInt,
  now: Date = new Date(),
): GuessGodGame {
  return {
    version: GUESS_GOD_DATA_VERSION,
    gameId: createGameId(randomInt),
    answerKey: generateAnswerKey(randomInt),
    userAnswers: Array.from({ length: QUESTION_COUNT }, () => null),
    gameStatus: 'playing',
    score: null,
    resultTitle: null,
    createdAt: now.toISOString(),
    submittedAt: null,
  }
}

/** Marks or re-marks one question. A submitted game is returned unchanged. */
export function markAnswer(game: GuessGodGame, questionIndex: number, choice: Choice): GuessGodGame {
  if (game.gameStatus !== 'playing') return game
  if (!Number.isInteger(questionIndex) || questionIndex < 0 || questionIndex >= QUESTION_COUNT) {
    return game
  }
  if (!isChoice(choice) || game.userAnswers[questionIndex] === choice) return game

  const userAnswers = [...game.userAnswers]
  userAnswers[questionIndex] = choice
  return { ...game, userAnswers }
}

export function countMarked(game: GuessGodGame) {
  return game.userAnswers.filter((mark) => mark !== null).length
}

export function canSubmit(game: GuessGodGame) {
  return game.gameStatus === 'playing' && countMarked(game) === QUESTION_COUNT
}

export function gradeAnswers(answerKey: readonly Choice[], userAnswers: readonly Mark[]) {
  return answerKey.map((answer, index) => userAnswers[index] === answer)
}

export function scoreAnswers(answerKey: readonly Choice[], userAnswers: readonly Mark[]) {
  return gradeAnswers(answerKey, userAnswers).filter(Boolean).length
}

/** Grades and locks the game. Submitting twice or with blanks changes nothing. */
export function submitGame(game: GuessGodGame, now: Date = new Date()): GuessGodGame {
  if (!canSubmit(game)) return game
  const score = scoreAnswers(game.answerKey, game.userAnswers)
  return {
    ...game,
    gameStatus: 'submitted',
    score,
    resultTitle: getGuessGodResult(score).title,
    submittedAt: now.toISOString(),
  }
}

export function getGameResult(game: GuessGodGame): GuessGodResult | null {
  return game.score === null ? null : getGuessGodResult(game.score)
}

// ---------- marking style ----------

/** 'one-line': the same number all the way down. 'spread': every number used equally (2 each). */
export type MarkingStyle = 'one-line' | 'spread' | 'mixed'

export function classifyMarkingStyle(marks: readonly Mark[]): MarkingStyle {
  if (marks.length !== QUESTION_COUNT || marks.some((mark) => mark === null)) return 'mixed'
  if (marks.every((mark) => mark === marks[0])) return 'one-line'
  const perChoice = QUESTION_COUNT / CHOICE_COUNT
  const spread = CHOICES.every(
    (choice) => marks.filter((mark) => mark === choice).length === perChoice,
  )
  return spread ? 'spread' : 'mixed'
}

// ---------- probability (binomial, n = 10, p = 1/5) ----------

// Every question's answer is drawn on its own with 1/5 odds, so any marking -
// one line, an even spread or anything else - matches each question with
// probability 1/5. The odds below therefore hold for every way of marking.

/** 5^10: every possible answer key, equally likely. */
export const ALL_OUTCOMES = CHOICE_COUNT ** QUESTION_COUNT

/** Average number right when guessing at random: n * p. */
export const EXPECTED_SCORE = QUESTION_COUNT / CHOICE_COUNT

function binomial(n: number, k: number) {
  let result = 1
  for (let index = 1; index <= k; index += 1) {
    result = (result * (n - k + index)) / index
  }
  return Math.round(result)
}

/**
 * Ways to get exactly k right out of ALL_OUTCOMES: C(10, k) * 4^(10 - k).
 * Kept as integers so the odds shown are exact, not rounded floats.
 */
export function waysExactly(k: number) {
  if (!Number.isInteger(k) || k < 0 || k > QUESTION_COUNT) return 0
  return binomial(QUESTION_COUNT, k) * (CHOICE_COUNT - 1) ** (QUESTION_COUNT - k)
}

export function waysAtLeast(k: number) {
  let total = 0
  for (let score = Math.max(0, k); score <= QUESTION_COUNT; score += 1) {
    total += waysExactly(score)
  }
  return total
}

export function probabilityExactly(k: number) {
  return waysExactly(k) / ALL_OUTCOMES
}

export function probabilityAtLeast(k: number) {
  return waysAtLeast(k) / ALL_OUTCOMES
}

/**
 * Human-readable odds: a percentage while it is readable, otherwise
 * "N분의 1". The exact 10/10 case keeps its exact denominator.
 */
export function formatOdds(ways: number) {
  if (ways <= 0) return '0%'
  if (ways === ALL_OUTCOMES) return '100%'
  const percent = (ways / ALL_OUTCOMES) * 100
  if (percent >= 1) return `${percent.toFixed(1).replace(/\.0$/, '')}%`
  const denominator = ALL_OUTCOMES / ways
  const exact = Number.isInteger(denominator)
  return `${exact ? '' : '약 '}${Math.round(denominator).toLocaleString('ko-KR')}분의 1`
}

// ---------- storage ----------

function isValidDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

/** Rebuilds a game from storage, or null when anything is missing or tampered with. */
export function parseStoredGame(raw: string | null): GuessGodGame | null {
  if (!raw) return null
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return null
  }
  if (!value || typeof value !== 'object') return null

  const candidate = value as Partial<GuessGodGame>
  if (candidate.version !== GUESS_GOD_DATA_VERSION) return null
  if (typeof candidate.gameId !== 'string' || !candidate.gameId) return null
  if (!isValidDate(candidate.createdAt)) return null

  const { answerKey, userAnswers } = candidate
  if (
    !Array.isArray(answerKey) ||
    answerKey.length !== QUESTION_COUNT ||
    !answerKey.every(isChoice)
  ) {
    return null
  }
  if (
    !Array.isArray(userAnswers) ||
    userAnswers.length !== QUESTION_COUNT ||
    !userAnswers.every((mark) => mark === null || isChoice(mark))
  ) {
    return null
  }

  const base = {
    version: GUESS_GOD_DATA_VERSION,
    gameId: candidate.gameId,
    answerKey: [...answerKey],
    userAnswers: [...userAnswers],
    createdAt: candidate.createdAt,
  }

  if (candidate.gameStatus === 'playing') {
    return { ...base, gameStatus: 'playing', score: null, resultTitle: null, submittedAt: null }
  }

  if (candidate.gameStatus === 'submitted') {
    // The stored score is recomputed rather than trusted.
    if (userAnswers.some((mark) => mark === null) || !isValidDate(candidate.submittedAt)) {
      return null
    }
    const score = scoreAnswers(answerKey, userAnswers)
    return {
      ...base,
      gameStatus: 'submitted',
      score,
      resultTitle: getGuessGodResult(score).title,
      submittedAt: candidate.submittedAt,
    }
  }

  return null
}

const STORAGE_KEY = 'guess-god-game'

/**
 * Mirror of the last saved game, so a round can still go from the OMR sheet
 * to its result when the browser refuses storage (private mode, webviews).
 */
let memoryGame: GuessGodGame | null = null

export function loadGame(): GuessGodGame | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) return memoryGame
    const game = parseStoredGame(raw)
    if (!game) window.localStorage.removeItem(STORAGE_KEY)
    return game
  } catch {
    return memoryGame
  }
}

export function saveGame(game: GuessGodGame) {
  memoryGame = game
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game))
  } catch {
    // Storage unavailable: the in-memory copy keeps this visit working.
  }
}

export function clearGame() {
  memoryGame = null
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}
