import type { PitchSlide } from './pitchSlides'
import './pitchSlide.css'

/** 장표 한 장. 16:9 틀 안에서 크기에 맞춰 글자가 같이 커진다. 어드민 미리보기와 웹 보기가 함께 쓴다. */
export function PitchSlideView({ slide, page, total }: { slide: PitchSlide; page: number; total: number }) {
  return (
    <article className={`pslide${slide.tone ? ` pslide--${slide.tone}` : ''}`} aria-label={`${page}번 장표: ${slide.title}`}>
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
        {slide.bullets && (
          <ul className="pslide__bullets">
            {slide.bullets.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
      </div>
      <footer className="pslide__foot">
        <span>{slide.note}</span>
        <span>착 CHAK · {page} / {total}</span>
      </footer>
    </article>
  )
}
