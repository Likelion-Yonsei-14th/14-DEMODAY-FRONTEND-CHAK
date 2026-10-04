import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  ArrowLeft,
  Eraser,
  PencilLine,
} from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  AppBar,
  Button,
  IconButton,
} from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import './Classroom.css'

const chalkColors = [
  { id: 'white', label: '흰색', value: '#FFF8E8' },
  { id: 'yellow', label: '노랑', value: '#F5E28A' },
  { id: 'pink', label: '분홍', value: '#F5B4BF' },
  { id: 'blue', label: '하늘', value: '#B9DDED' },
] as const

export function BlackboardPage() {
  const navigate = useNavigate()
  const { classroomId } = useParams()
  const classroom = usePrototypeStore((state) => state.classroom)
  const member = usePrototypeStore((state) => state.classroomMember)

  if (!member) {
    return (
      <Navigate
        to={`/prototype/classroom/${classroomId ?? classroom.id}/join`}
        replace
      />
    )
  }

  const id = classroomId ?? classroom.id

  return (
    <AppShell
      surface="base"
      contentClassName="blackboard-page-shell"
      appBar={
        <AppBar
          title="우리 칠판"
          subtitle={classroom.name}
          leading={
            <IconButton
              label="교실로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() =>
                navigate(`/prototype/classroom/${id}/map`)
              }
            />
          }
        />
      }
      fixedAction={
        <Button
          variant="brand"
          fullWidth
          leadingIcon={<PencilLine size={18} aria-hidden />}
          onClick={() =>
            navigate(
              `/prototype/classroom/${id}/blackboard/write`,
            )
          }
        >
          칠판에 한마디 남기기
        </Button>
      }
    >
      <main className="blackboard-page">
        <section className="blackboard-board" aria-label="친구들이 함께 쓰는 칠판">
          <div className="blackboard-board__surface">
            {classroom.blackboardEntries.length === 0 ? (
              <p className="blackboard-board__empty">
                첫 응원을 칠판에 남겨보세요.
              </p>
            ) : (
              <div className="blackboard-board__entries">
                {classroom.blackboardEntries.map((entry, index) => (
                  <article
                    className="blackboard-entry"
                    key={entry.id}
                    style={{
                      transform: `rotate(${[-1.5, 1.2, -.5, 1.8][index % 4] ?? 0}deg)`,
                    }}
                  >
                    {entry.drawingDataUrl && (
                      <img
                        src={entry.drawingDataUrl}
                        alt=""
                        className="blackboard-entry__drawing"
                      />
                    )}
                    {entry.text && (
                      <p>{entry.text}</p>
                    )}
                    <span>— {entry.authorName}</span>
                  </article>
                ))}
              </div>
            )}
          </div>
          <div className="blackboard-board__ledge" aria-hidden>
            <span />
            <span />
            <span />
          </div>
        </section>
      </main>
    </AppShell>
  )
}

export function BlackboardWritePage() {
  const navigate = useNavigate()
  const { classroomId } = useParams()
  const classroom = usePrototypeStore((state) => state.classroom)
  const member = usePrototypeStore((state) => state.classroomMember)
  const addBlackboardEntry = usePrototypeStore(
    (state) => state.addBlackboardEntry,
  )
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const [text, setText] = useState('')
  const [color, setColor] = useState<string>(chalkColors[0].value)
  const [hasDrawing, setHasDrawing] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return
    context.lineCap = 'round'
    context.lineJoin = 'round'
  }, [])

  if (!member) {
    return (
      <Navigate
        to={`/prototype/classroom/${classroomId ?? classroom.id}/join`}
        replace
      />
    )
  }

  const id = classroomId ?? classroom.id

  const pointFromEvent = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  const startDrawing = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    const point = pointFromEvent(event)
    if (!point) return

    event.currentTarget.setPointerCapture(event.pointerId)
    drawingRef.current = true
    lastPointRef.current = point
  }

  const draw = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    if (!drawingRef.current) return

    const canvas = canvasRef.current
    const previous = lastPointRef.current
    const point = pointFromEvent(event)
    if (!canvas || !previous || !point) return

    const context = canvas.getContext('2d')
    if (!context) return

    context.strokeStyle = color
    context.lineWidth = 5
    context.beginPath()
    context.moveTo(previous.x, previous.y)
    context.lineTo(point.x, point.y)
    context.stroke()

    lastPointRef.current = point
    setHasDrawing(true)
  }

  const stopDrawing = () => {
    drawingRef.current = false
    lastPointRef.current = null
  }

  const clearDrawing = () => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    context.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawing(false)
  }

  const save = () => {
    if (!text.trim() && !hasDrawing) return

    addBlackboardEntry({
      text,
      drawingDataUrl: hasDrawing
        ? canvasRef.current?.toDataURL('image/png')
        : undefined,
    })
    navigate(`/prototype/classroom/${id}/blackboard`, {
      replace: true,
    })
  }

  return (
    <AppShell
      surface="base"
      contentClassName="blackboard-write-shell"
      appBar={
        <AppBar
          title="칠판에 남기기"
          leading={
            <IconButton
              label="칠판으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() =>
                navigate(`/prototype/classroom/${id}/blackboard`)
              }
            />
          }
        />
      }
      fixedAction={
        <Button
          variant="brand"
          fullWidth
          disabled={!text.trim() && !hasDrawing}
          onClick={save}
        >
          칠판에 남기기
        </Button>
      }
    >
      <main className="blackboard-write">
        <section className="blackboard-write__heading">
          <h1>한마디 쓰거나, 분필처럼 직접 그려보세요.</h1>
        </section>

        <label className="blackboard-write__text-field">
          <span>한마디</span>
          <textarea
            value={text}
            maxLength={80}
            placeholder="우리 반 다 같이 끝까지 가보자!"
            onChange={(event) => setText(event.target.value)}
          />
          <small>{text.length}/80</small>
        </label>

        <section className="blackboard-drawing">
          <header>
            <strong>손으로 그리기</strong>
            <button
              type="button"
              className="blackboard-drawing__clear"
              onClick={clearDrawing}
            >
              <Eraser size={15} aria-hidden />
              지우기
            </button>
          </header>

          <div className="blackboard-drawing__canvas-wrap">
            <canvas
              ref={canvasRef}
              width={640}
              height={420}
              aria-label="손그림을 그리는 칠판"
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerCancel={stopDrawing}
              onPointerLeave={stopDrawing}
            />
          </div>

          <div className="blackboard-drawing__colors" aria-label="분필 색상">
            {chalkColors.map((chalk) => (
              <button
                type="button"
                key={chalk.id}
                className={
                  color === chalk.value
                    ? 'blackboard-chalk blackboard-chalk--selected'
                    : 'blackboard-chalk'
                }
                style={{
                  '--chalk-color': chalk.value,
                } as React.CSSProperties}
                aria-label={chalk.label}
                aria-pressed={color === chalk.value}
                onClick={() => setColor(chalk.value)}
              />
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  )
}
