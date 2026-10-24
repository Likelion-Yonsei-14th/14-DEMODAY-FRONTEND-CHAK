import { Link } from 'react-router-dom'
import { PromotionLayout } from './PromotionLayout'
import {
  AD_SPEC_NOTE,
  AD_SPECS_TEXT,
  AFTER_EXAM_TEXT,
  BEFORE_EXAM_TEXT,
  CONDITIONS_TEXT,
  DAILY_REASONS_TEXT,
  formatWon,
  PROCESS_TEXT,
  PROMOTION_CONTACT,
  PROMOTION_DATES,
  PROMOTION_PRICE,
  promotionStatus,
  SCHEDULE_TEXT,
  tight,
  WHY_NOW_TEXT,
  type PromotionStatus,
} from './promotionContent'

const DEADLINE_LINE_RAW: Record<PromotionStatus, string> = {
  EARLY_BIRD: `${PROMOTION_DATES.earlyBirdDeadline.label}까지 입금하면 ${formatWon(PROMOTION_PRICE.earlyBird)}(VAT 별도)이고, 회신은 ${PROMOTION_DATES.replyDeadline.label}까지 받아요.`,
  OPEN: `얼리버드는 끝났어요. 정가 ${formatWon(PROMOTION_PRICE.regular)}(VAT 별도)로 ${PROMOTION_DATES.finalDeadline.label}까지 입금을 받아요.`,
  CLOSED: '이번 시즌 접수는 마감했어요. 다음 시즌 제휴는 메일로 문의해 주세요.',
}

const DEADLINE_LINE = Object.fromEntries(
  Object.entries(DEADLINE_LINE_RAW).map(([key, value]) => [key, tight(value)]),
) as Record<PromotionStatus, string>

