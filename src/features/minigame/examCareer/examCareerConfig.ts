/**
 * Every tunable number of the exam career simulator lives here, so balance
 * can be adjusted without touching the simulation code.
 */

export const EXAM_CAREER_DATA_VERSION = 7

/** 탐구 is graded as two separate subjects. */
export type Subject = 'korean' | 'math' | 'english' | 'inquiry1' | 'inquiry2'

export const SUBJECTS: readonly { id: Subject; name: string }[] = [
  { id: 'korean', name: '국어' },
  { id: 'math', name: '수학' },
  { id: 'english', name: '영어' },
  { id: 'inquiry1', name: '탐구1' },
  { id: 'inquiry2', name: '탐구2' },
]

// ---------- track and electives (2027학년도 수능 체계) ----------

/** 문과 / 이과 leaning, picked at the start. It never forces an elective. */
export type Track = 'humanities' | 'science'

export const TRACKS: Record<Track, { label: string }> = {
  humanities: { label: '문과' },
  science: { label: '이과' },
}

/**
 * How much a student leans to their track. On exam day, subjects on their
 * side score up to `max / 2` higher and the other side as much lower; 영어
 * belongs to neither. Drawn per student, so some lean hard and some barely
 * at all, while overall ability still moves every subject together.
 */
export const TRACK_LEAN = { min: 0, max: 12 } as const

export type ElectiveCategory = 'korean' | 'math' | 'inquiry'
export type KoreanElective = 'speech-writing' | 'language-media'
export type MathElective = 'probability' | 'calculus' | 'geometry'
export type InquiryElective = 'social' | 'science' | 'mixed'

export type Electives = { korean: KoreanElective; math: MathElective; inquiry: InquiryElective }

export type ElectiveOption<Id extends string> = {
  id: Id
  label: string
  /** Small, permanent growth-speed difference for the subjects it covers. */
  growth: number
  /** How settled a student of each track is on first picking it (0-1). */
  startAdaptation: Record<Track, number>
}

export const ELECTIVE_OPTIONS: {
  korean: readonly ElectiveOption<KoreanElective>[]
  math: readonly ElectiveOption<MathElective>[]
  inquiry: readonly ElectiveOption<InquiryElective>[]
} = {
  korean: [
    { id: 'speech-writing', label: '화법과 작문', growth: 1, startAdaptation: { humanities: 0.93, science: 0.9 } },
    { id: 'language-media', label: '언어와 매체', growth: 1.04, startAdaptation: { humanities: 0.88, science: 0.87 } },
  ],
  math: [
    { id: 'probability', label: '확률과 통계', growth: 1, startAdaptation: { humanities: 0.93, science: 0.88 } },
    { id: 'calculus', label: '미적분', growth: 1.04, startAdaptation: { humanities: 0.82, science: 0.91 } },
    { id: 'geometry', label: '기하', growth: 1.02, startAdaptation: { humanities: 0.8, science: 0.89 } },
  ],
  inquiry: [
    { id: 'social', label: '사회탐구', growth: 1, startAdaptation: { humanities: 0.93, science: 0.85 } },
    { id: 'science', label: '과학탐구', growth: 1.02, startAdaptation: { humanities: 0.84, science: 0.93 } },
    { id: 'mixed', label: '혼합 (사탐+과탐)', growth: 1.01, startAdaptation: { humanities: 0.88, science: 0.88 } },
  ],
}

/** Which graded subjects each elective category covers. */
export const ELECTIVE_SUBJECTS: Record<ElectiveCategory, Subject[]> = {
  korean: ['korean'],
  math: ['math'],
  inquiry: ['inquiry1', 'inquiry2'],
}

export const INQUIRY_SUBJECT_LABELS: Record<InquiryElective, [string, string]> = {
  social: ['사회탐구 1', '사회탐구 2'],
  science: ['과학탐구 1', '과학탐구 2'],
  mixed: ['사회탐구', '과학탐구'],
}

/** 고1 has no electives: everyone takes 통합사회 and 통합과학. */
export const INTEGRATED_INQUIRY_LABELS: [string, string] = ['통합사회', '통합과학']

/** Which track's side each graded subject is on. 영어 is on neither. */
export const SUBJECT_SIDES: {
  korean: Track
  math: Track
  inquiry: Record<InquiryElective | 'integrated', [Track, Track]>
} = {
  korean: 'humanities',
  math: 'science',
  inquiry: {
    integrated: ['humanities', 'science'],
    social: ['humanities', 'humanities'],
    science: ['science', 'science'],
    mixed: ['humanities', 'science'],
  },
}

export const DEFAULT_ELECTIVES: Record<Track, Electives> = {
  humanities: { korean: 'speech-writing', math: 'probability', inquiry: 'social' },
  science: { korean: 'language-media', math: 'calculus', inquiry: 'science' },
}

export const ADAPTATION = {
  /** Exam-day score lost at adaptation 0; scales linearly up to 1 (fully settled). */
  penaltyAtZero: 14,
  recoveryPerMonth: 0.07,
  /** Where a subject's adaptation drops to when its elective changes. */
  /** Changing when 고3 starts leaves more time to settle than the change before the September 모의평가. */
  switchAtSeniorStart: 0.6,
  switchInSenior: 0.55,
  switchInRetake: 0.62,
} as const

// ---------- exam schedule ----------

/** g1-g3: high school years. nsu: every retake year after the first CSAT. */
export type Phase = 'g1' | 'g2' | 'g3' | 'nsu'
export type ExamKind = 'mock' | 'pyeongga' | 'csat'

export type ExamTemplate = {
  /** Unique within its year, e.g. "06p" for the June 평가원 mock. */
  key: string
  month: number
  label: string
  kind: ExamKind
}

