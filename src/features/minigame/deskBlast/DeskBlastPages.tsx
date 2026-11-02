import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import {
  BookOpen,
  Candy,
  Coffee,
  Eraser,
  Highlighter,
  House,
  NotebookPen,
  PenLine,
  RotateCcw,
  Share2,
  StickyNote,
  Ticket,
  Timer,
  Download,
  Trophy,
  Moon,
  Sun,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AppBar, Button, IconButton, useFeedback } from '@/design-system'
import {
  createDeskBlastRound,
  fetchDeskBlastLeaderboard,
  submitDeskBlastRound,
  type DeskBlastGrade,
} from '@/api/minigames'
import { AppShell } from '@/layout/AppShell'
import { MinigameLeaderboard } from '../MinigameLeaderboard'
import { DeskBlastBoard, DeskBlastPiece, DragPreview } from './DeskBlastBoard'
import {
  DRAG_LIFT_PX,
  dropTarget,
  tapAnchor,
  useExpiring,
  type ClearEffect,
  type DragState,
} from './deskBlastDrag'
import { formatPlayTime, recordText, type BlastResult } from './deskBlastFormat'
import { ALL_CLEAR_PHRASE, comboPhrase, DESK_CLUTTER, deskTypeLine, deskTypeOf } from './deskBlastCopy'
import {
  BOARD_SIZE,
  canPlace,
  createGame,
  placePiece,
  type GameState,
  type PlaceResult,
} from './deskBlastEngine'
import {
  downloadBlob,
  renderBlastShareImage,
  SHARE_FILE_NAME,
  SHARE_TITLE,
  type ShareCardData,
} from './deskBlastShareImage'
import {
  isMuted,
  playAllClear,
  playClear,
  playComboBreak,
  playGameOver,
  playNewBest,
  playPick,
  playPlace,
  setMuted,
  unlockAudio,
} from './deskBlastSound'
import { readLook, saveLook, type BlastLook } from './deskBlastLook'
import { hasSeenHint, loadBestScore, markHintSeen, saveBestScore } from './deskBlastStorage'
import './DeskBlast.css'

const SERVICE_HOME = '/'
/** A finger must move this far before a press on a piece counts as a drag rather than a tap. */
const DRAG_START_PX = 6
const EFFECT_MS = 700
const FLOATER_MS = 1300
/** Lets the last clear play before the result card covers the desk. */
const RESULT_DELAY_MS = 750

const CLUTTER_ICONS: Record<string, ReactNode> = {
  coffee: <Coffee size={26} />,
  sticky: <StickyNote size={26} />,
  eraser: <Eraser size={24} />,
  timer: <Timer size={26} />,
  highlighter: <Highlighter size={26} />,
  chocolate: <Candy size={24} />,
  pen: <PenLine size={26} />,
  memo: <NotebookPen size={26} />,
  ticket: <Ticket size={26} />,
  workbook: <BookOpen size={28} />,
}

type Floater = { key: number; text: string; kind: 'gain' | 'combo' | 'phrase' | 'allclear' }

function intensityOf(combo: number): 0 | 1 | 2 | 3 {
  if (combo >= 8) return 3
  if (combo >= 5) return 2
  if (combo >= 2) return 1
  return 0
}

function effectLevel(result: PlaceResult): 1 | 2 | 3 {
  const strength = result.combo + (result.lines >= 3 ? 2 : result.lines === 2 ? 1 : 0)
  if (strength >= 6) return 3
  if (strength >= 3) return 2
  return 1
}

function ServiceHomeButton() {
  const navigate = useNavigate()
  return (
    <IconButton label="홈 화면으로 돌아가기" icon={<House size={20} aria-hidden />} onClick={() => navigate(SERVICE_HOME)} />
  )
}

