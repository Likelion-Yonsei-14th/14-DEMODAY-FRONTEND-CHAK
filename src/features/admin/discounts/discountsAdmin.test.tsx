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
const ads = vi.hoisted(() => ({ uploadAdCreative: vi.fn() }))
vi.mock('@/api/adminAds', async (original) => ({ ...(await original<typeof import('@/api/adminAds')>()), ...ads }))

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

    // 새 혜택은 수능날부터 연말까지, 챙길 것은 수험표만 채워져 있다.
    expect(field(/시작일/).value).toBe('2026-11-19')
    expect(field(/마지막 날/).value).toBe('2026-12-31')
    expect(field(/챙길 것 \(한 줄/).value).toBe('2027학년도 수험표 원본')

    fireEvent.change(field(/브랜드 · 시설/), { target: { value: ' 수험생 안경 ' } })
    fireEvent.change(field(/종류/), { target: { value: '안경·렌즈' } })
    fireEvent.change(field(/혜택 \(한 문장\)/), { target: { value: '안경 50% 할인' } })
    fireEvent.change(field(/시작일/), { target: { value: '' } })
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

  it("lets each advertiser's own terms be added, reordered and saved", async () => {
    api.createAdminDiscount.mockImplementation(async (input) => ({ ...everland, ...input, id: 2 }))
    renderPage()
    await screen.findByRole('cell', { name: /에버랜드/ })
    fireEvent.change(field(/브랜드 · 시설/), { target: { value: '수능 카페' } })
    fireEvent.change(field(/혜택 \(한 문장\)/), { target: { value: '음료 30% 할인' } })
    fireEvent.change(field(/출처 주소/), { target: { value: 'https://x.example.com/cafe' } })
    fireEvent.change(field(/받는 방법/), { target: { value: '네이버 예약 후 방문' } })

    const add = screen.getByRole('button', { name: '+ 항목 추가' })
    fireEvent.click(add)
    fireEvent.click(add)
    fireEvent.click(add)
    fireEvent.change(field(/^추가 항목 1 이름$/), { target: { value: '이용 시간' } })
    fireEvent.change(field(/^추가 항목 1 내용$/), { target: { value: '평일\t11시~17시' } })
    fireEvent.change(field(/^추가 항목 2 이름$/), { target: { value: '증정' } })
    fireEvent.change(field(/^추가 항목 2 내용$/), { target: { value: ' 쿠키 1개 ' } })
    // 탭(저장 구분자)은 공백으로 바뀐다. 줄바꿈은 한 줄 입력칸이 이미 지운다.
    expect(field(/^추가 항목 1 내용$/).value).toBe('평일 11시~17시')
    expect(screen.getByRole('button', { name: '추가 항목 1 위로' })).toBeDisabled()

    // 증정을 맨 위로
    fireEvent.click(screen.getByRole('button', { name: '추가 항목 2 위로' }))
    expect(field(/^추가 항목 1 이름$/).value).toBe('증정')

    // 미리보기 카드에도 받는 방법 칩과 추가 항목이 보인다.
    const preview = document.querySelector('.discount-preview') as HTMLElement
    expect(within(preview).getByRole('list', { name: '챙길 것' })).toHaveTextContent('네이버 예약 후 방문')
    expect(within(preview).getByText('쿠키 1개')).toBeInTheDocument()

    // 한쪽만 적은 줄은 막는다. 3번째 줄은 둘 다 비어 있어 저장할 때 빠진다.
    fireEvent.change(field(/^추가 항목 3 이름$/), { target: { value: '문의' } })
    fireEvent.click(screen.getByRole('button', { name: '혜택 올리기' }))
    expect(await screen.findByText('추가 항목은 이름과 내용을 모두 적어 주세요.')).toBeInTheDocument()
    expect(api.createAdminDiscount).not.toHaveBeenCalled()

    fireEvent.change(field(/^추가 항목 3 이름$/), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: '혜택 올리기' }))
    await waitFor(() => expect(api.createAdminDiscount).toHaveBeenCalledTimes(1))
    expect(api.createAdminDiscount.mock.calls[0]![0]).toMatchObject({
      howTo: '네이버 예약 후 방문',
      extras: [
        { label: '증정', value: '쿠키 1개' },
        { label: '이용 시간', value: '평일 11시~17시' },
      ],
    })
  })

  it('uploads a representative image file instead of pasting an address', async () => {
    ads.uploadAdCreative.mockReset().mockResolvedValue('https://www.chak.live/api/public/ads/creatives/42')
    api.createAdminDiscount.mockImplementation(async (input) => ({ ...everland, ...input, id: 2 }))
    renderPage()
    await screen.findByRole('cell', { name: /에버랜드/ })
    fireEvent.change(field(/이미지를 가져온 페이지/), { target: { value: 'https://old.example.com' } })
    const picker = document.querySelector('input[type="file"]') as HTMLInputElement

    // 형식·크기가 맞지 않으면 올리지 않는다.
    fireEvent.change(picker, { target: { files: [new File(['x'], 'a.bmp', { type: 'image/bmp' })] } })
    expect(await screen.findByText('PNG·JPEG·WEBP·GIF 이미지만 올릴 수 있어요.')).toBeInTheDocument()
    const big = new File([new Uint8Array(1024 * 1024 + 1)], 'big.png', { type: 'image/png' })
    fireEvent.change(picker, { target: { files: [big] } })
    expect(await screen.findByText(/1MB까지 올릴 수 있어요/)).toBeInTheDocument()
    expect(ads.uploadAdCreative).not.toHaveBeenCalled()

    const file = new File(['png'], 'cafe.png', { type: 'image/png' })
    fireEvent.change(picker, { target: { files: [file] } })
    await waitFor(() => expect(field(/^대표 이미지 주소$/).value).toBe('https://www.chak.live/api/public/ads/creatives/42'))
    expect(ads.uploadAdCreative).toHaveBeenCalledWith(file)
    // 직접 올린 이미지에는 출처 페이지가 필요 없다.
    expect(field(/이미지를 가져온 페이지/).value).toBe('')

    fireEvent.change(field(/브랜드 · 시설/), { target: { value: '수능 카페' } })
    fireEvent.change(field(/혜택 \(한 문장\)/), { target: { value: '음료 30% 할인' } })
    fireEvent.change(field(/출처 주소/), { target: { value: 'https://x.example.com/cafe' } })
    fireEvent.click(screen.getByRole('button', { name: '혜택 올리기' }))
    await waitFor(() => expect(api.createAdminDiscount).toHaveBeenCalledTimes(1))
    expect(api.createAdminDiscount.mock.calls[0]![0]).toMatchObject({
      image: 'https://www.chak.live/api/public/ads/creatives/42',
      imageSource: null,
    })
  })

  it('stops at eight extra rows and removes a row', async () => {
    renderPage()
    await screen.findByRole('cell', { name: /에버랜드/ })
    const add = screen.getByRole('button', { name: '+ 항목 추가' })
    for (let i = 0; i < 8; i++) fireEvent.click(add)
    expect(add).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: '추가 항목 8 빼기' }))
    expect(add).toBeEnabled()
    expect(screen.queryByLabelText('추가 항목 8 이름')).toBeNull()
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

  it('filters the list by sponsored and regular', async () => {
    api.fetchAdminDiscounts.mockResolvedValue([everland, { ...everland, id: 2, brand: '제휴 카페', sponsored: true }])
    renderPage()
    await screen.findByRole('cell', { name: /에버랜드/ })
    const kind = screen.getByRole('group', { name: '제휴 여부' })

    fireEvent.click(within(kind).getByRole('button', { name: '제휴 1' }))
    expect(screen.getByRole('cell', { name: /제휴 카페/ })).toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: /에버랜드/ })).not.toBeInTheDocument()

    fireEvent.click(within(kind).getByRole('button', { name: '일반 1' }))
    expect(screen.getByRole('cell', { name: /에버랜드/ })).toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: /제휴 카페/ })).not.toBeInTheDocument()

    fireEvent.click(within(kind).getByRole('button', { name: '제휴·일반 모두' }))
    expect(screen.getAllByRole('cell', { name: /에버랜드|제휴 카페/ })).toHaveLength(2)
  })
})
