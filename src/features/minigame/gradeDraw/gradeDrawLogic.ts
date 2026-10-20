import {
  determineResultTitle,
  type GradeDrawTitle,
} from './gradeDrawResults'

export const GRADE_DRAW_DATA_VERSION = 1

export type Grade = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

/** Returns an integer in [0, maxExclusive). */
export type RandomInt = (maxExclusive: number) => number

export type GradeWeight = {
  grade: Grade
  /** Integer share of TOTAL_WEIGHT; keeps the odds exact. */
  weight: number
  probability: number
}

export const TOTAL_WEIGHT = 10_000

const weight = (grade: Grade, value: number): GradeWeight => ({
  grade,
  weight: value,
  probability: value / TOTAL_WEIGHT,
})

/**
 * Game odds for an imagined group of steadily-preparing test takers.
 * Made up for the game - not a survey of real CSAT results.
 */
export const GRADE_WEIGHTS: readonly GradeWeight[] = [
  weight(1, 800),
  weight(2, 1600),
  weight(3, 2300),
  weight(4, 2300),
  weight(5, 1600),
  weight(6, 900),
  weight(7, 300),
  weight(8, 150),
  weight(9, 50),
]

export type SubjectId = 'korean' | 'math' | 'english' | 'history' | 'inquiry1' | 'inquiry2'

export type SubjectDefinition = {
  subjectId: SubjectId
  subjectName: string
  /** Per-subject odds can go here later; every subject shares one table for now. */
  gradeWeights: readonly GradeWeight[]
}

export const SUBJECTS: readonly SubjectDefinition[] = [
  { subjectId: 'korean', subjectName: '국어', gradeWeights: GRADE_WEIGHTS },
  { subjectId: 'math', subjectName: '수학', gradeWeights: GRADE_WEIGHTS },
  { subjectId: 'english', subjectName: '영어', gradeWeights: GRADE_WEIGHTS },
  { subjectId: 'history', subjectName: '한국사', gradeWeights: GRADE_WEIGHTS },
  { subjectId: 'inquiry1', subjectName: '탐구 1', gradeWeights: GRADE_WEIGHTS },
  { subjectId: 'inquiry2', subjectName: '탐구 2', gradeWeights: GRADE_WEIGHTS },
]

export const SUBJECT_COUNT = SUBJECTS.length

const nameOf = ({ subjectId, subjectName }: SubjectDefinition) => ({ subjectId, subjectName })

export type SubjectResult = {
  subjectId: SubjectId
  subjectName: string
  grade: Grade | null
  isDrawn: boolean
}

export type GameStatus = 'drawing' | 'completed'

export type GradeDrawGame = {
  version: number
  gameId: string
  subjects: SubjectResult[]
  gameStatus: GameStatus
  /** Set once every subject is drawn; null before. */
  resultTitle: GradeDrawTitle | null
  createdAt: string
  completedAt: string | null
}

