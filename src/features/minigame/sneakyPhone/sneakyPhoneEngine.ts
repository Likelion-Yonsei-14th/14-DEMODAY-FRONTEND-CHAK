/**
 * 선생님 몰래 폰 하기 - game rules as pure functions.
 *
 * Everything runs on one clock: `elapsed`, milliseconds since the round
 * started. Score, the teacher's phases and the caught check all advance on
 * it, and the screen only renders what this state says - so the teacher's
 * pose on screen and the moment you get caught can never drift apart.
 */

export const GAME_MS = 30_000
export const SURVIVAL_BONUS = 500
export const BASE_POINTS_PER_SECOND = 100

/** The head-turn tell. Kept fixed so late rounds still give time to react. */
export const WARNING_MS = 400
/** Turning back to the board; the teacher can still see you until it ends. */
export const RETURNING_MS = 350
export const WATCHING_MIN_MS = 1_000
export const WATCHING_MAX_MS = 2_000

/** Board-facing time shrinks as the round goes on. */
export const BOARD_MS_BY_STAGE = [
  { from: 0, min: 2_400, max: 4_000 },
  { from: 10_000, min: 1_800, max: 3_200 },
  { from: 20_000, min: 1_200, max: 2_400 },
] as const

/** Multiplier by how long the phone has been out without a break. */
export const STREAK_TIERS = [
  { from: 0, multiplier: 1 },
  { from: 1_000, multiplier: 1.5 },
  { from: 2_000, multiplier: 2 },
  { from: 3_000, multiplier: 3 },
] as const

export type TeacherPhase = 'board' | 'warning' | 'watching' | 'returning'
export type GameStatus = 'playing' | 'caught' | 'survived'

/** Returns a number in [0, 1). */
export type Random = () => number

export type SneakyPhoneState = {
  status: GameStatus
  /** Game time in ms since the start, capped at GAME_MS. */
  elapsed: number
  phase: TeacherPhase
  phaseStartedAt: number
  phaseEndsAt: number
  /** Whether the player is holding the phone out right now. */
  using: boolean
  /** Current unbroken phone time; back to 0 the moment it is hidden. */
  streakMs: number
  /** Points earned so far, unrounded. */
  score: number
  totalPhoneMs: number
  /** Game time the round ended, when it has. */
  endedAt: number | null
}

export type SneakyPhoneResult = {
  status: Exclude<GameStatus, 'playing'>
  baseScore: number
  bonus: number
  finalScore: number
  totalPhoneMs: number
  endedAt: number
}

/** The teacher can see the class: holding the phone now means getting caught. */
export function isTeacherLooking(phase: TeacherPhase) {
  return phase === 'watching' || phase === 'returning'
}

export function multiplierFor(streakMs: number) {
  let multiplier: number = STREAK_TIERS[0].multiplier
  for (const tier of STREAK_TIERS) if (streakMs >= tier.from) multiplier = tier.multiplier
  return multiplier
}

/** Time until the streak reaches the next multiplier, or Infinity at the top. */
function msUntilNextTier(streakMs: number) {
  const next = STREAK_TIERS.find((tier) => tier.from > streakMs)
  return next ? next.from - streakMs : Number.POSITIVE_INFINITY
}

/**
 * Points for one unbroken stretch of phone time, tier by tier: each tier's
 * rate covers only the time spent in that tier - nothing is back-dated.
 */
export function pointsForStreak(fromMs: number, toMs: number) {
  let points = 0
  let cursor = fromMs
  while (cursor < toMs) {
    const end = Math.min(toMs, cursor + msUntilNextTier(cursor))
    points += (BASE_POINTS_PER_SECOND * multiplierFor(cursor) * (end - cursor)) / 1000
    cursor = end
  }
  return points
}

const between = (random: Random, min: number, max: number) => min + random() * (max - min)

export function boardDurationAt(elapsed: number, random: Random) {
  let stage: (typeof BOARD_MS_BY_STAGE)[number] = BOARD_MS_BY_STAGE[0]
  for (const candidate of BOARD_MS_BY_STAGE) if (elapsed >= candidate.from) stage = candidate
  return between(random, stage.min, stage.max)
}

function phaseDuration(phase: TeacherPhase, startsAt: number, random: Random) {
  switch (phase) {
    case 'board':
      return boardDurationAt(startsAt, random)
    case 'warning':
      return WARNING_MS
    case 'watching':
      return between(random, WATCHING_MIN_MS, WATCHING_MAX_MS)
    case 'returning':
      return RETURNING_MS
  }
}

