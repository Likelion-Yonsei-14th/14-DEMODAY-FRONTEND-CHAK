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

/** 장표 한 장. 16:9 틀 안에서 크기에 맞춰 글자가 같이 커진다. 어드민 미리보기와 웹 보기가 함께 쓴다. */
export function PitchSlideView({ slide, page, total }: { slide: PitchSlide; page: number; total: number }) {
  const top = slide.chart ? Math.max(...slide.chart.values, slide.chart.expected, 1) : 1
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
        {slide.stats && (
          <dl className="pslide__stats">
            {slide.stats.map((stat) => (
              <div key={stat.label} className={stat.strong ? 'is-strong' : undefined}>
                <dt>{stat.label}</dt>
                <dd>{stat.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {slide.chart && (
          <div className="pslide__chart" role="img" aria-label={`일 접속자 그래프. ${slide.chart.from}부터 ${slide.chart.to}까지 늘었고, 수능 당일은 ${slide.chart.expected.toLocaleString('ko-KR')}명으로 예상해요.`}>
            <div className="pslide__bars">
              {slide.chart.values.map((value, index, all) => (
                <i key={index} className={index === all.length - 1 ? 'is-now' : undefined} style={{ height: `${(value / top) * 100}%` }} />
              ))}
              <i className="is-forecast" style={{ height: `${(slide.chart.expected / top) * 100}%` }} />
            </div>
            <p className="pslide__axis">
              <span>{slide.chart.from}</span>
              <span>{slide.chart.to}</span>
              <span>수능 당일 예상</span>
            </p>
          </div>
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
