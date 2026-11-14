import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/client'
import { INTEREST_OPTIONS, PROMOTION_DATES, promotionStatus, tight } from './promotionContent'

const api = vi.hoisted(() => ({ submitPromotionInquiry: vi.fn(), fetchVisitorSeries: vi.fn() }))
vi.mock('@/api/promotion', () => api)

import { PromotionApplyPage } from './PromotionApplyPage'
import { PromotionConsultPage } from './PromotionConsultPage'
import { PromotionPage } from './PromotionPage'

const at = (iso: string) => new Date(iso)

/** 화면 글자의 줄바꿈 금지 공백과 단어 결합 기호를 일반 공백으로 보고 찾는다. */
const plain = (pattern: RegExp) => (content: string) => pattern.test(content.replace(/\u00a0/g, ' ').replace(/\u2060/g, ''))

describe('promotion schedule', () => {
  it('stays open until the final payment deadline in Korean time, then closes', () => {
    expect(promotionStatus(at('2026-10-24T03:00:00Z'))).toBe('OPEN')
    expect(promotionStatus(at('2026-11-18T14:59:00Z'))).toBe('OPEN') // 11/18 23:59 KST
    expect(promotionStatus(at('2026-11-18T15:01:00Z'))).toBe('CLOSED')
    expect(PROMOTION_DATES.finalDeadline.short).toBe('11.18')
  })

  it('names the plans the way the leaflet does, without prices, and keeps the server values', () => {
    expect(INTEREST_OPTIONS.map((option) => option.value)).toEqual([
      'LOCAL_A', 'LOCAL_B', 'LOCAL_C', 'BRAND_S', 'BRAND_M', 'BRAND_L', 'ENTERPRISE', 'JOINT', 'OTHER',
    ])
    expect(INTEREST_OPTIONS[0].label).toContain('혜택함 입점')
    expect(INTEREST_OPTIONS[1].label).toContain('응원 화면 광고 모달')
    expect(INTEREST_OPTIONS.some((option) => option.label.includes('만원'))).toBe(false)
  })
})

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/promotion" element={<PromotionPage />} />
        <Route path="/promotion/apply" element={<PromotionApplyPage />} />
        <Route path="/promotion/apply/consult" element={<PromotionConsultPage />} />
        <Route path="/promotion/apply/benefit" element={<p>혜택 시안 신청서</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('tight (mobile line breaks)', () => {
  it('keeps dates, prices, short phrases and particles after parentheses together', () => {
    expect(tight('10월 31일(토)까지')).toBe('10월\u00a031일(토)\u2060까지')
    expect(tight('시청 1만 회를 보장해요')).toContain('1만\u00a0회')
    expect(tight('혜택함 맨 위에')).toBe('혜택함 맨\u00a0위에')
    expect(tight('규격(사이즈, 문구 길이)으로 받아요')).toContain(')\u2060으로')
    expect(tight('수능 전 광고')).toBe('수능\u00a0전 광고')
    expect(tight('2~5개 지점')).toBe('2~5개\u00a0지점')
    expect(tight('세 가지 중')).toBe('세\u00a0가지 중')
  })

  it('does not change what the text says', () => {
    const sample = '11월 12일까지 입금하면 11.9만원(VAT 별도)이고, 수능 후 혜택함 맨 위에 한 번 더 보여 드려요.'
    expect(tight(sample).replace(/\u00a0/g, ' ').replace(/\u2060/g, '')).toBe(sample)
  })
})

describe('promotion page', () => {
  afterEach(() => vi.useRealTimers())

  const open = () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(at('2026-10-25T03:00:00Z'))
  }

  const body = () => (document.body.textContent ?? '').replace(/\u00a0/g, ' ').replace(/\u2060/g, '')

  it('opens with the leaflet cover: cheering before the exam, discounts after', () => {
    open()
    renderAt('/promotion')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('수능 전엔 매일 응원을, 수능 후엔 할인을.')
    expect(screen.getByText('2026 수능 광고 파트너 모집')).toBeInTheDocument()
    expect(body()).toContain('쿠폰은 예시예요')
    expect(body()).toContain('입금은 11월 18일(수)까지 받아요.')
  })

  it('shows the two-stage package: modal first (B), benefit box second (A), both as C', () => {
    open()
    renderAt('/promotion')
    const products = screen.getByRole('region', { name: '2단계 광고 패키지' })
    const names = within(products).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(names.slice(0, 2)).toEqual(['응원 화면 광고 모달', '수험생 혜택함 입점'])
    expect(products).toHaveTextContent('1단계B안')
    expect(products).toHaveTextContent('2단계A안')
    expect(products).toHaveTextContent('C안 · 1+2단계 패키지')
    expect(products).toHaveTextContent('혜택함 상단 우선 노출')
  })

  it('asks to inquire for the price instead of listing one', () => {
    open()
    renderAt('/promotion')
    expect(body()).toContain('매장 1곳부터 참여할 수 있어요')
    expect(body()).not.toContain('만원')
    expect(body()).not.toContain('VAT')
    expect(body()).not.toContain('Brand S')
  })

  it('charts the real daily visitors and the forecast up to the exam day, above 3,000', () => {
    open()
    renderAt('/promotion')
    const local = screen.getByRole('region', { name: '수능이 끝나면, 우리 매장으로.' })
    expect(local).toHaveTextContent('실제 일 접속자 · 10/28 – 11/13')
    expect(local).toHaveTextContent('14배')
    expect(local).toHaveTextContent('일 접속자 131명 → 1,855명')
    const chart = within(local).getByRole('img')
    expect(chart).toHaveAccessibleName(expect.stringContaining('11/19 수능 당일에는 약 3,70'))
    expect(chart.querySelectorAll('.promo-chart__bar')).toHaveLength(16) // 17일 중 집계 없는 11/05 제외
    expect(local).toHaveTextContent('수능 당일 예상 DAU')
    expect(local).toHaveTextContent('약 3,700명')
    expect(local).toHaveTextContent('예상치예요')
  })

  it('lists the three steps and the leaflet schedule', () => {
    open()
    renderAt('/promotion')
    const how = screen.getByRole('region', { name: '착과 함께할 준비, 3단계면 충분해요' })
    for (const phrase of ['참여 의사 전달', '광고 정보 제출', '광고 노출 시작', '수정은 1회까지예요', '11/18최종 입금 마감', '11/19수능 당일 · 마지막 응원', '11/20~30혜택함 오픈']) {
      expect(how).toHaveTextContent(phrase)
    }
    expect(body()).not.toContain('11월 2일')
    expect(body()).not.toContain('11월 12일')
  })

  it('gives the phone, email and person to contact', () => {
    open()
    renderAt('/promotion')
    expect(screen.getByRole('link', { name: '010-3924-4047' })).toHaveAttribute('href', 'tel:010-3924-4047')
    expect(body()).toContain('담당 조민준')
  })

  it('links to the consultation form and lists the ad specs', () => {
    open()
    renderAt('/promotion')
    expect(screen.getAllByRole('link', { name: /상담 신청/ }).length).toBeGreaterThan(0)
    expect(screen.getByText(plain(/1080×1350px · MP4/))).toBeInTheDocument()
    expect(screen.getByText(plain(/1125×375px/))).toBeInTheDocument()
  })

  it('points to email once the season is over', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(at('2026-11-20T03:00:00Z'))
    renderAt('/promotion')
    const main = within(screen.getByRole('main'))
    expect(main.queryByRole('link', { name: /상담 신청/ })).not.toBeInTheDocument()
    expect(main.getAllByRole('link', { name: '메일로 문의하기' }).length).toBeGreaterThan(0)
  })

  it('closes the form after the final deadline and points to email', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(at('2026-11-20T03:00:00Z'))
    renderAt('/promotion/apply')
    expect(screen.getByRole('alert')).toHaveTextContent('접수는 마감했어요')
    expect(screen.queryByRole('button', { name: '상담 신청하기' })).not.toBeInTheDocument()
  })
})

