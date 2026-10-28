import { Link } from 'react-router-dom'
import { PromotionLayout } from './PromotionLayout'
import { BENEFIT_DATES } from './benefitSurvey'
import { PROMOTION_CONTACT, promotionStatus, tight } from './promotionContent'

/** 신청 첫 화면: 광고 계약 상담을 할지, 혜택 정보를 보내 시안을 받을지 고른다. */
export function PromotionApplyPage() {
  const closed = promotionStatus() === 'CLOSED'

  return (
    <PromotionLayout title="신청하기 · 착">
      <main className="promo-form-page">
        <h1>어떤 신청을 하실까요?</h1>
        <p className="promo-form-page__lead">{tight('광고 구성이 궁금하면 상담을, 이미 함께하기로 했다면 혜택 정보를 보내 시안을 받아 보세요.')}</p>

        {closed ? (
          <p className="promo-error" role="alert">
            이번 시즌 접수는 마감했어요. 다음 시즌 제휴는 <a href={`mailto:${PROMOTION_CONTACT.email}`}>{PROMOTION_CONTACT.email}</a>로 문의해 주세요.
          </p>
        ) : (
          <div className="promo-choices">
            <Link className="promo-choice" to="/promotion/apply/consult">
              <strong>계약 상담 신청하기</strong>
              <span>{tight('어떤 광고가 맞을지 먼저 이야기하고 싶어요. 연락처만 남기면 착 팀이 연락드려요. (약 1분)')}</span>
            </Link>
            <Link className="promo-choice" to="/promotion/apply/benefit">
              <strong>시안 신청하기</strong>
              <span>
                {tight(`수험생에게 드릴 혜택 정보를 보내고 광고 시안을 받아요. ${BENEFIT_DATES.sendBy}까지 보내 주시면 ${BENEFIT_DATES.proposalBy}까지 시안을 보내드려요. (약 3분)`)}
              </span>
            </Link>
          </div>
        )}
      </main>
    </PromotionLayout>
  )
}
