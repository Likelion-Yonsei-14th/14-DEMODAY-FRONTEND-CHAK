import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/client'
import { formatWon, PROMOTION_DATES, promotionStatus } from './promotionContent'

const api = vi.hoisted(() => ({ submitPromotionInquiry: vi.fn() }))
vi.mock('@/api/promotion', () => api)

import { PromotionApplyPage } from './PromotionApplyPage'
import { PromotionPage } from './PromotionPage'

const at = (iso: string) => new Date(iso)

describe('promotion schedule', () => {
  it('moves from early bird to open to closed in Korean time', () => {
    expect(promotionStatus(at('2026-10-24T03:00:00Z'))).toBe('EARLY_BIRD')
    expect(promotionStatus(at('2026-10-31T14:59:00Z'))).toBe('EARLY_BIRD') // 10/31 23:59 KST
    expect(promotionStatus(at('2026-10-31T15:01:00Z'))).toBe('OPEN') // 11/1 00:01 KST
    expect(promotionStatus(at('2026-11-12T14:59:00Z'))).toBe('OPEN')
    expect(promotionStatus(at('2026-11-12T15:01:00Z'))).toBe('CLOSED')
    expect(PROMOTION_DATES.earlyBirdDeadline.short).toBe('10.31')
  })

  it('formats prices the way the brochure does', () => {
    expect(formatWon(149_000)).toBe('14.9만원')
    expect(formatWon(199_000)).toBe('19.9만원')
    expect(formatWon(200_000)).toBe('20만원')
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

describe('promotion page', () => {
  afterEach(() => vi.useRealTimers())

  it('shows the early-bird price before the deadline and the regular price after it', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(at('2026-10-25T03:00:00Z'))
    const early = renderAt('/promotion')
    expect(screen.getByText('14.9만원')).toBeInTheDocument()
    expect(screen.getByText(/10월 31일\(토\)까지 입금하면 14\.9만원/)).toBeInTheDocument()
    early.unmount()

    vi.setSystemTime(at('2026-11-05T03:00:00Z'))
    renderAt('/promotion')
    expect(screen.queryByText('14.9만원')).not.toBeInTheDocument()
    expect(screen.getAllByText(/19\.9만원/).length).toBeGreaterThan(0)
    expect(screen.getByText(/얼리버드는 끝났어요/)).toBeInTheDocument()
  })

  it('links to the consultation form and lists the ad specs', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(at('2026-10-25T03:00:00Z'))
    renderAt('/promotion')
    expect(screen.getAllByRole('link', { name: /상담 신청/ }).length).toBeGreaterThan(0)
    expect(screen.getByText(/1080×1350px · MP4/)).toBeInTheDocument()
    expect(screen.getByText(/1125×375px/)).toBeInTheDocument()
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
      company: '착커피', contactName: '김담당', email: 'kim@chakcoffee.com', consent: true, website: '', message: '',
    })
    expect(await screen.findByText('상담 신청을 잘 받았어요')).toBeInTheDocument()
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
