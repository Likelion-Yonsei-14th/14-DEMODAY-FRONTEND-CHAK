import {
  ADAPTATION,
  ADMISSION,
  APPLICATION_GROUPS,
  BREAKUP_NOTICE,
  attemptLabel,
  CHANCE_LABELS,
  CHOICE_EVENTS,
  cohortShift,
  COMMON_DAY_ROLLS,
  DEFAULT_ELECTIVES,
  ELECTIVE_OPTIONS,
  ELECTIVE_SUBJECTS,
  EXAM_CAREER_DATA_VERSION,
  GENIUS_AWAKENING,
  GROWTH,
  GROWTH_TYPES,
  INQUIRY_SUBJECT_LABELS,
  INTEGRATED_INQUIRY_LABELS,
  LEGEND_LECTURE,
  LUCK_TILT,
  RETAKE_CHOICE_EVENTS,
  RETAKE_EXAMS,
  RETAKE_JUNE_REPORT,
  RETAKE_START_EVENTS,
  SCHOOL_YEARS,
  STUDENT,
  SUBJECTS,
  STUDENT_NAME,
  STUDY_CAFE_EVENT,
  SUBJECT_DAY_ROLLS,
  SUBJECT_SIDES,
  TRACK_LEAN,
  TRACKS,
  UNIVERSITY_TIERS,
  gradeFromScore,
  volatilityFor,
  type CareerFlag,
  type ChoiceEvent,
  type ChoiceOutcome,
  type DayRoll,
  type DayRollId,
  type ElectiveCategory,
  type Electives,
  type EventEffect,
  type EventTarget,
  type ExamKind,
  type GrowthType,
  type Phase,
  type Subject,
  type Track,
  type UniversityTierId,
} from './examCareerConfig'
import { streamFor, type RandomStream } from './examCareerRandom'

// ---------- types ----------

export type Grades = Record<Subject, number>

export type ExamSlot = {
  /** Unique across the whole career, e.g. "g3-09p" or "n2-csat". */
  id: string
  phase: Phase
  key: string
  label: string
  yearLabel: string
  kind: ExamKind
  /** 0 = 현역, 1 = 재수, … */
  attempt: number
  /** Months since the start of 고1 March; used to measure time between exams. */
  absoluteMonth: number
  /** Months into high school of the matching 고3 exam; sets the grading bar. */
  cohortMonth: number
}

export type ActiveEffect = {
  eventId: string
  kind: 'growth' | 'day' | 'swing' | 'bust-risk'
  subjects: Subject[]
  /** Growth multiplier, day-score change, or a 대박 / 대폭망 odds multiplier. */
  value: number
  examsLeft: number
}

export type CareerEventRecord = {
  eventId: string
  title: string
  description: string
  tone: 'up' | 'down'
}

export type DayNote = { subject: Subject | 'all'; roll: DayRollId; label: string }

export type ExamResult = {
  examId: string
  index: number
  label: string
  yearLabel: string
  attempt: number
  kind: ExamKind
  /** The electives sat in this exam; null in 고1, before any were chosen. */
  electives: Electives | null
  grades: Grades
  average: number
  events: CareerEventRecord[]
  /** Only the rolls worth mentioning (anything but an ordinary day). */
  dayNotes: DayNote[]
}

/**
 * playing: the next exam can run. choosing: waiting for electives (before
 * 고2, when 고3 starts, before the 고3 September 모의평가, at the start of each
 * retake year). event: waiting for the player's pick in a choice event.
 * decision: a CSAT just ended. applying: picking the 가·나·다군 schools.
 * admission: results are in; enroll or retake. finished: the career is over.
 */
export type CareerStatus =
  | 'playing'
  | 'choosing'
  | 'event'
  | 'notice'
  | 'decision'
  | 'applying'
  | 'admission'
  | 'finished'

const STATUSES: readonly CareerStatus[] = [
  'playing',
  'choosing',
  'event',
  'notice',
  'decision',
  'applying',
  'admission',
  'finished',
]

export type Application = {
  group: string
  tierId: UniversityTierId
  /** This year's cutoff for the group in this 군. */
  cutoff: number
  chance: number
  accepted: boolean
}

export type AdmissionRecord = {
  attempt: number
  csatExamId: string
  average: number
  applications: Application[]
  /** Where the student enrolled; null while undecided or when they did not. */
  enrolled: UniversityTierId | null
}
export type ElectiveChoicePoint = 'first' | 'senior' | 'last-change' | 'retake'

export type CareerProfile = {
  name: string
  track: Track
  /** How much stronger their track's subjects are than the other side's (exam-day points). */
  trackLean: number
  growthType: GrowthType
  stability: number
  luck: number
  /** Exam id where a genius-type student awakens; null for the other types. */
  geniusAwakeningExamId: string | null
  /** The 현역 exam the 스터디카페 event comes before. */
  studyCafeExamId: string
}

