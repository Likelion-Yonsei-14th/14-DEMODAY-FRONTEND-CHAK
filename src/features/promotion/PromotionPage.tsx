import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { isApiEnabled } from '@/api/config'
import { fetchVisitorSeries } from '@/api/promotion'
import { PromotionLayout } from './PromotionLayout'
import {
  AD_PACKAGE,
  AD_SPEC_NOTE,
  AD_SPECS_TEXT,
  AD_STAGES,
  DAILY_REASONS_TEXT,
  EXAM_DATE,
  EXTRA_OPTIONS,
  FIT_CATEGORIES,
  FLOW_TEXT,
  HERO_COUPONS,
  MINI_CONTENTS,
  PROCESS_TEXT,
  PROMOTION_CONTACT,
  PROMOTION_DATES,
  promotionStatus,
  SCHEDULE,
  tight,
  VISITOR_SNAPSHOT,
  WHY_NOW_TEXT,
} from './promotionContent'
import { GROWTH_WINDOW_DAYS, shortDate, traction, worthShowing, type VisitorDay } from './promotionForecast'
import { VisitorChart } from './VisitorChart'

/** 리플렛의 빨간 줄이 붙은 작은 꼭지 제목. */
function Label({ children }: { children: ReactNode }) {
  return <p className="promo-label">{children}</p>
}

const count = (value: number) => value.toLocaleString('ko-KR')

/** 접속자 수: 먼저 저장해 둔 값으로 그리고, 서버가 최신 값을 주면 바꾼다. 못 받으면 그대로 둔다. */
function useVisitorDays(): readonly VisitorDay[] {
  const [days, setDays] = useState<readonly VisitorDay[]>(VISITOR_SNAPSHOT)
  useEffect(() => {
    if (!isApiEnabled) return
    let cancelled = false
    fetchVisitorSeries()
      .then((series) => {
        const valid = series.days.filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day.date) && Number.isFinite(day.visitors) && day.visitors >= 0)
        if (!cancelled && valid.length === series.days.length && valid.some((day) => day.visitors > 0)) setDays(valid)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])
  return days
}

