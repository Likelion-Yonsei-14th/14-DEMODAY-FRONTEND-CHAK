import { SUBJECTS, type Subject } from './examCareerConfig'
import type { ExamResult } from './examCareerEngine'

const SUBJECT_COLORS: Record<Subject, string> = {
  korean: '#d93a1f',
  math: '#2f6bff',
  english: '#17866f',
  inquiry1: '#7b5cff',
  inquiry2: '#c2306f',
}

const HEIGHT = 168
const PAD = { top: 14, right: 12, bottom: 22, left: 26 }
const STEP = 26

/** Grades over the career: 1 at the top, 9 at the bottom. Retake years are split by dashed lines. */
export function ExamCareerChart({ history }: { history: ExamResult[] }) {
  if (history.length === 0) return null
  const width = Math.max(300, PAD.left + PAD.right + STEP * Math.max(1, history.length - 1))
  const innerHeight = HEIGHT - PAD.top - PAD.bottom
  const x = (index: number) =>
    history.length === 1 ? PAD.left + (width - PAD.left - PAD.right) / 2 : PAD.left + index * STEP
  const y = (grade: number) => PAD.top + ((grade - 1) / 8) * innerHeight
  const path = (values: number[]) =>
    values.map((value, index) => `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)},${y(value).toFixed(1)}`).join(' ')

  const attemptStarts = history.filter((result, index) => index > 0 && result.attempt !== history[index - 1]!.attempt)

  return (
    <figure className="exam-career-chart">
      <div className="exam-career-chart__scroll">
        <svg
          viewBox={`0 0 ${width} ${HEIGHT}`}
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`시험 ${history.length}회 성적 변화 그래프. 마지막 평균 ${history[history.length - 1]!.average}등급`}
        >
          {[1, 3, 5, 7, 9].map((grade) => (
            <g key={grade}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(grade)}
                y2={y(grade)}
                className="exam-career-chart__grid"
              />
              <text x={PAD.left - 8} y={y(grade) + 4} className="exam-career-chart__axis" textAnchor="end">
                {grade}
              </text>
            </g>
          ))}
          {attemptStarts.map((result) => (
            <g key={result.examId}>
              <line
                x1={x(result.index) - STEP / 2}
                x2={x(result.index) - STEP / 2}
                y1={PAD.top - 6}
                y2={HEIGHT - PAD.bottom}
                className="exam-career-chart__divider"
              />
              <text x={x(result.index) - STEP / 2 + 3} y={HEIGHT - 6} className="exam-career-chart__axis">
                {result.yearLabel}
              </text>
            </g>
          ))}
          {SUBJECTS.map((subject) => (
            <path
              key={subject.id}
              d={path(history.map((result) => result.grades[subject.id]))}
              className="exam-career-chart__subject"
              stroke={SUBJECT_COLORS[subject.id]}
            />
          ))}
          <path d={path(history.map((result) => result.average))} className="exam-career-chart__average" />
          {history
            .filter((result) => result.kind === 'csat')
            .map((result) => (
              <circle
                key={result.examId}
                cx={x(result.index)}
                cy={y(result.average)}
                r={5}
                className="exam-career-chart__csat"
              />
            ))}
        </svg>
      </div>
      <figcaption className="exam-career-chart__legend">
        <span>
          <i className="exam-career-chart__swatch exam-career-chart__swatch--average" />
          평균
        </span>
        {SUBJECTS.map((subject) => (
          <span key={subject.id}>
            <i className="exam-career-chart__swatch" style={{ background: SUBJECT_COLORS[subject.id] }} />
            {subject.name}
          </span>
        ))}
        <span>
          <i className="exam-career-chart__swatch exam-career-chart__swatch--csat" />
          수능
        </span>
      </figcaption>
    </figure>
  )
}