function Steps({ items, after }: { items: readonly { title: string; body: string; highlight?: boolean }[]; after?: boolean }) {
  return (
    <ol className={`promo-steps${after ? ' promo-steps--after' : ''}`}>
      {items.map((item, index) => (
        <li key={item.title} className={item.highlight ? 'is-ad' : undefined}>
          <span className="promo-steps__no">{(after ? 3 : 0) + index + 1}</span>
          <div>
            <strong>{item.title}</strong>
            <p>{item.body}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

export function PromotionPage() {
  const status = promotionStatus()
  const closed = status === 'CLOSED'
  const price = status === 'EARLY_BIRD' ? PROMOTION_PRICE.earlyBird : PROMOTION_PRICE.regular

  return (
    <PromotionLayout title="착 · 수능 시즌 광고 제휴 제안">
      <main>
        <section className="promo-hero">
          <p className="promo-kicker">광고 제휴 제안</p>
          <h1>
            <span className="promo-nb">수능 끝난 고3이</span> <span className="promo-nb">제일 먼저 여는 앱, 착</span>
          </h1>
          <p className="promo-hero__text">
            {tight('친구와 가족의 응원을 수험생이 매일 열어보는 앱이에요. 수능 전에는 응원을 열 때, 수능이 끝난 뒤에는 혜택함 맨 위에 광고를 실을 수 있어요.')}
          </p>
          <ul className="promo-facts" aria-label="핵심 조건">
            <li>시청 1만&nbsp;회 보장</li>
            <li>업종별 배너 1곳</li>
            <li>쿠폰·매장 운영 없이 노출만</li>
          </ul>
          <div className="promo-actions">
            {closed ? (
              <a className="promo-btn" href={`mailto:${PROMOTION_CONTACT.email}`}>메일로 문의하기</a>
            ) : (
              <Link className="promo-btn" to="/promotion/apply">상담 신청하기</Link>
            )}
            <a className="promo-btn promo-btn--ghost" href="#package">구성과 가격 보기</a>
          </div>
          <p className="promo-hero__deadline" aria-live="polite">{DEADLINE_LINE[status]}</p>
        </section>

        <section className="promo-section" aria-labelledby="why">
          <h2 id="why">수능 시즌에 브랜드가 묻히기 쉬운 이유</h2>
          <dl className="promo-why">
            {WHY_NOW_TEXT.map((item) => (
              <div key={item.when}>
                <dt>{item.when}</dt>
                <dd>{item.body}</dd>
              </div>
            ))}
          </dl>
          <p>{tight('착은 수험생이 한 달 내내 여는 앱이라서, 친구와 가족의 응원이 열릴 때마다 브랜드 광고도 같이 열려요. 수능 다음 날에는 혜택함 맨 위에서 한 번 더 보여 드려요.')}</p>
        </section>

        <section className="promo-section promo-section--tint" aria-labelledby="service">
          <h2 id="service">착은 이런 앱이에요</h2>
          <p>{tight('수험생이 친구와 가족에게 응원을 받아 책상 위에 쌓아 두는 앱이에요. 광고는 이 흐름 안에서 보여요. 아래에서 색이 들어간 단계가 광고가 나오는 곳이에요.')}</p>
          <h3>수능 전, 매일</h3>
          <Steps items={BEFORE_EXAM_TEXT} />
          <h3>수능 다음 날부터 {PROMOTION_DATES.serviceEnd.short}까지</h3>
          <Steps items={AFTER_EXAM_TEXT} after />
          <h3>수험생이 매일 들어오는 이유</h3>
          <ul className="promo-list">
            {DAILY_REASONS_TEXT.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </section>

        <section className="promo-section" id="package" aria-labelledby="package-title">
          <h2 id="package-title">구성과 가격</h2>
          <div className="promo-package">
            <h3>대형 브랜드 패키지 <span>모달 광고 + 배너</span></h3>
            <ul>
              <li>
                <strong>수능 전 광고 모달(B안)</strong>
                <span>{tight('응원을 열 때마다 영상이나 사진 광고가 열려요. 시청 1만 회를 보장해요.')}</span>
              </li>
              <li>
                <strong>배너 2구좌, 업종별 1곳</strong>
                <span>{tight('매일 여는 응원 카드 사이와, 수능 후 혜택함 맨 위에 들어가요.')}</span>
              </li>
            </ul>
            <p className="promo-price">
              {status === 'EARLY_BIRD' && <span className="promo-price__regular">정가 {formatWon(PROMOTION_PRICE.regular)}</span>}
              <strong>{formatWon(price)}</strong>
              <span>{tight(`VAT 별도${status === 'EARLY_BIRD' ? ` · ${PROMOTION_DATES.earlyBirdDeadline.label}까지 입금 시 얼리버드` : ''}`)}</span>
            </p>
          </div>
          <h3>쿠폰 없이 노출만 하는 이유</h3>
          <p>{tight('대형 브랜드는 쿠폰을 쓰게 하는 것보다 수험생이 먼저 떠올리는 브랜드가 되는 게 중요하다고 봤어요. 그래서 혜택함 입점 없이 매일 보이는 모달과 배너만 넣었어요.')}</p>
          <h3>진행 조건</h3>
          <ul className="promo-list">
            {CONDITIONS_TEXT.map((condition) => (
              <li key={condition}>{condition}</li>
            ))}
          </ul>
        </section>

        <section className="promo-section promo-section--tint" aria-labelledby="slots">
          <h2 id="slots">광고가 들어가는 자리와 규격</h2>
          <div className="promo-slots">
            <figure>
              <div className="promo-frame promo-frame--modal" aria-hidden>4 : 5</div>
              <figcaption><strong>모달</strong> 수능 전, 응원을 열 때</figcaption>
            </figure>
            <figure>
              <div className="promo-frame promo-frame--banner" aria-hidden>3 : 1</div>
              <figcaption><strong>배너</strong> 응원 카드 사이, 수능 후 혜택함 맨 위</figcaption>
            </figure>
          </div>
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

        <section className="promo-section" aria-labelledby="how">
          <h2 id="how">진행은 이렇게 해요</h2>
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
          <h3>일정</h3>
          <ol className="promo-timeline">
            {SCHEDULE_TEXT.map((item) => (
              <li key={item.date} className={item.key ? 'is-key' : undefined}>
                <strong>{item.date}</strong>
                <span>{item.note}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="promo-section promo-cta" aria-labelledby="apply">
          <h2 id="apply">참여 의향만 남겨 주셔도 먼저 연락드려요</h2>
          <p>
            {tight(`회신 기한은 ${PROMOTION_DATES.replyDeadline.label}이고, 서비스 기간은 ${PROMOTION_DATES.serviceStart.short}부터 ${PROMOTION_DATES.serviceEnd.short}까지예요. 상담 먼저 받아 보시고 정하셔도 괜찮아요.`)}
          </p>
          <div className="promo-actions">
            {closed ? (
              <a className="promo-btn" href={`mailto:${PROMOTION_CONTACT.email}`}>메일로 문의하기</a>
            ) : (
              <Link className="promo-btn" to="/promotion/apply">상담 신청하기</Link>
            )}
          </div>
          <p className="promo-cta__contact">
            <a href={`mailto:${PROMOTION_CONTACT.email}`}>{PROMOTION_CONTACT.email}</a>
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
