import { useEffect, useRef, useState, type CSSProperties } from 'react'
import {
  ArrowLeft,
  Check,
  CloudSun,
  Coffee,
  Crown,
  Download,
  House,
  Medal,
  PencilLine,
  RotateCcw,
  Share2,
  Sprout,
  Target,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  AppBar,
  BottomSheet,
  Button,
  IconButton,
  useFeedback,
} from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import { shareOrCopyLink } from '@/lib/shareLink'
import { buildPrototypeShareUrl } from '@/prototype/shareUrl'
import {
  canSubmit,
  CHOICES,
  classifyMarkingStyle,
  clearGame,
  countMarked,
  createGame,
  EXPECTED_SCORE,
  formatOdds,
  gradeAnswers,
  loadGame,
  markAnswer,
  QUESTION_COUNT,
  saveGame,
  submitGame,
  waysAtLeast,
  waysExactly,
  type Choice,
  type GuessGodGame,
  type MarkingStyle,
} from './guessGodLogic'
import {
  getGuessGodResult,
  parseSharedScore,
  type GuessGodResult,
  type GuessGodTier,
} from './guessGodResults'
import {
  GUESS_GOD_PATH,
  GUESS_GOD_PLAY_PATH,
  guessGodResultPath,
} from './guessGodRoutes'
import { downloadBlob, renderShareImage } from './guessGodShareImage'
import './GuessGod.css'

/** Where "back to the service" goes: the entry route picks /home or /start. */
const SERVICE_HOME = '/'

/** Long enough to read as "grading", short enough not to be in the way. */
const GRADING_MS = 1100

const CIRCLED: Record<Choice, string> = { 1: '①', 2: '②', 3: '③', 4: '④', 5: '⑤' }

const TIER_ICONS: Record<GuessGodTier, LucideIcon> = {
  'day-off': Coffee,
  'off-day': CloudSun,
  rookie: Sprout,
  expert: Target,
  master: Medal,
  legend: Crown,
}

