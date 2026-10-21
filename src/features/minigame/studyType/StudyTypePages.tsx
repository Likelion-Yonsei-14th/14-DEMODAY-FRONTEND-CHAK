import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  House,
  RotateCcw,
  Share2,
  Sparkles,
} from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  AppBar,
  BottomSheet,
  Button,
  ChoiceCard,
  IconButton,
  useFeedback,
} from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import { shareOrCopyLink } from '@/lib/shareLink'
import { buildPrototypeShareUrl } from '@/prototype/shareUrl'
import { getCharacterSrc } from './studyTypeCharacters'
import { STUDY_TYPE_PATH, studyTypeResultPath } from './studyTypeRoutes'
import {
  answerQuestion,
  clearSession,
  computeOutcome,
  countAnswered,
  createSession,
  getQuestion,
  goToQuestion,
  isSessionComplete,
  loadSession,
  saveSession,
  type DimensionResult,
  type StudyTypeSession,
} from './studyTypeLogic'
import {
  DIMENSION_COPY,
  findStudyTypeBySlug,
  STUDY_TYPE_RESULTS,
  TRAIT_LABELS,
  type StudyTypeResult,
} from './studyTypeResults'
import type { Trait } from './studyTypeQuestions'
import { downloadBlob, renderShareImage } from './studyTypeShareImage'
import './StudyType.css'

/** Where "back to the service" goes: the entry route picks /home or /start. */
const SERVICE_HOME = '/'

/** Lets the picked card show as selected before the next question slides in. */
const ADVANCE_DELAY_MS = 220

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

export function StudyTypeIntroPage() {
  const navigate = useNavigate()
  const [saved] = useState(loadSession)
  const answered = saved ? countAnswered(saved) : 0
  const completedOutcome =
    saved && isSessionComplete(saved) ? computeOutcome(saved.answers) : null

  const startFresh = () => {
    saveSession(createSession())
    navigate(`${STUDY_TYPE_PATH}/test`)
  }

  return (
    <AppShell
      surface="base"
      contentClassName="study-type-shell"
      appBar={<AppBar title="미니게임" leading={<ServiceHomeButton />} />}
    >
      <div className="study-type-intro">
        <div className="study-type-intro__characters" aria-hidden>
          {(['PSA', 'LFN', 'PFN', 'LSN'] as const).map((code) => (
            <img key={code} src={getCharacterSrc(code)} alt="" />
          ))}
        </div>

        <header className="study-type-intro__header">
          <span className="study-type-tag">수험생 성향 테스트</span>
          <h1>나의 수험생 유형은?</h1>
          <p>
            공부할 때 나는 어떤 타입일까? 질문에 답하며 알아보는 나의 수험생
            유형!
          </p>
        </header>

        <div className="study-type-intro__actions">
          {completedOutcome ? (
            <>
              <Button
                variant="brand"
                fullWidth
                onClick={() =>
                  navigate(studyTypeResultPath(completedOutcome.typeCode))
                }
              >
                내 결과 다시 보기
              </Button>
              <Button
                variant="secondary"
                fullWidth
                leadingIcon={<RotateCcw size={18} aria-hidden />}
                onClick={startFresh}
              >
                다시 테스트하기
              </Button>
            </>
          ) : answered > 0 ? (
            <>
              <Button
                variant="brand"
                fullWidth
                onClick={() => navigate(`${STUDY_TYPE_PATH}/test`)}
              >
                이어서 하기
              </Button>
              <Button
                variant="secondary"
                fullWidth
                leadingIcon={<RotateCcw size={18} aria-hidden />}
                onClick={startFresh}
              >
                처음부터 다시 하기
              </Button>
            </>
          ) : (
            <Button variant="brand" fullWidth onClick={startFresh}>
              테스트 시작
            </Button>
          )}
          <Button
            variant="tertiary"
            fullWidth
            onClick={() => navigate(SERVICE_HOME)}
          >
            홈 화면으로 돌아가기
          </Button>
        </div>

        <p className="study-type-disclaimer">
          재미로 보는 테스트예요. 과학적으로 검증된 성격 검사가 아니니 가볍게
          즐겨 주세요.
        </p>
      </div>
    </AppShell>
  )
}

