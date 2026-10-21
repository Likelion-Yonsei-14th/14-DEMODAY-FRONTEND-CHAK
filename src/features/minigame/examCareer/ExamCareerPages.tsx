import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Check, GraduationCap, House, RotateCcw, Sparkles, TrendingDown, TrendingUp, X } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AppBar, Button, Dialog, IconButton, TextField } from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import {
  APPLICATION_GROUPS,
  attemptLabel,
  type ChoiceEvent,
  ELECTIVE_OPTIONS,
  MAJOR_FIELDS,
  STUDENT_NAME,
  SUBJECTS,
  TRACKS,
  UNIVERSITY_TIERS,
  type ElectiveCategory,
  type Electives,
  type Track,
  type UniversityTierId,
} from './examCareerConfig'
import {
  admissionChance,
  admissionCutoffs,
  applyToUniversities,
  chanceLabel,
  chooseElectives,
  acknowledgeNotice,
  chooseEventOption,
  choiceEventBefore,
  clearCareer,
  createCareer,
  decide,
  electiveChoiceBefore,
  enroll,
  loadCareer,
  nextExam,
  pendingEventOf,
  pendingNoticeOf,
  runExam,
  saveCareer,
  subjectLabel,
  summarize,
  universityLabel,
  type CareerEventRecord,
  type CareerState,
  type ElectiveChoicePoint,
  type ExamResult,
  type ExamSlot,
  type SavedCareer,
} from './examCareerEngine'
import { createCareerSeed } from './examCareerRandom'
import { EXAM_CAREER_PATH, EXAM_CAREER_PLAY_PATH } from './examCareerRoutes'
import { ExamCareerChart } from './ExamCareerChart'
import './ExamCareer.css'

/** Where "back to the service" goes: the entry route picks /home or /start. */
const SERVICE_HOME = '/'

const DISCLAIMER = '재미로 보는 가상 시뮬레이션이에요. 실제 성적이나 입시 결과를 예측하지 않아요.'
const ADMISSION_NOTE = '대학과 합격선은 모두 게임 속 가상의 기준이에요. 실제 대학 입결과 관계없어요.'
const CUTOFF_NOTE = '합격선은 해마다, 군마다 달라요. 같은 그룹이라도 어느 군에 넣느냐에 따라 가능성이 달라져요.'

/** How long each line of the waiting screen stays before the results come out. */
const SUSPENSE_STEP_MS = 900

const SUSPENSE_LINES: Record<'csat' | 'admission', string[]> = {
  csat: ['답안지를 채점하고 있어요', '표준점수를 계산하고 있어요', '성적표를 출력하고 있어요'],
  admission: ['원서 접수를 마쳤어요', '가·나·다군 합격자를 발표하고 있어요', '두근두근, 결과를 확인해 볼까요'],
}

const TRACK_IDS = Object.keys(TRACKS) as Track[]

const ELECTIVE_GROUPS: { category: ElectiveCategory; title: string }[] = [
  { category: 'korean', title: '국어' },
  { category: 'math', title: '수학' },
  { category: 'inquiry', title: '탐구' },
]

const CHOICE_COPY: Record<ElectiveChoicePoint, { title: string; body: string; confirm: string }> = {
  first: {
    title: '고2가 됐어요. 선택과목을 정해 주세요',
    body: '처음 고른 과목은 조금씩 손에 익어 가요. 고3이 될 때와 고3 9월 모의평가 직전에 바꿀 기회가 있어요.',
    confirm: '이대로 시작하기',
  },
  senior: {
    title: '고3이 됐어요. 선택과목을 바꿀 수 있어요',
    body: '지금 과목을 그대로 가져가도 돼요. 바꾼 과목은 실력은 그대로지만 한동안 적응 기간이 필요해요. 9월 모의평가 직전에 마지막 기회가 한 번 더 있어요.',
    confirm: '이대로 고3 시작하기',
  },
  'last-change': {
    title: '선택과목을 바꿀 마지막 기회예요',
    body: '9월 모의평가 전에 최종 확정해요. 확정하면 수능까지 바꿀 수 없어요. 바꾼 과목은 실력은 그대로지만 한동안 적응 기간이 필요해요.',
    confirm: '최종 확정하기',
  },
  retake: {
    title: '새 수능 준비를 시작해요',
    body: '선택과목을 다시 정할 수 있어요. 지난 기록은 그대로 남고, 바꾼 과목만 적응 기간이 필요해요.',
    confirm: '이대로 준비하기',
  },
}