export type CareerState = {
  version: number
  seed: string
  status: CareerStatus
  pendingChoice: ElectiveChoicePoint | null
  /** The exam whose electives choice was already made, so it is not asked twice. */
  choiceAnsweredFor: string | null
  attempt: number
  /** Index of the next exam within the current attempt's schedule. */
  nextExamIndex: number
  profile: CareerProfile
  electives: Electives | null
  skill: Record<Subject, number>
  potential: Record<Subject, number>
  /** 1 = fully settled in the subject's elective; lower costs exam-day points. */
  adaptation: Record<Subject, number>
  effects: ActiveEffect[]
  /** The choice event waiting for a pick (status "event"). */
  pendingEvent: string | null
  /** The exam whose choice event was already answered, so it is not asked twice. */
  eventAnsweredFor: string | null
  /** What happened in choice events since the last exam; shown with the next result. */
  pendingRecords: CareerEventRecord[]
  /** Something that just happened and waits to be acknowledged (status "notice"). */
  pendingNotice: string | null
  flags: CareerFlag[]
  lastAbsoluteMonth: number | null
  history: ExamResult[]
  /** One record per round of applications, kept across retakes. */
  admissions: AdmissionRecord[]
}

// ---------- schedule ----------

export const SUBJECT_IDS = SUBJECTS.map((subject) => subject.id)

export function scheduleFor(attempt: number): ExamSlot[] {
  if (attempt === 0) {
    return SCHOOL_YEARS.flatMap((year, yearIndex) =>
      year.exams.map((exam) => ({
        id: `${year.phase}-${exam.key}`,
        phase: year.phase,
        key: exam.key,
        label: exam.label,
        yearLabel: year.label,
        kind: exam.kind,
        attempt: 0,
        absoluteMonth: yearIndex * 12 + exam.month,
        cohortMonth: yearIndex * 12 + exam.month - 3,
      })),
    )
  }
  const csatMonth = 2 * 12 + 11
  return RETAKE_EXAMS.map((exam) => ({
    id: `n${attempt}-${exam.key}`,
    phase: 'nsu' as const,
    key: exam.key,
    label: exam.label,
    yearLabel: attemptLabel(attempt),
    kind: exam.kind,
    attempt,
    absoluteMonth: csatMonth + (attempt - 1) * 12 + GROWTH.monthsBeforeRetakeJune + (exam.month - 6),
    cohortMonth: 2 * 12 + exam.month - 3,
  }))
}

export function nextExam(state: CareerState): ExamSlot | null {
  return scheduleFor(state.attempt)[state.nextExamIndex] ?? null
}

// ---------- helpers ----------

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const round1 = (value: number) => Math.round(value * 10) / 10
const round2 = (value: number) => Math.round(value * 100) / 100

export function averageGrade(grades: Grades) {
  return round1(SUBJECT_IDS.reduce((sum, subject) => sum + grades[subject], 0) / SUBJECT_IDS.length)
}

type Focus = { weakest: Subject; strongest: Subject; random: Subject }

/** The subjects an effect lands on; weakest / strongest / random are fixed when the event happens. */
function targetsOf(target: EventTarget, focus: Focus): Subject[] {
  if (target === 'all') return [...SUBJECT_IDS]
  if (target === 'weakest' || target === 'strongest' || target === 'random') return [focus[target]]
  return [target]
}

/** `key` seeds the random subject, so it never shifts the event's other draws. */
function focusOf(skill: Record<Subject, number>, key: string): Focus {
  const sorted = [...SUBJECT_IDS].sort((a, b) => skill[a] - skill[b])
  const random = SUBJECT_IDS[streamFor(`${key}:random-subject`).int(0, SUBJECT_IDS.length - 1)]!
  return { weakest: sorted[0]!, strongest: sorted[sorted.length - 1]!, random }
}

const ELECTIVE_CATEGORIES = Object.keys(ELECTIVE_SUBJECTS) as ElectiveCategory[]

type AnyElectiveOption = { id: string; label: string; growth: number; startAdaptation: Record<Track, number> }

function electiveOption(category: ElectiveCategory, electives: Electives): AnyElectiveOption {
  const options = ELECTIVE_OPTIONS[category] as readonly AnyElectiveOption[]
  return options.find((option) => option.id === electives[category]) ?? options[0]!
}

/** The elective category a graded subject belongs to; english has none. */
function categoryOf(subject: Subject): ElectiveCategory | null {
  return ELECTIVE_CATEGORIES.find((category) => ELECTIVE_SUBJECTS[category].includes(subject)) ?? null
}

/** "수학 · 미적분", "사회탐구 1" — or, in 고1, the plain name and 통합사회 / 통합과학. */
export function subjectLabel(subject: Subject, electives: Electives | null) {
  const base = SUBJECTS.find((item) => item.id === subject)?.name ?? subject
  if (subject === 'inquiry1' || subject === 'inquiry2') {
    const labels = electives ? INQUIRY_SUBJECT_LABELS[electives.inquiry] : INTEGRATED_INQUIRY_LABELS
    return { name: labels[subject === 'inquiry1' ? 0 : 1], elective: null as string | null }
  }
  if (!electives) return { name: base, elective: null as string | null }
  const category = categoryOf(subject)
  return { name: base, elective: category ? electiveOption(category, electives).label : null }
}