export function PromotionPage() {
  const closed = promotionStatus() === 'CLOSED'
  const apply = closed ? (
    <a className="promo-btn" href={`mailto:${PROMOTION_CONTACT.email}`}>메일로 문의하기</a>
  ) : (
    <Link className="promo-btn" to="/promotion/apply">상담 신청하기</Link>
  )
  const days = useVisitorDays()
  const growth = useMemo(() => traction(days, EXAM_DATE), [days])

  return (
    <PromotionLayout title="착 · 수능 시즌 광고·제휴 제안">
      <main>
        <section className="promo-hero">
          <div className="promo-hero__copy">
            <Label>로컬 매장 광고 제휴</Label>
            <h1>
              <span className="promo-nb">수능 전엔</span> <span className="promo-nb">매일 <em>응원</em>을,</span>{' '}
              <span className="promo-nb">수능 후엔</span> <span className="promo-nb"><em>할인</em>을.</span>
            </h1>
            <p className="promo-pill">2026 수능 로컬 매장 파트너 모집</p>
            <p className="promo-hero__text">{tight('수능 끝난 고3이 가장 먼저 여는 수능 응원 앱에서, 우리 동네 수험생에게 매장을 알리세요.')}</p>
            <div className="promo-actions">
              {apply}
              <a className="promo-btn promo-btn--ghost" href="#products">광고 상품 보기</a>
            </div>
            <p className="promo-hero__deadline" aria-live="polite">
              {closed
                ? '이번 시즌 접수는 마감했어요. 다음 시즌 제휴는 메일로 문의해 주세요.'
                : tight(`입금은 ${PROMOTION_DATES.finalDeadline.label}까지 받아요.`)}
            </p>
          </div>
          <figure className="promo-coupons">
            <ul>
              {HERO_COUPONS.map((coupon) => (
                <li key={coupon.title}>
                  <span className="promo-coupons__tag">{coupon.tag}</span>
                  {'shop' in coupon && <small>{coupon.shop}</small>}
                  <strong>{coupon.title}</strong>
                  {'note' in coupon && <small>{tight(coupon.note)}</small>}
                </li>
              ))}
            </ul>
            <figcaption>쿠폰은 예시예요</figcaption>
          </figure>
        </section>

        <section className="promo-section" aria-labelledby="why">
          <Label>문제와 해결</Label>
          <h2 id="why">
            <span className="promo-nb">수험생 프로모션,</span> <span className="promo-nb">수능이 끝난 뒤에</span>{' '}
            <span className="promo-nb">알려도 충분할까요?</span>
          </h2>
          <dl className="promo-why">
            {WHY_NOW_TEXT.map((item) => (
              <div key={item.when}>
                <dt>{item.when}</dt>
                <dd>
                  <strong>{item.title}</strong>
                  {item.body}
                </dd>
              </div>
            ))}
          </dl>
          <h3 className="promo-accent">수험생 할인이 잘 맞는 업종</h3>
          <ul className="promo-chips">
            {FIT_CATEGORIES.map((category) => (
              <li key={category}>{category}</li>
            ))}
          </ul>
          <div className="promo-callout">
            <p className="promo-callout__kicker">CHAK이라면</p>
            <p className="promo-callout__text">
              <span className="promo-nb">수능 전에 알린 우리 매장을,</span> <span className="promo-nb">수능 후의 실제 방문으로.</span>
            </p>
          </div>
        </section>

        <section className="promo-section promo-section--tint" aria-labelledby="flow">
          <Label>수험생 이용 흐름</Label>
          <h2 id="flow">
            <span className="promo-nb">응원은 <em>수능 전</em>,</span> <span className="promo-nb">혜택은 <em>수능 후</em></span>
          </h2>
          <ol className="promo-flow">
            {FLOW_TEXT.map((step, index) => (
              <li key={step.title} className={'highlight' in step ? 'is-key' : undefined}>
                <span className="promo-flow__no">{index + 1}</span>
                <div>
                  <small>{step.when}</small>
                  <strong>{step.title}</strong>
                  <p>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="promo-box">
            <h3>수험생이 착을 매일 찾는 이유</h3>
            <dl className="promo-reasons">
              {DAILY_REASONS_TEXT.map((reason) => (
                <div key={reason.tag}>
                  <dt>{reason.tag}</dt>
                  <dd>
                    <strong>{reason.title}</strong>
                    {reason.body}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <p className="promo-plus">+ 공부 중 쉬어 가는 미니게임 · 선배 응원 콘텐츠</p>
          <p className="promo-note">{MINI_CONTENTS.join(' · ')}</p>
        </section>

        <section className="promo-section" id="products" aria-labelledby="products-title">
          <Label>광고 상품</Label>
          <h2 id="products-title"><em>2단계</em> 광고 패키지</h2>
          <ul className="promo-stages">
            {AD_STAGES.map((item, index) => (
              <li key={item.plan}>
                <p className="promo-stages__badge">
                  <span className={index === 0 ? 'is-first' : undefined}>{item.stage}</span>
                  {item.plan}
                </p>
                <h3>{item.name}</h3>
                <p>{tight(item.body)}</p>
                <ul className="promo-list">
                  {item.points.map((point) => (
                    <li key={point}>{tight(point)}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <div className="promo-callout promo-callout--card">
            <p className="promo-callout__kicker">{AD_PACKAGE.plan}</p>
            <p className="promo-callout__text">{tight(AD_PACKAGE.body)}</p>
          </div>
          <h3>
            노출 옵션 <small>별도 견적</small>
          </h3>
          <ul className="promo-chips">
            {EXTRA_OPTIONS.map((option) => (
              <li key={option}>{option}</li>
            ))}
          </ul>
          <p className="promo-note">{tight('기본 상품은 착 앱 안에서만 노출돼요. 인스타그램 등 외부 노출은 옵션으로 협의해요.')}</p>
          <p className="promo-note">{tight('매장 1곳부터 참여할 수 있어요. 광고 요금은 문의해 주시면 안내해 드려요.')}</p>
        </section>

        <section className="promo-section promo-section--tint" aria-labelledby="local">
          <Label>로컬 매장 제휴</Label>
          <h2 id="local">
            <span className="promo-nb">수능이 끝나면,</span> <span className="promo-nb">우리 매장으로.</span>
          </h2>
          <p>{tight('수험생의 첫 외출에 맞춰 쿠폰을 소개하세요.')}</p>
          {worthShowing(growth) && (
            <div className="promo-traction">
              <p className="promo-accent">실제 일 접속자 · {shortDate(growth.first.date)} – {shortDate(growth.last.date)}</p>
              <p className="promo-traction__lead">
                <strong>{growth.multiple}배</strong>
                <span>
                  <b>{growth.span}일 만에 폭발적 성장</b>
                  일 접속자 {count(growth.first.visitors)}명 → {count(growth.last.visitors)}명
                </span>
              </p>
              <VisitorChart days={days} ahead={growth.forecast} />
              <p className="promo-note">
                {tight(
                  growth.forecast.length > 0
                    ? `막대는 실제 접속자, 점선은 최근 ${GROWTH_WINDOW_DAYS}일의 증가세가 수능 당일까지 이어질 때의 예상치예요. 집계가 없는 날은 비워 뒀어요.`
                    : '막대는 실제 접속자예요. 집계가 없는 날은 비워 뒀어요.',
                )}
              </p>
              {growth.expected !== null && (
                <p className="promo-dau">
                  <span>
                    <b>수능 당일 예상 DAU</b>
                    서비스 일간 활성 이용자 예상치
                  </span>
                  <strong>약 {count(growth.expected)}명</strong>
                </p>
              )}
            </div>
          )}
          <h3>매장 가까이에서 만나요</h3>
          <p>{tight('로컬 매장 인근 고등학교에 착을 홍보하고 있어요.')}</p>
          <p className="promo-accent">지역 수험생에게 우리 가게를 알릴 기회</p>
        </section>

        <section className="promo-section" aria-labelledby="how">
          <Label>참여 방법</Label>
          <h2 id="how">
            <span className="promo-nb">착과 함께할 준비,</span> <span className="promo-nb"><em>3단계</em>면 충분해요</span>
          </h2>
          <ol className="promo-process">
            {PROCESS_TEXT.map((item) => (
              <li key={item.no}>
                <span>{item.no}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="promo-schedule">
            <h3>일정 · 2027학년도 수능 기준</h3>
            <ol>
              {SCHEDULE.map((item) => (
                <li key={item.date}>
                  <strong>{item.date}</strong>
                  <span>{item.note}</span>
                </li>
              ))}
            </ol>
          </div>
          <h3>광고 소재 규격</h3>
          <dl className="promo-specs">
            {AD_SPECS_TEXT.map((row) => (
              <div key={row.slot}>
                <dt>{row.slot}</dt>
                <dd>{row.spec}</dd>
              </div>
            ))}
          </dl>
          <p className="promo-note">{tight(AD_SPEC_NOTE)}</p>
        </section>

        <section className="promo-section promo-cta" aria-labelledby="apply">
          <Label>참여 문의</Label>
          <h2 id="apply">
            <span className="promo-nb">지금 문의하고</span> <span className="promo-nb">이번 수능에 함께해요</span>
          </h2>
          <p>{tight('매장 1곳부터 참여할 수 있어요. 상담을 신청하거나 담당자에게 연락해 주세요.')}</p>
          <div className="promo-actions">{apply}</div>
          <p className="promo-cta__phone">
            <a href={`tel:${PROMOTION_CONTACT.phone}`}>{PROMOTION_CONTACT.phone}</a>
          </p>
          <p className="promo-cta__contact">
            <a href={`mailto:${PROMOTION_CONTACT.email}`}>{PROMOTION_CONTACT.email}</a>
            <br />
            담당 {PROMOTION_CONTACT.manager}
            {' · '}
            <a href={PROMOTION_CONTACT.instagramUrl} target="_blank" rel="noreferrer">
              인스타그램 {PROMOTION_CONTACT.instagramHandle}
            </a>
          </p>
        </section>
      </main>
    </PromotionLayout>
  )
}