export const SCHOOL_YEARS: readonly { phase: Exclude<Phase, 'nsu'>; label: string; exams: ExamTemplate[] }[] = [
  {
    phase: 'g1',
    label: '고1',
    exams: [
      { key: '03', month: 3, label: '3월 학평', kind: 'mock' },
      { key: '06', month: 6, label: '6월 학평', kind: 'mock' },
      { key: '09', month: 9, label: '9월 학평', kind: 'mock' },
      { key: '10', month: 10, label: '10월 학평', kind: 'mock' },
    ],
  },
  {
    phase: 'g2',
    label: '고2',
    exams: [
      { key: '03', month: 3, label: '3월 학평', kind: 'mock' },
      { key: '06', month: 6, label: '6월 학평', kind: 'mock' },
      { key: '09', month: 9, label: '9월 학평', kind: 'mock' },
      { key: '10', month: 10, label: '10월 학평', kind: 'mock' },
    ],
  },
  {
    phase: 'g3',
    label: '고3',
    exams: [
      { key: '03', month: 3, label: '3월 학평', kind: 'mock' },
      { key: '05', month: 5, label: '5월 학평', kind: 'mock' },
      { key: '06p', month: 6, label: '6월 모의평가', kind: 'pyeongga' },
      { key: '07', month: 7, label: '7월 학평', kind: 'mock' },
      { key: '09p', month: 9, label: '9월 모의평가', kind: 'pyeongga' },
      { key: '10', month: 10, label: '10월 학평', kind: 'mock' },
      { key: 'csat', month: 11, label: '수능', kind: 'csat' },
    ],
  },
]

export const RETAKE_EXAMS: readonly ExamTemplate[] = [
  { key: '06p', month: 6, label: '6월 모의평가', kind: 'pyeongga' },
  { key: '09p', month: 9, label: '9월 모의평가', kind: 'pyeongga' },
  { key: 'csat', month: 11, label: '수능', kind: 'csat' },
]

/** 0 = 현역, 1 = 재수, then 3수, 4수 … */
export function attemptLabel(attempt: number) {
  if (attempt === 0) return '현역'
  if (attempt === 1) return '재수'
  return `${attempt + 1}수`
}

// ---------- student generation ----------

export type GrowthType = 'early' | 'steady' | 'late' | 'genius'

export const GROWTH_TYPES: Record<
  GrowthType,
  { label: string; weight: number; phaseMultiplier: Record<Phase, number> }
> = {
  early: { label: '조기 완성형', weight: 20, phaseMultiplier: { g1: 2.1, g2: 1.5, g3: 0.4, nsu: 0.4 } },
  steady: { label: '꾸준한 성장형', weight: 45, phaseMultiplier: { g1: 1, g2: 1, g3: 1, nsu: 0.7 } },
  late: { label: '대기만성형', weight: 25, phaseMultiplier: { g1: 0.4, g2: 0.6, g3: 2.8, nsu: 1 } },
  genius: { label: '천재 각성형', weight: 10, phaseMultiplier: { g1: 0.8, g2: 0.8, g3: 1, nsu: 0.75 } },
}

export const STUDENT = {
  /** Shared academic ability; each subject leans on it, which links the subjects. */
  commonAbility: { mean: 46, spread: 16, min: 12, max: 82 },
  /** How far a subject strays from the shared ability; small, so strong students are strong across the board. */
  subjectOffsetSpread: 7,
  initialSkill: { min: 5, max: 90 },
  /** Room left to grow, on top of the starting skill: one shared draw, plus a little per subject. */
  potentialGap: { min: 10, max: 62, subjectSpread: 7 },
  /** Internal scale, not a raw score: top students can sit above 100. */
  potentialMax: 125,
  skillMax: 130,
  /** A genius awakens at one exam between these (in career exam order). */
  geniusAwakeningWindow: { fromIndex: 3, toIndex: 13 },
  /** The 현역 exams each electives choice point comes right before. */
  electiveFirstChoiceBefore: 'g2-03',
  electiveSeniorChangeBefore: 'g3-03',
  electiveLastChangeBefore: 'g3-09p',
  /**
   * The 스터디카페 event comes once, before one of these 현역 exams (drawn per
   * student): from after 고1 March up to before the 고3 September 모의평가,
   * wherever no other choice event is asked.
   */
  studyCafeBefore: ['g1-10', 'g2-03', 'g2-10', 'g3-03', 'g3-06p', 'g3-07'],
} as const

// ---------- growth ----------

export const GROWTH = {
  /** Skill points per month for a steady student with plenty of room left. */
  basePerMonth: 0.95,
  /** Growth slows as skill nears potential; full speed when the gap is this big. */
  gapForFullSpeed: 26,
  /** Random wobble per √month, scaled by how unstable the student is. */
  noisePerSqrtMonth: 1,
  /** Skill can sit slightly above potential, never far. */
  potentialOvershoot: 3,
  /** Average growth multiplier for each retake year: 재수, 삼수, 사수, … */
  retakeMultiplier: [0.85, 0.6, 0.42, 0.3, 0.22],
  /** Months between the 현역 CSAT (Nov) and the 재수 June mock. */
  monthsBeforeRetakeJune: 7,
} as const

/** Unstable students swing more, both while growing and on the day. */
export function volatilityFor(stability: number) {
  return 1.25 - 0.5 * stability
}

// ---------- exam day ----------

export type DayRollId = 'normal' | 'good' | 'bad' | 'jackpot' | 'bust'

export type DayRoll = { id: DayRollId; label: string; weight: number; range: [number, number] }

/** Per subject, per exam. Weights are percentages of the starting balance. */
export const SUBJECT_DAY_ROLLS: readonly DayRoll[] = [
  { id: 'normal', label: '평범', weight: 72, range: [-3, 3] },
  { id: 'good', label: '좋은 컨디션', weight: 12, range: [4, 7] },
  { id: 'bad', label: '컨디션 난조', weight: 12, range: [-7, -4] },
  { id: 'jackpot', label: '대박', weight: 2.5, range: [9, 14] },
  { id: 'bust', label: '대폭망', weight: 1.5, range: [-14, -9] },
]

