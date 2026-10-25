import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/client'
import { BRAND_TIERS, formatWon, LOCAL_PRODUCTS, PROMOTION_DATES, promotionStatus, tight } from './promotionContent'

const api = vi.hoisted(() => ({ submitPromotionInquiry: vi.fn() }))
vi.mock('@/api/promotion', () => api)

import { PromotionApplyPage } from './PromotionApplyPage'
import { PromotionPage } from './PromotionPage'

const at = (iso: string) => new Date(iso)

/** 화면 글자의 줄바꿈 금지 공백과 단어 결합 기호를 일반 공백으로 보고 찾는다. */
const plain = (pattern: RegExp) => (content: string) => pattern.test(content.replace(/\u00a0/g, ' ').replace(/\u2060/g, ''))

describe('promotion schedule', () => {
  it('stays open until the final payment deadline in Korean time, then closes', () => {
    expect(promotionStatus(at('2026-10-24T03:00:00Z'))).toBe('OPEN')
    expect(promotionStatus(at('2026-11-12T14:59:00Z'))).toBe('OPEN') // 11/12 23:59 KST
    expect(promotionStatus(at('2026-11-12T15:01:00Z'))).toBe('CLOSED')
    expect(PROMOTION_DATES.replyDeadline.short).toBe('11.2')
  })

  it('formats prices the way the BM does', () => {
    expect(formatWon(49_000)).toBe('4.9만원')
    expect(formatWon(129_000)).toBe('12.9만원')
    expect(formatWon(200_000)).toBe('20만원')
  })

  it('keeps the BM price table: launch partner price is always below the base price', () => {
    expect(LOCAL_PRODUCTS.map((p) => p.price)).toEqual([49_000, 99_000, 129_000])
    expect(BRAND_TIERS.map((t) => [t.regular, t.launch])).toEqual([
      [149_000, 119_000],
      [299_000, 239_000],
      [499_000, 399_000],
      [null, null],
    ])
  })
})

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/promotion" element={<PromotionPage />} />
        <Route path="/promotion/apply" element={<PromotionApplyPage />} />
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

  it('shows the three Local products with their prices', () => {
    open()
    renderAt('/promotion')
    const local = screen.getByRole('region', { name: 'Local 상품 (매장 1곳)' })
    expect(local).toHaveTextContent('수능 후 방문형')
    expect(local).toHaveTextContent('4.9만원')
    expect(local).toHaveTextContent('9.9만원')
    expect(local).toHaveTextContent('12.9만원')
    expect(local).toHaveTextContent('VAT 별도')
  })

  it('shows the Brand tiers with launch partner prices and Enterprise as a quote', () => {
    open()
    renderAt('/promotion')
    const table = screen.getByRole('table')
    const row = (name: string) => screen.getByRole('rowheader', { name }).closest('tr') as HTMLElement
    expect(row('Brand S')).toHaveTextContent('14.9만원')
    expect(row('Brand S')).toHaveTextContent('11.9만원')
    expect(row('Brand M')).toHaveTextContent('29.9만원')
    expect(row('Brand M')).toHaveTextContent('23.9만원')
    expect(row('Brand L')).toHaveTextContent('49.9만원')
    expect(row('Brand L')).toHaveTextContent('39.9만원')
    expect(row('Enterprise')).toHaveTextContent('별도 협의')
    expect(table).toHaveTextContent('런칭 파트너가')
  })

  it('explains franchise scope, joint promotions and extra options', () => {
    open()
    renderAt('/promotion')
    const text = (document.body.textContent ?? '').replace(/\u00a0/g, ' ').replace(/\u2060/g, '')
    for (const phrase of ['참여를 희망한 가맹점', '본사가 지정한 일부 매장', '무료 쿠폰', '공동 SNS 프로모션', '카테고리 또는 상권 독점 캠페인']) {
      expect(text).toContain(phrase)
    }
    expect(screen.getByText(plain(/서울 매장 20곳만 참여하면 Brand M/))).toBeInTheDocument()
  })

  it('says the audience is only students and the people around them', () => {
    open()
    renderAt('/promotion')
    expect(screen.getByRole('heading', { name: '착은 보는 사람이 처음부터 정해져 있어요' })).toBeInTheDocument()
    expect(screen.getByText(plain(/수험생과 그 친구, 가족만 쓰는 서비스/))).toBeInTheDocument()
    expect(screen.getByText(plain(/일반 광고는 수험생이 아닌 사람에게도/))).toBeInTheDocument()
  })

  it('no longer promises the old package (view guarantee, early bird)', () => {
    open()
    renderAt('/promotion')
    const text = document.body.textContent ?? ''
    expect(text).not.toContain('시청 1만')
    expect(text).not.toContain('얼리버드')
    expect(text).not.toContain('19.9만원')
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

describe('promotion apply form', () => {
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
    renderAt('/promotion/apply')
    const send = screen.getByRole('button', { name: '상담 신청하기' })
    expect(send).toBeDisabled()
    fill()
    expect(send).toBeDisabled()
    fireEvent.click(screen.getByRole('checkbox'))
    expect(send).toBeEnabled()
  })

  it('sends the inquiry and confirms', async () => {
    api.submitPromotionInquiry.mockResolvedValue({ received: true })
    renderAt('/promotion/apply')
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
    renderAt('/promotion/apply')
    fill()
    fireEvent.change(screen.getByRole('combobox', { name: /관심 있는 상품/ }), { target: { value: 'BRAND_M' } })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: '상담 신청하기' }))

    await waitFor(() => expect(api.submitPromotionInquiry).toHaveBeenCalledTimes(1))
    expect(api.submitPromotionInquiry.mock.calls[0]![0]).toMatchObject({ interest: 'BRAND_M' })
  })

  it('explains rate limiting and keeps what was typed', async () => {
    api.submitPromotionInquiry.mockRejectedValue(new ApiError(429, { code: 'TOO_MANY_EVENTS' }))
    renderAt('/promotion/apply')
    fill()
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: '상담 신청하기' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('너무 많이')
    expect(screen.getByRole('textbox', { name: /^브랜드 이름/ })).toHaveValue('착커피')
  })
})
