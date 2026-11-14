import type { PitchScreen, PitchSlide } from './pitchSlides'
import './pitchSlide.css'

export const PITCH_LOGO = '/assets/brand/chak-icon-192.png'
export const PITCH_DESK = '/assets/brand/pitch-desk.jpg'
/** 응원 책상 화면에 놓이는 쪽지 */
export const DESK_NOTES = ['수능 대박!', '넌 할 수 있어', '끝나고 맛있는 거 먹자'] as const

/** 휴대폰 화면 그림. 실제 앱 화면을 단순하게 옮긴 것이다. */
function Screen({ screen }: { screen: PitchScreen }) {
  if (screen.kind === 'desk') {
    return (
      <div className="pphone__screen pphone__screen--desk" style={{ backgroundImage: `url(${PITCH_DESK})` }}>
        {DESK_NOTES.map((note) => (
          <span key={note} className="pphone__note">{note}</span>
        ))}
        <span className="pphone__bar">오늘의 응원 3개 도착</span>
      </div>
    )
  }
  if (screen.kind === 'ad') {
    return (
      <div className="pphone__screen pphone__screen--ad" style={{ backgroundImage: `url(${PITCH_DESK})` }}>
        <div className="pphone__modal">
          <small>광고</small>
          <strong>{screen.store}</strong>
          <span>{screen.place ? `${screen.place} · 수험생 할인` : '수험생 할인'}</span>
          <em>응원 열기</em>
        </div>
      </div>
    )
  }
  return (
    <div className="pphone__screen pphone__screen--coupon">
      <b>혜택함</b>
      <div className="pphone__coupon">
        <small>수험생 쿠폰</small>
        <strong>{screen.store}</strong>
        <span>{screen.category} · 수험생 할인</span>
      </div>
      <i />
      <i />
    </div>
  )
}

const count = (value: number) => value.toLocaleString('ko-KR')

/** 일 접속자 막대(실제)와, 마지막 날에서 수능 당일 예상까지 올라가는 점선 추세선. */
function TrendChart({ chart }: { chart: NonNullable<PitchSlide['chart']> }) {
  const W = 600
  const H = 330
  const TOP = 44
  const BOTTOM = 290
  const SIDE = 8
  const all = [...chart.values, ...chart.ahead]
  const top = Math.max(...all, 1)
  const slot = (W - SIDE * 2) / all.length
  const x = (index: number) => SIDE + slot * index + slot / 2
  const y = (value: number) => BOTTOM - (value / top) * (BOTTOM - TOP)
  const lastIndex = chart.values.length - 1
  const last = chart.values[lastIndex] ?? 0
  const line = [last, ...chart.ahead].map((value, index) => `${x(lastIndex + index)},${y(value)}`).join(' ')
  const peak = chart.ahead.at(-1)
  return (
    <svg
      className="pslide__chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`일 접속자 그래프. ${chart.from} ${count(chart.values[0] ?? 0)}명에서 ${chart.to} ${count(last)}명으로 늘었고, 수능 당일은 ${count(chart.expected)}명으로 예상해요.`}
    >
      {peak !== undefined && (
        <>
          <polygon className="pslide__chart-area" points={`${x(lastIndex)},${BOTTOM} ${line} ${x(all.length - 1)},${BOTTOM}`} />
          <polyline className="pslide__chart-line" points={line} />
        </>
      )}
      {chart.values.map((value, index) =>
        value > 0 ? (
          <rect key={index} className={index === lastIndex ? 'is-now' : undefined} x={x(index) - slot * 0.36} y={y(value)} width={slot * 0.72} height={BOTTOM - y(value)} rx={3} />
        ) : null,
      )}
      <line className="pslide__chart-axis" x1={SIDE} x2={W - SIDE} y1={BOTTOM} y2={BOTTOM} />
      <text x={x(0)} y={y(chart.values[0] ?? 0) - 8} textAnchor="middle">{count(chart.values[0] ?? 0)}</text>
      <text className="is-now" x={x(lastIndex)} y={y(last) - 10} textAnchor="middle">{count(last)}</text>
      <text className="is-tick" x={x(0)} y={BOTTOM + 22} textAnchor="middle">{chart.from}</text>
      <text className="is-tick" x={x(lastIndex)} y={BOTTOM + 22} textAnchor="middle">{chart.to}</text>
      {peak !== undefined && (
        <>
          <circle className="pslide__chart-dot" cx={x(all.length - 1)} cy={y(peak)} r={8} />
          <text className="is-peak" x={x(all.length - 1) - 16} y={y(peak) + 8} textAnchor="end">예상 {count(peak)}</text>
          <text className="is-tick is-now" x={W - SIDE} y={BOTTOM + 22} textAnchor="end">수능 당일</text>
        </>
      )}
    </svg>
  )
}