function prefersReducedMotion() {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
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

/** Starts a round with a freshly drawn answer key. */
function startNewGame() {
  clearGame()
  saveGame(createGame())
}

export function GuessGodIntroPage() {
  const navigate = useNavigate()
  const [saved] = useState(loadGame)
  const marked = saved?.gameStatus === 'playing' ? countMarked(saved) : 0
  const finished = saved?.gameStatus === 'submitted' ? saved : null

  const startFresh = () => {
    startNewGame()
    navigate(GUESS_GOD_PLAY_PATH)
  }

  return (
    <AppShell
      surface="base"
      contentClassName="guess-god-shell"
      appBar={<AppBar title="미니게임" leading={<ServiceHomeButton />} />}
    >
      <div className="guess-god-intro">
        <div className="guess-god-intro__art" aria-hidden>
          <div className="guess-god-intro__card">
            {[3, 1, 4, 2].map((filled, row) => (
              <div key={row} className="guess-god-intro__row">
                <span>{row + 1}</span>
                {CHOICES.map((choice) => (
                  <i key={choice} className={choice === filled ? 'is-filled' : ''} />
                ))}
              </div>
            ))}
          </div>
          <PencilLine className="guess-god-intro__pencil" size={46} />
        </div>

        <header className="guess-god-intro__header">
          <span className="guess-god-tag">수능 찍기 실력 테스트</span>
          <h1>오늘의 찍신은 나야!</h1>
          <p className="guess-god-intro__subtitle">나의 수능 찍기 실력은?</p>
          <p>
            문제는 없습니다. 오직 당신의 감만 믿으세요!
            <br />
            10문제를 전부 찍고, 오늘의 찍신력을 확인해 보세요.
          </p>
          <ul className="guess-god-intro__meta" aria-label="게임 정보">
            <li>10문항</li>
          </ul>
        </header>

        <div className="guess-god-intro__actions">
          {finished ? (
            <>
              <Button
                variant="brand"
                fullWidth
                onClick={() => navigate(guessGodResultPath(finished.score ?? 0))}
              >
                내 결과 다시 보기
              </Button>
              <Button
                variant="secondary"
                fullWidth
                leadingIcon={<RotateCcw size={18} aria-hidden />}
                onClick={startFresh}
              >
                다시 도전하기
              </Button>
            </>
          ) : marked > 0 ? (
            <>
              <Button
                variant="brand"
                fullWidth
                onClick={() => navigate(GUESS_GOD_PLAY_PATH)}
              >
                이어서 찍기
              </Button>
              <Button
                variant="secondary"
                fullWidth
                leadingIcon={<RotateCcw size={18} aria-hidden />}
                onClick={startFresh}
              >
                새 정답표로 다시 하기
              </Button>
            </>
          ) : (
            <Button variant="brand" fullWidth onClick={startFresh}>
              게임 시작
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

        <p className="guess-god-disclaimer">
          재미로 즐기는 확률 게임이에요. 실제 시험 실력이나 수능 성적과는 관련이
          없어요.
        </p>
      </div>
    </AppShell>
  )
}

/** Picks up the round in progress, or starts one so the key exists before any mark. */
function loadOrCreateGame() {
  const saved = loadGame()
  if (saved) return saved
  const game = createGame()
  saveGame(game)
  return game
}

export function GuessGodPlayPage() {
  const navigate = useNavigate()
  const [game, setGame] = useState<GuessGodGame>(loadOrCreateGame)
  const [grading, setGrading] = useState(false)
  const submitting = useRef(false)
  const gradingTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(gradingTimer.current), [])

  if (game.gameStatus === 'submitted' && !grading) {
    return <Navigate to={guessGodResultPath(game.score ?? 0)} replace />
  }

  const marked = countMarked(game)
  const remaining = QUESTION_COUNT - marked
  const locked = game.gameStatus !== 'playing'

  const mark = (questionIndex: number, choice: Choice) => {
    if (submitting.current) return
    setGame((current) => {
      const next = markAnswer(current, questionIndex, choice)
      if (next !== current) saveGame(next)
      return next
    })
  }

  const submit = () => {
    if (submitting.current || !canSubmit(game)) return
    submitting.current = true
    const submitted = submitGame(game)
    saveGame(submitted)
    setGame(submitted)
    setGrading(true)
    gradingTimer.current = window.setTimeout(
      () => navigate(guessGodResultPath(submitted.score ?? 0), { replace: true }),
      prefersReducedMotion() ? 0 : GRADING_MS,
    )
  }

  return (
    <AppShell
      surface="base"
      contentClassName="guess-god-shell"
      appBar={<AppBar title="오늘의 찍신은 나야!" leading={<ServiceHomeButton />} />}
      fixedAction={
        <div className="guess-god-submit">
          <p role="status">
            {grading
              ? '채점하고 있어요...'
              : remaining > 0
                ? `아직 ${remaining}문항이 남았어요`
                : '모두 찍었어요! 이제 제출해 볼까요?'}
          </p>
          <Button
            variant="brand"
            fullWidth
            loading={grading}
            disabled={remaining > 0}
            onClick={submit}
          >
            OMR 제출하기
          </Button>
        </div>
      }
    >
      <div className="guess-god-play">
        <div className="guess-god-progress">
          <p>
            <strong>{marked}</strong> / {QUESTION_COUNT} 마킹 완료
          </p>
          <div
            className="guess-god-progress__track"
            role="progressbar"
            aria-label="마킹한 문항 수"
            aria-valuemin={0}
            aria-valuemax={QUESTION_COUNT}
            aria-valuenow={marked}
          >
            <span style={{ width: `${(marked / QUESTION_COUNT) * 100}%` }} />
          </div>
        </div>

        <section
          className={['guess-god-sheet', grading ? 'guess-god-sheet--grading' : '']
            .filter(Boolean)
            .join(' ')}
          aria-label="OMR 답안지"
          aria-busy={grading || undefined}
        >
          <div className="guess-god-sheet__head" aria-hidden>
            <span>문번</span>
            <span>답란</span>
          </div>
          {game.userAnswers.map((current, questionIndex) => (
            <fieldset
              key={questionIndex}
              className="guess-god-row"
              disabled={locked}
            >
              <legend className="guess-god-row__number">
                {questionIndex + 1}
                <span className="guess-god-sr-only">번 문항</span>
              </legend>
              <div className="guess-god-row__bubbles">
                {CHOICES.map((choice) => (
                  <label key={choice} className="guess-god-bubble">
                    <input
                      type="radio"
                      name={`guess-god-q${questionIndex + 1}`}
                      value={choice}
                      checked={current === choice}
                      onChange={() => mark(questionIndex, choice)}
                    />
                    <span className="guess-god-bubble__mark" aria-hidden>
                      {choice}
                    </span>
                    <span className="guess-god-sr-only">{choice}번</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          {grading && (
            <div className="guess-god-sheet__grading" aria-hidden>
              <PencilLine size={30} />
              <span>채점 중</span>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}

function ResultCard({
  result,
  score,
  isMine,
}: {
  result: GuessGodResult
  score: number
  isMine: boolean
}) {
  const Icon = TIER_ICONS[result.tier]

  return (
    <section
      className={`guess-god-card guess-god-card--${result.tier}`}
      style={
        {
          '--guess-god-bg': result.tone.background,
          '--guess-god-accent': result.tone.accent,
        } as CSSProperties
      }
    >
      {result.tier === 'legend' && (
        <div className="guess-god-card__confetti" aria-hidden>
          {Array.from({ length: 12 }, (_, index) => (
            <i key={index} />
          ))}
        </div>
      )}
      <span className="guess-god-card__eyebrow">
        {isMine ? '오늘의 찍기 결과' : '친구의 찍기 결과'}
      </span>
      <span className="guess-god-card__icon" aria-hidden>
        <Icon size={30} />
      </span>
      <p className="guess-god-card__score" aria-hidden>
        <strong>{score}</strong>
        <span> / {QUESTION_COUNT}</span>
      </p>
      <p className="guess-god-card__count">
        {QUESTION_COUNT}문제 중 {score}문제 정답!
      </p>
      <h1>{result.title}</h1>
      <p className="guess-god-card__quote">“{result.quote}”</p>
      <p className="guess-god-card__description">{result.description}</p>
    </section>
  )
}

function GradingTable({ game }: { game: GuessGodGame }) {
  const grades = gradeAnswers(game.answerKey, game.userAnswers)

  return (
    <section className="guess-god-section">
      <h2>OMR 채점 결과</h2>
      <div className="guess-god-table-wrap">
        <table className="guess-god-table" aria-label="OMR 채점 결과">
          <thead>
            <tr>
              <th scope="col">문번</th>
              <th scope="col">내 답</th>
              <th scope="col">정답</th>
              <th scope="col">채점</th>
            </tr>
          </thead>
          <tbody>
            {game.answerKey.map((answer, index) => {
              const mine = game.userAnswers[index]
              const correct = grades[index]
              return (
                <tr key={index} className={correct ? 'is-correct' : 'is-wrong'}>
                  <th scope="row">{index + 1}</th>
                  <td>{mine ? CIRCLED[mine] : '-'}</td>
                  <td>{CIRCLED[answer]}</td>
                  <td>
                    <span className="guess-god-verdict">
                      {correct ? (
                        <Check size={16} strokeWidth={3} aria-hidden />
                      ) : (
                        <X size={16} strokeWidth={3} aria-hidden />
                      )}
                      {correct ? '정답' : '오답'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

const MARKING_STYLE_LABELS: Record<MarkingStyle, string> = {
  'one-line': '한 줄로 찍기',
  spread: '번호 골고루 나눠 찍기',
  mixed: '자유롭게 찍기',
}

/**
 * Odds from 10 questions drawn at random out of the real 2022-2026 CSAT 국어(화법과
 * 작문)·영어 odd-form answer keys. Real keys are balanced across ①-⑤, unlike this
 * game's fully random key, so these are shown as past-exam figures only.
 */
const PAST_EXAM_STRATEGY_ODDS: Array<{
  style: MarkingStyle
  name: string
  example: string
  average: number
  atLeastFour: string
}> = [
  { style: 'one-line', name: '한 줄로 찍기', example: '예: 10문항 모두 ③', average: 2, atLeastFour: '약 9.7%' },
  { style: 'spread', name: '번호 나눠 찍기', example: '예: ①~⑤를 2개씩', average: 2, atLeastFour: '약 12.3%' },
]

function StrategyComparison({ style }: { style: MarkingStyle }) {

  return (
    <div className="guess-god-strategy">
      <h3>한 줄로 찍기 vs 번호 나눠 찍기</h3>
      <p>
        이번 내 찍기 방식: <strong>{MARKING_STYLE_LABELS[style]}</strong>
      </p>
      <div className="guess-god-table-wrap">
        <table className="guess-god-table guess-god-strategy__table" aria-label="찍기 방식별 확률">
          <thead>
            <tr>
              <th scope="col">찍는 방식</th>
              <th scope="col">평균 정답</th>
              <th scope="col">4문항 이상 맞힐 확률</th>
            </tr>
          </thead>
          <tbody>
            {PAST_EXAM_STRATEGY_ODDS.map((row) => (
              <tr key={row.style} className={row.style === style ? 'is-mine' : ''}>
                <th scope="row">
                  {row.name}
                  <small>{row.example}</small>
                </th>
                <td>{row.average}문항</td>
                <td>{row.atLeastFour}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        평균 정답은 2문항으로 같지만, 실제 수능 기출에서는 번호를 나눠 찍었을 때
        4문항 이상 맞힐 확률이 <strong>약 2.6%p 높았어요.</strong>
      </p>
      <p className="guess-god-strategy__note">
        2022~2026학년도 수능 국어·영어 정답표를 기준으로, 10문항을 무작위로
        선택했을 때의 확률이에요. 실제 시험에서 반드시 같은 결과가 나온다는 뜻은
        아니에요.
      </p>
    </div>
  )
}

function LuckAnalysis({ score, game }: { score: number; game: GuessGodGame }) {
  const comparison =
    score > EXPECTED_SCORE
      ? '오늘은 평균보다 높은 결과!'
      : score === EXPECTED_SCORE
        ? '딱 평균만큼 맞혔어요.'
        : '평균보다 조금 아쉽지만, 운은 매일 새로 뽑혀요.'

  return (
    <section className="guess-god-section">
      <h2>오늘의 찍기 운 분석</h2>
      <ul className="guess-god-analysis">
        <li>
          총 {QUESTION_COUNT}문항 중 <strong>{score}문항</strong> 정답
        </li>
        <li>
          무작위로 찍으면 평균 <strong>{EXPECTED_SCORE}문항</strong> 정답 (문항당
          20%)
        </li>
        <li>{comparison}</li>
        <li>
          {score === 0 ? (
            <>
              이론상 10문항을 모두 틀릴 확률은{' '}
              <strong>{formatOdds(waysExactly(0))}</strong>
            </>
          ) : (
            <>
              이론상 {score}문항 이상 맞힐 확률은{' '}
              <strong>{formatOdds(waysAtLeast(score))}</strong>
            </>
          )}
        </li>
      </ul>
      <p className="guess-god-section__note">
        실제 참여자 순위가 아니라, 5지선다를 무작위로 찍었을 때의 수학적
        확률이에요.
      </p>
      <StrategyComparison style={classifyMarkingStyle(game.userAnswers)} />
    </section>
  )
}

function useShareActions(result: GuessGodResult, score: number, game: GuessGodGame | null) {
  const { showToast } = useFeedback()
  const [image, setImage] = useState<{ blob: Blob; url: string } | null>(null)
  const [rendering, setRendering] = useState(false)

  useEffect(
    () => () => {
      if (image) URL.revokeObjectURL(image.url)
    },
    [image],
  )

  const resultUrl = buildPrototypeShareUrl(guessGodResultPath(score))
  const playUrl = buildPrototypeShareUrl(GUESS_GOD_PATH)
  const fileName = `오늘의찍신_${score}점.png`

  const shareLink = () =>
    shareOrCopyLink(
      {
        title: '오늘의 찍신은 나야!',
        text: `${QUESTION_COUNT}문제 중 ${score}문제 정답! 나는 '${result.title}'. 너도 도전해 볼래?`,
        url: resultUrl,
      },
      showToast,
      '결과 링크를 복사했어요. 친구에게 붙여넣어 보내세요.',
    )

  const createImage = async () => {
    if (rendering || !game) return
    setRendering(true)
    try {
      const grades = gradeAnswers(game.answerKey, game.userAnswers)
      const blob = await renderShareImage(result, score, grades, playUrl)
      setImage({ blob, url: URL.createObjectURL(blob) })
    } catch {
      showToast('이미지를 만들지 못했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setRendering(false)
    }
  }

  const file = image ? new File([image.blob], fileName, { type: 'image/png' }) : null
  const canShareFile =
    file !== null &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] })

  const shareImageFile = async () => {
    if (!file) return
    try {
      await navigator.share({ files: [file], title: '오늘의 찍신은 나야!' })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      showToast('공유하지 못했어요. 이미지를 저장한 뒤 직접 보내 주세요.')
    }
  }

  const downloadImage = () => {
    if (!image) return
    try {
      downloadBlob(image.blob, fileName)
    } catch {
      showToast('저장하지 못했어요. 이미지를 길게 눌러 저장해 주세요.')
    }
  }

  return {
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

export function GuessGodResultPage() {
  const navigate = useNavigate()
  const { score: scoreParam } = useParams()
  const [saved] = useState(loadGame)
  const score = parseSharedScore(scoreParam)

  useEffect(() => {
    window.scrollTo?.(0, 0)
  }, [score])

  if (score === null) return <Navigate to={GUESS_GOD_PATH} replace />

  const mine = saved?.gameStatus === 'submitted' && saved.score === score ? saved : null

  return (
    <GuessGodResultView
      key={score}
      score={score}
      game={mine}
      onRetry={() => {
        startNewGame()
        navigate(GUESS_GOD_PLAY_PATH)
      }}
    />
  )
}

function GuessGodResultView({
  score,
  game,
  onRetry,
}: {
  score: number
  /** Null when viewing a result someone shared. */
  game: GuessGodGame | null
  onRetry: () => void
}) {
  const navigate = useNavigate()
  const result = getGuessGodResult(score)
  const share = useShareActions(result, score, game)
  const isMine = game !== null

  return (
    <AppShell
      surface="base"
      contentClassName="guess-god-shell"
      appBar={
        <AppBar
          title={isMine ? '나의 찍기 결과' : '찍기 결과'}
          leading={
            <IconButton
              label="게임 첫 화면으로"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate(GUESS_GOD_PATH)}
            />
          }
          trailing={<ServiceHomeButton />}
        />
      }
    >
      <div className="guess-god-result">
        <ResultCard result={result} score={score} isMine={isMine} />

        {!isMine && (
          <section className="guess-god-section guess-god-cta">
            <h2>나는 몇 문제나 맞힐까?</h2>
            <p>10문제를 감으로 찍고 오늘의 찍신력을 확인해 보세요.</p>
            <Button variant="brand" fullWidth onClick={() => navigate(GUESS_GOD_PATH)}>
              나도 도전하기
            </Button>
          </section>
        )}

        {game && <GradingTable game={game} />}
        {game && <LuckAnalysis score={score} game={game} />}

        <div className="guess-god-result__actions">
          {isMine ? (
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
              <Button
                variant="secondary"
                fullWidth
                leadingIcon={<RotateCcw size={18} aria-hidden />}
                onClick={onRetry}
              >
                다시 도전하기
              </Button>
            </>
          ) : null}
          <Button variant="tertiary" fullWidth onClick={() => navigate(SERVICE_HOME)}>
            홈 화면으로 돌아가기
          </Button>
        </div>

        <p className="guess-god-disclaimer">
          {isMine
            ? '재미로 즐기는 확률 게임이에요. 실제 시험 실력이나 수능 성적과는 관련이 없어요.'
            : '친구가 공유한 미니게임 결과예요. 공식 기록이 아닌 재미로 보는 결과예요.'}
        </p>
      </div>

      <BottomSheet
        open={share.image !== null}
        onClose={share.closeImage}
        title="결과 이미지"
        description="저장이 안 되면 이미지를 길게 눌러 저장해 주세요."
      >
        {share.image && (
          <div className="guess-god-image-sheet">
            <img src={share.image.url} alt={`${result.title} 결과 이미지`} />
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
