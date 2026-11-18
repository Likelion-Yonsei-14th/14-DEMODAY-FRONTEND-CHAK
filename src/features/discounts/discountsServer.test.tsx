import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/features/ads/AdBanner', () => ({ AdBanner: () => null }))
vi.mock('@/api/config', async (original) => ({ ...(await original<typeof import('@/api/config')>()), isApiEnabled: true }))
const api = vi.hoisted(() => ({ fetchDiscounts: vi.fn(), offline: false }))
// 실패하는 경우는 vi.fn 대신 평범한 함수로 돌려준다(vi.fn이 돌려준 거부는 화면이 잡아도 테스트 실패로 남는다).
vi.mock('@/api/discounts', async (original) => ({
  ...(await original<typeof import('@/api/discounts')>()),
  fetchDiscounts: () => (api.offline ? Promise.reject(new TypeError('Failed to fetch')) : api.fetchDiscounts()),
}))

import { toDiscount, type ApiDiscount } from '@/api/discounts'
import { DISCOUNTS } from './discountData'
import { DiscountsPage } from './DiscountsPage'

const server: ApiDiscount = {
  id: 7,
  brand: '광주 방탈출',
  category: '놀이·체험',
  benefit: '수험생 30% 할인',
  start: null,
  end: '2099-12-31',
  conditions: null,
  area: '광주',
  place: '광주 동구',
  sourceUrl: 'https://www.example.com/n/1',
  sourceDate: null,
  highlight: '30%',
  bring: [],
  howTo: null,
  companions: null,
  branches: null,
  image: null,
  imageSource: null,
  visible: true,
  updatedByName: null,
  updatedAt: '2026-11-18T03:00:00Z',
}

const renderPage = () =>
  render(
    <MemoryRouter>
      <DiscountsPage />
    </MemoryRouter>,
  )

describe('discounts from the server', () => {
  beforeEach(() => {
    api.fetchDiscounts.mockReset()
    api.offline = false
  })

  it('shows the list the operators keep, with the day it was last changed', async () => {
    api.fetchDiscounts.mockResolvedValue({ updated: '2026-11-18', items: [toDiscount(server)] })
    renderPage()
    expect(screen.getByText('혜택을 불러오고 있어요...')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: '광주 방탈출' })).toBeInTheDocument()
    expect(screen.getByText(/11월 18일 기준/)).toBeInTheDocument()
    // 새 지역이 들어오면 지역 버튼도 생긴다.
    expect(screen.getByRole('button', { name: '광주' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: DISCOUNTS[0]!.brand })).toBeNull()
  })

  it('falls back to the bundled list when the server cannot be reached', async () => {
    api.offline = true
    renderPage()
    expect(await screen.findByText(/11월 17일 기준/)).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0)
  })

  it('maps empty server values to what the card expects', () => {
    const d = toDiscount({ ...server, bring: ['수험표'], conditions: null, place: null })
    expect(d).toMatchObject({ id: 7, conditions: '', place: '', bring: ['수험표'], highlight: '30%', image: undefined })
  })
})