/** 장표 한 장. 16:9 틀 안에서 크기에 맞춰 글자가 같이 커진다. 어드민 미리보기와 웹 보기가 함께 쓴다. */
export function PitchSlideView({ slide, page, total }: { slide: PitchSlide; page: number; total: number }) {
  const stats = slide.stats && (
    <dl className="pslide__stats">
      {slide.stats.map((stat) => (
        <div key={stat.label} className={stat.strong ? 'is-strong' : undefined}>
          <dt>{stat.label}</dt>
          <dd>{stat.value}</dd>
        </div>
      ))}
    </dl>
  )
  return (
    <article className={`pslide${slide.tone ? ` pslide--${slide.tone}` : ''}`} aria-label={`${page}번 장표: ${slide.title}`}>
      <p className="pslide__brand">
        <img src={PITCH_LOGO} alt="" />
        착 CHAK
      </p>
      <div className="pslide__body">
        <p className="pslide__kicker">{slide.kicker}</p>
        <h3 className="pslide__title">{slide.title}</h3>
        {slide.pill && <p className="pslide__pill">{slide.pill}</p>}
        {slide.chart ? (
          <div className="pslide__split">
            {stats}
            <TrendChart chart={slide.chart} />
          </div>
        ) : (
          stats
        )}
        {slide.phones && (
          <ul className="pslide__phones">
            {slide.phones.map((phone) => (
              <li key={phone.title}>
                <div className="pphone">
                  <Screen screen={phone.screen} />
                </div>
                <div className="pslide__caption">
                  <small>{phone.tag}</small>
                  <strong>{phone.title}</strong>
                  <span>{phone.body}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
        {slide.cards && (
          <ul className="pslide__cards">
            {slide.cards.map((card) => (
              <li key={card.title} className={card.highlight ? 'is-highlight' : undefined}>
                {card.tag && <small>{card.tag}</small>}
                <strong>{card.title}</strong>
                <span>{card.body}</span>
              </li>
            ))}
          </ul>
        )}
        {slide.bullets && (
          <ul className="pslide__bullets">
            {slide.bullets.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
        {slide.steps && (
          <ol className="pslide__steps">
            {slide.steps.map((step) => (
              <li key={step.label}>
                <small>{step.label}</small>
                <strong>{step.value}</strong>
                {step.sub && <span>{step.sub}</span>}
              </li>
            ))}
          </ol>
        )}
        {slide.compare && (
          <div className="pslide__compare">
            <p className="pslide__bar">
              <span>예상 수익</span>
              <i style={{ width: '100%' }} />
              <b>{slide.compare.profit}</b>
            </p>
            <p className="pslide__bar is-price">
              <span>제안 광고비</span>
              <i style={{ width: `${Math.max(slide.compare.ratio * 100, 3)}%` }} />
              <b>{slide.compare.price}</b>
            </p>
            <p className="pslide__summary">{slide.compare.summary}</p>
          </div>
        )}
        {slide.callout && <p className="pslide__callout">{slide.callout}</p>}
      </div>
      {slide.coupon && (
        <div className="pslide__ticket" aria-hidden>
          <span />
          <span />
          <div>
            <small>수험생 쿠폰</small>
            <strong>{slide.coupon.store}</strong>
            <em>{slide.coupon.category} · 수험생 할인</em>
          </div>
        </div>
      )}
      <footer className="pslide__foot">
        <span>{slide.note}</span>
        <span>{page} / {total}</span>
      </footer>
    </article>
  )
}