/** The track whose side a subject is on in this exam, or null for 영어. */
function sideOf(subject: Subject, electives: Electives | null): Track | null {
  if (subject === 'korean') return SUBJECT_SIDES.korean
  if (subject === 'math') return SUBJECT_SIDES.math
  if (subject === 'english') return null
  return SUBJECT_SIDES.inquiry[electives?.inquiry ?? 'integrated'][subject === 'inquiry1' ? 0 : 1]
}

export function isValidElectives(value: unknown): value is Electives {
  if (!value || typeof value !== 'object') return false
  const electives = value as Record<string, unknown>
  return ELECTIVE_CATEGORIES.every((category) =>
    (ELECTIVE_OPTIONS[category] as readonly { id: string }[]).some((option) => option.id === electives[category]),
  )
}

// ---------- student ----------

export function normalizeName(name: string) {
  return name.trim().slice(0, STUDENT_NAME.maxLength) || STUDENT_NAME.fallback
}

export function createCareer(seed: string, track: Track = 'humanities', name = ''): CareerState {
  const key = (part: string) => streamFor(`${seed}:profile:${part}`)
  const typeIds = Object.keys(GROWTH_TYPES) as GrowthType[]
  const growthType = key('type').weighted(typeIds, (id) => GROWTH_TYPES[id].weight)

  const { commonAbility } = STUDENT
  const common = clamp(
    commonAbility.mean + key('common').normal() * commonAbility.spread,
    commonAbility.min,
    commonAbility.max,
  )

  const { potentialGap } = STUDENT
  const sharedGap = key('potential').between(potentialGap.min, potentialGap.max)
  const skill = {} as Record<Subject, number>
  const potential = {} as Record<Subject, number>
  const adaptation = {} as Record<Subject, number>
  for (const subject of SUBJECT_IDS) {
    const offset = key(`${subject}:offset`).normal() * STUDENT.subjectOffsetSpread
    const start = clamp(common + offset, STUDENT.initialSkill.min, STUDENT.initialSkill.max)
    const gap = clamp(
      sharedGap + key(`${subject}:potential`).normal() * potentialGap.subjectSpread,
      potentialGap.min,
      potentialGap.max,
    )
    skill[subject] = round1(start)
    potential[subject] = round1(Math.min(STUDENT.potentialMax, start + gap))
    adaptation[subject] = 1
  }

  const schedule = scheduleFor(0)
  const { fromIndex, toIndex } = STUDENT.geniusAwakeningWindow
  const awakening =
    growthType === 'genius' ? schedule[key('genius-awakening').int(fromIndex, toIndex)]?.id ?? null : null
  // High school opens with a choice event, before the first exam is even offered.
  const entryEvent = choiceEventFor(schedule[0]!)

  return {
    version: EXAM_CAREER_DATA_VERSION,
    seed,
    status: entryEvent ? 'event' : 'playing',
    pendingChoice: null,
    choiceAnsweredFor: null,
    attempt: 0,
    nextExamIndex: 0,
    profile: {
      name: normalizeName(name),
      track,
      trackLean: round1(key('lean').between(TRACK_LEAN.min, TRACK_LEAN.max)),
      growthType,
      stability: round2(key('stability').next()),
      luck: round2(key('luck').next()),
      geniusAwakeningExamId: awakening,
      studyCafeExamId: STUDENT.studyCafeBefore[key('study-cafe').int(0, STUDENT.studyCafeBefore.length - 1)]!,
    },
    electives: null,
    skill,
    potential,
    adaptation,
    effects: [],
    pendingEvent: entryEvent?.id ?? null,
    eventAnsweredFor: null,
    pendingRecords: [],
    pendingNotice: null,
    flags: [],
    lastAbsoluteMonth: null,
    history: [],
    admissions: [],
  }
}

// ---------- electives ----------

/**
 * Settles the electives at a choice point. A first pick starts each subject at
 * its option's adaptation for the student's track. Later, only the categories
 * that actually change drop in adaptation; skill itself is never reset.
 */
export function chooseElectives(state: CareerState, electives: Electives): CareerState {
  if (state.status !== 'choosing' || !state.pendingChoice || !isValidElectives(electives)) return state
  const adaptation = { ...state.adaptation }
  const previous = state.electives

  for (const category of ELECTIVE_CATEGORIES) {
    const changed = !previous || previous[category] !== electives[category]
    if (!changed) continue
    const start = electiveOption(category, electives).startAdaptation[state.profile.track]
    for (const subject of ELECTIVE_SUBJECTS[category]) {
      adaptation[subject] = state.pendingChoice === 'first' ? start : Math.min(start, SWITCH_ADAPTATION[state.pendingChoice])
    }
  }

  return {
    ...state,
    status: 'playing',
    pendingChoice: null,
    choiceAnsweredFor: nextExam(state)?.id ?? null,
    electives: { ...electives },
    adaptation,
  }
}

const SWITCH_ADAPTATION: Record<Exclude<ElectiveChoicePoint, 'first'>, number> = {
  senior: ADAPTATION.switchAtSeniorStart,
  'last-change': ADAPTATION.switchInSenior,
  retake: ADAPTATION.switchInRetake,
}

