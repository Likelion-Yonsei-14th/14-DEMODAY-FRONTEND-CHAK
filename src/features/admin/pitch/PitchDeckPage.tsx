import { useMemo, useState } from 'react'
import { defaultInput, estimate, PITCH_CATEGORIES, won, withCategory, type PitchInput } from './pitchModel'
import { buildSlides, deckFileName } from './pitchSlides'
import './pitch.css'

type NumberKey = { [K in keyof PitchInput]: PitchInput[K] extends number ? K : never }[keyof PitchInput]

const COUNT_FIELDS: readonly { key: NumberKey; label: string; unit: string; step: number }[] = [
  { key: 'visitorsNow', label: '지금 일 접속자', unit: '명', step: 100 },
  { key: 'visitorsExpected', label: '수능 당일 예상 접속자', unit: '명', step: 100 },
  { key: 'spend', label: '객단가', unit: '원', step: 1000 },
  { key: 'revisitCount', label: '재방문 횟수(1년)', unit: '회', step: 1 },
]

const RATE_FIELDS: readonly { key: NumberKey; label: string }[] = [
  { key: 'openRate', label: '혜택함을 여는 비율' },
  { key: 'localRate', label: '매장 근처 수험생 비율' },
  { key: 'conversion', label: '방문 전환율' },
  { key: 'margin', label: '수익률' },
  { key: 'revisitRate', label: '재방문율' },
  { key: 'priceRatio', label: '광고비 ÷ 예상 수익' },
]

/** 매장 이름·위치·업종을 넣으면 그 매장에 맞춘 제휴 제안 장표와 예상 수익, 제안 광고비를 만든다. */
export function PitchDeckPage() {
  const [input, setInput] = useState<PitchInput>(() => defaultInput())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const result = useMemo(() => estimate(input), [input])
  const slides = useMemo(() => buildSlides(input), [input])

  const setNumber = (key: NumberKey, value: number) => setInput((current) => ({ ...current, [key]: Number.isFinite(value) ? value : 0 }))

  const download = async () => {
    setBusy(true)
    setError(null)
    try {
      const { downloadDeck } = await import('./pitchPptx')
      await downloadDeck(slides, deckFileName(input))
    } catch {
      setError('PPT 파일을 만들지 못했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pitch">
      <h1>홍보 PPT 만들기</h1>
      <p className="pitch__lead">매장 정보를 넣으면 그 매장에 맞춘 제안 장표와 예상 수익, 제안 광고비가 만들어져요.</p>

      <form className="pitch-form" onSubmit={(event) => event.preventDefault()}>
        <fieldset>
          <legend>매장 정보</legend>
          <label>
            <span>매장 이름</span>
            <input value={input.storeName} maxLength={30} placeholder="예) 착헤어" onChange={(event) => setInput({ ...input, storeName: event.target.value })} />
          </label>
          <label>
            <span>위치</span>
            <input value={input.location} maxLength={30} placeholder="예) 신촌역" onChange={(event) => setInput({ ...input, location: event.target.value })} />
          </label>
          <label>
            <span>업종</span>
            <select value={input.categoryId} onChange={(event) => setInput(withCategory(input, event.target.value))}>
              {PITCH_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>{category.label}</option>
              ))}
            </select>
          </label>
        </fieldset>

        <fieldset>
          <legend>계산에 쓰는 가정값</legend>
          <p className="pitch-form__hint">업종을 고르면 객단가·수익률·전환율이 그 업종의 기본값으로 바뀌어요. 매장과 상의해 고쳐 쓰세요.</p>
          {COUNT_FIELDS.map((field) => (
            <label key={field.key}>
              <span>{field.label} ({field.unit})</span>
              <input type="number" min={0} step={field.step} value={input[field.key]} onChange={(event) => setNumber(field.key, event.target.valueAsNumber)} />
            </label>
          ))}
          {RATE_FIELDS.map((field) => (
            <label key={field.key}>
              <span>{field.label} (%)</span>
              <input
                type="number"
                min={0}
                max={field.key === 'priceRatio' ? 95 : 100}
                step={0.5}
                value={Math.round(input[field.key] * 1000) / 10}
                onChange={(event) => setNumber(field.key, event.target.valueAsNumber / 100)}
              />
            </label>
          ))}
        </fieldset>
      </form>

      <dl className="pitch-result" aria-label="계산 결과">
        <div><dt>쿠폰 도달</dt><dd>{result.reach.toLocaleString('ko-KR')}명</dd></div>
        <div><dt>예상 방문</dt><dd>{result.visits.toLocaleString('ko-KR')}명</dd></div>
        <div><dt>예상 수익</dt><dd>{won(result.profit)}</dd></div>
        <div className="is-key"><dt>제안 광고비</dt><dd>{won(result.adPrice)}</dd></div>
        <div><dt>1년 추가 기대 수익</dt><dd>{won(result.loyaltyProfit)}</dd></div>
      </dl>
      {result.profit === 0 && <p className="pitch__warn">예상 방문이 0명이라 광고비를 제안할 수 없어요. 가정값을 확인해 주세요.</p>}

      <div className="pitch__actions">
        <button type="button" className="pitch-btn" onClick={download} disabled={busy}>
          {busy ? '만드는 중...' : 'PPT 내려받기'}
        </button>
        {error && <p role="alert" className="pitch__warn">{error}</p>}
      </div>

      <h2>미리보기</h2>
      <ol className="pitch-slides">
        {slides.map((slide, index) => (
          <li key={slide.kicker} className={`pitch-slide${slide.tone ? ` pitch-slide--${slide.tone}` : ''}`} aria-label={`${index + 1}번 장표`}>
            <p className="pitch-slide__kicker">{slide.kicker}</p>
            <h3>{slide.title}</h3>
            {slide.stats && (
              <dl className="pitch-slide__stats">
                {slide.stats.map((stat) => (
                  <div key={stat.label} className={stat.strong ? 'is-strong' : undefined}>
                    <dt>{stat.label}</dt>
                    <dd>{stat.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {slide.bullets && (
              <ul>
                {slide.bullets.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
            {slide.note && <p className="pitch-slide__note">{slide.note}</p>}
          </li>
        ))}
      </ol>
    </div>
  )
}
