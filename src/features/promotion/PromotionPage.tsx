import { Link } from 'react-router-dom'
import { PromotionLayout } from './PromotionLayout'
import {
  AD_SPEC_NOTE,
  AD_SPECS_TEXT,
  AFTER_EXAM_TEXT,
  BEFORE_EXAM_TEXT,
  BRAND_COMMON_TEXT,
  BRAND_TIERS,
  CONDITIONS_TEXT,
  DAILY_REASONS_TEXT,
  ENTERPRISE_NOTE,
  formatWon,
  FRANCHISE_SCOPES_TEXT,
  EXTRA_OPTIONS,
  JOINT_BENEFITS,
  LOCAL_PRODUCTS,
  PROCESS_TEXT,
  PROMOTION_CONTACT,
  PROMOTION_DATES,
  promotionStatus,
  SCHEDULE_TEXT,
  tight,
  WHY_NOW_TEXT,
} from './promotionContent'

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

function Bullets({ items }: { items: readonly string[] }) {
  return (
    <ul className="promo-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

export function PromotionPage() {
  const closed = promotionStatus() === 'CLOSED'
  const apply = closed ? (
    <a className="promo-btn" href={`mailto:${PROMOTION_CONTACT.email}`}>메일로 문의하기</a>
  ) : (
    <Link className="promo-btn" to="/promotion/apply">상담 신청하기</Link>
  )

  return (
    <PromotionLayout title="착 · 수능 시즌 광고·제휴 제안">
      <main>
        <section className="promo-hero">
          <p className="promo-kicker">광고·제휴 제안</p>
          <h1>
            <span className="promo-nb">수능 전에는 알리고,</span> <span className="promo-nb">수능 후에는 매장으로</span>
          </h1>
          <p className="promo-hero__text">
            {tight('착은 수능 전에는 수험생에게 브랜드를 자연스럽게 보여 주고, 수능 후에는 혜택을 쓰러 가까운 매장에 가도록 이어 주는 앱이에요.')}
          </p>
          <div className="promo-actions">
            {apply}
            <a className="promo-btn promo-btn--ghost" href="#local">상품과 가격 보기</a>
          </div>
          <p className="promo-hero__deadline" aria-live="polite">
            {closed
              ? '이번 시즌 접수는 마감했어요. 다음 시즌 제휴는 메일로 문의해 주세요.'
              : tight(`회신은 ${PROMOTION_DATES.replyDeadline.label}까지, 입금은 ${PROMOTION_DATES.finalDeadline.label}까지 받아요.`)}
          </p>
        </section>

        <section className="promo-section" aria-labelledby="why">
          <h2 id="why">수능 시즌에 가게와 브랜드가 묻히기 쉬운 이유</h2>
          <dl className="promo-why">
            {WHY_NOW_TEXT.map((item) => (
              <div key={item.when}>
                <dt>{item.when}</dt>
                <dd>{item.body}</dd>
              </div>
            ))}
          </dl>
          <p>{tight('SNS나 포털 같은 일반 광고는 수험생이 아닌 사람에게도 똑같이 보여서, 수험생에게 얼마나 닿았는지 알기 어렵고 효율도 떨어져요.')}</p>
          <h3>착은 보는 사람이 처음부터 정해져 있어요</h3>
          <p>{tight('착은 수험생과 그 친구, 가족만 쓰는 서비스예요. 광고를 보는 사람이 곧 수험생과 주변 지인이라서, 따로 타깃을 맞추지 않아도 원하는 대상에게 노출돼요.')}</p>
          <p>{tight('수험생은 수능 전에 한 달 내내 응원을 열어 보고, 수능이 끝나면 혜택함에서 쿠폰과 가까운 매장으로 이어져요.')}</p>
        </section>

        <section className="promo-section promo-section--tint" aria-labelledby="service">
          <h2 id="service">착은 이런 앱이에요</h2>
          <p>{tight('수험생이 친구와 가족에게 응원을 받아 책상 위에 쌓아 두는 앱이에요. 아래에서 색이 들어간 단계가 광고와 혜택이 보이는 곳이에요.')}</p>
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

        <section className="promo-section" id="local" aria-labelledby="local-title">
          <h2 id="local-title">Local 상품 (매장 1곳)</h2>
          <p>{tight('개별 매장과 소상공인을 위한 상품이에요. A, B, C 중에 하나를 고르시면 돼요. 가격은 1개 매장 기준이에요.')}</p>
          <ul className="promo-products">
            {LOCAL_PRODUCTS.map((product) => (
              <li key={product.id}>
                <div className="promo-products__head">
                  <strong>{product.id}. {product.name}</strong>
                  <span className="promo-products__price">
                    {formatWon(product.price)}
                    <small>VAT 별도</small>
                  </span>
                </div>
                <ul className="promo-list">
                  {product.points.map((point) => (
                    <li key={point}>{tight(point)}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>

        <section className="promo-section promo-section--tint" id="brand" aria-labelledby="brand-title">
          <h2 id="brand-title">Brand 상품 (여러 지점)</h2>
          <p>{tight('프랜차이즈 본사나 여러 지점이 있는 브랜드는 참여하는 지점 수로 가격을 정해요. 아래 내용은 모든 Brand 상품에 들어 있어요.')}</p>
          <Bullets items={BRAND_COMMON_TEXT} />

          <h3>참여 지점 수별 가격</h3>
          <div className="promo-table-wrap">
            <table className="promo-table">
              <thead>
                <tr>
                  <th scope="col">상품</th>
                  <th scope="col">참여 지점</th>
                  <th scope="col">기준가</th>
                  <th scope="col">런칭 파트너가</th>
                </tr>
              </thead>
              <tbody>
                {BRAND_TIERS.map((tier) => (
                  <tr key={tier.id}>
                    <th scope="row">{tier.name}</th>
                    <td>{tight(tier.branches)}</td>
                    {tier.regular === null || tier.launch === null ? (
                      <td colSpan={2}>별도 협의</td>
                    ) : (
                      <>
                        <td>{formatWon(tier.regular)}</td>
                        <td className="promo-table__launch">{formatWon(tier.launch)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="promo-vat">VAT 별도 · 런칭 파트너가는 첫 시즌에 함께하는 초기 파트너에게 적용해요.</p>
          <p>{tight(ENTERPRISE_NOTE)}</p>

          <h3>프랜차이즈 적용 범위</h3>
          <p>{tight('본사와 계약해도 모든 가맹점이 자동으로 들어가지는 않아요. 계약할 때 아래 중에서 적용 범위를 정해요.')}</p>
          <Bullets items={FRANCHISE_SCOPES_TEXT} />
          <p>{tight('수험생에게는 실제로 혜택을 쓸 수 있는 참여 매장만 보이고, 현재 위치에서 가까운 곳부터 추천해요. 전국 브랜드가 서울 매장 20곳만 참여하면 Brand M으로 진행하고, 그 20곳 중 가까운 매장부터 보여 줘요.')}</p>
        </section>

        <section className="promo-section" aria-labelledby="joint">
          <h2 id="joint">공동 프로모션</h2>
          <p>{tight(`광고비를 현금으로만 받지는 않아요. ${JOINT_BENEFITS.join(', ')}처럼 브랜드가 내놓는 혜택도 제휴로 인정해요. 혜택이나 경품이 충분한 규모면 광고비의 일부나 전부를 협의해서 조정할 수 있어요.`)}</p>

          <h3>추가 광고 옵션</h3>
          <p>{tight(`기본 상품 말고 더 노출하고 싶으시면 ${EXTRA_OPTIONS.join(', ')} 같은 옵션을 더할 수 있어요. 기간과 지면에 따라 따로 협의해요.`)}</p>
        </section>

        <section className="promo-section promo-section--tint" aria-labelledby="slots">
          <h2 id="slots">수능 전 광고가 들어가는 자리와 규격</h2>
          <div className="promo-slots">
            <figure>
              <div className="promo-frame promo-frame--modal" aria-hidden>4 : 5</div>
              <figcaption><strong>모달</strong> 수능 전, 응원을 열 때</figcaption>
            </figure>
            <figure>
              <div className="promo-frame promo-frame--banner" aria-hidden>3 : 1</div>
              <figcaption><strong>배너</strong> 응원 카드 사이, 혜택함 위쪽</figcaption>
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
          <h3>진행 조건</h3>
          <ul className="promo-list">
            {CONDITIONS_TEXT.map((condition) => (
              <li key={condition}>{condition}</li>
            ))}
          </ul>
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
          <h2 id="apply">어떤 상품이 맞을지 고민되시면</h2>
          <p>
            {tight(`매장 수와 원하시는 방식만 알려 주시면 같이 정해 드려요. 회신 기한은 ${PROMOTION_DATES.replyDeadline.label}이고, 서비스 기간은 ${PROMOTION_DATES.serviceStart.short}부터 ${PROMOTION_DATES.serviceEnd.short}까지예요. 상담 먼저 받아 보시고 정하셔도 괜찮아요.`)}
          </p>
          <div className="promo-actions">{apply}</div>
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