const NEXT_PHASE: Record<TeacherPhase, TeacherPhase> = {
  board: 'warning',
  warning: 'watching',
  watching: 'returning',
  returning: 'board',
}

export function createGame(random: Random = Math.random): SneakyPhoneState {
  return {
    status: 'playing',
    elapsed: 0,
    phase: 'board',
    phaseStartedAt: 0,
    phaseEndsAt: phaseDuration('board', 0, random),
    using: false,
    streakMs: 0,
    score: 0,
    totalPhoneMs: 0,
    endedAt: null,
  }
}

/**
 * Runs the clock forward to `target`. Teacher turns, multiplier steps and the
 * final bell are handled at their exact times, not at frame boundaries, so
 * the result does not depend on the frame rate.
 *
 * Tie rule: if the bell and the teacher's turn land on the same instant, the
 * bell wins - the round is over before the teacher finishes turning.
 */
export function advanceTo(
  state: SneakyPhoneState,
  target: number,
  random: Random = Math.random,
): SneakyPhoneState {
  if (state.status !== 'playing' || target <= state.elapsed) return state
  const s = { ...state }
  const until = Math.min(target, GAME_MS)

  while (s.status === 'playing' && s.elapsed < until) {
    let next = Math.min(until, s.phaseEndsAt)
    if (s.using) next = Math.min(next, s.elapsed + msUntilNextTier(s.streakMs))

    const step = next - s.elapsed
    if (s.using) {
      s.score += pointsForStreak(s.streakMs, s.streakMs + step)
      s.streakMs += step
      s.totalPhoneMs += step
    }
    s.elapsed = next

    if (s.elapsed >= GAME_MS) {
      s.status = 'survived'
      s.endedAt = GAME_MS
      break
    }
    if (s.elapsed >= s.phaseEndsAt) {
      s.phase = NEXT_PHASE[s.phase]
      s.phaseStartedAt = s.elapsed
      s.phaseEndsAt = s.elapsed + phaseDuration(s.phase, s.elapsed, random)
      // The turn completes with the phone out: caught at this exact instant.
      if (s.using && isTeacherLooking(s.phase)) {
        s.status = 'caught'
        s.endedAt = s.elapsed
      }
    }
  }
  return s
}

/**
 * Takes the phone out or puts it away at game time `at`. The clock is run up
 * to `at` first, so points stop or start exactly when the input happened.
 * Taking it out while the teacher is looking is caught on the spot.
 */
export function setPhone(
  state: SneakyPhoneState,
  using: boolean,
  at: number,
  random: Random = Math.random,
): SneakyPhoneState {
  const s = advanceTo(state, at, random)
  if (s.status !== 'playing' || s.using === using) return s
  if (!using) return { ...s, using: false, streakMs: 0 }
  if (isTeacherLooking(s.phase)) return { ...s, using: true, status: 'caught', endedAt: s.elapsed }
  return { ...s, using: true, streakMs: 0 }
}

/**
 * Whole points for display. Points pile up in small float steps every frame,
 * so a hair of tolerance keeps 409.9999… from showing as 409.
 */
export const wholePoints = (score: number) => Math.floor(score + 1e-6)

export function getResult(state: SneakyPhoneState): SneakyPhoneResult | null {
  if (state.status === 'playing' || state.endedAt === null) return null
  const baseScore = wholePoints(state.score)
  const bonus = state.status === 'survived' ? SURVIVAL_BONUS : 0
  return {
    status: state.status,
    baseScore,
    bonus,
    finalScore: baseScore + bonus,
    totalPhoneMs: state.totalPhoneMs,
    endedAt: state.endedAt,
  }
}

export const secondsLeft = (state: SneakyPhoneState) =>
  Math.max(0, Math.ceil((GAME_MS - state.elapsed) / 1000))

// ---------- best score ----------

const BEST_KEY = 'sneaky-phone-best'
const BEST_VERSION = 1

export function loadBestScore(): number {
  try {
    const raw = window.localStorage.getItem(BEST_KEY)
    if (!raw) return 0
    const value = JSON.parse(raw) as { version?: unknown; best?: unknown }
    if (value?.version !== BEST_VERSION) return 0
    const best = value.best
    return typeof best === 'number' && Number.isInteger(best) && best >= 0 ? best : 0
  } catch {
    return 0
  }
}

/** Saves `score` when it beats the stored best; returns whether it did. */
export function saveBestScore(score: number): boolean {
  if (!Number.isInteger(score) || score <= loadBestScore()) return false
  try {
    window.localStorage.setItem(BEST_KEY, JSON.stringify({ version: BEST_VERSION, best: score }))
  } catch {
    // Storage unavailable: the record just isn't kept.
  }
  return true
}
