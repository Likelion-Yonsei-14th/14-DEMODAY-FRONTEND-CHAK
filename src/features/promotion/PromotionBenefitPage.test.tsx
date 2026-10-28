import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/client'

const api = vi.hoisted(() => ({ submitBenefitSubmission: vi.fn(), uploadBenefitFile: vi.fn() }))
vi.mock('@/api/promotion', () => api)

import { PromotionBenefitPage } from './PromotionBenefitPage'

const field = (name: RegExp | string) => screen.getByLabelText(name)
const next = () => fireEvent.click(screen.getByRole('button', { name: '다음' }))
const type = (name: RegExp | string, value: string) => fireEvent.change(field(name), { target: { value } })

function fillContact() {
  type(/^브랜드\(업체\)명/, '착커피')
  type(/^업종/, 'CAFE')
  type(/^담당자 이름/, '김담당')
  type(/^담당자 연락처/, '010-1234-5678')
  type(/^담당자 이메일/, 'kim@chakcoffee.com')
  next()
}

function fillBenefit() {
  fireEvent.click(screen.getByRole('radio', { name: '수험표를 가진 수험생 누구나' }))
  fireEvent.click(screen.getByRole('checkbox', { name: '% 할인' }))
  type(/^할인율/, '20')
  type(/^혜택을 한 줄로/, '수험생 전 음료 20% 할인')
  type(/^혜택 상세 설명/, '수험표를 보여주세요')
  type(/^혜택 시작일/, '2026-11-20')
  type(/^혜택 종료일/, '2026-12-31')
  next()
}

function fillUsage() {
  fireEvent.click(screen.getByRole('checkbox', { name: '매장에서 수험표 제시' }))
  next()
}

describe('benefit survey page', () => {
  beforeEach(() => {
    api.submitBenefitSubmission.mockReset()
    api.uploadBenefitFile.mockReset()
    window.sessionStorage.clear()
    window.scrollTo = vi.fn()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-30T03:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  const renderPage = () => render(<MemoryRouter><PromotionBenefitPage /></MemoryRouter>)

  it('does not move on until the required answers are given', () => {
    renderPage()
    next()
    expect(screen.getByText('1 / 4 · 업체 정보')).toBeInTheDocument()
    expect(screen.getAllByText('꼭 답해 주세요').length).toBeGreaterThan(0)
  })

  it('shows the follow-up question of a chosen benefit and asks for it', () => {
    renderPage()
    fillContact()
    expect(screen.queryByLabelText(/^할인율/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('checkbox', { name: '% 할인' }))
    expect(screen.getByLabelText(/^할인율/)).toBeInTheDocument()
    type(/^할인율/, '20퍼')
    expect(screen.getByLabelText(/^할인율/)).toHaveValue('20') // 숫자 칸은 숫자만 받는다
  })

  it('goes through the four pages and sends the answers with numbers as numbers', async () => {
    api.uploadBenefitFile.mockResolvedValue('promotion/uploads/0b1e2f3a-1111-2222-3333-444455556666/logo.png')
    api.submitBenefitSubmission.mockResolvedValue({ received: true })
    renderPage()
    fillContact()
    fillBenefit()
    fillUsage()

    expect(screen.getByText('4 / 4 · 참여 매장 · 시안 자료')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: '전 매장' }))
    fireEvent.change(field(/^로고 파일/), { target: { files: [new File(['x'], 'logo.png', { type: 'image/png' })] } })
    expect(await screen.findByText(/올렸어요: logo.png/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('checkbox', { name: '착 수험생 혜택함 (필수)' }))
    fireEvent.click(screen.getByRole('radio', { name: '1일 이내' }))

    const submit = screen.getByRole('button', { name: '제출하기' })
    expect(submit).toBeDisabled()
    fireEvent.click(screen.getByRole('checkbox', { name: /개인정보/ }))
    fireEvent.click(submit)

    await waitFor(() => expect(api.submitBenefitSubmission).toHaveBeenCalledTimes(1))
    const [answers, website] = api.submitBenefitSubmission.mock.calls[0]!
    expect(website).toBe('')
    expect(answers).toMatchObject({
      brand: '착커피', category: 'CAFE', email: 'kim@chakcoffee.com', target: 'EXAM_TICKET_HOLDER',
      benefits: ['PERCENT'], percent: 20, usageMethods: ['SHOW_EXAM_TICKET'], scope: 'ALL_STORES',
      logoFileKey: 'promotion/uploads/0b1e2f3a-1111-2222-3333-444455556666/logo.png',
      exposure: ['BENEFIT_BOX'], reviewPeriod: 'WITHIN_1_DAY',
    })
    expect(api.uploadBenefitFile).toHaveBeenCalledWith('LOGO', expect.any(File))
    expect(await screen.findByText('제출해 주셔서 감사합니다!')).toBeInTheDocument()
    expect(window.sessionStorage.getItem('chak-benefit-draft')).toBeNull()
  })

  it('tells the person when a file cannot be uploaded and when the server rejects the answers', async () => {
    api.uploadBenefitFile.mockRejectedValue(new Error('network'))
    renderPage()
    fillContact()
    fillBenefit()
    fillUsage()
    fireEvent.change(field(/^로고 파일/), { target: { files: [new File(['x'], 'logo.png')] } })
    expect(await screen.findByText(/파일을 올리지 못했어요/)).toBeInTheDocument()

    api.uploadBenefitFile.mockResolvedValue('promotion/uploads/0b1e2f3a-1111-2222-3333-444455556666/logo.png')
    api.submitBenefitSubmission.mockRejectedValue(new ApiError(400, { code: 'INVALID_BENEFIT_ANSWER' }))
    fireEvent.click(screen.getByRole('radio', { name: '온라인만' }))
    fireEvent.change(field(/^로고 파일/), { target: { files: [new File(['x'], 'logo.png')] } })
    await screen.findByText(/올렸어요/)
    fireEvent.click(screen.getByRole('checkbox', { name: '착 수험생 혜택함 (필수)' }))
    fireEvent.click(screen.getByRole('radio', { name: '2~3일' }))
    fireEvent.click(screen.getByRole('checkbox', { name: /개인정보/ }))
    fireEvent.click(screen.getByRole('button', { name: '제출하기' }))
    expect(await screen.findByText('입력한 내용을 한 번만 더 확인해 주세요.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '제출하기' })).toBeEnabled()
  })

  it('keeps what was typed when going back and after a reload', () => {
    const { unmount } = renderPage()
    fillContact()
    fireEvent.click(screen.getByRole('button', { name: '이전' }))
    expect(field(/^브랜드\(업체\)명/)).toHaveValue('착커피')
    unmount()
    renderPage()
    expect(field(/^브랜드\(업체\)명/)).toHaveValue('착커피')
  })

  it('closes after the final deadline', () => {
    vi.setSystemTime(new Date('2026-11-20T03:00:00Z'))
    renderPage()
    expect(screen.getByRole('alert')).toHaveTextContent('접수는 마감했어요')
    expect(screen.queryByRole('button', { name: '다음' })).not.toBeInTheDocument()
  })
})