describe('promotion apply chooser', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(at('2026-10-25T03:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('offers a contract consultation and a mockup request', () => {
    renderAt('/promotion/apply')
    expect(screen.getByRole('link', { name: /계약 상담 신청하기/ })).toHaveAttribute('href', '/promotion/apply/consult')
    expect(screen.getByRole('link', { name: /시안 신청하기/ })).toHaveAttribute('href', '/promotion/apply/benefit')
  })

  it('opens the right form from each choice', () => {
    renderAt('/promotion/apply')
    fireEvent.click(screen.getByRole('link', { name: /시안 신청하기/ }))
    expect(screen.getByText('혜택 시안 신청서')).toBeInTheDocument()
  })

  it('offers only email once the season is over', () => {
    vi.setSystemTime(at('2026-11-20T03:00:00Z'))
    renderAt('/promotion/apply')
    expect(screen.queryByRole('link', { name: /시안 신청하기/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /계약 상담 신청하기/ })).not.toBeInTheDocument()
  })
})

describe('promotion consult form', () => {
  beforeEach(() => {
    api.submitPromotionInquiry.mockReset()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(at('2026-10-25T03:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  const fill = () => {
    fireEvent.change(screen.getByRole('textbox', { name: /^브랜드 이름/ }), { target: { value: '착커피' } })
    fireEvent.change(screen.getByRole('textbox', { name: /^담당자 이름/ }), { target: { value: '김담당' } })
    fireEvent.change(screen.getByRole('textbox', { name: /^이메일/ }), { target: { value: 'kim@chakcoffee.com' } })
  }

  it('needs the required fields and the privacy consent before it can be sent', () => {
    renderAt('/promotion/apply/consult')
    const send = screen.getByRole('button', { name: '상담 신청하기' })
    expect(send).toBeDisabled()
    fill()
    expect(send).toBeDisabled()
    fireEvent.click(screen.getByRole('checkbox'))
    expect(send).toBeEnabled()
  })

  it('sends the inquiry and confirms', async () => {
    api.submitPromotionInquiry.mockResolvedValue({ received: true })
    renderAt('/promotion/apply/consult')
    fill()
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: '상담 신청하기' }))

    await waitFor(() => expect(api.submitPromotionInquiry).toHaveBeenCalledTimes(1))
    expect(api.submitPromotionInquiry.mock.calls[0]![0]).toMatchObject({
      company: '착커피', contactName: '김담당', email: 'kim@chakcoffee.com', consent: true, website: '', message: '', interest: '',
    })
    expect(await screen.findByText('상담 신청을 잘 받았어요')).toBeInTheDocument()
  })

  it('sends the chosen product so the team knows what to talk about', async () => {
    api.submitPromotionInquiry.mockResolvedValue({ received: true })
    renderAt('/promotion/apply/consult')
    fill()
    fireEvent.change(screen.getByRole('combobox', { name: /관심 있는 상품/ }), { target: { value: 'BRAND_M' } })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: '상담 신청하기' }))

    await waitFor(() => expect(api.submitPromotionInquiry).toHaveBeenCalledTimes(1))
    expect(api.submitPromotionInquiry.mock.calls[0]![0]).toMatchObject({ interest: 'BRAND_M' })
  })

  it('explains rate limiting and keeps what was typed', async () => {
    api.submitPromotionInquiry.mockRejectedValue(new ApiError(429, { code: 'TOO_MANY_EVENTS' }))
    renderAt('/promotion/apply/consult')
    fill()
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: '상담 신청하기' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('너무 많이')
    expect(screen.getByRole('textbox', { name: /^브랜드 이름/ })).toHaveValue('착커피')
  })
})
