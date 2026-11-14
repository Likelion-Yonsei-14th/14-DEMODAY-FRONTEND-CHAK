import { shortDate, type VisitorDay } from './promotionForecast'

const WIDTH = 640
const HEIGHT = 250
const TOP = 34
const BOTTOM = 212
const SIDE = 10

const count = (value: number) => value.toLocaleString('ko-KR')

/** 날짜별 접속자 막대(실제)와 수능 당일까지의 예상 점선. 숫자는 그래프 아래 글로도 적는다. */
export function VisitorChart({ days, ahead }: { days: readonly VisitorDay[]; ahead: readonly VisitorDay[] }) {
  const all = [...days, ...ahead]
  const top = Math.max(...all.map((day) => day.visitors), 1)
  const slot = (WIDTH - SIDE * 2) / all.length
  const bar = Math.min(slot * 0.72, 30)
  const x = (index: number) => SIDE + slot * index + slot / 2
  const y = (value: number) => BOTTOM - (value / top) * (BOTTOM - TOP)

  const lastIndex = days.reduce((found, day, index) => (day.visitors > 0 ? index : found), 0)
  const first = days[0]
  const last = days[lastIndex]
  const peak = ahead.at(-1)
  const line = [last, ...ahead].map((day, index) => `${x(lastIndex + index)},${y(day?.visitors ?? 0)}`)
  const summary =
    first && last
      ? `일 접속자 그래프. ${shortDate(first.date)} ${count(first.visitors)}명에서 ${shortDate(last.date)} ${count(last.visitors)}명으로 늘었어요.` +
        (peak ? ` ${shortDate(peak.date)} 수능 당일에는 약 ${count(peak.visitors)}명으로 예상해요.` : '')
      : '일 접속자 그래프'

  return (
    <svg className="promo-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={summary}>
      {ahead.length > 0 && (
        <>
          <polygon className="promo-chart__area" points={`${x(lastIndex)},${BOTTOM} ${line.join(' ')} ${x(all.length - 1)},${BOTTOM}`} />
          <polyline className="promo-chart__line" points={line.join(' ')} />
        </>
      )}
      {days.map((day, index) =>
        day.visitors > 0 ? (
          <rect
            key={day.date}
            className={index === lastIndex ? 'promo-chart__bar is-now' : 'promo-chart__bar'}
            x={x(index) - bar / 2}
            y={y(day.visitors)}
            width={bar}
            height={BOTTOM - y(day.visitors)}
            rx={3}
          />
        ) : null,
      )}
      <line className="promo-chart__axis" x1={SIDE} x2={WIDTH - SIDE} y1={BOTTOM} y2={BOTTOM} />
      {first && (
        <>
          <text className="promo-chart__value" x={x(0)} y={y(first.visitors) - 8} textAnchor="middle">{count(first.visitors)}</text>
          <text className="promo-chart__tick" x={x(0)} y={BOTTOM + 20} textAnchor="middle">{shortDate(first.date)}</text>
        </>
      )}
      {last && lastIndex > 0 && (
        <>
          <text className="promo-chart__value is-now" x={x(lastIndex)} y={y(last.visitors) - 8} textAnchor="middle">{count(last.visitors)}</text>
          <text className="promo-chart__tick" x={x(lastIndex)} y={BOTTOM + 20} textAnchor="middle">{shortDate(last.date)}</text>
        </>
      )}
      {peak && (
        <>
          <circle className="promo-chart__dot" cx={x(all.length - 1)} cy={y(peak.visitors)} r={6} />
          <text className="promo-chart__value is-now" x={x(all.length - 1) - 12} y={y(peak.visitors) + 5} textAnchor="end">예상 {count(peak.visitors)}</text>
          <text className="promo-chart__tick is-now" x={x(all.length - 1)} y={BOTTOM + 20} textAnchor="end">{shortDate(peak.date)} 수능</text>
        </>
      )}
    </svg>
  )
}