/** Electives choice points that come right before an exam of the 현역 schedule. */
const CHOICES_BEFORE: Record<string, ElectiveChoicePoint> = {
  [STUDENT.electiveFirstChoiceBefore]: 'first',
  [STUDENT.electiveSeniorChangeBefore]: 'senior',
  [STUDENT.electiveLastChangeBefore]: 'last-change',
}

/** The electives choice the next exam waits for, if it has not been made yet. */
export function electiveChoiceBefore(state: CareerState): ElectiveChoicePoint | null {
  const slot = nextExam(state)
  if (!slot || slot.attempt !== 0 || state.choiceAnsweredFor === slot.id) return null
  return CHOICES_BEFORE[slot.id] ?? null
}

export function defaultElectivesFor(state: CareerState): Electives {
  return state.electives ?? DEFAULT_ELECTIVES[state.profile.track]
}

// ---------- events ----------

const ALL_CHOICE_EVENTS: readonly ChoiceEvent[] = [...CHOICE_EVENTS, ...RETAKE_CHOICE_EVENTS, STUDY_CAFE_EVENT]

/** The choice event asked right before this exam, if any. */
export function choiceEventFor(slot: ExamSlot): ChoiceEvent | null {
  return ALL_CHOICE_EVENTS.find((event) => event.before.includes(`${slot.phase}-${slot.key}`)) ?? null
}

/** The choice event this career asks before the exam: the fixed ones, or its own 스터디카페 moment. */
export function choiceEventBefore(state: CareerState, slot: ExamSlot): ChoiceEvent | null {
  const fixed = choiceEventFor(slot)
  if (fixed) return fixed
  return slot.attempt === 0 && state.profile.studyCafeExamId === slot.id ? STUDY_CAFE_EVENT : null
}

/** The notice waiting to be acknowledged (status "notice"). */
export function pendingNoticeOf(state: CareerState) {
  if (state.status !== 'notice' || state.pendingNotice !== BREAKUP_NOTICE.id) return null
  return { title: BREAKUP_NOTICE.title, text: BREAKUP_NOTICE.outcomes[0].text }
}

export function acknowledgeNotice(state: CareerState): CareerState {
  if (state.status !== 'notice') return state
  return { ...state, status: 'playing', pendingNotice: null }
}

/** The choice event currently waiting for a pick. */
export function pendingEventOf(state: CareerState): ChoiceEvent | null {
  if (state.status !== 'event') return null
  return ALL_CHOICE_EVENTS.find((event) => event.id === state.pendingEvent) ?? null
}

type Working = {
  skill: Record<Subject, number>
  potential: Record<Subject, number>
  effects: ActiveEffect[]
  stability: number
  flags: CareerFlag[]
}

function workingCopy(state: CareerState): Working {
  return {
    skill: { ...state.skill },
    potential: { ...state.potential },
    stability: state.profile.stability,
    flags: [...state.flags],
    effects: state.effects.map((effect) => ({ ...effect, subjects: [...effect.subjects] })),
  }
}

/** Applies effects to a working copy, potential first so a skill jump is capped against the raised ceiling. */
function applyEffects(
  effects: readonly EventEffect[],
  eventId: string,
  working: Working,
  random: RandomStream,
  focus: Focus,
) {
  const ordered = [...effects].sort((a, b) => Number(b.type === 'potential') - Number(a.type === 'potential'))
  for (const effect of ordered) {
    const subjects = 'target' in effect ? targetsOf(effect.target, focus) : []
    if (effect.type === 'flag') {
      working.flags = working.flags.filter((flag) => flag !== effect.flag)
      if (effect.on) working.flags.push(effect.flag)
    } else if (effect.type === 'stability') {
      working.stability = round2(clamp(working.stability + random.between(...effect.amount), 0, 1))
    } else if (effect.type === 'skill') {
      for (const subject of subjects) {
        const ceiling = Math.min(STUDENT.skillMax, working.potential[subject] + GROWTH.potentialOvershoot)
        const raised = working.skill[subject] + random.between(...effect.amount)
        working.skill[subject] = round1(clamp(raised, 0, Math.max(ceiling, working.skill[subject])))
      }
    } else if (effect.type === 'potential') {
      for (const subject of subjects) {
        working.potential[subject] = Math.min(
          STUDENT.potentialMax,
          working.potential[subject] + random.between(...effect.amount),
        )
      }
    } else if (effect.type === 'growth' || effect.type === 'swing' || effect.type === 'bust-risk') {
      working.effects.push({ eventId, kind: effect.type, subjects, value: effect.factor, examsLeft: effect.exams })
    } else {
      working.effects.push({
        eventId,
        kind: 'day',
        subjects,
        value: random.between(...effect.amount),
        examsLeft: effect.exams,
      })
    }
  }
}

/**
 * Draws one outcome, applies it to the working copy and describes it.
 * `{subject}` names the subject a weakest / strongest / random effect landed on.
 */
