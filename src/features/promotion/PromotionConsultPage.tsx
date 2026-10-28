import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { submitPromotionInquiry } from '@/api/promotion'
import { PromotionLayout } from './PromotionLayout'
import { INTEREST_OPTIONS, PROMOTION_CONTACT, promotionStatus, tight } from './promotionContent'

type Phase = 'editing' | 'sending' | 'done'

const errorText = (error: unknown) => {
  if (error instanceof ApiError) {
    if (error.status === 429) return '짧은 시간에 너무 많이 보내셨어요. 잠시 뒤에 다시 시도해 주세요.'
    if (error.status === 400) return '입력한 내용을 한 번만 더 확인해 주세요.'
  }
  return `지금은 보내지 못했어요. 잠시 뒤에 다시 시도하시거나 ${PROMOTION_CONTACT.email}로 메일 주세요.`
}

export function PromotionConsultPage() {
  const closed = promotionStatus() === 'CLOSED'
  const [phase, setPhase] = useState<Phase>('editing')
  const [error, setError] = useState<string | null>(null)
  const [company, setCompany] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [interest, setInterest] = useState('')
  const [message, setMessage] = useState('')
  const [consent, setConsent] = useState(false)
  const [website, setWebsite] = useState('')

  const ready = company.trim() && contactName.trim() && email.trim() && consent && phase !== 'sending'

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!ready) return
    setPhase('sending')
    setError(null)
    try {
      await submitPromotionInquiry({ company, contactName, email, phone, interest, message, consent, website })
      setPhase('done')
    } catch (failure) {
      setError(errorText(failure))
      setPhase('editing')
    }
  }

  if (phase === 'done') {
    return (
      <PromotionLayout title="상담 신청을 받았어요 · 착">
        <main className="promo-form-page">
          <div className="promo-done" role="status">
            <h1>상담 신청을 잘 받았어요</h1>
            <p>
              남겨 주신 이메일({email.trim()})로 1~2일 안에 답장드릴게요. 기다리는 동안 궁금한 게 생기면{' '}
              <a href={`mailto:${PROMOTION_CONTACT.email}`}>{PROMOTION_CONTACT.email}</a>로 편하게 메일 주세요.
            </p>
            <Link className="promo-btn" to="/promotion">제안서로 돌아가기</Link>
          </div>
        </main>
      </PromotionLayout>
    )
  }

  return (
    <PromotionLayout title="광고 상담 신청 · 착">
      <main className="promo-form-page">
        <p className="promo-back"><Link to="/promotion/apply">← 신청 종류 다시 고르기</Link></p>
        <h1>계약 상담 신청</h1>
        <p className="promo-form-page__lead">
          {tight('참여 의향만 남겨 주셔도 착 팀이 먼저 연락드려요. 궁금한 점이 있으면 같이 적어 주세요.')}
        </p>

        {closed ? (
          <p className="promo-error" role="alert">
            이번 시즌 접수는 마감했어요. 다음 시즌 제휴는 <a href={`mailto:${PROMOTION_CONTACT.email}`}>{PROMOTION_CONTACT.email}</a>로 문의해 주세요.
          </p>
        ) : (
          <form className="promo-form" onSubmit={submit} noValidate>
            <label>
              <span>브랜드 이름</span>
              <input value={company} onChange={(e) => setCompany(e.target.value)} maxLength={100} autoComplete="organization" required />
            </label>
            <label>
              <span>담당자 이름</span>
              <input value={contactName} onChange={(e) => setContactName(e.target.value)} maxLength={50} autoComplete="name" required />
            </label>
            <label>
              <span>이메일</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={320} autoComplete="email" required />
            </label>
            <label>
              <span>전화번호 <small>(선택)</small></span>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9+\-() ]/g, ''))} maxLength={30} autoComplete="tel" />
            </label>
            <label>
              <span>관심 있는 상품 <small>(선택)</small></span>
              <select value={interest} onChange={(e) => setInterest(e.target.value)}>
                <option value="">아직 정하지 않았어요</option>
                {INTEREST_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span>궁금한 점 <small>(선택)</small></span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
                rows={4}
                placeholder="예) 매장 수와 지역, 원하는 시기, 소재는 언제까지 보내야 하는지"
              />
            </label>

            {/* 자동 입력 프로그램만 채우는 숨은 칸 */}
            <div className="promo-trap" aria-hidden>
              <label>
                웹사이트
                <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </label>
            </div>

            <label className="promo-consent">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>
                상담을 위해 이름과 이메일 등을 받는 데 동의해요. 접수 1년 뒤에 지우고, 자세한 내용은{' '}
                <Link to="/privacy" target="_blank">개인정보처리방침</Link>에 있어요.
              </span>
            </label>

            {error && <p className="promo-error" role="alert">{error}</p>}
            <button type="submit" className="promo-btn" disabled={!ready}>
              {phase === 'sending' ? '보내는 중' : '상담 신청하기'}
            </button>
            <p className="promo-note">
              메일이 편하시면 <a href={`mailto:${PROMOTION_CONTACT.email}`}>{PROMOTION_CONTACT.email}</a>로 바로 보내셔도 돼요.
            </p>
          </form>
        )}
      </main>
    </PromotionLayout>
  )
}