export function isGrade(value: unknown): value is Grade {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 9
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

export function totalWeight(table: readonly GradeWeight[]) {
  return table.reduce((sum, entry) => sum + entry.weight, 0)
}

/** Maps a roll in [0, total) onto the cumulative weight bands. */
export function gradeFromRoll(roll: number, table: readonly GradeWeight[] = GRADE_WEIGHTS): Grade {
  const total = totalWeight(table)
  if (!Number.isInteger(roll) || roll < 0 || roll >= total) {
    throw new RangeError(`roll must be an integer in [0, ${total})`)
  }
  let upper = 0
  for (const entry of table) {
    upper += entry.weight
    if (roll < upper) return entry.grade
  }
  return table[table.length - 1]!.grade
}

/** One weighted draw: a roll in [0, 10000) picks the grade band it lands in. */
export function drawWeightedGrade(
  randomInt: RandomInt = secureRandomInt,
  table: readonly GradeWeight[] = GRADE_WEIGHTS,
): Grade {
  return gradeFromRoll(randomInt(totalWeight(table)), table)
}

function createGameId(randomInt: RandomInt) {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID()
  return Array.from({ length: 16 }, () => randomInt(16).toString(16)).join('')
}

export function createGame(
  randomInt: RandomInt = secureRandomInt,
  now: Date = new Date(),
): GradeDrawGame {
  return {
    version: GRADE_DRAW_DATA_VERSION,
    gameId: createGameId(randomInt),
    subjects: SUBJECTS.map((definition) => ({
      ...nameOf(definition),
      grade: null,
      isDrawn: false,
    })),
    gameStatus: 'drawing',
    resultTitle: null,
    createdAt: now.toISOString(),
    completedAt: null,
  }
}

export function countDrawn(game: GradeDrawGame) {
  return game.subjects.filter((subject) => subject.isDrawn).length
}

/** Subject id to grade, for the subjects drawn so far. */
export function getDrawnGrades(game: GradeDrawGame): Partial<Record<SubjectId, Grade>> {
  const drawn: Partial<Record<SubjectId, Grade>> = {}
  for (const subject of game.subjects) {
    if (subject.isDrawn && subject.grade !== null) drawn[subject.subjectId] = subject.grade
  }
  return drawn
}

/** Grades in subject order; only meaningful once the game is complete. */
export function getGrades(game: GradeDrawGame): Grade[] {
  return game.subjects.map((subject) => subject.grade).filter(isGrade)
}

function finishIfComplete(game: GradeDrawGame, now: Date): GradeDrawGame {
  if (game.subjects.some((subject) => !subject.isDrawn)) return game
  return {
    ...game,
    gameStatus: 'completed',
    resultTitle: determineResultTitle(getGrades(game)),
    completedAt: now.toISOString(),
  }
}

const definitionOf = (subjectId: SubjectId) =>
  SUBJECTS.find((subject) => subject.subjectId === subjectId)

/**
 * Draws one subject's grade. A subject that already has a grade, or a
 * finished game, comes back unchanged - nothing is ever re-drawn.
 */
export function drawSubjectGrade(
  game: GradeDrawGame,
  subjectId: SubjectId,
  randomInt: RandomInt = secureRandomInt,
  now: Date = new Date(),
): GradeDrawGame {
  if (game.gameStatus !== 'drawing') return game
  const index = game.subjects.findIndex((subject) => subject.subjectId === subjectId)
  const definition = definitionOf(subjectId)
  if (index < 0 || !definition || game.subjects[index]!.isDrawn) return game

  const subjects = [...game.subjects]
  subjects[index] = {
    ...subjects[index]!,
    grade: drawWeightedGrade(randomInt, definition.gradeWeights),
    isDrawn: true,
  }
  return finishIfComplete({ ...game, subjects }, now)
}

/** Draws every subject still showing "?", each on its own; drawn ones stay as they are. */
export function drawRemainingGrades(
  game: GradeDrawGame,
  randomInt: RandomInt = secureRandomInt,
  now: Date = new Date(),
): GradeDrawGame {
  return game.subjects.reduce(
    (current, subject) =>
      subject.isDrawn ? current : drawSubjectGrade(current, subject.subjectId, randomInt, now),
    game,
  )
}

export type ResultStats = {
  firstGradeCount: number
  bestGrade: Grade
  worstGrade: Grade
  /** Plain arithmetic mean - not how real admissions combine grades. */
  averageGrade: number
}

export function calculateResultStats(grades: readonly Grade[]): ResultStats {
  if (grades.length === 0) throw new RangeError('no grades to summarize')
  return {
    firstGradeCount: grades.filter((grade) => grade === 1).length,
    bestGrade: Math.min(...grades) as Grade,
    worstGrade: Math.max(...grades) as Grade,
    averageGrade: grades.reduce<number>((sum, grade) => sum + grade, 0) / grades.length,
  }
}

/** "3.17", "3.5" or "3" - at most two decimals, no trailing zeros. */
export function formatAverage(average: number) {
  return String(Math.round(average * 100) / 100)
}

// ---------- share link ----------

/** Six digits in subject order, e.g. "143225". Grades only, nothing else. */
export function encodeGrades(grades: readonly Grade[]) {
  return grades.join('')
}

export function decodeGrades(value: string | undefined): Grade[] | null {
  if (!value || !new RegExp(`^[1-9]{${SUBJECT_COUNT}}$`).test(value)) return null
  return [...value].map(Number) as Grade[]
}

// ---------- storage ----------

function isValidDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

/** Rebuilds a game from storage, or null when anything is missing, stale or out of range. */
export function parseStoredGame(raw: string | null): GradeDrawGame | null {
  if (!raw) return null
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return null
  }
  if (!value || typeof value !== 'object') return null

  const candidate = value as Partial<GradeDrawGame>
  if (candidate.version !== GRADE_DRAW_DATA_VERSION) return null
  if (typeof candidate.gameId !== 'string' || !candidate.gameId) return null
  if (!isValidDate(candidate.createdAt)) return null

  const stored = candidate.subjects
  if (!Array.isArray(stored) || stored.length !== SUBJECT_COUNT) return null

  const subjects: SubjectResult[] = []
  for (const [index, definition] of SUBJECTS.entries()) {
    const entry = stored[index] as Partial<SubjectResult> | undefined
    if (!entry || entry.subjectId !== definition.subjectId) return null
    if (entry.isDrawn === true) {
      if (!isGrade(entry.grade)) return null
      subjects.push({ ...nameOf(definition), grade: entry.grade, isDrawn: true })
    } else if (entry.isDrawn === false && entry.grade === null) {
      subjects.push({ ...nameOf(definition), grade: null, isDrawn: false })
    } else {
      return null
    }
  }
  const base = {
    version: GRADE_DRAW_DATA_VERSION,
    gameId: candidate.gameId,
    subjects: subjects,
    createdAt: candidate.createdAt,
  }
  const allDrawn = subjects.every((subject) => subject.isDrawn)

  if (candidate.gameStatus === 'drawing' && !allDrawn) {
    return { ...base, gameStatus: 'drawing', resultTitle: null, completedAt: null }
  }
  if (candidate.gameStatus === 'completed' && allDrawn && isValidDate(candidate.completedAt)) {
    // The title is re-derived from the grades rather than trusted.
    return {
      ...base,
      gameStatus: 'completed',
      resultTitle: determineResultTitle(subjects.map((subject) => subject.grade!)),
      completedAt: candidate.completedAt,
    }
  }
  return null
}

const STORAGE_KEY = 'grade-draw-game'

/**
 * Mirror of the last saved game, so a round keeps working within this visit
 * when the browser refuses storage (private mode, webviews).
 */
let memoryGame: GradeDrawGame | null = null

export function restoreGameState(): GradeDrawGame | null {
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

export function saveGameState(game: GradeDrawGame) {
  memoryGame = game
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game))
  } catch {
    // Storage unavailable: the in-memory copy keeps this visit working.
  }
}

/** Throws the old round away and saves a fresh one with every subject at "?". */
export function resetGame(): GradeDrawGame {
  clearGameState()
  const game = createGame()
  saveGameState(game)
  return game
}

export function clearGameState() {
  memoryGame = null
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}