/** One roll per exam that moves every subject together. */
export const COMMON_DAY_ROLLS: readonly DayRoll[] = [
  { id: 'normal', label: '평소 같은 하루', weight: 85, range: [-1, 1] },
  { id: 'good', label: '컨디션 좋은 날', weight: 6, range: [2, 4] },
  { id: 'bad', label: '컨디션 나쁜 날', weight: 6, range: [-4, -2] },
  { id: 'jackpot', label: '모든 게 잘 풀린 날', weight: 1.5, range: [7, 11] },
  { id: 'bust', label: '모든 게 꼬인 날', weight: 1.5, range: [-11, -7] },
]

/** Lucky students tilt the good rolls up and the bad rolls down by up to this much. */
export const LUCK_TILT = 0.35

// ---------- grades ----------

/**
 * Internal exam-day score (skill + day luck) → 1-9 grade. Not a real raw
 * score. Set a little kinder than the real stanine split, so an average
 * career lands around grade 4 rather than 5.
 */
export const GRADE_CUTOFFS: readonly { grade: number; minScore: number }[] = [
  { grade: 1, minScore: 73 },
  { grade: 2, minScore: 62 },
  { grade: 3, minScore: 52 },
  { grade: 4, minScore: 42 },
  { grade: 5, minScore: 33 },
  { grade: 6, minScore: 24 },
  { grade: 7, minScore: 15 },
  { grade: 8, minScore: 7 },
]

/**
 * Grades are relative: as the whole year group studies, the bar rises. This
 * is the average cohort skill gained since 고1 March, by months elapsed,
 * measured from the simulator itself with choice events picked evenly
 * (re-measure if GROWTH or CHOICE_EVENTS change). An exam
 * is graded on `score - shift`, so an average student keeps an average grade.
 * Retake-year exams use the shift of the same month in 고3.
 */
export const COHORT_SKILL_SHIFT: readonly [months: number, shift: number][] = [
  [0, 0],
  [12, 12.6],
  [24, 25.6],
  [27, 29],
  [32, 33.6],
]

export function cohortShift(monthsSinceStart: number) {
  const points = COHORT_SKILL_SHIFT
  if (monthsSinceStart <= points[0]![0]) return points[0]![1]
  for (let index = 1; index < points.length; index += 1) {
    const [m1, s1] = points[index]!
    const [m0, s0] = points[index - 1]!
    if (monthsSinceStart <= m1) return s0 + ((s1 - s0) * (monthsSinceStart - m0)) / (m1 - m0)
  }
  return points[points.length - 1]![1]
}

export function gradeFromScore(score: number) {
  return GRADE_CUTOFFS.find((cutoff) => score >= cutoff.minScore)?.grade ?? 9
}

// ---------- events ----------

/**
 * weakest / strongest: the student's lowest / highest skill when the event
 * happens. random: one subject drawn (seeded) when it happens.
 */
export type EventTarget = 'all' | 'weakest' | 'strongest' | 'random' | Subject

export type EventEffect =
  /** Permanent skill change. */
  | { type: 'skill'; target: EventTarget; amount: [number, number] }
  /** Permanent potential change. */
  | { type: 'potential'; target: EventTarget; amount: [number, number] }
  /** Growth multiplier for the next `exams` exams. */
  | { type: 'growth'; target: EventTarget; factor: number; exams: number }
  /** Exam-day score change for the next `exams` exams. */
  | { type: 'day'; target: EventTarget; amount: [number, number]; exams: number }
  /** Permanent change to how steady the student is (0-1), for growth and exam day alike. */
  | { type: 'stability'; amount: [number, number] }
  /** Multiplies the odds of a 대박 or 대폭망 exam day for the next `exams` exams (above 1: more of both). */
  | { type: 'swing'; target: EventTarget; factor: number; exams: number }
  /** Multiplies only the odds of a 대폭망 exam day for the next `exams` exams. */
  | { type: 'bust-risk'; target: EventTarget; factor: number; exams: number }
  /** Turns a lasting story flag on or off. */
  | { type: 'flag'; flag: CareerFlag; on: boolean }

/** Story flags a career carries between events. dating: in a relationship. */
export type CareerFlag = 'dating'

export type ChoiceOutcome = {
  weight: number
  tone: 'up' | 'down'
  /** `{subject}` is replaced with the subject a weakest / strongest effect landed on. */
  text: string
  effects: EventEffect[]
}

export type ChoiceOption = {
  id: string
  label: string
  /** One is drawn (seeded) when the option is chosen. */
  outcomes: ChoiceOutcome[]
}

export type ChoiceEvent = {
  id: string
  title: string
  prompt: string
  /**
   * Asked right before these exams, as `${phase}-${key}` (retake years use
   * "nsu"). Empty for an event asked at another moment (RETAKE_START_EVENTS).
   */
  before: string[]
  options: ChoiceOption[]
  /** Show the outcome in a popup as soon as it is picked, instead of only with the next exam. */
  revealAtOnce?: boolean
}

