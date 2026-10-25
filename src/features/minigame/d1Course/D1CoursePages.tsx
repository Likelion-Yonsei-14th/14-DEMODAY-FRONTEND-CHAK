import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Download, House, RotateCcw, Route, Share2 } from 'lucide-react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { saveD1CourseResponse } from '@/api/d1Course'
import { AppBar, BottomSheet, Button, IconButton, TextField, useFeedback } from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import { shareOrCopyLink } from '@/lib/shareLink'
import { buildPrototypeShareUrl } from '@/prototype/shareUrl'
import {
  ACTIVITIES,
  ACTIVITY_COUNT,
  AREAS,
  BUDGETS,
  COMPANIONS,
  courseLabelOf,
  courseLine,
  labelOf,
  NICKNAME_MAX_LENGTH,
  placeText,
  shuffled,
  type ActivityId,
  type AreaId,
  type BudgetId,
  type CompanionId,
  type Option,
} from './d1CourseConfig'
import { districtOptions, needsDistrict, regionOf, REGIONS, startText, type RegionId } from './d1CourseRegions'
import { D1_COURSE_PATH, D1_COURSE_PLAY_PATH, d1CourseResultPath } from './d1CourseRoutes'
import { parseShareCode, shareCodeOf } from './d1CourseShare'
import { downloadBlob, renderShareImage } from './d1CourseShareImage'
import './D1Course.css'

/** Where "back to the service" goes: the entry route picks /home or /start. */
const SERVICE_HOME = '/'

const TITLE = '수능 끝 D+1 코스 짜기'
const STATS_NOTE = '응답은 통계로만 쓰여요.'

/** The four question screens; the fifth step is the result card. */
const QUESTION_COUNT = 4