function ServiceHomeButton() {
  const navigate = useNavigate()
  return (
    <IconButton
      label="홈 화면으로 돌아가기"
      icon={<House size={20} aria-hidden />}
      onClick={() => navigate(SERVICE_HOME)}
    />
  )
}

function OptionGroup<Id extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly { id: Id; label: string; description?: string }[]
  value: Id | null
  onChange: (id: Id) => void
}) {
  return (
    <div className="exam-career-options" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={value === option.id}
          className={['exam-career-options__item', value === option.id ? 'is-selected' : ''].filter(Boolean).join(' ')}
          onClick={() => onChange(option.id)}
        >
          <strong>{option.label}</strong>
          {option.description && <small>{option.description}</small>}
        </button>
      ))}
    </div>
  )
}

function startNewCareer(track: Track, name: string): SavedCareer {
  clearCareer()
  const saved = { state: createCareer(createCareerSeed(), track, name) }
  saveCareer(saved)
  return saved
}

export function ExamCareerIntroPage() {
  const navigate = useNavigate()
  const [saved] = useState(loadCareer)
  const [track, setTrack] = useState<Track | null>(null)
  const [name, setName] = useState('')
  const ready = Boolean(track && name.trim())
  const inProgress = saved && saved.state.status !== 'finished' && saved.state.history.length > 0
  const lastExam = saved?.state.history.at(-1)

  const start = () => {
    if (!track || !name.trim()) return
    startNewCareer(track, name)
    navigate(EXAM_CAREER_PLAY_PATH)
  }

  return (
    <AppShell
      surface="base"
      contentClassName="exam-career-shell"
      appBar={<AppBar title="미니게임" leading={<ServiceHomeButton />} />}
    >
      <div className="exam-career-intro">
        <div className="exam-career-intro__art" aria-hidden>
          <GraduationCap size={42} />
        </div>
        <header className="exam-career-intro__header">
          <span className="exam-career-tag">선택형 시뮬레이션</span>
          <h1>수험생 커리어 시뮬레이터</h1>
          <p>
            고1 첫 모의고사부터 수능까지, 한 수험생의 성적이 어떻게 흘러가는지 지켜보세요.
            중요한 순간마다 어떻게 보낼지, 어떤 선택과목을 볼지, 수능 뒤에는 어느 대학에 지원할지 직접 정해요.
          </p>
        </header>

        <section className="exam-career-section" aria-labelledby="exam-career-name-title">
          <h2 id="exam-career-name-title">수험생 이름</h2>
          <TextField
            id="exam-career-name"
            label="이름"
            maxLength={STUDENT_NAME.maxLength}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </section>

        <section className="exam-career-section" aria-labelledby="exam-career-track-title">
          <h2 id="exam-career-track-title">어떤 성향의 수험생인가요?</h2>
          <OptionGroup
            label="문과 이과 성향"
            options={TRACK_IDS.map((id) => ({ id, label: TRACKS[id].label }))}
            value={track}
            onChange={setTrack}
          />
          <p className="exam-career-section__note">
            성향에 맞는 과목을 조금 더 잘하는 편이에요. 차이는 사람마다 달라서 거의 없을 수도 있어요. 선택과목은
            고2가 되면 따로 정해요.
          </p>
        </section>

        <div className="exam-career-intro__actions">
          {inProgress && (
            <Button
              variant="brand"
              fullWidth
              onClick={() => navigate(EXAM_CAREER_PLAY_PATH)}
            >
              이어서 보기 · {lastExam?.yearLabel} {lastExam?.label}까지
            </Button>
          )}
          <Button
            variant={inProgress ? 'secondary' : 'brand'}
            fullWidth
            disabled={!ready}
            leadingIcon={inProgress ? <RotateCcw size={18} aria-hidden /> : undefined}
            onClick={start}
          >
            {!name.trim()
              ? '이름을 먼저 적어 주세요'
              : !track
                ? '성향을 먼저 골라 주세요'
                : inProgress
                  ? '새 커리어 시작'
                  : '커리어 시작'}
          </Button>
          <Button variant="tertiary" fullWidth onClick={() => navigate(SERVICE_HOME)}>
            홈 화면으로 돌아가기
          </Button>
        </div>

        <p className="exam-career-disclaimer">{DISCLAIMER}</p>
      </div>
    </AppShell>
  )
}