function happen(
  outcomes: readonly ChoiceOutcome[],
  eventId: string,
  title: string,
  key: string,
  working: Working,
  electives: Electives | null,
): CareerEventRecord {
  const random = streamFor(key)
  const outcome = random.weighted(outcomes, (item) => item.weight)
  const focus = focusOf(working.skill, key)
  applyEffects(outcome.effects, eventId, working, random, focus)
  const targeted = outcome.effects.find(
    (effect) =>
      'target' in effect &&
      (effect.target === 'weakest' || effect.target === 'strongest' || effect.target === 'random'),
  )
  const subject = targeted && 'target' in targeted ? focus[targeted.target as keyof Focus] : null
  return {
    eventId,
    title,
    description: outcome.text.replace('{subject}', subject ? subjectLabel(subject, electives).name : ''),
    tone: outcome.tone,
  }
}

/**
 * Answers the waiting choice event. The option's outcome is drawn from a
 * stream keyed by the exam, the event and the option, so the same pick
 * always ends the same way. Its effects start with the next exam.
 */
export function chooseEventOption(state: CareerState, optionId: string): CareerState {
  const event = pendingEventOf(state)
  const slot = nextExam(state)
  const option = event?.options.find((item) => item.id === optionId)
  if (!event || !slot || !option) return state

  const working = workingCopy(state)
  const record = happen(
    option.outcomes,
    event.id,
    `${event.title} · ${option.label}`,
    `${state.seed}:choice:${slot.id}:${event.id}:${option.id}`,
    working,
    state.electives,
  )

  const records = [...state.pendingRecords, record]

  // Someone dating may be left right after the 현역 CSAT's D-30 pick.
  let notice: string | null = null
  if (slot.kind === 'csat' && slot.attempt === 0 && working.flags.includes('dating')) {
    const key = `${state.seed}:event:${slot.id}:${BREAKUP_NOTICE.id}`
    if (streamFor(`${key}:roll`).chance(BREAKUP_NOTICE.chance)) {
      records.push(happen(BREAKUP_NOTICE.outcomes, BREAKUP_NOTICE.id, BREAKUP_NOTICE.title, key, working, state.electives))
      notice = BREAKUP_NOTICE.id
    }
  }

  const { stability, ...changed } = working
  // The retake-start events run one after another, then that year's electives.
  const startIndex = (RETAKE_START_EVENTS as readonly string[]).indexOf(event.id)
  const nextStartEvent = startIndex >= 0 ? (RETAKE_START_EVENTS[startIndex + 1] ?? null) : null
  return {
    ...state,
    ...changed,
    profile: { ...state.profile, stability },
    status: nextStartEvent ? 'event' : notice ? 'notice' : state.pendingChoice ? 'choosing' : 'playing',
    pendingEvent: nextStartEvent,
    pendingNotice: notice,
    // A retake-start event is not the June exam's own event, which still comes.
    eventAnsweredFor: startIndex >= 0 ? state.eventAnsweredFor : slot.id,
    pendingRecords: records,
  }
}

// ---------- one exam ----------

/**
 * `swing` scales the 대박 and 대폭망 odds together (events such as 마지막 승부);
 * `bustRisk` scales only the 대폭망 odds (a breakup before the CSAT).
 */
function tiltedRolls(rolls: readonly DayRoll[], luck: number, swing = 1, bustRisk = 1): DayRoll[] {
  // luck 0.5 is neutral; luckier students see more good days and fewer bad ones.
  const tilt = (luck - 0.5) * 2 * LUCK_TILT
  return rolls.map((roll) => {
    const extreme = roll.id === 'jackpot' ? swing : roll.id === 'bust' ? swing * bustRisk : 1
    if (roll.id === 'good' || roll.id === 'jackpot') return { ...roll, weight: roll.weight * (1 + tilt) * extreme }
    if (roll.id === 'bad' || roll.id === 'bust') return { ...roll, weight: roll.weight * (1 - tilt) * extreme }
    return roll
  })
}

/** How last year's CSAT compares with this retake year's June 모의평가. */
function juneTrend(history: ExamResult[], june: ExamResult): 'up' | 'same' | 'down' {
  const lastCsat = [...history].reverse().find((result) => result.kind === 'csat' && result.attempt === june.attempt - 1)
  if (!lastCsat) return 'same'
  const gain = lastCsat.average - june.average
  if (gain >= RETAKE_JUNE_REPORT.threshold) return 'up'
  if (gain <= -RETAKE_JUNE_REPORT.threshold) return 'down'
  return 'same'
}

/**
 * Simulates the next exam: events → growth → exam-day luck → grades.
 * Pure: the same state always produces the same next state. Stops at an
 * electives choice or a choice event instead of running the exam.
 */
