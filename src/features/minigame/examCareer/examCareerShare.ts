import {
  ELECTIVE_OPTIONS,
  SUBJECTS,
  UNIVERSITY_TIERS,
  type ElectiveCategory,
  type Electives,
  type Track,
  type UniversityTierId,
} from './examCareerConfig'
import { averageGrade, summarize, type CareerState, type Grades } from './examCareerEngine'

/** What a shared link carries: the final CSAT and where it led. No name, seed or history. */
export type SharedCareer = {
  track: Track
  attempt: number
  grades: Grades
  electives: Electives
  average: number
  enrolled: UniversityTierId | null
}

const TRACK_CODES: Record<Track, string> = { humanities: 'h', science: 's' }
const CATEGORIES: readonly ElectiveCategory[] = ['korean', 'math', 'inquiry']
const NOT_ENROLLED = 'none'

const optionsOf = (category: ElectiveCategory) => ELECTIVE_OPTIONS[category] as readonly { id: string }[]

/**
 * A short, readable code for a finished career, e.g. "h1-23412-010-seoul-upper":
 * track and attempt, the five CSAT grades, the elective of each category, the
 * school enrolled at. Null until there is a final CSAT.
 */
export function shareCodeOf(state: CareerState): string | null {
  const summary = summarize(state)
  const final = summary.finalCsat
  if (!final?.electives) return null
  const grades = SUBJECTS.map((subject) => final.grades[subject.id]).join('')
  const electives = CATEGORIES.map((category) =>
    optionsOf(category).findIndex((option) => option.id === final.electives![category]),
  ).join('')
  const enrolled = summary.admission?.enrolled ?? NOT_ENROLLED
  return `${TRACK_CODES[state.profile.track]}${final.attempt}-${grades}-${electives}-${enrolled}`
}

/** Reads a shared code back; anything malformed gives null. */
export function parseShareCode(code: string | undefined): SharedCareer | null {
  const match = /^([hs])(\d)-([1-9]{5})-(\d{3})-([a-z-]+)$/.exec(code ?? '')
  if (!match) return null
  const [, trackCode, attemptText, gradeText, electiveText, enrolledText] = match
  const track = (Object.keys(TRACK_CODES) as Track[]).find((id) => TRACK_CODES[id] === trackCode)!

  const electives = {} as Record<ElectiveCategory, string>
  for (const [index, category] of CATEGORIES.entries()) {
    const option = optionsOf(category)[Number(electiveText![index])]
    if (!option) return null
    electives[category] = option.id
  }

  const enrolled =
    enrolledText === NOT_ENROLLED
      ? null
      : (UNIVERSITY_TIERS.find((tier) => tier.id === enrolledText)?.id ?? undefined)
  if (enrolled === undefined) return null

  const grades = {} as Grades
  SUBJECTS.forEach((subject, index) => {
    grades[subject.id] = Number(gradeText![index])
  })

  return {
    track,
    attempt: Number(attemptText),
    grades,
    electives: electives as Electives,
    average: averageGrade(grades),
    enrolled,
  }
}