function GradeChange({ current, previous }: { current: number; previous: number | undefined }) {
  if (previous === undefined || previous === current) {
    return (
      <span className="exam-career-change exam-career-change--same">{previous === undefined ? '첫 시험' : '유지'}</span>
    )
  }
  const better = current < previous
  return (
    <span className={`exam-career-change exam-career-change--${better ? 'up' : 'down'}`}>
      {better ? '▲' : '▼'}
      {Math.abs(current - previous)}
      <span className="exam-career-sr-only">{better ? '등급 상승' : '등급 하락'}</span>
    </span>
  )
}

function GradeList({ result, previous }: { result: ExamResult; previous?: ExamResult }) {
  const labels = SUBJECTS.map((subject) => subjectLabel(subject.id, result.electives))
  const hasElective = labels.some((label) => label.elective)
  // Each tile spans the same rows (subject, elective, grade, change) so the grades line up.
  const rows = 2 + (hasElective ? 1 : 0) + (previous !== undefined ? 1 : 0)
  return (
    <ul className="exam-career-grades">
      {SUBJECTS.map((subject, order) => {
        const label = labels[order]!
        return (
          <li key={subject.id} style={{ animationDelay: `${order * 60}ms`, gridRow: `span ${rows}` }}>
            <span className="exam-career-grades__subject">{label.name}</span>
            {hasElective && <span className="exam-career-grades__elective">{label.elective}</span>}
            <span className={`exam-career-grade exam-career-grade--${result.grades[subject.id]}`}>
              {result.grades[subject.id]}등급
            </span>
            {previous !== undefined && (
              <GradeChange current={result.grades[subject.id]} previous={previous.grades[subject.id]} />
            )}
          </li>
        )
      })}
    </ul>
  )
}

