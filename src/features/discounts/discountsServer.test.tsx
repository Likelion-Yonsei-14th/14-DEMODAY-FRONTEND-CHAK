import { fireEvent, render, screen, within } from '@testing-library/react'
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

  it('keeps extras in order and treats missing or empty ones as none', () => {
    const extras = [
      { label: '증정', value: '음료 1잔' },
      { label: '이용 시간', value: '평일 11시~17시' },
    ]
    expect(toDiscount({ ...server, extras }).extras).toEqual(extras)
    expect(toDiscount({ ...server, extras: [] }).extras).toBeUndefined()
    // 이 칸이 생기기 전 서버는 extras를 보내지 않는다.
    expect(toDiscount(server).extras).toBeUndefined()
  })

  it('shows extras after how to get it, and the how-to chip even without things to bring', async () => {
    api.fetchDiscounts.mockResolvedValue({
      updated: '2026-11-18',
      items: [toDiscount({ ...server, howTo: '네이버 예약', extras: [{ label: '증정', value: '음료 1잔' }, { label: '증정', value: '쿠키' }] })],
    })
    renderPage()
    const heading = await screen.findByRole('heading', { name: '광주 방탈출' })
    const card = heading.closest('li') as HTMLElement
    expect(within(card).getByRole('list', { name: '받는 방법' })).toHaveTextContent('네이버 예약')
    fireEvent.click(within(card).getByRole('button', { name: /자세히 보기/ }))
    const labels = within(card).getAllByRole('term').map((dt) => dt.textContent)
    expect(labels).toEqual(['받는 방법', '증정', '증정', '적용 지점'])
  })
})
