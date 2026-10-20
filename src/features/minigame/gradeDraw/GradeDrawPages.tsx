import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  Dices,
  Download,
  House,
  RotateCcw,
  Share2,
  Sparkles,
} from 'lucide-react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
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
  calculateResultStats,
  countDrawn,
  createGame,
  decodeGrades,
  drawRemainingGrades,
  drawSubjectGrade,
  encodeGrades,
  formatAverage,
  getGrades,
  GRADE_WEIGHTS,
  resetGame,
  restoreGameState,
  saveGameState,
  SUBJECT_COUNT,
  SUBJECTS,
  type Grade,
  type GradeDrawGame,
  type SubjectId,
  type SubjectResult,
} from './gradeDrawLogic'
import {
  determineResultTitle,
  getResultComments,
  type GradeDrawTitle,
} from './gradeDrawResults'
import {
  GRADE_DRAW_PATH,
  GRADE_DRAW_PLAY_PATH,
  gradeDrawResultPath,
} from './gradeDrawRoutes'
import { downloadBlob, generateShareImage } from './gradeDrawShareImage'
import './GradeDraw.css'

/** Where "back to the service" goes: the entry route picks /home or /start. */
const SERVICE_HOME = '/'

/** How long a grade "rolls" before the already-drawn result shows. */
const REVEAL_MS = 800
/** Gap between subjects when the rest are revealed in one go. */
const REVEAL_STAGGER_MS = 160

const DISCLAIMER =
  '본 콘텐츠는 실제 수능 성적 및 대학 합격 가능성과 관계없는 오락용 미니게임입니다.'

const INCOMPLETE_NOTICE = '6과목을 모두 뽑아야 성적표를 볼 수 있어요.'

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