/** Moments where the player decides how the student spends the time before the next exam. */
export const CHOICE_EVENTS: readonly ChoiceEvent[] = [
  {
    id: 'high-school-entry',
    title: '고등학교 입학',
    prompt: '중학교를 졸업하고 드디어 고등학생이 되었다. 앞으로의 3년, 어떤 고등학생이 될까?',
    before: ['g1-03'],
    options: [
      {
        id: 'top-of-class',
        label: '전교 1등을 노린다',
        outcomes: [
          {
            weight: 1,
            tone: 'up',
            text: '입학하자마자 책상 앞에 앉았어요. 출발선이 조금 앞당겨졌어요.',
            effects: [{ type: 'skill', target: 'all', amount: [2, 4] }],
          },
        ],
      },
      {
        id: 'balanced',
        label: '적당히 공부하면서 즐긴다',
        outcomes: [
          {
            weight: 1,
            tone: 'up',
            text: '공부와 놀이 사이에서 균형을 찾았어요. 성적이 쉽게 흔들리지 않아요.',
            effects: [{ type: 'stability', amount: [0.15, 0.25] }],
          },
        ],
      },
      {
        id: 'enjoy-first',
        label: '일단 고등학교 생활부터 즐긴다',
        outcomes: [
          {
            weight: 1,
            tone: 'up',
            text: '공부는 잠시 미뤘지만, 넓게 경험한 만큼 오를 수 있는 한계가 높아졌어요.',
            effects: [
              { type: 'skill', target: 'all', amount: [-4, -2] },
              { type: 'potential', target: 'all', amount: [5, 8] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'study-style',
    title: '고1 공부 스타일',
    prompt: '첫 모의고사를 치르고 나니 고민이 생겼어요. 앞으로 어떻게 공부할까요?',
    before: ['g1-06'],
    options: [
      {
        id: 'academy',
        label: '학원 종합반 등록',
        outcomes: [
          {
            weight: 1,
            tone: 'up',
            text: '학원 진도에 맞춰 공부 습관이 잡혔어요.',
            effects: [{ type: 'growth', target: 'all', factor: 1.35, exams: 3 }],
          },
        ],
      },
      {
        id: 'self-study',
        label: '혼자 계획 세워 공부',
        outcomes: [
          {
            weight: 1,
            tone: 'up',
            text: '스스로 공부하는 법을 익혔어요. 오를 수 있는 한계가 높아졌어요.',
            effects: [{ type: 'potential', target: 'all', amount: [3, 6] }],
          },
        ],
      },
      {
        id: 'balance',
        label: '동아리도 열심히',
        outcomes: [
          {
            weight: 1,
            tone: 'up',
            text: '즐거운 학교생활 덕분에 시험장에서도 마음이 편해요.',
            effects: [
              { type: 'day', target: 'all', amount: [1, 3], exams: 2 },
              { type: 'potential', target: 'all', amount: [1, 3] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'g1-summer',
    title: '고1 여름방학',
    prompt: '첫 여름방학이 시작됐어요. 어떻게 보낼까요?',
    before: ['g1-09'],
    options: [
      {
        id: 'advance-math',
        label: '수학 선행 몰입',
        outcomes: [
          {
            weight: 3,
            tone: 'up',
            text: '선행이 제대로 먹혔어요. 수학이 한동안 쑥쑥 올라요.',
            effects: [
              { type: 'growth', target: 'math', factor: 2, exams: 3 },
              { type: 'potential', target: 'math', amount: [3, 6] },
            ],
          },
          {
            weight: 1,
            tone: 'down',
            text: '너무 몰아붙였나 봐요. 지쳐서 시험이 버거웠어요.',
            effects: [
              { type: 'growth', target: 'math', factor: 1.4, exams: 2 },
              { type: 'day', target: 'all', amount: [-4, -2], exams: 1 },
            ],
          },
        ],
      },
      {
        id: 'fill-gaps',
        label: '약한 과목 보충',
        outcomes: [
          {
            weight: 1,
            tone: 'up',
            text: '{subject} 구멍을 메웠어요.',
            effects: [{ type: 'skill', target: 'weakest', amount: [4, 8] }],
          },
        ],
      },
      {
        id: 'rest',
        label: '푹 쉬고 재충전',
        outcomes: [
          {
            weight: 1,
            tone: 'up',
            text: '잘 쉬고 나니 머리가 맑아요.',
            effects: [{ type: 'day', target: 'all', amount: [2, 4], exams: 1 }],
          },
        ],
      },
    ],
  },
  {
    id: 'math-wall',
    title: '어려워진 수학',
    prompt: '고2 수학이 갑자기 어려워졌어요. 어떻게 할까요?',
    before: ['g2-06'],
    options: [
      {
        id: 'tutor',
        label: '수학 과외 시작',
        outcomes: [
          {
            weight: 1,
            tone: 'up',
            text: '과외 선생님과 잘 맞았어요. 수학이 빠르게 올라요.',
            effects: [
              { type: 'growth', target: 'math', factor: 2.2, exams: 2 },
              { type: 'potential', target: 'math', amount: [3, 6] },
            ],
          },
        ],
      },
      {
        id: 'basics',
        label: '개념부터 다시',
        outcomes: [
          {
            weight: 1,
            tone: 'up',
            text: '개념을 다시 잡느라 잠깐 주춤했지만 수학의 한계가 높아졌어요.',
            effects: [
              { type: 'growth', target: 'math', factor: 0.6, exams: 1 },
              { type: 'potential', target: 'math', amount: [7, 11] },
            ],
          },
        ],
      },
      {
        id: 'strength',
        label: '잘하는 과목에 집중',
        outcomes: [
          {
            weight: 1,
            tone: 'up',
            text: '{subject}이(가) 더 단단해졌어요. 대신 수학은 한동안 제자리예요.',
            effects: [
              { type: 'skill', target: 'strongest', amount: [4, 7] },
              { type: 'growth', target: 'math', factor: 0.6, exams: 2 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'g2-summer',
    title: '고2 여름방학',
    prompt: '고3이 가까워졌어요. 이번 여름방학은 어떻게 보낼까요?',
    before: ['g2-09'],
    options: [
      {
        id: 'camp',
        label: '기숙학원 캠프',
        outcomes: [
          {
            weight: 2,
            tone: 'up',
            text: '캠프에서 하루 종일 공부한 효과가 나타나요.',
            effects: [{ type: 'growth', target: 'all', factor: 1.7, exams: 2 }],
          },
          {
            weight: 1,
            tone: 'down',
            text: '캠프는 버텼지만 돌아오자마자 몸살이 났어요.',
            effects: [
              { type: 'growth', target: 'all', factor: 1.4, exams: 2 },
              { type: 'day', target: 'all', amount: [-5, -3], exams: 1 },
            ],
          },
        ],
      },
      {
        id: 'past-exams',
        label: '기출 문제 정리',
        outcomes: [
          {
            weight: 1,
            tone: 'up',
            text: '기출을 정리하며 수능이 어떤 시험인지 감이 잡혔어요.',
            effects: [{ type: 'potential', target: 'all', amount: [3, 6] }],
          },
        ],
      },
      {
        id: 'trip',
        label: '가족 여행으로 리프레시',
        outcomes: [
          {
            weight: 1,
            tone: 'up',
            text: '여행을 다녀오니 다시 공부할 힘이 났어요.',
            effects: [{ type: 'day', target: 'all', amount: [2, 4], exams: 1 }],
          },
        ],
      },
    ],
  },
  {
    id: 'senior-spring',
    title: '고3의 각오',
    prompt: '드디어 고3이에요. 어떤 마음으로 1년을 보낼까요?',
    before: ['g3-05'],
    options: [
      {
        id: 'all-in',
        label: '독서실에서 끝장 공부',
        outcomes: [
          {
            weight: 2,
            tone: 'up',
            text: '독하게 마음먹은 효과가 나타나요. 모든 과목이 빠르게 올라요.',
            effects: [
              { type: 'growth', target: 'all', factor: 1.9, exams: 3 },
              { type: 'potential', target: 'all', amount: [2, 5] },
            ],
          },
          {
            weight: 1,
            tone: 'down',
            text: '너무 달렸나 봐요. 번아웃이 와서 한동안 시험이 버거워요.',
            effects: [
              { type: 'growth', target: 'all', factor: 1.2, exams: 3 },
              { type: 'day', target: 'all', amount: [-6, -3], exams: 2 },
            ],
          },
        ],
      },
      {
        id: 'steady-plan',
        label: '계획표대로 꾸준히',
        outcomes: [
          {
            weight: 1,
            tone: 'up',
            text: '하루하루 계획을 지키며 조금씩 올라가요.',
            effects: [{ type: 'growth', target: 'all', factor: 1.35, exams: 4 }],
          },
        ],
      },
      {
        id: 'mind',
        label: '멘탈 관리 먼저',
        outcomes: [
          {
            weight: 1,
            tone: 'up',
            text: '마음이 단단해져서 시험장에서도 차분해요.',
            effects: [{ type: 'day', target: 'all', amount: [1, 3], exams: 3 }],
          },
        ],
      },
    ],
  },
  {
    id: 'g3-summer',
    title: '고3 여름방학',
    prompt: '수능까지 넉 달 남았어요. 마지막 여름방학은 어떻게 보낼까요?',
    before: ['g3-09p'],
    options: [
      {
        id: 'mock-drills',
        label: '실전 모의고사 반복',
        outcomes: [
          {
            weight: 1,
            tone: 'up',
            text: '실전 감각이 붙었어요. 시험장에서 손이 먼저 움직여요.',
            effects: [{ type: 'day', target: 'all', amount: [1, 3], exams: 3 }],
          },
        ],
      },
      {
        id: 'weak-all-in',
        label: '취약 과목 올인',
        outcomes: [
          {
            weight: 1,
            tone: 'up',
            text: '{subject}에 매달린 보람이 있어요.',
            effects: [{ type: 'skill', target: 'weakest', amount: [5, 9] }],
          },
        ],
      },
      {
        id: 'lectures',
        label: '인강 몰아 듣기',
        outcomes: [
          {
            weight: 2,
            tone: 'up',
            text: '인강으로 빈틈을 빠르게 채웠어요.',
            effects: [{ type: 'growth', target: 'all', factor: 1.6, exams: 2 }],
          },
          {
            weight: 1,
            tone: 'down',
            text: '틀어 놓기만 하고 딴짓을 했어요. 남은 게 별로 없어요.',
            effects: [{ type: 'growth', target: 'all', factor: 0.8, exams: 2 }],
          },
        ],
      },
    ],
  },
  {
    id: 'retake-life',
    title: '재수 생활',
    prompt: '다시 수능을 준비해요. 어디서 공부할까요?',
    before: [],
    options: [
      {
        id: 'academy',
        label: '재수종합반',
        outcomes: [
          {
            weight: 1,
            tone: 'up',
            text: '재수 학원 일정에 잘 적응했어요.',
            effects: [{ type: 'growth', target: 'all', factor: 1.5, exams: 3 }],
          },
        ],
      },
      {
        id: 'boarding',
        label: '기숙학원',
        outcomes: [
          {
            weight: 2,
            tone: 'up',
            text: '공부만 하는 환경 덕분에 실력이 빠르게 올라요.',
            effects: [{ type: 'growth', target: 'all', factor: 1.9, exams: 3 }],
          },
          {
            weight: 1,
            tone: 'down',
            text: '갇힌 생활이 답답해서 슬럼프가 왔어요.',
            effects: [
              { type: 'growth', target: 'all', factor: 1.1, exams: 3 },
              { type: 'day', target: 'all', amount: [-5, -2], exams: 1 },
            ],
          },
        ],
      },
      {
        id: 'alone',
        label: '독학 재수',
        outcomes: [
          {
            weight: 1,
            tone: 'up',
            text: '혼자 공부가 체질이었어요. 내 속도로 쭉쭉 올라요.',
            effects: [{ type: 'growth', target: 'all', factor: 2.1, exams: 3 }],
          },
          {
            weight: 1,
            tone: 'down',
            text: '혼자서는 생활 리듬이 무너졌어요. 성적이 잘 오르지 않아요.',
            effects: [{ type: 'growth', target: 'all', factor: 0.6, exams: 3 }],
          },
        ],
      },
    ],
  },
  {
    id: 'csat-eve',
    title: '수능 D-30',
    prompt: '수능이 한 달 남았어요. 마지막 한 달은 어떻게 보낼까요?',
    before: ['g3-csat'],
    options: [
      {
        id: 'timed',
        label: '실전처럼 시간 재고 풀기',
        outcomes: [
          {
            weight: 1,
            tone: 'up',
            text: '시간 배분이 몸에 익었어요.',
            effects: [{ type: 'day', target: 'all', amount: [1, 2], exams: 1 }],
          },
        ],
      },
      {
        id: 'new-problems',
        label: '끝까지 새 문제 풀기',
        outcomes: [
          {
            weight: 1,
            tone: 'up',
            text: '마지막에 푼 문제가 수능에 비슷하게 나왔어요!',
            effects: [{ type: 'day', target: 'all', amount: [3, 6], exams: 1 }],
          },
          {
            weight: 1,
            tone: 'down',
            text: '어려운 문제에 자신감만 떨어졌어요.',
            effects: [{ type: 'day', target: 'all', amount: [-4, -1], exams: 1 }],
          },
        ],
      },
      {
        id: 'review',
        label: '오답 노트 복습',
        outcomes: [
          {
            weight: 1,
            tone: 'up',
            text: '같은 실수를 반복하지 않게 됐어요.',
            effects: [{ type: 'skill', target: 'all', amount: [0.5, 2] }],
          },
        ],
      },
    ],
  },
]

/** 현역 only: asked once, before an exam drawn from STUDENT.studyCafeBefore. */
export const STUDY_CAFE_EVENT: ChoiceEvent = {
  id: 'study-cafe',
  title: '스터디카페의 운명의 짝',
  revealAtOnce: true,
  prompt:
    '오늘도 평소처럼 스터디카페에 갔다. 그런데 매일 같은 자리에 앉는 사람이 자꾸 눈에 들어온다. 어느 날, 그 사람이 먼저 말을 걸어왔다.',
  before: [],
  options: [
    {
      id: 'ask-number',
      label: '용기를 내서 연락처를 물어본다',
      outcomes: [
        {
          weight: 1,
          tone: 'up',
          text: '연애를 시작했어요! 기분이 좋아 공부도 잘돼요. 다만 마음이 들뜨는 날도 많아졌어요.',
          effects: [
            { type: 'growth', target: 'all', factor: 1.3, exams: 3 },
            { type: 'day', target: 'all', amount: [1, 3], exams: 2 },
            { type: 'stability', amount: [-0.12, -0.06] },
            { type: 'flag', flag: 'dating', on: true },
          ],
        },
        {
          weight: 1,
          tone: 'down',
          text: '정중하게 거절당했어요. 한동안 멘탈이 흔들리지만, 오기가 생겨 공부에 매달려요.',
          effects: [
            { type: 'day', target: 'all', amount: [-4, -2], exams: 2 },
            { type: 'growth', target: 'all', factor: 1.25, exams: 2 },
          ],
        },
      ],
    },
    {
      id: 'study-mate',
      label: '함께 공부하자고 제안한다',
      outcomes: [
        {
          weight: 2,
          tone: 'up',
          text: '스터디 메이트가 됐어요. 서로 자극이 돼서 쑥쑥 올라요. 대신 서로 의지하다 보니 혼자일 땐 조금 흔들려요.',
          effects: [
            { type: 'growth', target: 'all', factor: 1.45, exams: 3 },
            { type: 'stability', amount: [-0.08, -0.03] },
          ],
        },
        {
          weight: 1,
          tone: 'down',
          text: '같이 공부하니 수다만 늘었어요. 그래도 그 사람이 푸는 문제를 보며 배운 게 있어요.',
          effects: [
            { type: 'growth', target: 'all', factor: 0.8, exams: 2 },
            { type: 'potential', target: 'all', amount: [1, 3] },
          ],
        },
      ],
    },
    {
      id: 'study-first',
      label: '지금은 공부가 먼저다',
      outcomes: [
        {
          weight: 2,
          tone: 'up',
          text: '마음을 다잡고 하던 공부를 이어갔어요. 성적이 쉽게 흔들리지 않아요. 다만 가끔 그 자리를 돌아보게 돼요.',
          effects: [
            { type: 'stability', amount: [0.06, 0.12] },
            { type: 'day', target: 'all', amount: [-1.5, -0.5], exams: 1 },
          ],
        },
        {
          weight: 1,
          tone: 'down',
          text: '공부가 먼저라고 했지만 자꾸 생각나요. 한동안 집중이 잘 안 돼요. 그래도 덕분에 마음은 단단해졌어요.',
          effects: [
            { type: 'growth', target: 'all', factor: 0.7, exams: 2 },
            { type: 'stability', amount: [0.03, 0.06] },
          ],
        },
      ],
    },
  ],
}

/**
 * Only for a student who started dating at the 스터디카페: now and then, right
 * after the 현역 수능 D-30 pick, the relationship ends. Shown on the page,
 * before the CSAT button; it raises the odds of a 대폭망 on the day.
 */
export const BREAKUP_NOTICE = {
  id: 'breakup',
  title: '수능 30일 전, 이별',
  chance: 0.3,
  outcomes: [
    {
      weight: 1,
      tone: 'down',
      text: '수능을 한 달 앞두고 헤어졌어요. 마음이 무너져 수능 날 크게 흔들릴 수 있어요.',
      effects: [
        { type: 'bust-risk', target: 'all', factor: 4, exams: 1 },
        { type: 'day', target: 'all', amount: [-2, -1], exams: 1 },
        { type: 'flag', flag: 'dating', on: false },
      ],
    },
  ],
} as const satisfies { id: string; title: string; chance: number; outcomes: ChoiceOutcome[] }

/** Asked one after another as soon as a retake year starts, before its electives. */
export const RETAKE_START_EVENTS = ['retake-life', 'friends-festival'] as const

/** Choice events of a retake year, after how to spend it has been picked. */
export const RETAKE_CHOICE_EVENTS: readonly ChoiceEvent[] = [
  {
    id: 'friends-festival',
    title: '대학 간 친구들의 연락',
    prompt: '대학에 간 친구들이 축제에 놀러 오라고 한다. 오랜만에 친구들을 만날 기회다.',
    before: [],
    options: [
      {
        id: 'visit',
        label: '하루 정도 놀러 간다',
        outcomes: [
          {
            weight: 1,
            tone: 'up',
            text: '오랜만에 실컷 웃고 왔어요. 마음은 가벼워졌지만 공부 리듬이 잠깐 흐트러졌어요.',
            effects: [
              { type: 'day', target: 'all', amount: [1, 3], exams: 1 },
              { type: 'growth', target: 'all', factor: 0.75, exams: 1 },
            ],
          },
        ],
      },
      {
        id: 'study',
        label: '공부에 집중한다',
        outcomes: [
          {
            weight: 1,
            tone: 'up',
            text: '축제 대신 책상 앞을 지켰어요. 실력은 조금 늘었지만 스트레스가 쌓였어요.',
            effects: [
              { type: 'skill', target: 'all', amount: [1, 2.5] },
              { type: 'day', target: 'all', amount: [-2, -1], exams: 1 },
            ],
          },
        ],
      },
      {
        id: 'ignore',
        label: '연락을 무시한다',
        outcomes: [
          {
            weight: 1,
            tone: 'up',
            text: '휴대폰을 덮고 하던 공부를 이어갔어요. 별일 없었어요.',
            effects: [],
          },
          {
            weight: 1,
            tone: 'down',
            text: '답장을 안 했더니 괜히 마음이 쓰여요. 공부가 손에 잘 안 잡혀요.',
            effects: [{ type: 'day', target: 'all', amount: [-3, -1], exams: 2 }],
          },
        ],
      },
    ],
  },
  {
    id: 'academy-rival',
    title: '재수학원의 라이벌',
    prompt: '매번 비슷한 성적을 받던 옆자리 학생이 최근 모의고사에서 크게 성적을 올렸다.',
    before: ['nsu-09p'],
    options: [
      {
        id: 'push',
        label: '자극받아 공부한다',
        outcomes: [
          {
            weight: 2,
            tone: 'up',
            text: '지기 싫은 마음이 원동력이 됐어요. 실력이 빠르게 올라요.',
            effects: [{ type: 'growth', target: 'all', factor: 1.8, exams: 2 }],
          },
          {
            weight: 1,
            tone: 'down',
            text: '무리하게 따라가다 번아웃이 왔어요.',
            effects: [
              { type: 'growth', target: 'all', factor: 1.1, exams: 2 },
              { type: 'day', target: 'all', amount: [-4, -2], exams: 1 },
            ],
          },
        ],
      },
      {
        id: 'own-pace',
        label: '내 페이스를 유지한다',
        outcomes: [
          {
            weight: 1,
            tone: 'up',
            text: '남은 남이고 나는 나예요. 성적이 쉽게 흔들리지 않아요.',
            effects: [{ type: 'stability', amount: [0.12, 0.22] }],
          },
        ],
      },
      {
        id: 'ask',
        label: '공부법을 물어본다',
        outcomes: [
          {
            weight: 1,
            tone: 'up',
            text: '라이벌의 공부법이 딱 맞았어요. 막혀 있던 게 풀리기 시작해요.',
            effects: [
              { type: 'potential', target: 'all', amount: [4, 7] },
              { type: 'growth', target: 'all', factor: 1.6, exams: 2 },
            ],
          },
          {
            weight: 2,
            tone: 'down',
            text: '특별한 비법은 없었어요. 결국 꾸준함이 답이래요.',
            effects: [{ type: 'skill', target: 'all', amount: [0, 1] }],
          },
        ],
      },
    ],
  },
  {
    id: 'final-push',
    title: '마지막 승부',
    prompt: '재수 생활도 이제 끝이 보인다. 수능까지 얼마 남지 않았다.',
    before: ['nsu-csat'],
    options: [
      {
        id: 'all-out',
        label: '마지막까지 달린다',
        outcomes: [
          {
            weight: 1,
            tone: 'up',
            text: '마지막 한 방울까지 쏟아부었어요. 수능 날 무슨 일이든 일어날 수 있어요.',
            effects: [
              { type: 'swing', target: 'all', factor: 2.5, exams: 1 },
              { type: 'growth', target: 'all', factor: 1.2, exams: 1 },
            ],
          },
        ],
      },
      {
        id: 'condition',
        label: '컨디션 관리에 집중한다',
        outcomes: [
          {
            weight: 1,
            tone: 'up',
            text: '잠도 식사도 시험 시간에 맞췄어요. 수능 날 크게 흔들리지 않을 거예요.',
            effects: [
              { type: 'swing', target: 'all', factor: 0.3, exams: 1 },
              { type: 'stability', amount: [0.1, 0.15] },
            ],
          },
        ],
      },
      {
        id: 'weak-point',
        label: '약점을 집중 공략한다',
        outcomes: [
          {
            weight: 1,
            tone: 'up',
            text: '{subject}만 붙잡았어요. 나머지 과목은 지금 실력 그대로 가요.',
            effects: [
              { type: 'skill', target: 'weakest', amount: [3, 6] },
              { type: 'growth', target: 'all', factor: 0, exams: 1 },
            ],
          },
        ],
      },
    ],
  },
]

/**
 * After a retake year's June 모의평가, the result is set against last year's
 * CSAT average. Nobody chooses it: what happens depends on the grades.
 */
export const RETAKE_JUNE_REPORT = {
  id: 'retake-june-report',
  title: '6평 성적표',
  /**
   * Average-grade change that counts as a real rise or drop. Anything smaller
   * is a slight rise, no change or a slight drop: worded apart, same effects.
   */
  threshold: 0.4,
  cases: {
    up: [
      {
        weight: 1,
        tone: 'up',
        text: '"올해는 다르다!" 작년 수능보다 올랐어요. 자신감이 붙었어요.',
        effects: [{ type: 'day', target: 'all', amount: [1, 3], exams: 2 }],
      },
    ],
    'slight-up': [
      {
        weight: 1,
        tone: 'down',
        text: '"1년을 더 했는데 이것밖에 안 올랐다고?" 슬럼프가 찾아왔어요.',
        effects: [{ type: 'growth', target: 'all', factor: 0.6, exams: 2 }],
      },
      {
        weight: 1,
        tone: 'up',
        text: '"1년을 더 했는데 이것밖에 안 올랐다고?" 잠깐 흔들렸지만 마음을 다잡았어요.',
        effects: [],
      },
    ],
    same: [
      {
        weight: 1,
        tone: 'down',
        text: '"1년을 더 했는데 그대로라고?" 슬럼프가 찾아왔어요.',
        effects: [{ type: 'growth', target: 'all', factor: 0.6, exams: 2 }],
      },
      {
        weight: 1,
        tone: 'up',
        text: '"1년을 더 했는데 그대로라고?" 잠깐 흔들렸지만 마음을 다잡았어요.',
        effects: [],
      },
    ],
    'slight-down': [
      {
        weight: 1,
        tone: 'down',
        text: '"1년을 더 했는데 오히려 떨어졌다고?" 슬럼프가 찾아왔어요.',
        effects: [{ type: 'growth', target: 'all', factor: 0.6, exams: 2 }],
      },
      {
        weight: 1,
        tone: 'up',
        text: '"1년을 더 했는데 오히려 떨어졌다고?" 잠깐 흔들렸지만 마음을 다잡았어요.',
        effects: [],
      },
    ],
    down: [
      {
        weight: 1,
        tone: 'up',
        text: '"작년 수능보다 못 봤다고?" 정신이 번쩍 들었어요. 각성했어요.',
        effects: [
          { type: 'potential', target: 'all', amount: [2, 4] },
          { type: 'growth', target: 'all', factor: 1.8, exams: 2 },
        ],
      },
      {
        weight: 1,
        tone: 'down',
        text: '"작년 수능보다 못 봤다고?" 슬럼프에 빠졌어요.',
        effects: [
          { type: 'growth', target: 'all', factor: 0.6, exams: 2 },
          { type: 'day', target: 'all', amount: [-3, -1], exams: 1 },
        ],
      },
    ],
  },
} as const satisfies {
  id: string
  title: string
  threshold: number
  cases: Record<'up' | 'slight-up' | 'same' | 'slight-down' | 'down', ChoiceOutcome[]>
}

/** A rare turn of luck right before any CSAT, 현역 or retake. Nobody chooses it. */
export const LEGEND_LECTURE = {
  id: 'legend-lecture',
  title: '전설의 일타강사',
  chance: 0.08,
  outcomes: [
    {
      weight: 70,
      tone: 'up',
      text: '우연히 들은 강의에서 그동안 이해하지 못했던 {subject} 개념이 한 번에 정리됐어요.',
      effects: [
        { type: 'potential', target: 'random', amount: [3, 6] },
        { type: 'skill', target: 'random', amount: [3, 6] },
      ],
    },
    {
      weight: 25,
      tone: 'down',
      text: '우연히 유명한 강의를 들었지만, 성적에는 별다른 변화가 없었어요.',
      effects: [],
    },
    {
      weight: 5,
      tone: 'up',
      text: '우연히 들은 강의에서 {subject}의 모든 게 한 번에 이해되기 시작했어요. 대역전의 시작이에요!',
      effects: [
        { type: 'potential', target: 'random', amount: [10, 15] },
        { type: 'skill', target: 'random', amount: [10, 15] },
      ],
    },
  ],
} as const satisfies { id: string; title: string; chance: number; outcomes: ChoiceOutcome[] }

/** A genius-type student wakes up on their own; this is the one event nobody chooses. */
export const GENIUS_AWAKENING = {
  id: 'genius-awakening',
  title: '천재 각성',
  description: '어느 날 갑자기 모든 게 이해되기 시작했다. 잠들어 있던 재능이 깨어났다.',
  tone: 'up',
  effects: [
    { type: 'potential', target: 'all', amount: [16, 26] },
    { type: 'skill', target: 'all', amount: [6, 12] },
    { type: 'growth', target: 'all', factor: 2.6, exams: 3 },
  ],
} as const satisfies { id: string; title: string; description: string; tone: 'up'; effects: EventEffect[] }

// ---------- student name ----------

export const STUDENT_NAME = { maxLength: 10, fallback: '수험생' } as const

// ---------- university applications (fictional) ----------

/**
 * Rough university groups for the ending. The cutoffs are made up for the game, not real ones.
 * A cutoff is the 5-subject CSAT average grade that gives a 50 % chance. Each
 * year and each 가·나·다군 draws it from the group's range, and neighbouring
 * ranges overlap: a 지역 거점 국립대 can now and then be harder to get into
 * than an 인서울 중하위권 one. The centres follow the simulator's own spread
 * (roughly top 3 %, 10 %, 25 %, 45 %, 70 %, 92 %).
 */
export type UniversityTierId = 'sky' | 'seoul-upper' | 'seoul-lower' | 'regional' | 'provincial' | 'college'

export const UNIVERSITY_TIERS: readonly { id: UniversityTierId; label: string; cutoff: { min: number; max: number } }[] = [
  { id: 'sky', label: 'SKY', cutoff: { min: 1.2, max: 1.8 } },
  { id: 'seoul-upper', label: '인서울 상위권 대학', cutoff: { min: 1.7, max: 2.6 } },
  { id: 'seoul-lower', label: '인서울 중하위권 대학', cutoff: { min: 2.4, max: 3.5 } },
  { id: 'regional', label: '지역 거점 국립대', cutoff: { min: 2.9, max: 4.3 } },
  { id: 'provincial', label: '지방 4년제 대학', cutoff: { min: 4.1, max: 5.7 } },
  { id: 'college', label: '전문대학', cutoff: { min: 5.7, max: 7.4 } },
]

export const MAJOR_FIELDS: Record<Track, string> = {
  humanities: '인문·사회계열',
  science: '자연·공학계열',
}

/** 정시: one application in each of the 가·나·다 groups. */
export const APPLICATION_GROUPS = ['가군', '나군', '다군'] as const

export const ADMISSION = {
  /** Grades of average below/above the cutoff that move the chance from 50 % to ~73 % / ~27 %. */
  spread: 0.22,
  minChance: 0.03,
  maxChance: 0.97,
} as const

/** How the screen describes a chance. */
export const CHANCE_LABELS: readonly { minChance: number; label: string; tone: 'safe' | 'fair' | 'reach' | 'long-shot' }[] = [
  { minChance: 0.75, label: '안정', tone: 'safe' },
  { minChance: 0.4, label: '적정', tone: 'fair' },
  { minChance: 0.15, label: '소신', tone: 'reach' },
  { minChance: 0, label: '상향', tone: 'long-shot' },
]
