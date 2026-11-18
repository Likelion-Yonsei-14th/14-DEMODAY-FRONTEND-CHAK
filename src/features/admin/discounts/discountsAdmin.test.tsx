import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/features/ads/AdBanner', () => ({ AdBanner: () => null }))
const api = vi.hoisted(() => ({
  fetchAdminDiscounts: vi.fn(),
  createAdminDiscount: vi.fn(),
  updateAdminDiscount: vi.fn(),
  deleteAdminDiscount: vi.fn(),
}))
vi.mock('@/api/discounts', async (original) => ({ ...(await original<typeof import('@/api/discounts')>()), ...api }))

import type { ApiDiscount } from '@/api/discounts'
import { DiscountsAdminPage } from './DiscountsAdminPage'

const everland: ApiDiscount = {
  id: 1,
  brand: '에버랜드',
  category: '놀이·체험',
  benefit: '수험생 이용권 2만원',
  start: '2026-11-11',
  end: '2099-12-31',
  conditions: '중복 할인 안 돼요.',
  area: '경기',
  place: '경기 용인',
  sourceUrl: 'https://www.example.com/a',
  sourceDate: '2026-11-11',
  highlight: '2만원',
  bring: ['2027학년도 수험표 원본', '신분증'],
  howTo: '사전 예약',
  companions: null,
  branches: null,
  image: null,
  imageSource: null,
  visible: true,
  updatedByName: '다은',
  updatedAt: '2026-11-17T01:00:00Z',
}

const renderPage = () =>
  render(
    <MemoryRouter>
      <DiscountsAdminPage />
    </MemoryRouter>,
  )

const field = (name: RegExp) => screen.getByLabelText(name) as HTMLInputElement

describe('discounts admin', () => {
  beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset())
    api.fetchAdminDiscounts.mockResolvedValue([everland])
  })

  it('adds a discount with every field the card shows', async () => {
    api.createAdminDiscount.mockImplementation(async (input) => ({ ...everland, ...input, id: 2 }))
    renderPage()
    await screen.findByRole('cell', { name: /에버랜드/ })

    fireEvent.change(field(/브랜드 · 시설/), { target: { value: ' 수험생 안경 ' } })
    fireEvent.change(field(/종류/), { target: { value: '안경·렌즈' } })
    fireEvent.change(field(/혜택 \(한 문장\)/), { target: { value: '안경 50% 할인' } })
    fireEvent.change(field(/마지막 날/), { target: { value: '2026-12-31' } })
    fireEvent.change(field(/지역 \(걸러 보기용\)/), { target: { value: '부산' } })
    fireEvent.change(field(/챙길 것 \(한 줄/), { target: { value: '수험표\n\n신분증 ' } })
    fireEvent.change(field(/출처 주소/), { target: { value: 'https://www.example.com/glasses' } })

    // 미리보기는 사용자 화면의 카드와 같다.
    const preview = document.querySelector('.discount-preview') as HTMLElement
    expect(within(preview).getByRole('heading', { name: '수험생 안경' })).toBeInTheDocument()
    expect(within(preview).getByText('안경 50% 할인')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '혜택 올리기' }))
    await waitFor(() => expect(api.createAdminDiscount).toHaveBeenCalledTimes(1))
    expect(api.createAdminDiscount.mock.calls[0]![0]).toMatchObject({
      brand: '수험생 안경',
      category: '안경·렌즈',
      benefit: '안경 50% 할인',
      start: null,
      end: '2026-12-31',
      area: '부산',
      bring: ['수험표', '신분증'],
      highlight: null,
      visible: true,
    })
    expect(await screen.findByText(/'수험생 안경' 혜택을 올렸어요/)).toBeInTheDocument()
  })

  it('stops a discount without a source or with a backwards period before saving', async () => {
    renderPage()
    await screen.findByRole('cell', { name: /에버랜드/ })
    fireEvent.change(field(/브랜드 · 시설/), { target: { value: 'A' } })
    fireEvent.change(field(/혜택 \(한 문장\)/), { target: { value: 'B' } })
    fireEvent.click(screen.getByRole('button', { name: '혜택 올리기' }))
    expect(await screen.findByText(/출처 주소/, { selector: '.admin__error' })).toBeInTheDocument()

    fireEvent.change(field(/출처 주소/), { target: { value: 'https://x.example.com' } })
    fireEvent.change(field(/시작일/), { target: { value: '2026-12-31' } })
    fireEvent.change(field(/마지막 날/), { target: { value: '2026-12-01' } })
    fireEvent.click(screen.getByRole('button', { name: '혜택 올리기' }))
    expect(await screen.findByText('시작일이 마지막 날보다 늦어요.')).toBeInTheDocument()
    expect(api.createAdminDiscount).not.toHaveBeenCalled()
  })

  it('edits, hides and deletes', async () => {
    api.updateAdminDiscount.mockImplementation(async (id, input) => ({ ...everland, ...input, id }))
    api.deleteAdminDiscount.mockResolvedValue(undefined)
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderPage()
    const row = (await screen.findByRole('cell', { name: /에버랜드/ })).closest('tr')!

    fireEvent.click(within(row).getByRole('button', { name: '고치기' }))
    expect(field(/브랜드 · 시설/).value).toBe('에버랜드')
    expect(field(/챙길 것 \(한 줄/).value).toBe('2027학년도 수험표 원본\n신분증')
    fireEvent.change(field(/혜택 \(한 문장\)/), { target: { value: '수험생 이용권 1만 9천원' } })
    fireEvent.click(screen.getByRole('button', { name: '고친 내용 저장' }))
    await waitFor(() =>
      expect(api.updateAdminDiscount).toHaveBeenCalledWith(1, expect.objectContaining({ benefit: '수험생 이용권 1만 9천원', howTo: '사전 예약' })),
    )

    const updatedRow = (await screen.findByRole('cell', { name: /1만 9천원/ })).closest('tr')!
    fireEvent.click(within(updatedRow).getByRole('button', { name: '숨기기' }))
    await waitFor(() => expect(api.updateAdminDiscount).toHaveBeenLastCalledWith(1, expect.objectContaining({ visible: false })))
    expect(await screen.findByText('숨김', { selector: '.admin-badge' })).toBeInTheDocument()

    fireEvent.click(within(screen.getByRole('cell', { name: /에버랜드/ }).closest('tr')!).getByRole('button', { name: '지우기' }))
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('되돌릴 수 없어요'))
    await waitFor(() => expect(api.deleteAdminDiscount).toHaveBeenCalledWith(1))
    expect(await screen.findByText('해당하는 혜택이 없어요.')).toBeInTheDocument()
    confirm.mockRestore()
  })
})