export function runExam(state: CareerState): CareerState {
  if (state.status !== 'playing') return state
  const slot = nextExam(state)
  if (!slot) return state
  // How the time before the exam is spent comes first, then any electives choice.
  const choiceEvent = choiceEventBefore(state, slot)
  if (choiceEvent && state.eventAnsweredFor !== slot.id) {
    return { ...state, status: 'event', pendingEvent: choiceEvent.id }
  }
  const choicePoint = electiveChoiceBefore(state)
  if (choicePoint) return { ...state, status: 'choosing', pendingChoice: choicePoint }

  const { seed, profile, electives } = state
  const index = state.history.length
  const working = workingCopy(state)
  const events: CareerEventRecord[] = [...state.pendingRecords]

  // 1. Events nobody chooses: a genius-type student's awakening, and the rare
  //    legendary lecture right before a CSAT.
  if (profile.geniusAwakeningExamId === slot.id) {
    const key = `${seed}:event:${slot.id}:${GENIUS_AWAKENING.id}`
    applyEffects(GENIUS_AWAKENING.effects, GENIUS_AWAKENING.id, working, streamFor(key), focusOf(working.skill, key))
    events.push({
      eventId: GENIUS_AWAKENING.id,
      title: GENIUS_AWAKENING.title,
      description: GENIUS_AWAKENING.description,
      tone: GENIUS_AWAKENING.tone,
    })
  }
  if (slot.kind === 'csat' && streamFor(`${seed}:event:${slot.id}:${LEGEND_LECTURE.id}:roll`).chance(LEGEND_LECTURE.chance)) {
    const key = `${seed}:event:${slot.id}:${LEGEND_LECTURE.id}`
    events.push(happen(LEGEND_LECTURE.outcomes, LEGEND_LECTURE.id, LEGEND_LECTURE.title, key, working, electives))
  }

  // 2. Growth and elective adaptation since the last exam.
  const months = state.lastAbsoluteMonth === null ? 0 : slot.absoluteMonth - state.lastAbsoluteMonth
  const volatility = volatilityFor(working.stability)
  const typeMultiplier = GROWTH_TYPES[profile.growthType].phaseMultiplier[slot.phase]
  const retakeMultiplier =
    slot.attempt === 0
      ? 1
      : (GROWTH.retakeMultiplier[slot.attempt - 1] ?? GROWTH.retakeMultiplier[GROWTH.retakeMultiplier.length - 1]!)
  const adaptation = { ...state.adaptation }

  for (const subject of SUBJECT_IDS) {
    adaptation[subject] = round2(Math.min(1, adaptation[subject] + ADAPTATION.recoveryPerMonth * months))
    if (months === 0) continue
    const random = streamFor(`${seed}:growth:${slot.id}:${subject}`)
    const category = categoryOf(subject)
    const electiveGrowth = electives && category ? electiveOption(category, electives).growth : 1
    const gap = Math.max(0, working.potential[subject] - working.skill[subject])
    const gapFactor = clamp(gap / GROWTH.gapForFullSpeed, 0, 1)
    const effectMultiplier = working.effects
      .filter((effect) => effect.kind === 'growth' && effect.subjects.includes(subject))
      .reduce((product, effect) => product * effect.value, 1)
    const trend =
      GROWTH.basePerMonth * months * typeMultiplier * retakeMultiplier * electiveGrowth * gapFactor * effectMultiplier
    const wobble = random.normal() * GROWTH.noisePerSqrtMonth * Math.sqrt(months) * volatility
    const ceiling = Math.min(STUDENT.skillMax, working.potential[subject] + GROWTH.potentialOvershoot)
    // Growth never lifts skill past the ceiling (and never drags it down to it).
    const next = working.skill[subject] + trend + wobble
    working.skill[subject] = round1(clamp(next, 0, Math.max(ceiling, working.skill[subject])))
  }

  // 3-4. Exam day: one shared condition, then each subject's own luck.
  const dayNotes: DayNote[] = []
  const commonRoll = streamFor(`${seed}:condition:${slot.id}:common`)
  const common = commonRoll.weighted(tiltedRolls(COMMON_DAY_ROLLS, profile.luck), (roll) => roll.weight)
  const commonValue = commonRoll.between(...common.range)
  if (common.id !== 'normal') dayNotes.push({ subject: 'all', roll: common.id, label: common.label })

  const bar = cohortShift(slot.cohortMonth)
  const grades = {} as Grades
  for (const subject of SUBJECT_IDS) {
    const side = sideOf(subject, electives)
    const leanValue = side === null ? 0 : ((side === profile.track ? 1 : -1) * profile.trackLean) / 2
    const random = streamFor(`${seed}:condition:${slot.id}:${subject}`)
    const oddsOf = (kind: ActiveEffect['kind']) =>
      working.effects
        .filter((effect) => effect.kind === kind && effect.subjects.includes(subject))
        .reduce((product, effect) => product * effect.value, 1)
    const rolls = tiltedRolls(SUBJECT_DAY_ROLLS, profile.luck, oddsOf('swing'), oddsOf('bust-risk'))
    const roll = random.weighted(rolls, (item) => item.weight)
    // Steadier students swing less on the day, too.
    const rollValue = random.between(...roll.range) * volatility
    if (roll.id === 'jackpot' || roll.id === 'bust') {
      dayNotes.push({ subject, roll: roll.id, label: roll.label })
    }
    const eventValue = working.effects
      .filter((effect) => effect.kind === 'day' && effect.subjects.includes(subject))
      .reduce((sum, effect) => sum + effect.value, 0)
    const adaptationPenalty = (1 - adaptation[subject]) * ADAPTATION.penaltyAtZero
    grades[subject] = gradeFromScore(
      working.skill[subject] + leanValue + commonValue + rollValue + eventValue - adaptationPenalty - bar,
    )
  }

  // 5-6. Record, then age the active effects by one exam.
  const result: ExamResult = {
    examId: slot.id,
    index,
    label: slot.label,
    yearLabel: slot.yearLabel,
    attempt: slot.attempt,
    kind: slot.kind,
    electives: electives ? { ...electives } : null,
    grades,
    average: averageGrade(grades),
    events,
    dayNotes,
  }
  working.effects = working.effects
    .map((effect) => ({ ...effect, examsLeft: effect.examsLeft - 1 }))
    .filter((effect) => effect.examsLeft > 0)

  // 7. A retake year's June 모의평가 is set against last year's CSAT; its
  //    effects start with the next exam.
  if (slot.attempt > 0 && slot.key === '06p') {
    const trend = juneTrend(state.history, result)
    const key = `${seed}:event:${slot.id}:${RETAKE_JUNE_REPORT.id}`
    events.push(
      happen(RETAKE_JUNE_REPORT.cases[trend], RETAKE_JUNE_REPORT.id, RETAKE_JUNE_REPORT.title, key, working, electives),
    )
  }

  return {
    ...state,
    status: slot.kind === 'csat' ? 'decision' : 'playing',
    pendingChoice: null,
    nextExamIndex: state.nextExamIndex + 1,
    profile: { ...profile, stability: working.stability },
    flags: working.flags,
    skill: working.skill,
    potential: working.potential,
    adaptation,
    effects: working.effects,
    pendingRecords: [],
    lastAbsoluteMonth: slot.absoluteMonth,
    history: [...state.history, result],
  }
}