export function StudyTypeTestPage() {
  const navigate = useNavigate()
  const [session, setSession] = useState<StudyTypeSession>(
    () => loadSession() ?? createSession(),
  )
  const [pendingTrait, setPendingTrait] = useState<Trait | null>(null)
  const advanceTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    saveSession(session)
  }, [session])

  useEffect(() => () => window.clearTimeout(advanceTimer.current), [])

  const total = session.questionOrder.length
  const index = session.currentIndex
  const storedId = session.questionOrder[index]
  const question = storedId ? getQuestion(storedId) : undefined
  const isLast = index === total - 1
  const complete = isSessionComplete(session)
  const answered = countAnswered(session)
  const remaining = total - answered

  if (!question) return <Navigate to={STUDY_TYPE_PATH} replace />

  const questionId = question.id
  const currentAnswer = session.answers[questionId]
  const selected = pendingTrait ?? currentAnswer
  const options = (session.optionOrder[questionId] ?? [0, 1]).map(
    (optionIndex) => question.options[optionIndex],
  )

  const choose = (trait: Trait) => {
    if (pendingTrait) return
    if (isLast) {
      setSession((current) => answerQuestion(current, questionId, trait))
      return
    }
    setPendingTrait(trait)
    advanceTimer.current = window.setTimeout(() => {
      setSession((current) => answerQuestion(current, questionId, trait))
      setPendingTrait(null)
    }, ADVANCE_DELAY_MS)
  }

  const move = (nextIndex: number) => {
    if (pendingTrait) return
    setSession((current) => goToQuestion(current, nextIndex))
  }

  const showResult = () => {
    const outcome = computeOutcome(session.answers)
    if (outcome) {
      navigate(studyTypeResultPath(outcome.typeCode))
      return
    }
    const firstUnanswered = session.questionOrder.findIndex(
      (id) => !session.answers[id],
    )
    move(firstUnanswered)
  }

  return (
    <AppShell
      surface="base"
      contentClassName="study-type-shell"
      appBar={
        <AppBar
          title="나의 수험생 유형은?"
          leading={<ServiceHomeButton />}
        />
      }
    >
      <div className="study-type-test">
        <div className="study-type-progress">
          <p>
            <span>
              <strong>{index + 1}</strong> / {total}번째 문항
            </span>
            <span className="study-type-progress__left">
              {remaining > 0 ? `${remaining}문항 남았어요` : '모두 답했어요'}
            </span>
          </p>
          <div
            className="study-type-progress__track"
            role="progressbar"
            aria-label="답한 문항 수"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={answered}
          >
            <span style={{ width: `${(answered / total) * 100}%` }} />
          </div>
        </div>

        <section
          key={questionId}
          className="study-type-question"
          aria-labelledby="study-type-question-title"
          aria-live="polite"
        >
          <h2 id="study-type-question-title">{question.question}</h2>

          <div className="study-type-question__options">
            {options.map((option) => (
              <ChoiceCard
                key={option.trait}
                title={option.label}
                selected={selected === option.trait}
                onClick={() => choose(option.trait)}
              />
            ))}
          </div>
        </section>

        <nav className="study-type-test__nav" aria-label="질문 이동">
          <Button
            variant="secondary"
            size="m"
            leadingIcon={<ChevronLeft size={18} aria-hidden />}
            disabled={index === 0}
            onClick={() => move(index - 1)}
          >
            이전 질문
          </Button>
          {!isLast && (
            <Button
              variant="tertiary"
              size="m"
              trailingIcon={<ChevronRight size={18} aria-hidden />}
              disabled={!currentAnswer}
              onClick={() => move(index + 1)}
            >
              다음 질문
            </Button>
          )}
        </nav>

        {isLast && (
          <div className="study-type-test__finish">
            <Button
              variant="brand"
              fullWidth
              leadingIcon={<Sparkles size={18} aria-hidden />}
              disabled={!currentAnswer}
              onClick={showResult}
            >
              결과 확인하기
            </Button>
            {currentAnswer && !complete && (
              <p role="status">
                아직 답하지 않은 질문이 있어요. 버튼을 누르면 그 질문으로
                이동해요.
              </p>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}

function RatioBar({ result }: { result: DimensionResult }) {
  const copy = DIMENSION_COPY[result.dimension]
  const [left, right] = result.traits
  const winnerIsLeft = result.winner === left

  return (
    <li className="study-type-ratio">
      <div className="study-type-ratio__head">
        <strong>{copy.title}</strong>
      </div>
      <div className="study-type-ratio__labels">
        <span className={winnerIsLeft ? 'is-winner' : ''}>
          {TRAIT_LABELS[left]} {result.percents[0]}%
        </span>
        <span className={winnerIsLeft ? '' : 'is-winner'}>
          {TRAIT_LABELS[right]} {result.percents[1]}%
        </span>
      </div>
      <div
        className="study-type-ratio__track"
        role="img"
        aria-label={`${TRAIT_LABELS[left]} ${result.percents[0]}%, ${TRAIT_LABELS[right]} ${result.percents[1]}%`}
      >
        <span style={{ width: `${result.percents[0]}%` }} />
      </div>
      <p>{result.balanced ? copy.balanced : copy.lean[result.winner]}</p>
    </li>
  )
}

function useShareActions(result: StudyTypeResult) {
  const { showToast } = useFeedback()
  const [image, setImage] = useState<{ blob: Blob; url: string } | null>(null)
  const [rendering, setRendering] = useState(false)

  useEffect(
    () => () => {
      if (image) URL.revokeObjectURL(image.url)
    },
    [image],
  )

  const resultUrl = buildPrototypeShareUrl(studyTypeResultPath(result.typeCode))
  const testUrl = buildPrototypeShareUrl(STUDY_TYPE_PATH)
  const fileName = `수험생유형_${result.typeName.replace(/\s+/g, '_')}.png`

  const shareLink = () =>
    shareOrCopyLink(
      resultUrl,
      showToast,
      '결과 링크를 복사했어요. 친구에게 붙여넣어 보내세요.',
    )

  const createImage = async () => {
    if (rendering) return
    setRendering(true)
    try {
      const blob = await renderShareImage(result, testUrl)
      setImage({ blob, url: URL.createObjectURL(blob) })
    } catch {
      showToast('이미지를 만들지 못했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setRendering(false)
    }
  }

  return {
    shareLink,
    createImage,
    rendering,
    image,
    closeImage: () => setImage(null),
    downloadImage: () => image && downloadBlob(image.blob, fileName),
  }
}

export function StudyTypeResultPage() {
  const navigate = useNavigate()
  const { slug } = useParams()
  const outcome = useMemo(() => {
    const saved = loadSession()
    return saved ? computeOutcome(saved.answers) : null
  }, [])

  const result = findStudyTypeBySlug(slug)
  if (!result) {
    return <Navigate to={STUDY_TYPE_PATH} replace />
  }

  const isMine = outcome?.typeCode === result.typeCode

  return (
    <StudyTypeResultView
      key={result.typeCode}
      result={result}
      dimensions={isMine ? outcome.dimensions : null}
      onRetry={() => {
        clearSession()
        saveSession(createSession())
        navigate(`${STUDY_TYPE_PATH}/test`)
      }}
    />
  )
}

function StudyTypeResultView({
  result,
  dimensions,
  onRetry,
}: {
  result: StudyTypeResult
  /** Null when viewing someone else's shared result or another type. */
  dimensions: DimensionResult[] | null
  onRetry: () => void
}) {
  const navigate = useNavigate()
  const share = useShareActions(result)
  const mate = STUDY_TYPE_RESULTS[result.compatibleType.typeCode]
  const isMine = dimensions !== null

  useEffect(() => {
    window.scrollTo?.(0, 0)
  }, [result.typeCode])

  return (
    <AppShell
      surface="base"
      contentClassName="study-type-shell"
      appBar={
        <AppBar
          title={isMine ? '나의 수험생 유형' : '수험생 유형'}
          leading={
            <IconButton
              label="테스트 첫 화면으로"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate(STUDY_TYPE_PATH)}
            />
          }
          trailing={<ServiceHomeButton />}
        />
      }
    >
      <div className="study-type-result">
        <section
          className="study-type-card"
          style={{ ['--study-type-bg' as string]: result.characterAsset.background }}
        >
          <span className="study-type-card__eyebrow">
            {isMine ? '나의 수험생 유형은' : '이 유형은'}
          </span>
          <img
            className="study-type-card__character"
            src={getCharacterSrc(result.typeCode)}
            alt={result.characterAsset.alt}
          />
          <h1>{result.typeName}</h1>
          <p className="study-type-card__tagline">“{result.tagline}”</p>
          <p className="study-type-card__description">{result.description}</p>
        </section>

        {!isMine && (
          <section className="study-type-section study-type-cta">
            <h2>나는 어떤 유형일까?</h2>
            <p>질문에 답하고 나의 수험생 유형을 알아보세요.</p>
            <Button
              variant="brand"
              fullWidth
              onClick={() => navigate(STUDY_TYPE_PATH)}
            >
              나도 테스트하기
            </Button>
          </section>
        )}

        {dimensions && (
          <section className="study-type-section">
            <h2>나의 공부 성향</h2>
            <p className="study-type-section__note">
              이번 테스트에서 고른 답의 비율이에요.
            </p>
            <ul className="study-type-ratios">
              {dimensions.map((dimension) => (
                <RatioBar key={dimension.dimension} result={dimension} />
              ))}
            </ul>
          </section>
        )}

        <section className="study-type-section">
          <h2>이런 모습, 나만 그래?</h2>
          <ul className="study-type-checklist">
            {result.relatableMoments.map((moment) => (
              <li key={moment}>{moment}</li>
            ))}
          </ul>
        </section>

        <section className="study-type-section">
          <h2>장점과 주의할 점</h2>
          <div className="study-type-pros-cons">
            <div className="study-type-pros-cons__card study-type-pros-cons__card--pro">
              <h3>이런 점이 좋아요</h3>
              <ul>
                {result.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="study-type-pros-cons__card study-type-pros-cons__card--con">
              <h3>이런 점은 챙겨 봐요</h3>
              <ul>
                {result.cautions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="study-type-section">
          <h2>나에게 맞는 공부 팁</h2>
          <ol className="study-type-tips">
            {result.studyTips.map((tip) => (
              <li key={tip.title}>
                <strong>{tip.title}</strong>
                <p>{tip.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="study-type-section">
          <h2>함께 공부하면 좋은 메이트</h2>
          <div className="study-type-mate">
            <img
              src={getCharacterSrc(mate.typeCode)}
              alt={mate.characterAsset.alt}
            />
            <div>
              <strong>{mate.typeName}</strong>
            </div>
          </div>
          <p className="study-type-mate__text">{result.compatibleType.reason}</p>
          <p className="study-type-mate__text">
            {result.compatibleType.complement}
          </p>
          <button
            type="button"
            className="study-type-link"
            onClick={() => navigate(studyTypeResultPath(mate.typeCode))}
          >
            {mate.typeName} 유형 보기
            <ChevronRight size={16} aria-hidden />
          </button>
        </section>

        <div className="study-type-result__actions">
          {isMine && (
            <>
              <Button
                variant="brand"
                fullWidth
                leadingIcon={<Share2 size={18} aria-hidden />}
                onClick={share.shareLink}
              >
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
            </>
          )}
          {isMine ? (
            <Button
              variant="secondary"
              fullWidth
              leadingIcon={<RotateCcw size={18} aria-hidden />}
              onClick={onRetry}
            >
              다시 테스트하기
            </Button>
          ) : (
            <Button
              variant="brand"
              fullWidth
              onClick={() => navigate(STUDY_TYPE_PATH)}
            >
              나도 테스트하기
            </Button>
          )}
          <Button
            variant="tertiary"
            fullWidth
            onClick={() => navigate(SERVICE_HOME)}
          >
            홈 화면으로 돌아가기
          </Button>
        </div>

        <p className="study-type-disclaimer">
          재미로 보는 테스트예요. 결과와 궁합은 공부 습관을 돌아보는 참고용으로만
          봐 주세요.
        </p>
      </div>

      <BottomSheet
        open={share.image !== null}
        onClose={share.closeImage}
        title="결과 이미지"
        description="저장이 안 되면 이미지를 길게 눌러 저장해 주세요."
      >
        {share.image && (
          <div className="study-type-image-sheet">
            <img
              src={share.image.url}
              alt={`${result.typeName} 결과 이미지`}
            />
            <Button
              variant="primary"
              fullWidth
              leadingIcon={<Download size={18} aria-hidden />}
              onClick={share.downloadImage}
            >
              이미지 다운로드
            </Button>
          </div>
        )}
      </BottomSheet>
    </AppShell>
  )
}