/** The intro passes the nickname along; it is shown on the card and never sent. */
type PlayState = { nickname?: string } | null

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
  columns,
}: {
  label: string
  options: readonly Option<Id>[]
  value: Id | null
  onChange: (id: Id) => void
  columns?: number
}) {
  return (
    <div
      className="d1-course-options"
      role="radiogroup"
      aria-label={label}
      style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={value === option.id}
          className={['d1-course-options__item', value === option.id ? 'is-selected' : ''].filter(Boolean).join(' ')}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

/** Pick up to three; each picked one shows its place in the course. */
function ActivityPicker({
  options,
  value,
  onChange,
}: {
  options: readonly Option<ActivityId>[]
  value: ActivityId[]
  onChange: (next: ActivityId[]) => void
}) {
  const full = value.length >= ACTIVITY_COUNT
  const toggle = (id: ActivityId) => {
    if (value.includes(id)) onChange(value.filter((item) => item !== id))
    else if (!full) onChange([...value, id])
  }

  return (
    <div className="d1-course-options d1-course-options--activities" role="group" aria-label="하고 싶은 것">
      {options.map((option) => {
        const order = value.indexOf(option.id)
        const selected = order >= 0
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            disabled={full && !selected}
            className={['d1-course-options__item', selected ? 'is-selected' : ''].filter(Boolean).join(' ')}
            onClick={() => toggle(option.id)}
          >
            {selected && (
              <span className="d1-course-options__order" aria-label={`${order + 1}번째`}>
                {order + 1}
              </span>
            )}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export function D1CourseIntroPage() {
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('')

  return (
    <AppShell
      surface="base"
      contentClassName="d1-course-shell"
      appBar={<AppBar title="미니게임" leading={<ServiceHomeButton />} />}
    >
      <div className="d1-course-intro">
        <div className="d1-course-intro__art" aria-hidden>
          <Route size={42} />
        </div>
        <header className="d1-course-intro__header">
          <span className="d1-course-tag">코스 플래너</span>
          <h1>{TITLE}</h1>
          <p>수능 다음 날, 어디서 누구랑 뭐 하고 놀까? 하고 싶은 걸 골라서 나만의 코스를 완성해 보세요.</p>
        </header>

        <section className="d1-course-section" aria-labelledby="d1-course-name-title">
          <h2 id="d1-course-name-title">결과 카드에 쓸 이름</h2>
          <TextField
            id="d1-course-nickname"
            label="닉네임 (선택)"
            helper="결과 카드에만 보이고 저장되지 않아요."
            maxLength={NICKNAME_MAX_LENGTH}
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
          />
        </section>

        <div className="d1-course-intro__actions">
          <Button
            variant="brand"
            fullWidth
            onClick={() => navigate(D1_COURSE_PLAY_PATH, { state: { nickname: nickname.trim() } })}
          >
            코스 짜러 가기
          </Button>
          <Button variant="tertiary" fullWidth onClick={() => navigate(SERVICE_HOME)}>
            홈 화면으로 돌아가기
          </Button>
        </div>

        <p className="d1-course-disclaimer">{STATS_NOTE}</p>
      </div>
    </AppShell>
  )
}

type Answers = {
  region: RegionId | null
  /** Null until picked, and for a region without districts (세종). */
  district: string | null
  area: AreaId | null
  activities: ActivityId[]
  companion: CompanionId | null
  budget: BudgetId | null
}

type FinishedCourse = { [Key in Exclude<keyof Answers, 'district'>]: NonNullable<Answers[Key]> } & {
  district: string | null
  responseId: string
}

const EMPTY_ANSWERS: Answers = { region: null, district: null, area: null, activities: [], companion: null, budget: null }

/** Only the activities get a new order for every play, so no position collects more picks. */
const shuffleActivities = () => shuffled(ACTIVITIES)

function stepReady(step: number, answers: Answers) {
  if (step === 0) return answers.region !== null && (!needsDistrict(answers.region) || answers.district !== null)
  if (step === 1) return answers.area !== null
  if (step === 2) return answers.activities.length === ACTIVITY_COUNT
  return answers.companion !== null && answers.budget !== null
}

function nextLabel(step: number, answers: Answers) {
  if (step === 0 && answers.region && !stepReady(step, answers)) {
    return '출발 지역을 골라 주세요'
  }
  if (step === 2 && answers.activities.length < ACTIVITY_COUNT) {
    return `${ACTIVITY_COUNT - answers.activities.length}개 더 골라 주세요`
  }
  if (step === 3) {
    if (!answers.companion) return '누구랑 갈지 골라 주세요'
    if (!answers.budget) return '예산을 골라 주세요'
    return '코스 완성하기'
  }
  return '다음'
}

function responseOf(course: FinishedCourse, shared: boolean) {
  return {
    responseId: course.responseId,
    startRegion: course.region,
    startDistrict: course.district,
    area: course.area,
    activities: course.activities,
    companion: course.companion,
    budget: course.budget,
    shared,
  }
}

export function D1CoursePlayPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const nickname = (location.state as PlayState)?.nickname ?? ''
  const [activityOrder, setActivityOrder] = useState(shuffleActivities)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS)
  const [finished, setFinished] = useState<FinishedCourse | null>(null)
  const districtSection = useRef<HTMLElement>(null)

  useEffect(() => {
    window.scrollTo?.(0, 0)
  }, [step, finished])

  // The district list opens below the regions; bring it into view.
  useEffect(() => {
    if (answers.region) districtSection.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  }, [answers.region])

  const update = (patch: Partial<Answers>) => setAnswers((current) => ({ ...current, ...patch }))

  const restart = () => {
    setActivityOrder(shuffleActivities())
    setAnswers(EMPTY_ANSWERS)
    setFinished(null)
    setStep(0)
  }

  if (finished) return <CourseResultView course={finished} nickname={nickname} onRestart={restart} />

  const goBack = () => (step === 0 ? navigate(D1_COURSE_PATH) : setStep(step - 1))

  const proceed = () => {
    if (!stepReady(step, answers)) return
    if (step < QUESTION_COUNT - 1) {
      setStep(step + 1)
      return
    }
    const course = { ...answers, responseId: crypto.randomUUID() } as FinishedCourse
    saveD1CourseResponse(responseOf(course, false))
    setFinished(course)
  }

  return (
    <AppShell
      surface="base"
      contentClassName="d1-course-shell"
      appBar={
        <AppBar
          title={TITLE}
          leading={
            <IconButton
              label={step === 0 ? '게임 첫 화면으로' : '이전 질문으로'}
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={goBack}
            />
          }
          trailing={<ServiceHomeButton />}
        />
      }
      fixedAction={
        <Button variant="brand" fullWidth disabled={!stepReady(step, answers)} onClick={proceed}>
          {nextLabel(step, answers)}
        </Button>
      }
    >
      <div className="d1-course-play">
        <div className="d1-course-progress">
          <span>
            {step + 1} / {QUESTION_COUNT + 1}
          </span>
          <div
            className="d1-course-progress__bar"
            role="progressbar"
            aria-label="진행 단계"
            aria-valuemin={1}
            aria-valuemax={QUESTION_COUNT + 1}
            aria-valuenow={step + 1}
          >
            <span style={{ width: `${((step + 1) / (QUESTION_COUNT + 1)) * 100}%` }} />
          </div>
        </div>

        {step === 0 && (
          <section className="d1-course-section" aria-labelledby="d1-course-question">
            <h1 id="d1-course-question">어디서 출발해?</h1>
            <OptionGroup
              label="출발 시·도"
              options={REGIONS}
              value={answers.region}
              onChange={(region) => update({ region, district: null })}
              columns={4}
            />
          </section>
        )}

        {step === 0 && answers.region && needsDistrict(answers.region) && (
          <section ref={districtSection} className="d1-course-section" aria-labelledby="d1-course-district">
            <h2 id="d1-course-district">
              {regionOf(answers.region).label} 어디?
            </h2>
            <OptionGroup
              label={`${regionOf(answers.region).label} 출발 지역`}
              options={districtOptions(answers.region)}
              value={answers.district}
              onChange={(district) => update({ district })}
              columns={4}
            />
          </section>
        )}

        {step === 1 && (
          <section className="d1-course-section" aria-labelledby="d1-course-question">
            <h1 id="d1-course-question">어디로 놀러 갈래?</h1>
            <OptionGroup
              label="놀러 갈 곳"
              options={AREAS}
              value={answers.area}
              onChange={(area) => update({ area })}
              columns={2}
            />
          </section>
        )}

        {step === 2 && (
          <section className="d1-course-section" aria-labelledby="d1-course-question">
            <h1 id="d1-course-question">하고 싶은 거 3개 골라!</h1>
            <p className="d1-course-section__note">고른 순서대로 코스가 돼요.</p>
            <ActivityPicker
              options={activityOrder}
              value={answers.activities}
              onChange={(activities) => update({ activities })}
            />
          </section>
        )}

        {step === 3 && (
          <>
            <section className="d1-course-section" aria-labelledby="d1-course-question">
              <h1 id="d1-course-question">누구랑 가?</h1>
              <OptionGroup
                label="같이 갈 사람"
                options={COMPANIONS}
                value={answers.companion}
                onChange={(companion) => update({ companion })}
                columns={2}
              />
            </section>
            <section className="d1-course-section" aria-labelledby="d1-course-budget">
              <h2 id="d1-course-budget">예산은 얼마나?</h2>
              <OptionGroup
                label="예산"
                options={BUDGETS}
                value={answers.budget}
                onChange={(budget) => update({ budget })}
                columns={3}
              />
            </section>
          </>
        )}
      </div>
    </AppShell>
  )
}

function CourseTicket({
  heading,
  place,
  activities,
  details,
}: {
  heading: string
  place: string
  activities: readonly ActivityId[]
  details?: string
}) {
  return (
    <section className="d1-course-ticket" aria-labelledby="d1-course-ticket-title">
      <span className="d1-course-ticket__eyebrow">D+1 · 수능 다음 날</span>
      <h1 id="d1-course-ticket-title">{heading}</h1>
      <p className="d1-course-ticket__place">{place}</p>
      <ol className="d1-course-ticket__stops">
        {activities.map((activity) => (
          <li key={activity}>{courseLabelOf(activity)}</li>
        ))}
      </ol>
      {details && <p className="d1-course-ticket__details">{details}</p>}
    </section>
  )
}

function useShareActions(course: FinishedCourse, owner: string, onShared: () => void) {
  const { showToast } = useFeedback()
  const [image, setImage] = useState<{ blob: Blob; url: string } | null>(null)
  const [rendering, setRendering] = useState(false)

  useEffect(
    () => () => {
      if (image) URL.revokeObjectURL(image.url)
    },
    [image],
  )

  const place = placeText(course.area, startText(course.region, course.district))
  const playUrl = buildPrototypeShareUrl(D1_COURSE_PATH)
  const fileName = `수능끝코스_${place.replace(/\s/g, '')}.png`

  const shareLink = () => {
    onShared()
    return shareOrCopyLink(
      {
        title: TITLE,
        text: `${owner}의 수능 끝 코스: ${place} · ${courseLine(course.activities)}! 너도 수능 다음 날 코스를 짜 볼래?`,
        url: buildPrototypeShareUrl(d1CourseResultPath(shareCodeOf(course))),
      },
      showToast,
      '결과 링크를 복사했어요. 친구에게 붙여넣어 보내세요.',
    )
  }

  const createImage = async () => {
    if (rendering) return
    setRendering(true)
    try {
      const blob = await renderShareImage(owner, place, course.activities, playUrl)
      setImage({ blob, url: URL.createObjectURL(blob) })
    } catch {
      showToast('이미지를 만들지 못했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setRendering(false)
    }
  }

  const file = image ? new File([image.blob], fileName, { type: 'image/png' }) : null
  const canShareFile =
    file !== null && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })

  const shareImageFile = async () => {
    if (!file) return
    onShared()
    try {
      await navigator.share({ files: [file], title: TITLE })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      showToast('공유하지 못했어요. 이미지를 저장한 뒤 직접 보내 주세요.')
    }
  }

  const downloadImage = () => {
    if (!image) return
    onShared()
    try {
      downloadBlob(image.blob, fileName)
    } catch {
      showToast('저장하지 못했어요. 이미지를 길게 눌러 저장해 주세요.')
    }
  }

  return {
    place,
    shareLink,
    createImage,
    rendering,
    image,
    closeImage: () => setImage(null),
    downloadImage,
    canShareFile,
    shareImageFile,
  }
}

function CourseResultView({
  course,
  nickname,
  onRestart,
}: {
  course: FinishedCourse
  nickname: string
  onRestart: () => void
}) {
  const navigate = useNavigate()
  const owner = nickname || '나'
  // The answer is saved once as not shared; the first share of any kind updates it.
  const markedShared = useRef(false)
  const share = useShareActions(course, owner, () => {
    if (markedShared.current) return
    markedShared.current = true
    saveD1CourseResponse(responseOf(course, true))
  })

  return (
    <AppShell
      surface="base"
      contentClassName="d1-course-shell"
      appBar={
        <AppBar
          title="나의 수능 끝 코스"
          leading={
            <IconButton
              label="게임 첫 화면으로"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate(D1_COURSE_PATH)}
            />
          }
          trailing={<ServiceHomeButton />}
        />
      }
    >
      <div className="d1-course-summary">
        <CourseTicket
          heading={`${owner}의 수능 끝 코스`}
          place={share.place}
          activities={course.activities}
          details={`${labelOf(COMPANIONS, course.companion)} · ${labelOf(BUDGETS, course.budget)}`}
        />

        <div className="d1-course-summary__actions">
          <Button variant="brand" fullWidth leadingIcon={<Share2 size={18} aria-hidden />} onClick={share.shareLink}>
            결과 공유하기
          </Button>
          <Button
            variant="secondary"
            fullWidth
            loading={share.rendering}
            leadingIcon={<Download size={18} aria-hidden />}
            onClick={share.createImage}
          >
            이미지 저장하기
          </Button>
          <Button variant="secondary" fullWidth leadingIcon={<RotateCcw size={18} aria-hidden />} onClick={onRestart}>
            다시 짜기
          </Button>
          <Button variant="tertiary" fullWidth onClick={() => navigate(SERVICE_HOME)}>
            홈 화면으로 돌아가기
          </Button>
        </div>

        <p className="d1-course-disclaimer">{STATS_NOTE} 닉네임은 저장하지 않아요.</p>
      </div>

      <BottomSheet
        open={share.image !== null}
        onClose={share.closeImage}
        title="결과 이미지"
        description="저장이 안 되면 이미지를 길게 눌러 저장해 주세요."
      >
        {share.image && (
          <div className="d1-course-image-sheet">
            <img src={share.image.url} alt="수능 끝 코스 결과 이미지" />
            <Button
              variant="primary"
              fullWidth
              leadingIcon={<Download size={18} aria-hidden />}
              onClick={share.downloadImage}
            >
              이미지 다운로드
            </Button>
            {share.canShareFile && (
              <Button
                variant="secondary"
                fullWidth
                leadingIcon={<Share2 size={18} aria-hidden />}
                onClick={share.shareImageFile}
              >
                다른 앱으로 보내기
              </Button>
            )}
          </div>
        )}
      </BottomSheet>
    </AppShell>
  )
}

/** A course someone shared: the place and three activities, without their name or other answers. */
export function D1CourseResultPage() {
  const navigate = useNavigate()
  const { code } = useParams()
  const course = parseShareCode(code)

  useEffect(() => {
    window.scrollTo?.(0, 0)
  }, [code])

  if (!course) return <Navigate to={D1_COURSE_PATH} replace />

  return (
    <AppShell
      surface="base"
      contentClassName="d1-course-shell"
      appBar={
        <AppBar
          title="수능 끝 코스"
          leading={
            <IconButton
              label="게임 첫 화면으로"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate(D1_COURSE_PATH)}
            />
          }
          trailing={<ServiceHomeButton />}
        />
      }
    >
      <div className="d1-course-summary">
        <CourseTicket heading="친구의 수능 끝 코스" place={placeText(course.area, null)} activities={course.activities} />

        <section className="d1-course-section">
          <h2>나는 수능 다음 날 뭐 하지?</h2>
          <p className="d1-course-section__note">1분이면 나만의 수능 끝 코스를 짤 수 있어요.</p>
          <Button variant="brand" fullWidth onClick={() => navigate(D1_COURSE_PATH)}>
            나도 코스 짜기
          </Button>
        </section>

        <div className="d1-course-summary__actions">
          <Button variant="tertiary" fullWidth onClick={() => navigate(SERVICE_HOME)}>
            홈 화면으로 돌아가기
          </Button>
        </div>

        <p className="d1-course-disclaimer">친구가 공유한 미니게임 결과예요.</p>
      </div>
    </AppShell>
  )
}
