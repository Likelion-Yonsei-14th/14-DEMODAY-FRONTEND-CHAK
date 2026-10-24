import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PROMOTION_CONTACT } from './promotionContent'
import './promotion.css'

/** 브랜드 담당자가 보는 제안 페이지의 공통 틀. 앱 화면(430px 모바일 틀)과 달리 PC에서도 넓게 보인다. */
export function PromotionLayout({ title, children }: { title: string; children: ReactNode }) {
  useEffect(() => {
    const previous = document.title
    document.title = title
    return () => {
      document.title = previous
    }
  }, [title])

  return (
    <div className="promo">
      <header className="promo-header">
        <Link to="/promotion" className="promo-header__brand" aria-label="착 광고 제휴 제안 처음으로">
          <img src="/assets/brand/chak-mark.svg" alt="" width={32} height={32} />
          <span>수능 응원 앱 착</span>
        </Link>
        <Link to="/promotion/apply" className="promo-btn promo-btn--small">
          상담 신청
        </Link>
      </header>
      {children}
      <footer className="promo-footer">
        <p>{PROMOTION_CONTACT.team}</p>
        <p>
          <a href={`mailto:${PROMOTION_CONTACT.email}`}>{PROMOTION_CONTACT.email}</a>
          {' · '}
          <a href={PROMOTION_CONTACT.instagramUrl} target="_blank" rel="noreferrer">
            인스타그램 {PROMOTION_CONTACT.instagramHandle}
          </a>
        </p>
        <p>
          <Link to="/privacy">개인정보처리방침</Link>
          {' · '}
          <Link to="/terms">이용약관</Link>
        </p>
      </footer>
    </div>
  )
}