function ExamCard({ result, previous }: { result: ExamResult; previous?: ExamResult }) {
  return (
    <section className={`exam-career-card exam-career-card--${result.kind}`} aria-live="polite">
      <header className="exam-career-card__head">
        <span>{result.yearLabel}</span>
        <h2>{result.label}</h2>
        <p>
          평균 <strong>{result.average}</strong>등급
        </p>
      </header>
      <GradeList result={result} previous={previous ?? undefined} />
      {(result.events.length > 0 || result.dayNotes.length > 0) && (
        <ul className="exam-career-events">
          {result.events.map((event) => (
            <li key={event.eventId} className={`exam-career-event exam-career-event--${event.tone}`}>
              {event.tone === 'up' ? <TrendingUp size={16} aria-hidden /> : <TrendingDown size={16} aria-hidden />}
              <span>
                <strong>{event.title}</strong>
                {event.description}
              </span>
            </li>
          ))}
          {result.dayNotes.map((note) => (
            <li
              key={`${note.subject}-${note.roll}`}
              className={`exam-career-event exam-career-event--${note.roll === 'jackpot' || note.roll === 'good' ? 'up' : 'down'}`}
            >
              <Sparkles size={16} aria-hidden />
              <span>
                <strong>
                  {note.subject === 'all' ? '시험 당일' : subjectLabel(note.subject, result.electives).name} {note.label}
                </strong>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function ElectivePicker({
  point,
  initial,
  onConfirm,
}: {
  point: ElectiveChoicePoint
  /** The current electives; null for the first pick, which starts empty. */
  initial: Electives | null
  onConfirm: (electives: Electives) => void
}) {
  const [draft, setDraft] = useState<Partial<Electives>>(initial ?? {})
  const copy = CHOICE_COPY[point]
  const complete = ELECTIVE_GROUPS.every(({ category }) => draft[category])
  const changed = initial ? ELECTIVE_GROUPS.filter(({ category }) => draft[category] !== initial[category]) : []

  return (
    <section className="exam-career-section exam-career-electives" aria-labelledby="exam-career-electives-title">
      <h2 id="exam-career-electives-title">{copy.title}</h2>
      <p className="exam-career-section__note">{copy.body}</p>
      {ELECTIVE_GROUPS.map(({ category, title }) => (
        <div key={category} className="exam-career-electives__group">
          <h3>{title}</h3>
          <OptionGroup
            label={`${title} 선택과목`}
            options={ELECTIVE_OPTIONS[category] as readonly { id: string; label: string }[]}
            value={draft[category] ?? null}
            onChange={(id) => setDraft((current) => ({ ...current, [category]: id }))}
          />
        </div>
      ))}
      {initial && (
        <p className="exam-career-electives__summary" role="status">
          {changed.length === 0
            ? '지금 과목을 그대로 유지해요.'
            : `${changed.map(({ title }) => title).join(', ')} 과목을 바꿔요.`}
        </p>
      )}
      <Button variant="brand" fullWidth disabled={!complete} onClick={() => complete && onConfirm(draft as Electives)}>
        {complete ? copy.confirm : '과목을 모두 골라 주세요'}
      </Button>
    </section>
  )
}

/** Something that just happened (a breakup before the CSAT): on the page, until acknowledged. */
function NoticeCard({ title, text, onAcknowledge }: { title: string; text: string; onAcknowledge: () => void }) {
  return (
    <section className="exam-career-section exam-career-choice" aria-labelledby="exam-career-notice-title">
      <h2 id="exam-career-notice-title">{title}</h2>
      <p className="exam-career-section__note">{text}</p>
      <Button variant="brand" fullWidth onClick={onAcknowledge}>
        마음 추스르기
      </Button>
    </section>
  )
}

/** The event high school opens with: shown on the page itself, before the first exam. */
function EntryEvent({ event, onChoose }: { event: ChoiceEvent; onChoose: (optionId: string) => void }) {
  return (
    <section className="exam-career-section exam-career-choice" aria-labelledby="exam-career-choice-title">
      <span className="exam-career-tag">선택 이벤트</span>
      <h2 id="exam-career-choice-title">{event.title}</h2>
      <p className="exam-career-section__note">{event.prompt}</p>
      <div className="exam-career-choice__options" role="group" aria-label="이벤트 선택지">
        {event.options.map((option) => (
          <button key={option.id} type="button" className="exam-career-choice__option" onClick={() => onChoose(option.id)}>
            <strong>{option.label}</strong>
          </button>
        ))}
      </div>
    </section>
  )
}

function EventDialog({ event, onChoose }: { event: ChoiceEvent; onChoose: (optionId: string) => void }) {
  // A pick is required: the exam waits for it, so closing does nothing.
  return (
    <Dialog open onClose={() => {}} title={event.title} description={event.prompt}>
      <div className="exam-career-choice__options" role="group" aria-label="이벤트 선택지">
        {event.options.map((option) => (
          <button key={option.id} type="button" className="exam-career-choice__option" onClick={() => onChoose(option.id)}>
            <strong>{option.label}</strong>
          </button>
        ))}
      </div>
    </Dialog>
  )
}

/** A short wait before the CSAT score or the admission results come out. */
function SuspenseCard({ kind, onDone }: { kind: 'csat' | 'admission'; onDone: () => void }) {
  const lines = SUSPENSE_LINES[kind]
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (step + 1 < lines.length) setStep(step + 1)
      else onDone()
    }, SUSPENSE_STEP_MS)
    return () => window.clearTimeout(timer)
  }, [step, lines.length, onDone])

  return (
    <section
      className={`exam-career-card exam-career-suspense exam-career-suspense--${kind}`}
      role="status"
      aria-label={kind === 'csat' ? '수능 채점 중' : '합격 발표 중'}
    >
      <span className="exam-career-suspense__dots" aria-hidden>
        <i />
        <i />
        <i />
      </span>
      <p key={step} className="exam-career-suspense__line">
        {lines[step]}
      </p>
      <span
        className="exam-career-suspense__bar"
        style={{ animationDuration: `${SUSPENSE_STEP_MS * lines.length}ms` }}
        aria-hidden
      />
    </section>
  )
}

function latestCsat(state: CareerState) {
  return [...state.history].reverse().find((result) => result.kind === 'csat' && result.attempt === state.attempt)
}

function ApplicationPicker({
  state,
  onSubmit,
}: {
  state: CareerState
  onSubmit: (picks: UniversityTierId[]) => void
}) {
  const average = latestCsat(state)?.average ?? 9
  const cutoffs = admissionCutoffs(state)
  const [picks, setPicks] = useState<(UniversityTierId | null)[]>(() => APPLICATION_GROUPS.map(() => null))
  const major = MAJOR_FIELDS[state.profile.track]
  const complete = picks.every((pick) => pick !== null)

  return (
    <section className="exam-career-section exam-career-electives" aria-labelledby="exam-career-apply-title">
      <h2 id="exam-career-apply-title">정시 원서를 넣어 볼까요?</h2>
      <p className="exam-career-section__note">
        이번 수능 평균 {average}등급으로 가·나·다군에 한 곳씩 지원해요. 지원 학과는 {major}이에요.
      </p>
      {APPLICATION_GROUPS.map((group, index) => (
        <div key={group} className="exam-career-electives__group">
          <h3>{group}</h3>
          <OptionGroup
            label={`${group} 지원 대학`}
            options={UNIVERSITY_TIERS.map((tier) => ({
              id: tier.id,
              label: tier.label,
              description: chanceLabel(admissionChance(average, cutoffs[index]![tier.id])).label,
            }))}
            value={picks[index] ?? null}
            onChange={(tierId) =>
              setPicks((current) => current.map((pick, position) => (position === index ? tierId : pick)))
            }
          />
        </div>
      ))}
      <p className="exam-career-section__note">
        {CUTOFF_NOTE} {ADMISSION_NOTE}
      </p>
      <Button
        variant="brand"
        fullWidth
        disabled={!complete}
        onClick={() => complete && onSubmit(picks as UniversityTierId[])}
      >
        {complete ? '원서 접수하기' : '가·나·다군을 모두 골라 주세요'}
      </Button>
    </section>
  )
}

function AdmissionResults({
  state,
  onEnroll,
  onRetake,
}: {
  state: CareerState
  onEnroll: (tierId: UniversityTierId | null) => void
  onRetake: () => void
}) {
  const record = state.admissions.at(-1)
  if (!record) return null
  const accepted = [...new Set(record.applications.filter((item) => item.accepted).map((item) => item.tierId))]
  const major = MAJOR_FIELDS[state.profile.track]

  return (
    <section className="exam-career-section exam-career-electives" aria-labelledby="exam-career-admission-title">
      <h2 id="exam-career-admission-title">
        {accepted.length > 0 ? '합격 발표가 났어요!' : '아쉽게도 모두 불합격이에요'}
      </h2>
      <ul className="exam-career-admissions">
        {record.applications.map((item) => (
          <li key={item.group} className={item.accepted ? 'is-accepted' : 'is-rejected'}>
            <span className="exam-career-admissions__group">{item.group}</span>
            <span>
              {universityLabel(item.tierId)}
              <small>{chanceLabel(item.chance).label} 지원</small>
            </span>
            <strong>
              {item.accepted ? <Check size={16} aria-hidden /> : <X size={16} aria-hidden />}
              {item.accepted ? '합격' : '불합격'}
            </strong>
          </li>
        ))}
      </ul>
      <div className="exam-career-actions">
        {accepted.map((tierId) => (
          <Button key={tierId} variant="brand" fullWidth onClick={() => onEnroll(tierId)}>
            {universityLabel(tierId)} {major} 진학하기
          </Button>
        ))}
        <Button variant="secondary" fullWidth leadingIcon={<RotateCcw size={18} aria-hidden />} onClick={onRetake}>
          {attemptLabel(state.attempt + 1)} 도전하기
        </Button>
        {accepted.length === 0 && (
          <Button variant="tertiary" fullWidth onClick={() => onEnroll(null)}>
            진학하지 않고 마무리하기
          </Button>
        )}
      </div>
    </section>
  )
}

function HistoryList({ history }: { history: ExamResult[] }) {
  return (
    <details className="exam-career-history">
      <summary>전체 시험 기록 ({history.length}회)</summary>
      <ol>
        {[...history].reverse().map((result) => (
          <li key={result.examId} className={result.kind === 'csat' ? 'is-csat' : ''}>
            <span className="exam-career-history__label">
              {result.yearLabel} {result.label}
            </span>
            <span className="exam-career-history__grades">
              {SUBJECTS.map((subject) => result.grades[subject.id]).join(' · ')}
            </span>
            <span className="exam-career-history__average">{result.average}</span>
          </li>
        ))}
      </ol>
    </details>
  )
}

/** "고2로", "고3으로": the particle follows the year's last sound. */
function toYear(yearLabel: string) {
  return /[36]$/.test(yearLabel) ? `${yearLabel}으로` : `${yearLabel}로`
}

/** "학평을", "모의평가를": the object particle follows the label's last sound. */
function withObject(label: string) {
  const code = label.charCodeAt(label.length - 1) - 0xac00
  const hasFinal = code >= 0 && code < 11172 && code % 28 !== 0
  return `${label}${hasFinal ? '을' : '를'}`
}

/** The exam about to start, shown instead of the last results when a new stretch begins. */
function UpcomingCard({ slot, electives }: { slot: ExamSlot; electives: Electives | null }) {
  const picked = electives
    ? ELECTIVE_GROUPS.map(({ category }) =>
        (ELECTIVE_OPTIONS[category] as readonly { id: string; label: string }[]).find(
          (option) => option.id === electives[category],
        )?.label,
      ).join(' · ')
    : null
  return (
    <section className="exam-career-card exam-career-card--empty">
      <h2>
        {slot.yearLabel} {withObject(slot.label)} 앞두고 있어요
      </h2>
      <p>
        {picked
          ? `선택과목: ${picked}`
          : '어떤 수험생일지는 시험을 치러 봐야 알 수 있어요. 첫 시험을 시작해 보세요.'}
      </p>
    </section>
  )
}

/** What pressing the main button leads to next. */
function proceedLabel(state: CareerState, upcoming: ExamSlot | null) {
  if (!upcoming) return '다음 시험'
  // The CSAT never starts on its own: after the D-30 pick, it waits for this button.
  if (upcoming.kind === 'csat' && state.eventAnsweredFor === upcoming.id) return '수능 보러 가기'
  const choice = electiveChoiceBefore(state)
  // A choice event comes before the electives; the button then just names the exam.
  const eventFirst = choiceEventBefore(state, upcoming) !== null && state.eventAnsweredFor !== upcoming.id
  if (choice === 'last-change' && !eventFirst) return '선택과목 최종 확정하기'
  if (choice === 'first' || choice === 'senior') return `${toYear(upcoming.yearLabel)} 넘어가기`
  return `다음 시험 · ${upcoming.yearLabel} ${upcoming.label}`
}

export function ExamCareerPlayPage() {
  const navigate = useNavigate()
  const [saved, setSaved] = useState<SavedCareer | null>(loadCareer)
  /** UI only: the wait before a CSAT score or admission results. Not saved. */
  const [suspense, setSuspense] = useState<'csat' | 'admission' | null>(null)
  const endSuspense = useCallback(() => setSuspense(null), [])
  /** UI only: an outcome shown right away (스터디카페), before its exam runs. */
  const [revealed, setRevealed] = useState<CareerEventRecord | null>(null)

  if (!saved) return <Navigate to={EXAM_CAREER_PATH} replace />

  const { state } = saved
  const commit = (next: CareerState) => {
    const nextSaved = { state: next }
    saveCareer(nextSaved)
    setSaved(nextSaved)
    if (next.history.length > state.history.length && next.history.at(-1)!.kind === 'csat') setSuspense('csat')
  }
  const history = state.history
  const latest = history.at(-1)
  const upcoming = nextExam(state)
  const event = pendingEventOf(state)
  /** The opening event of high school sits on the page; later ones pop up. */
  const entryEvent = event && state.attempt === 0 && history.length === 0 ? event : null
  const notice = pendingNoticeOf(state)
  /**
   * A new stretch is about to begin (first exam, right after an electives
   * choice, a retake year): show what comes next, not the last results again.
   */
  const startingFresh =
    state.status === 'playing' &&
    upcoming !== null &&
    (!latest || state.choiceAnsweredFor === upcoming.id || (upcoming.attempt > 0 && state.nextExamIndex === 0))

  const chooseEvent = (optionId: string) => {
    const answered = chooseEventOption(state, optionId)
    if (event?.revealAtOnce && answered !== state) {
      // The outcome pops up first; the exam runs once it has been read.
      commit(answered)
      setRevealed(answered.pendingRecords.at(-1) ?? null)
      return
    }
    // The exam the event led up to runs right away and its card shows the event's
    // outcome, except the CSAT, which gets a button of its own.
    commit(answered.status === 'playing' && upcoming?.kind !== 'csat' ? runExam(answered) : answered)
  }
  const closeRevealed = () => {
    setRevealed(null)
    if (state.status === 'playing') commit(runExam(state))
  }
  const restart = () => {
    clearCareer()
    navigate(EXAM_CAREER_PATH)
  }

  if (state.status === 'finished') {
    return <CareerSummaryView saved={saved} onRestart={restart} />
  }

  const choosing = state.status === 'choosing' && state.pendingChoice
  const showActions = !suspense && !revealed && (state.status === 'playing' || state.status === 'decision')

  return (
    <AppShell
      surface="base"
      contentClassName="exam-career-shell"
      appBar={
        <AppBar
          title="수험생 커리어"
          subtitle={`${state.profile.name} · ${TRACKS[state.profile.track].label} · ${attemptLabel(state.attempt)}`}
          leading={
            <IconButton
              label="게임 첫 화면으로"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate(EXAM_CAREER_PATH)}
            />
          }
          trailing={<ServiceHomeButton />}
        />
      }
      fixedAction={
        showActions ? (
          <div className="exam-career-actions">
            {state.status === 'decision' ? (
              <>
                <p className="exam-career-actions__prompt">수능이 끝났어요. 어떻게 할까요?</p>
                <Button
                  variant="brand"
                  fullWidth
                  leadingIcon={<GraduationCap size={18} aria-hidden />}
                  onClick={() => commit(decide(state, 'university'))}
                >
                  대학 지원하기
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  leadingIcon={<RotateCcw size={18} aria-hidden />}
                  onClick={() => commit(decide(state, 'retake'))}
                >
                  {attemptLabel(state.attempt + 1)} 도전하기
                </Button>
              </>
            ) : (
              <Button variant="brand" fullWidth onClick={() => commit(runExam(state))}>
                {proceedLabel(state, upcoming)}
              </Button>
            )}
          </div>
        ) : undefined
      }
    >
      {notice ? (
        // The CSAT button only comes back once this has sunk in.
        <div className="exam-career-play">
          <NoticeCard title={notice.title} text={notice.text} onAcknowledge={() => commit(acknowledgeNotice(state))} />
        </div>
      ) : entryEvent ? (
        // Picking leaves the career ready for the 고1 March exam; that button comes next.
        <div className="exam-career-play">
          <EntryEvent
            key={entryEvent.id}
            event={entryEvent}
            onChoose={(optionId) => commit(chooseEventOption(state, optionId))}
          />
        </div>
      ) : choosing ? (
        // An electives choice gets the page to itself.
        <div className="exam-career-play">
          <ElectivePicker
            key={`${state.attempt}-${state.pendingChoice}`}
            point={state.pendingChoice!}
            initial={state.electives}
            onConfirm={(electives) => commit(chooseElectives(state, electives))}
          />
        </div>
      ) : (
        <div className="exam-career-play">
          {state.status === 'applying' && (
            <ApplicationPicker
              key={`apply-${state.attempt}`}
              state={state}
              onSubmit={(picks) => {
                commit(applyToUniversities(state, picks))
                setSuspense('admission')
              }}
            />
          )}

          {suspense === 'admission' && <SuspenseCard kind="admission" onDone={endSuspense} />}

          {state.status === 'admission' && !suspense && (
            <AdmissionResults
              state={state}
              onEnroll={(tierId) => commit(enroll(state, tierId))}
              onRetake={() => commit(decide(state, 'retake'))}
            />
          )}

          {suspense === 'csat' ? (
            <SuspenseCard kind="csat" onDone={endSuspense} />
          ) : startingFresh ? (
            <UpcomingCard slot={upcoming!} electives={state.electives} />
          ) : (
            // While the admission results are on their way, the wait has the stage to itself.
            latest &&
            suspense !== 'admission' && <ExamCard key={latest.examId} result={latest} previous={history.at(-2)} />
          )}

          {history.length > 1 && !suspense && (
            <section className="exam-career-section">
              <h2>성적 변화</h2>
              <ExamCareerChart history={history} />
            </section>
          )}

          {history.length > 0 && !suspense && <HistoryList history={history} />}

          <p className="exam-career-disclaimer">{DISCLAIMER}</p>
        </div>
      )}

      {revealed && (
        <Dialog
          open
          onClose={closeRevealed}
          title={revealed.title}
          description={revealed.description}
          primaryAction={{ label: '확인', variant: 'brand', onClick: closeRevealed }}
        />
      )}

      {event && !entryEvent && !suspense && <EventDialog key={`${state.attempt}-${state.nextExamIndex}-${event.id}`} event={event} onChoose={chooseEvent} />}
    </AppShell>
  )
}

function CareerSummaryView({ saved, onRestart }: { saved: SavedCareer; onRestart: () => void }) {
  const navigate = useNavigate()
  const summary = summarize(saved.state)
  const final = summary.finalCsat
  const { profile } = saved.state
  const enrolled = summary.admission?.enrolled ?? null

  // The summary replaces the play screen in place; start it from the top.
  useEffect(() => {
    window.scrollTo?.(0, 0)
  }, [])

  return (
    <AppShell
      surface="base"
      contentClassName="exam-career-shell"
      appBar={
        <AppBar
          title="커리어 요약"
          leading={
            <IconButton
              label="게임 첫 화면으로"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate(EXAM_CAREER_PATH)}
            />
          }
          trailing={<ServiceHomeButton />}
        />
      }
    >
      <div className="exam-career-summary">
        {final && (
          <section className="exam-career-card exam-career-card--csat">
            <header className="exam-career-card__head">
              <span>
                {profile.name} · {summary.attemptLabel} · 최종 수능
              </span>
              <h1>수험 생활 끝!</h1>
              <p>
                평균 <strong>{final.average}</strong>등급
              </p>
            </header>
            <GradeList result={final} />
          </section>
        )}

        <section className="exam-career-section exam-career-destination">
          <h2>진학 결과</h2>
          <p className="exam-career-destination__result">
            {enrolled
              ? `${profile.name}님은 ${universityLabel(enrolled)} ${MAJOR_FIELDS[profile.track]}에 진학했어요.`
              : `${profile.name}님은 대학에 진학하지 않고 수험 생활을 마무리했어요.`}
          </p>
          {summary.admission && (
            <ul className="exam-career-admissions">
              {summary.admission.applications.map((item) => (
                <li key={item.group} className={item.accepted ? 'is-accepted' : 'is-rejected'}>
                  <span className="exam-career-admissions__group">{item.group}</span>
                  <span>{universityLabel(item.tierId)}</span>
                  <strong>{item.accepted ? '합격' : '불합격'}</strong>
                </li>
              ))}
            </ul>
          )}
          <p className="exam-career-section__note">{ADMISSION_NOTE}</p>
        </section>

        <section className="exam-career-section">
          <h2>커리어 기록</h2>
          <dl className="exam-career-stats">
            <div>
              <dt>최종 응시</dt>
              <dd>{summary.attemptLabel}</dd>
            </div>
            <div>
              <dt>치른 시험</dt>
              <dd>{saved.state.history.length}회</dd>
            </div>
            {SUBJECTS.map((subject) => (
              <div key={subject.id}>
                <dt>{subjectLabel(subject.id, final?.electives ?? null).name} 최고</dt>
                <dd>{summary.bestGrades[subject.id]}등급</dd>
              </div>
            ))}
          </dl>
          {summary.biggestRise && (
            <p className="exam-career-highlight">
              <TrendingUp size={18} aria-hidden />
              <span>
                가장 극적인 상승: {summary.biggestRise.from.yearLabel} {summary.biggestRise.from.label} 평균{' '}
                {summary.biggestRise.from.average}등급 → {summary.biggestRise.to.yearLabel}{' '}
                {summary.biggestRise.to.label} 평균 {summary.biggestRise.to.average}등급
              </span>
            </p>
          )}
          {summary.csatResults.length > 1 && (
            <ul className="exam-career-batch">
              {summary.csatResults.map((result) => (
                <li key={result.examId}>
                  <span>{attemptLabel(result.attempt)} 수능</span>
                  <span>평균 {result.average}등급</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {summary.electiveChanges.length > 0 && (
          <section className="exam-career-section">
            <h2>선택과목 변경 전후</h2>
            <ul className="exam-career-batch">
              {summary.electiveChanges.map((change) => (
                <li key={`${change.category}-${change.after.examId}`}>
                  <span>
                    {change.from} → {change.to}
                  </span>
                  <span>
                    {change.subjects.map((subject) => change.before.grades[subject]).join('·')}등급 →{' '}
                    {change.subjects.map((subject) => change.after.grades[subject]).join('·')}등급
                  </span>
                  <small>
                    {change.before.yearLabel} {change.before.label} → {change.after.yearLabel} {change.after.label}
                  </small>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="exam-career-section">
          <h2>전체 성적 변화</h2>
          <ExamCareerChart history={saved.state.history} />
        </section>

        <section className="exam-career-section">
          <h2>주요 이벤트</h2>
          {summary.majorEvents.length > 0 ? (
            <ul className="exam-career-events">
              {summary.majorEvents.map((event, index) => (
                <li key={`${event.eventId}-${index}`} className={`exam-career-event exam-career-event--${event.tone}`}>
                  {event.tone === 'up' ? <TrendingUp size={16} aria-hidden /> : <TrendingDown size={16} aria-hidden />}
                  <span>
                    <strong>
                      {event.title} · {event.examLabel}
                    </strong>
                    {event.description}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="exam-career-section__note">큰 사건 없이 묵묵히 달려온 수험 생활이었어요.</p>
          )}
        </section>

        <div className="exam-career-summary__actions">
          <Button variant="brand" fullWidth leadingIcon={<RotateCcw size={18} aria-hidden />} onClick={onRestart}>
            다시 시작하기
          </Button>
          <Button variant="tertiary" fullWidth onClick={() => navigate(SERVICE_HOME)}>
            홈 화면으로 돌아가기
          </Button>
        </div>

        <p className="exam-career-disclaimer">{DISCLAIMER}</p>
      </div>
    </AppShell>
  )
}