/**
 * After a CSAT: apply to universities, or start the next retake year: first
 * how to spend it (a choice event), then its electives. A retake is also open
 * once admission results are in.
 */
export function decide(state: CareerState, choice: 'university' | 'retake'): CareerState {
  if (choice === 'university') {
    return state.status === 'decision' ? { ...state, status: 'applying' } : state
  }
  if (state.status !== 'decision' && state.status !== 'admission') return state
  return {
    ...state,
    status: 'event',
    pendingEvent: RETAKE_START_EVENTS[0],
    pendingChoice: 'retake',
    attempt: state.attempt + 1,
    nextExamIndex: 0,
  }
}

// ---------- university applications ----------

export type TierCutoffs = Record<UniversityTierId, number>

/**
 * This attempt's cutoff for every group, one set per 가·나·다군. Drawn from
 * each group's range, so neighbouring groups can swap places.
 */
export function admissionCutoffs(state: Pick<CareerState, 'seed' | 'attempt'>): TierCutoffs[] {
  return APPLICATION_GROUPS.map((_, group) => {
    const cutoffs = {} as TierCutoffs
    for (const tier of UNIVERSITY_TIERS) {
      const random = streamFor(`${state.seed}:cutoff:${state.attempt}:${group}:${tier.id}`)
      cutoffs[tier.id] = round2(random.between(tier.cutoff.min, tier.cutoff.max))
    }
    return cutoffs
  })
}

/** Chance of getting in, from how far the CSAT average sits from the cutoff. */
export function admissionChance(average: number, cutoff: number) {
  const chance = 1 / (1 + Math.exp(-(cutoff - average) / ADMISSION.spread))
  return round2(clamp(chance, ADMISSION.minChance, ADMISSION.maxChance))
}

export function chanceLabel(chance: number) {
  return CHANCE_LABELS.find((item) => chance >= item.minChance) ?? CHANCE_LABELS[CHANCE_LABELS.length - 1]!
}

/** Sends one application per 가·나·다 group, using this attempt's CSAT, and draws the results. */
export function applyToUniversities(state: CareerState, picks: UniversityTierId[]): CareerState {
  if (state.status !== 'applying' || picks.length !== APPLICATION_GROUPS.length) return state
  if (!picks.every((tierId) => UNIVERSITY_TIERS.some((tier) => tier.id === tierId))) return state
  const csat = [...state.history].reverse().find((result) => result.kind === 'csat' && result.attempt === state.attempt)
  if (!csat) return state

  const cutoffs = admissionCutoffs(state)
  const applications = APPLICATION_GROUPS.map((group, index) => {
    const tierId = picks[index]!
    const cutoff = cutoffs[index]![tierId]
    const chance = admissionChance(csat.average, cutoff)
    const random = streamFor(`${state.seed}:admission:${state.attempt}:${index}`)
    return { group, tierId, cutoff, chance, accepted: random.chance(chance) }
  })

  return {
    ...state,
    status: 'admission',
    admissions: [
      ...state.admissions,
      { attempt: state.attempt, csatExamId: csat.examId, average: csat.average, applications, enrolled: null },
    ],
  }
}