function GradeChip({ grade, revealed = false }: { grade: Grade; revealed?: boolean }) {
  return (
    <span
      className={[
        'grade-draw-chip',
        `grade-draw-chip--${grade}`,
        revealed ? 'is-revealed' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {grade}등급
      {revealed && grade === 1 && (
        <span className="grade-draw-chip__burst" aria-hidden>
          {Array.from({ length: 8 }, (_, index) => (
            <i key={index} />
          ))}
        </span>
      )}
    </span>
  )
}

export function GradeDrawIntroPage() {
  const navigate = useNavigate()
  const [saved] = useState(restoreGameState)
  const drawn = saved?.gameStatus === 'drawing' ? countDrawn(saved) : 0
  const finished = saved?.gameStatus === 'completed' ? saved : null

  const startFresh = () => {
    resetGame()
    navigate(GRADE_DRAW_PLAY_PATH)
  }

  return (
    <AppShell
      surface="base"
      contentClassName="grade-draw-shell"
      appBar={<AppBar title="미니게임" leading={<ServiceHomeButton />} />}
    >
      <div className="grade-draw-intro">
        <div className="grade-draw-intro__art" aria-hidden>
          <span className="grade-draw-intro__card">?</span>
          <span className="grade-draw-intro__card grade-draw-chip--1">1</span>
          <span className="grade-draw-intro__card">?</span>
          <Dices className="grade-draw-intro__dice" size={40} />
        </div>

        <header className="grade-draw-intro__header">
          <span className="grade-draw-tag">과목별 랜덤 등급 뽑기</span>
          <h1>수능 운빨 뽑기</h1>
          <p className="grade-draw-intro__subtitle">공부는 끝났다. 이제 운명에 맡겨라!</p>
          <p>
            국어 1등급, 수학 9등급도 가능한 운명의 수능!
            <br />
            6과목의 등급을 뽑아 나만의 가상 수능 성적표를 완성해 보세요.
            <br />
            오늘 당신의 수능 운은 몇 등급일까요?
          </p>
        </header>

        <div className="grade-draw-intro__actions">
          {finished ? (
            <>
              <Button
                variant="brand"
                fullWidth
                onClick={() => navigate(gradeDrawResultPath(getGrades(finished)))}
              >
                내 성적표 다시 보기
              </Button>
              <Button
                variant="secondary"
                fullWidth
                leadingIcon={<RotateCcw size={18} aria-hidden />}
                onClick={startFresh}
              >
                다시 뽑기
              </Button>
            </>
          ) : drawn > 0 ? (
            <>
              <Button variant="brand" fullWidth onClick={() => navigate(GRADE_DRAW_PLAY_PATH)}>
                이어서 뽑기
              </Button>
              <Button
                variant="secondary"
                fullWidth
                leadingIcon={<RotateCcw size={18} aria-hidden />}
                onClick={startFresh}
              >
                처음부터 다시 뽑기
              </Button>
            </>
          ) : (
            <Button variant="brand" fullWidth onClick={startFresh}>
              게임 시작
            </Button>
          )}
          <Button variant="tertiary" fullWidth onClick={() => navigate(SERVICE_HOME)}>
            홈 화면으로 돌아가기
          </Button>
        </div>

        <details className="grade-draw-odds">
          <summary>등급별 등장 확률 보기</summary>
          <table>
            <thead>
              <tr>
                <th scope="col">등급</th>
                <th scope="col">확률</th>
              </tr>
            </thead>
            <tbody>
              {GRADE_WEIGHTS.map(({ grade, probability }) => (
                <tr key={grade}>
                  <th scope="row">{grade}등급</th>
                  <td>{(probability * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            꾸준히 수능을 준비하는 가상의 수험생 집단을 가정한 게임용 확률이에요.
            실제 수능 등급 분포가 아니며, 모든 과목에 같은 확률을 적용해요.
          </p>
        </details>

        <p className="grade-draw-disclaimer">{DISCLAIMER}</p>
      </div>
    </AppShell>
  )
}

/** Picks up the round in progress, or starts and saves a fresh one. */
function loadOrCreateGame() {
  const saved = restoreGameState()
  if (saved) return saved
  const game = createGame()
  saveGameState(game)
  return game
}

/** Purely visual: cycles 1-9 in order. The real grade is already drawn and saved. */
function RollingGrade() {
  const [face, setFace] = useState(1)

  useEffect(() => {
    const timer = window.setInterval(() => setFace((current) => (current % 9) + 1), 70)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <span className="grade-draw-chip grade-draw-chip--rolling" aria-hidden>
      {face}등급
    </span>
  )
}

export function GradeDrawPlayPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const notice = (location.state as { notice?: string } | null)?.notice
  const [game, setGame] = useState<GradeDrawGame>(loadOrCreateGame)
  const [rolling, setRolling] = useState<SubjectId[]>([])
  const [revealed, setRevealed] = useState<SubjectId[]>([])
  /** Guards a second press in the same tick, before `rolling` re-renders. */
  const busy = useRef(false)
  const timers = useRef<number[]>([])

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer))
    },
    [],
  )

  const drawnCount = countDrawn(game)
  const complete = game.gameStatus === 'completed'
  const animating = rolling.length > 0

  /** Shows results that are already saved; nothing here draws again. */
  const reveal = (ids: SubjectId[]) => {
    if (ids.length === 0 || prefersReducedMotion()) {
      setRevealed(ids)
      busy.current = false
      return
    }
    setRolling(ids)
    setRevealed([])
    ids.forEach((id, index) => {
      const timer = window.setTimeout(() => {
        setRolling((current) => current.filter((rollingId) => rollingId !== id))
        setRevealed((current) => [...current, id])
        if (index === ids.length - 1) busy.current = false
      }, REVEAL_MS + index * REVEAL_STAGGER_MS)
      timers.current.push(timer)
    })
  }

  const commit = (next: GradeDrawGame, ids: SubjectId[]) => {
    saveGameState(next)
    setGame(next)
    reveal(ids)
  }

  const drawOne = (subjectId: SubjectId) => {
    if (busy.current) return
    const next = drawSubjectGrade(game, subjectId)
    if (next === game) return
    busy.current = true
    commit(next, [subjectId])
  }

  const drawRest = () => {
    if (busy.current) return
    const ids = game.subjects.filter((subject) => !subject.isDrawn).map((s) => s.subjectId)
    const next = drawRemainingGrades(game)
    if (next === game) return
    busy.current = true
    commit(next, ids)
  }

  return (
    <AppShell
      surface="base"
      contentClassName="grade-draw-shell"
      appBar={<AppBar title="수능 운빨 뽑기" leading={<ServiceHomeButton />} />}
      fixedAction={
        <div className="grade-draw-actions-bar">
          {complete && !animating ? (
            <Button
              variant="brand"
              fullWidth
              leadingIcon={<Sparkles size={18} aria-hidden />}
              onClick={() => navigate(gradeDrawResultPath(getGrades(game)))}
            >
              가상 성적표 보기
            </Button>
          ) : (
            <Button
              variant="brand"
              fullWidth
              leadingIcon={<Dices size={18} aria-hidden />}
              loading={animating}
              disabled={complete}
              onClick={drawRest}
            >
              남은 과목 한 번에 뽑기
            </Button>
          )}
        </div>
      }
    >
      <div className="grade-draw-play">
        {notice && !complete && (
          <p className="grade-draw-notice" role="status">
            {notice}
          </p>
        )}

        <div className="grade-draw-progress">
          <p>
            <strong>{drawnCount}</strong> / {SUBJECT_COUNT} 과목 완료
          </p>
          <div
            className="grade-draw-progress__track"
            role="progressbar"
            aria-label="뽑은 과목 수"
            aria-valuemin={0}
            aria-valuemax={SUBJECT_COUNT}
            aria-valuenow={drawnCount}
          >
            <span style={{ width: `${(drawnCount / SUBJECT_COUNT) * 100}%` }} />
          </div>
        </div>

        <ul className="grade-draw-subjects" aria-label="과목별 등급">
          {game.subjects.map((subject) => {
            const isRolling = rolling.includes(subject.subjectId)
            return (
              <li key={subject.subjectId} className="grade-draw-subject">
                <span className="grade-draw-subject__name">{subject.subjectName}</span>
                <span className="grade-draw-subject__grade" aria-live="polite">
                  {isRolling ? (
                    <>
                      <RollingGrade />
                      <span className="grade-draw-sr-only">뽑는 중</span>
                    </>
                  ) : subject.grade !== null ? (
                    <GradeChip
                      grade={subject.grade}
                      revealed={revealed.includes(subject.subjectId)}
                    />
                  ) : (
                    <span className="grade-draw-chip grade-draw-chip--hidden">?등급</span>
                  )}
                </span>
                {subject.isDrawn ? (
                  <span className="grade-draw-subject__done">확정</span>
                ) : (
                  <Button
                    variant="secondary"
                    size="m"
                    className="grade-draw-subject__button"
                    disabled={animating}
                    aria-label={`${subject.subjectName} 뽑기`}
                    onClick={() => drawOne(subject.subjectId)}
                  >
                    뽑기
                  </Button>
                )}
              </li>
            )
          })}
        </ul>

        <p className="grade-draw-hint">
          {complete
            ? '6과목이 모두 확정됐어요! 성적표를 확인해 보세요.'
            : '한 번 뽑은 등급은 바꿀 수 없어요.'}
        </p>
      </div>
    </AppShell>
  )
}

/** `/result` with no grades: the viewer's own finished card, or back to drawing. */
export function GradeDrawMyResultPage() {
  const [saved] = useState(restoreGameState)
  if (saved?.gameStatus === 'completed') {
    return <Navigate to={gradeDrawResultPath(getGrades(saved))} replace />
  }
  return <Navigate to={GRADE_DRAW_PLAY_PATH} replace state={{ notice: INCOMPLETE_NOTICE }} />
}

function toSubjects(grades: readonly Grade[]): SubjectResult[] {
  return SUBJECTS.map(({ subjectId, subjectName }, index) => ({
    subjectId,
    subjectName,
    grade: grades[index]!,
    isDrawn: true,
  }))
}

export function GradeDrawResultPage() {
  const navigate = useNavigate()
  const { grades: gradesParam } = useParams()
  // Read only: opening someone's link never touches the viewer's own game.
  const [saved] = useState(restoreGameState)
  const grades = decodeGrades(gradesParam)

  useEffect(() => {
    window.scrollTo?.(0, 0)
  }, [gradesParam])

  if (!grades) return <Navigate to={GRADE_DRAW_PATH} replace />

  const isMine =
    saved?.gameStatus === 'completed' && encodeGrades(getGrades(saved)) === encodeGrades(grades)

  return (
    <GradeDrawResultView
      key={gradesParam}
      grades={grades}
      isMine={isMine}
      onRetry={() => {
        resetGame()
        navigate(GRADE_DRAW_PLAY_PATH)
      }}
    />
  )
}

function useShareActions(subjects: SubjectResult[], grades: Grade[], title: GradeDrawTitle) {
  const { showToast } = useFeedback()
  const [image, setImage] = useState<{ blob: Blob; url: string } | null>(null)
  const [rendering, setRendering] = useState(false)

  useEffect(
    () => () => {
      if (image) URL.revokeObjectURL(image.url)
    },
    [image],
  )

  const resultUrl = buildPrototypeShareUrl(gradeDrawResultPath(grades))
  const playUrl = buildPrototypeShareUrl(GRADE_DRAW_PATH)
  const fileName = `수능운빨뽑기_${encodeGrades(grades)}.png`
  const summary = subjects.map((subject) => `${subject.subjectName} ${subject.grade}`).join(' · ')

  const shareLink = () =>
    shareOrCopyLink(
      {
        title: '수능 운빨 뽑기',
        text: `나의 운빨 수능 성적표: ${summary}. 칭호는 '${title.title}'! 너도 운빨 수능에 도전해 볼래?`,
        url: resultUrl,
      },
      showToast,
      '결과 링크를 복사했어요. 친구에게 붙여넣어 보내세요.',
    )

  const createImage = async () => {
    if (rendering) return
    setRendering(true)
    try {
      const blob = await generateShareImage(subjects, title, playUrl)
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
      await navigator.share({ files: [file], title: '수능 운빨 뽑기' })
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

function GradeDrawResultView({
  grades,
  isMine,
  onRetry,
}: {
  grades: Grade[]
  /** False when viewing a report card someone shared. */
  isMine: boolean
  onRetry: () => void
}) {
  const navigate = useNavigate()
  const subjects = toSubjects(grades)
  const title = determineResultTitle(grades)
  const stats = calculateResultStats(grades)
  const comments = getResultComments(stats)
  const share = useShareActions(subjects, grades, title)

  return (
    <AppShell
      surface="base"
      contentClassName="grade-draw-shell"
      appBar={
        <AppBar
          title={isMine ? '나의 운빨 성적표' : '운빨 성적표'}
          leading={
            <IconButton
              label="게임 첫 화면으로"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate(GRADE_DRAW_PATH)}
            />
          }
          trailing={<ServiceHomeButton />}
        />
      }
    >
      <div className="grade-draw-result">
        <section className="grade-draw-report" aria-labelledby="grade-draw-report-title">
          <header className="grade-draw-report__head">
            <h1 id="grade-draw-report-title">가상 수능 성적표</h1>
            <p>수능 운빨 뽑기 · {isMine ? '나의' : '친구의'} 운빨 성적표</p>
          </header>
          <table className="grade-draw-report__table">
            <thead>
              <tr>
                <th scope="col">과목</th>
                <th scope="col">등급</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject) => (
                <tr key={subject.subjectId}>
                  <th scope="row">{subject.subjectName}</th>
                  <td>
                    <GradeChip grade={subject.grade!} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="grade-draw-report__foot">
            게임으로 뽑은 가상의 결과예요. 실제 성적통지표가 아니에요.
          </p>
        </section>

        <section className={`grade-draw-title grade-draw-title--${title.id}`}>
          <span className="grade-draw-title__eyebrow">특별 칭호</span>
          <h2>{title.title}</h2>
          <p>“{title.quote}”</p>
        </section>

        {!isMine && (
          <section className="grade-draw-section grade-draw-cta">
            <h2>나는 몇 등급이 나올까?</h2>
            <p>6과목의 등급을 뽑아 나만의 가상 성적표를 만들어 보세요.</p>
            <Button variant="brand" fullWidth onClick={() => navigate(GRADE_DRAW_PATH)}>
              나도 뽑아 보기
            </Button>
          </section>
        )}

        <section className="grade-draw-section">
          <h2>결과 분석</h2>
          <dl className="grade-draw-stats">
            <div>
              <dt>1등급 과목</dt>
              <dd>{stats.firstGradeCount}개</dd>
            </div>
            <div>
              <dt>최고 등급</dt>
              <dd>{stats.bestGrade}등급</dd>
            </div>
            <div>
              <dt>최저 등급</dt>
              <dd>{stats.worstGrade}등급</dd>
            </div>
            <div>
              <dt>가상 평균 등급</dt>
              <dd>{formatAverage(stats.averageGrade)}등급</dd>
            </div>
          </dl>
          <ul className="grade-draw-comments">
            {comments.map((comment) => (
              <li key={comment}>{comment}</li>
            ))}
          </ul>
          <p className="grade-draw-section__note">
            가상 평균 등급은 6과목 등급의 단순 산술평균이에요. 실제 대학 입시의
            성적 산출이나 평가와는 관계없어요.
          </p>
        </section>

        <div className="grade-draw-result__actions">
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
              <Button
                variant="secondary"
                fullWidth
                leadingIcon={<RotateCcw size={18} aria-hidden />}
                onClick={onRetry}
              >
                다시 뽑기
              </Button>
            </>
          )}
          <Button variant="tertiary" fullWidth onClick={() => navigate(SERVICE_HOME)}>
            홈 화면으로 돌아가기
          </Button>
        </div>

        <p className="grade-draw-disclaimer">
          {DISCLAIMER}
          {!isMine && ' 친구가 공유한 결과이며 공식 기록이 아니에요.'}
        </p>
      </div>

      <BottomSheet
        open={share.image !== null}
        onClose={share.closeImage}
        title="결과 이미지"
        description="저장이 안 되면 이미지를 길게 눌러 저장해 주세요."
      >
        {share.image && (
          <div className="grade-draw-image-sheet">
            <img src={share.image.url} alt={`${title.title} 가상 성적표 이미지`} />
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