/** The page of the game: starts at once, with a one-line hint the first time only. */
export function DeskBlastPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useFeedback()
  const [game, setGame] = useState<GameState>(() => createGame())
  const gameRef = useRef(game)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [cellPx, setCellPx] = useState(40)
  const [hint, setHint] = useState(() => !hasSeenHint())
  const [effects, addEffect] = useExpiring<ClearEffect>(EFFECT_MS)
  const [floaters, addFloater] = useExpiring<Floater>(FLOATER_MS)
  const [result, setResult] = useState<BlastResult | null>(null)
  const [resultOpen, setResultOpen] = useState(false)
  const [best, setBest] = useState(loadBestScore)
  const [soundOff, setSoundOff] = useState(isMuted)
  const [look, setLook] = useState<BlastLook>(() => readLook(location.search))
  const bestRef = useRef(best)
  const boardRef = useRef<HTMLDivElement | null>(null)
  const dragInfo = useRef<{ slot: number; pointerId: number; startX: number; startY: number; moved: boolean } | null>(null)
  const listeners = useRef<{ move: (e: PointerEvent) => void; up: (e: PointerEvent) => void } | null>(null)
  const startedAt = useRef<number | null>(null)
  const keyCounter = useRef(0)
  const roundId = useRef<string | null>(null)
  const roundToken = useRef(0)
  const resultTimer = useRef<number | undefined>(undefined)
  const [grade, setGrade] = useState<DeskBlastGrade | null>(null)

  const nextKey = () => {
    keyCounter.current += 1
    return keyCounter.current
  }

  const startRound = useCallback(() => {
    roundId.current = null
    const token = roundToken.current
    createDeskBlastRound()
      .then((round) => {
        if (roundToken.current === token) roundId.current = round.roundId
      })
      .catch(() => {
        // Without a round the score still counts on this device; it just is not ranked.
      })
  }, [])

  useEffect(() => {
    startRound()
    return () => {
      window.clearTimeout(resultTimer.current)
      removeListeners()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dismissHint = () => {
    if (!hint) return
    setHint(false)
    markHintSeen()
  }

  function removeListeners() {
    if (!listeners.current) return
    window.removeEventListener('pointermove', listeners.current.move)
    window.removeEventListener('pointerup', listeners.current.up)
    window.removeEventListener('pointercancel', listeners.current.up)
    listeners.current = null
  }

  const finish = useCallback((final: GameState) => {
    const previousBest = bestRef.current
    const score = final.score
    const newBest = score > previousBest
    if (newBest) {
      saveBestScore(score)
      bestRef.current = score
      setBest(score)
    }
    const type = deskTypeOf(score)
    const playMs = startedAt.current === null ? 0 : performance.now() - startedAt.current
    setResult({
      score,
      bestCombo: final.bestCombo,
      lines: final.lines,
      playMs,
      typeName: type.name,
      line: deskTypeLine(type, score),
      newBest,
      previousBest,
    })
    window.clearTimeout(resultTimer.current)
    resultTimer.current = window.setTimeout(() => {
      setResultOpen(true)
      if (newBest) playNewBest()
      else playGameOver()
    }, RESULT_DELAY_MS)

    const id = roundId.current
    roundId.current = null
    if (id) {
      const token = roundToken.current
      submitDeskBlastRound(id, {
        score,
        lines: final.lines,
        bestCombo: final.bestCombo,
        placements: final.placements,
        playMs: Math.round(playMs),
      })
        .then((next) => {
          if (roundToken.current === token) setGrade(next)
        })
        .catch(() => {
          // Not ranked this time; the record on this device is unaffected.
        })
    }
  }, [])

  const place = useCallback(
    (slot: number, row: number, col: number) => {
      const moved = placePiece(gameRef.current, slot, row, col)
      if (!moved) return false
      if (startedAt.current === null) startedAt.current = performance.now()
      const { state, result: outcome } = moved
      gameRef.current = state
      setGame(state)
      setSelected(null)
      dismissHint()

      playPlace(outcome.placedCells)
      navigator.vibrate?.(outcome.lines > 0 ? 18 : 6)
      if (outcome.comboBroken) playComboBreak()
      if (outcome.lines > 0) {
        if (outcome.allClear) playAllClear()
        else playClear(outcome.lines, outcome.combo)
        addEffect({ key: nextKey(), cells: outcome.clearedCells, level: effectLevel(outcome) })
        addFloater({ key: nextKey(), text: `+${outcome.gained.toLocaleString('ko-KR')}`, kind: 'gain' })
        if (outcome.combo >= 2) {
          addFloater({ key: nextKey(), text: `${outcome.combo} COMBO`, kind: 'combo' })
          const phrase = comboPhrase(outcome.combo)
          if (phrase) addFloater({ key: nextKey(), text: phrase, kind: 'phrase' })
        }
        if (outcome.allClear) addFloater({ key: nextKey(), text: ALL_CLEAR_PHRASE, kind: 'allclear' })
      }
      if (state.status === 'over') finish(state)
      return true
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [addEffect, addFloater, finish],
  )

  const restart = () => {
    window.clearTimeout(resultTimer.current)
    roundToken.current += 1
    const fresh = createGame()
    gameRef.current = fresh
    startedAt.current = null
    setGame(fresh)
    setResult(null)
    setResultOpen(false)
    setGrade(null)
    setSelected(null)
    setDrag(null)
    startRound()
  }

  const heldTarget = useCallback((state: DragState) => {
    const piece = gameRef.current.hand[state.slot]
    const rect = boardRef.current?.getBoundingClientRect()
    if (!piece || !rect) return null
    const cell = rect.width / BOARD_SIZE
    const left = state.x - (piece.cols * cell) / 2
    const top = state.y - piece.rows * cell - DRAG_LIFT_PX
    return { piece, ...dropTarget(piece, { left, top }, rect) }
  }, [])

  const onPiecePointerDown = (event: ReactPointerEvent<HTMLButtonElement>, slot: number) => {
    if (gameRef.current.status !== 'playing' || dragInfo.current) return
    unlockAudio()
    playPick()
    const rect = boardRef.current?.getBoundingClientRect()
    if (rect && rect.width > 0) setCellPx(rect.width / BOARD_SIZE)
    dragInfo.current = { slot, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false }
    dismissHint()

    const move = (e: PointerEvent) => {
      const info = dragInfo.current
      if (!info || e.pointerId !== info.pointerId) return
      if (!info.moved && Math.hypot(e.clientX - info.startX, e.clientY - info.startY) < DRAG_START_PX) return
      info.moved = true
      setDrag({ slot: info.slot, x: e.clientX, y: e.clientY })
    }
    const up = (e: PointerEvent) => {
      const info = dragInfo.current
      if (!info || e.pointerId !== info.pointerId) return
      dragInfo.current = null
      removeListeners()
      setDrag(null)
      if (e.type === 'pointercancel') return
      if (!info.moved) {
        setSelected((current) => (current === info.slot ? null : info.slot))
        return
      }
      const target = heldTarget({ slot: info.slot, x: e.clientX, y: e.clientY })
      if (target && canPlace(gameRef.current.board, target.piece, target.row, target.col)) {
        place(info.slot, target.row, target.col)
      }
    }
    listeners.current = { move, up }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  const onCellClick = (row: number, col: number) => {
    unlockAudio()
    if (selected === null) return
    const piece = gameRef.current.hand[selected]
    if (!piece) return
    const anchor = tapAnchor(piece, row, col)
    if (!place(selected, anchor.row, anchor.col)) showToast('그 자리에는 놓을 수 없어요.')
  }

  const held = useMemo(() => {
    if (!drag) return null
    return heldTarget(drag)
  }, [drag, heldTarget])
  const draggedPiece = drag ? game.hand[drag.slot] : null
  const over = game.status === 'over'

  return (
    <AppShell
      surface="base"
      contentClassName="blast-shell"
      shellClassName={`blast-look-${look}`}
      appBar={
        <AppBar
          title="수능 블라스트"
          leading={<ServiceHomeButton />}
          trailing={
            <>
              <IconButton
                label={soundOff ? '효과음 켜기' : '효과음 끄기'}
                aria-pressed={!soundOff}
                icon={soundOff ? <VolumeX size={20} aria-hidden /> : <Volume2 size={20} aria-hidden />}
                onClick={() => {
                  const next = !soundOff
                  setMuted(next)
                  setSoundOff(next)
                  if (!next) {
                    unlockAudio()
                    playPick()
                  }
                }}
              />
              <IconButton
                label={look === 'arcade' ? '라이트 모드로 바꾸기' : '다크 모드로 바꾸기'}
                icon={look === 'arcade' ? <Moon size={20} aria-hidden /> : <Sun size={20} aria-hidden />}
                onClick={() => {
                  const next: BlastLook = look === 'arcade' ? 'objects' : 'arcade'
                  saveLook(next)
                  setLook(next)
                }}
              />
            </>
          }
        />
      }
    >
      <div className="blast-page" data-look={look}>
        <header className="blast-stats" aria-label="현재 기록">
          <div className="blast-stats__score">
            <span className="blast-stats__label">책상정리력</span>
            <strong key={game.score} className="blast-stats__value" data-testid="blast-score">
              {game.score.toLocaleString('ko-KR')}
            </strong>
          </div>
          <div className={`blast-stats__combo${game.combo >= 2 ? ' is-on' : ''}`} aria-live="polite">
            <span className="blast-stats__label">콤보</span>
            <strong data-testid="blast-combo">{game.combo}</strong>
          </div>
          <div className="blast-stats__best">
            <span className="blast-stats__label">
              <Trophy size={12} aria-hidden /> 최고
            </span>
            <strong>{Math.max(best, 0).toLocaleString('ko-KR')}</strong>
          </div>
        </header>

        <div className="blast-desk">
          <div className="blast-clutter" aria-hidden>
            {DESK_CLUTTER.map((item) => (
              <span
                key={item.id}
                className={`blast-clutter__item blast-clutter__item--${item.id}${game.score >= item.clearAt ? ' is-cleared' : ''}`}
                data-testid={`clutter-${item.id}`}
                data-cleared={game.score >= item.clearAt}
              >
                {CLUTTER_ICONS[item.id]}
              </span>
            ))}
          </div>

          <div className="blast-board-wrap">
            <DeskBlastBoard
              board={game.board}
              placed={game.placed}
              held={held}
              effects={effects}
              intensity={intensityOf(game.combo)}
              disabled={over}
              onCellClick={onCellClick}
              boardRef={boardRef}
            />
            <div className="blast-floaters" aria-live="polite">
              {floaters.map((floater) => (
                <span key={floater.key} className={`blast-floater blast-floater--${floater.kind}`}>
                  {floater.text}
                </span>
              ))}
            </div>
            {hint && (
              <button type="button" className="blast-hint" onClick={dismissHint}>
                블록을 책상에 놓고 가로·세로 한 줄을 정리해보세요.
              </button>
            )}
          </div>
        </div>

        <div className="blast-tray" aria-label="놓을 블록">
          {game.hand.map((piece, slot) => (
            <DeskBlastPiece
              key={piece ? piece.id : `empty-${slot}`}
              piece={piece}
              slot={slot}
              selected={selected === slot}
              dragging={drag?.slot === slot}
              disabled={over}
              onPointerDown={onPiecePointerDown}
              onKeyActivate={(index) => {
                unlockAudio()
                playPick()
                setSelected((current) => (current === index ? null : index))
              }}
            />
          ))}
        </div>
        {selected !== null && !drag && <p className="blast-tapnote">책상의 칸을 눌러 놓아요.</p>}
      </div>

      {drag && draggedPiece && <DragPreview piece={draggedPiece} x={drag.x} y={drag.y} cell={cellPx} />}

      {result && resultOpen && (
        <BlastResultSheet
          result={result}
          grade={grade}
          onRestart={restart}
          onHome={() => navigate(SERVICE_HOME)}
        />
      )}
    </AppShell>
  )
}

function BlastResultSheet({
  result,
  grade,
  onRestart,
  onHome,
}: {
  result: BlastResult
  grade: DeskBlastGrade | null
  onRestart: () => void
  onHome: () => void
}) {
  const { showToast } = useFeedback()
  const [image, setImage] = useState<Blob | null>(null)
  const [failed, setFailed] = useState(false)

  // Drawn as soon as the card appears, so Share can run straight from a tap.
  useEffect(() => {
    let cancelled = false
    const data: ShareCardData = {
      score: result.score,
      bestCombo: result.bestCombo,
      lines: result.lines,
      typeName: result.typeName,
      line: result.line,
      newBest: result.newBest,
    }
    renderBlastShareImage(data)
      .then((blob) => {
        if (!cancelled) setImage(blob)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [result])

  const file = useMemo(() => (image ? new File([image], SHARE_FILE_NAME, { type: 'image/png' }) : null), [image])
  const canShareFile = file !== null && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })

  const save = () => {
    if (!image) return
    try {
      downloadBlob(image, SHARE_FILE_NAME)
    } catch {
      showToast('저장하지 못했어요. 잠시 후 다시 시도해 주세요.')
    }
  }

  const share = async () => {
    if (!file) return
    try {
      await navigator.share({ files: [file], title: SHARE_TITLE, text: `책상정리력 ${result.score.toLocaleString('ko-KR')}점, ${result.typeName}! chak.live` })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      showToast('공유하지 못했어요. 이미지를 저장한 뒤 직접 보내 주세요.')
    }
  }

  return (
    <div className="blast-result" role="dialog" aria-modal="true" aria-label="게임 결과">
      <div className="blast-result__card">
        <span className="blast-result__tag">{result.newBest ? '최고 기록!' : '오늘의 책상 정리 끝'}</span>
        <p className="blast-result__type" data-testid="blast-type">
          {result.typeName}
        </p>
        <p className="blast-result__line">“{result.line}”</p>

        <p className="blast-result__score-label">최종 책상정리력</p>
        <p className="blast-result__score" data-testid="blast-final-score">
          {result.score.toLocaleString('ko-KR')}
        </p>
        <p className="blast-result__record">{recordText(result.score, result.previousBest)}</p>

        <dl className="blast-result__stats">
          <div>
            <dt>최고 콤보</dt>
            <dd>{result.bestCombo}콤보</dd>
          </div>
          <div>
            <dt>정리한 줄</dt>
            <dd>{result.lines}줄</dd>
          </div>
          <div>
            <dt>플레이 시간</dt>
            <dd>{formatPlayTime(result.playMs)}</dd>
          </div>
        </dl>

        {grade?.ranked && grade.rank && (
          <p className="blast-result__rank">
            오늘 {grade.rank.daily}위 · 전체 {grade.rank.overall}위
          </p>
        )}

        <div className="blast-result__actions">
          <Button variant="brand" fullWidth onClick={onRestart} leadingIcon={<RotateCcw size={16} aria-hidden />}>
            다시 정리하기
          </Button>
          <div className="blast-result__share">
            <Button variant="secondary" fullWidth onClick={save} disabled={!image} leadingIcon={<Download size={16} aria-hidden />}>
              {failed ? '이미지를 만들지 못했어요' : image ? '이미지 저장' : '이미지 만드는 중...'}
            </Button>
            {canShareFile && (
              <Button variant="secondary" fullWidth onClick={share} leadingIcon={<Share2 size={16} aria-hidden />}>
                공유하기
              </Button>
            )}
          </div>
          <Button variant="tertiary" fullWidth onClick={onHome}>
            홈 화면으로 돌아가기
          </Button>
        </div>

        <MinigameLeaderboard title="책상정리 랭킹" load={fetchDeskBlastLeaderboard} unit="점" />
      </div>
    </div>
  )
}