/** Enrolls at one of the schools that accepted, or ends without enrolling (null). */
export function enroll(state: CareerState, tierId: UniversityTierId | null): CareerState {
  const record = state.admissions.at(-1)
  if (state.status !== 'admission' || !record) return state
  if (tierId !== null && !record.applications.some((item) => item.accepted && item.tierId === tierId)) return state
  return {
    ...state,
    status: 'finished',
    admissions: [...state.admissions.slice(0, -1), { ...record, enrolled: tierId }],
  }
}

export function universityLabel(tierId: UniversityTierId) {
  return UNIVERSITY_TIERS.find((tier) => tier.id === tierId)?.label ?? tierId
}

// ---------- summary ----------

export type ElectiveChange = {
  category: ElectiveCategory
  from: string
  to: string
  /** The last exam before the change and the first one after it. */
  before: ExamResult
  after: ExamResult
  subjects: Subject[]
}

export type CareerSummary = {
  finalCsat: ExamResult | null
  attemptLabel: string
  bestGrades: Grades
  biggestRise: { from: ExamResult; to: ExamResult; gain: number } | null
  csatResults: ExamResult[]
  majorEvents: (CareerEventRecord & { examLabel: string })[]
  electiveChanges: ElectiveChange[]
  /** The final round of applications, if the student applied at all. */
  admission: AdmissionRecord | null
}

/** Every switch of an elective between two consecutive exams, with the grades around it. */
export function electiveChanges(history: ExamResult[]): ElectiveChange[] {
  const changes: ElectiveChange[] = []
  for (let index = 1; index < history.length; index += 1) {
    const before = history[index - 1]!
    const after = history[index]!
    if (!before.electives || !after.electives) continue
    for (const category of ELECTIVE_CATEGORIES) {
      if (before.electives[category] === after.electives[category]) continue
      changes.push({
        category,
        from: electiveOption(category, before.electives).label,
        to: electiveOption(category, after.electives).label,
        before,
        after,
        subjects: ELECTIVE_SUBJECTS[category],
      })
    }
  }
  return changes
}

export function summarize(state: CareerState): CareerSummary {
  const { history } = state
  const csatResults = history.filter((result) => result.kind === 'csat')
  const bestGrades = {} as Grades
  for (const subject of SUBJECT_IDS) {
    bestGrades[subject] = history.length ? Math.min(...history.map((result) => result.grades[subject])) : 9
  }

  // Largest drop in average grade (lower is better) from any exam to a later one.
  let biggestRise: CareerSummary['biggestRise'] = null
  let worstSoFar: ExamResult | null = null
  for (const result of history) {
    if (!worstSoFar || result.average > worstSoFar.average) worstSoFar = result
    const gain = round1(worstSoFar.average - result.average)
    if (gain > 0 && (!biggestRise || gain > biggestRise.gain)) biggestRise = { from: worstSoFar, to: result, gain }
  }

  return {
    finalCsat: csatResults[csatResults.length - 1] ?? null,
    attemptLabel: attemptLabel(state.attempt),
    bestGrades,
    biggestRise,
    csatResults,
    majorEvents: history.flatMap((result) =>
      result.events.map((event) => ({ ...event, examLabel: `${result.yearLabel} ${result.label}` })),
    ),
    electiveChanges: electiveChanges(history),
    admission: state.admissions.at(-1) ?? null,
  }
}

// ---------- storage ----------

const STORAGE_KEY = 'exam-career-game'

export type SavedCareer = { state: CareerState }

/** Restores a saved career, or null when it is missing, stale or damaged. */
export function parseSavedCareer(raw: string | null): SavedCareer | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as Partial<SavedCareer>
    const state = value?.state
    if (!state || state.version !== EXAM_CAREER_DATA_VERSION || typeof state.seed !== 'string') return null
    if (!STATUSES.includes(state.status)) return null
    if (!Array.isArray(state.admissions) || !Array.isArray(state.pendingRecords)) return null
    if (!Array.isArray(state.flags)) return null
    if (!Array.isArray(state.history) || !Number.isInteger(state.attempt) || state.attempt < 0) return null
    if (state.electives !== null && !isValidElectives(state.electives)) return null
    if (!state.profile || !(state.profile.track in TRACKS) || typeof state.profile.name !== 'string') return null
    if (typeof state.profile.trackLean !== 'number') return null
    const gradesOk = state.history.every((result) =>
      SUBJECT_IDS.every((subject) => {
        const grade = result?.grades?.[subject]
        return Number.isInteger(grade) && grade >= 1 && grade <= 9
      }),
    )
    if (!gradesOk) return null
    return { state }
  } catch {
    return null
  }
}

let memoryCareer: SavedCareer | null = null

export function loadCareer(): SavedCareer | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) return memoryCareer
    const saved = parseSavedCareer(raw)
    if (!saved) window.localStorage.removeItem(STORAGE_KEY)
    return saved
  } catch {
    return memoryCareer
  }
}

export function saveCareer(saved: SavedCareer) {
  memoryCareer = saved
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
  } catch {
    // Storage unavailable: this visit keeps working from memory.
  }
}

export function clearCareer() {
  memoryCareer = null
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to clear.
  }
}
