import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { defaultInput, estimate, PITCH_CATEGORIES, withCategory } from './pitchModel'
import { buildSlides, decodeDeck, deckFileName, deckPath, encodeDeck, josa, trendTo } from './pitchSlides'

const pptx = vi.hoisted(() => ({ downloadDeck: vi.fn() }))
vi.mock('./pitchPptx', () => pptx)

import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PitchDeckPage } from './PitchDeckPage'
import { PitchDeckViewPage } from './PitchDeckViewPage'

describe('pitch estimate', () => {
  it('narrows the expected visitors down to visits, profit and an ad price below the profit', () => {
    const result = estimate(defaultInput('hair'))
    // 3,700 × 60% × 5% = 111명 → 4% = 4명 → 80,000원 × 50% = 160,000원 → 30%
    expect(result.reach).toBe(111)
    expect(result.visits).toBe(4)
    expect(result.sales).toBe(320_000)
    expect(result.profit).toBe(160_000)
    expect(result.adPrice).toBe(48_000)
    expect(result.net).toBe(112_000)
  })

  it('always proposes an ad price below the expected profit, for every category and ratio', () => {
    for (const category of PITCH_CATEGORIES) {
      for (const priceRatio of [0.1, 0.5, 0.95, 1, 3]) {
        const result = estimate({ ...defaultInput(category.id), priceRatio })
        expect(result.profit, category.id).toBeGreaterThan(0)
        expect(result.adPrice, `${category.id} ${priceRatio}`).toBeLessThan(result.profit)
        expect(result.adPrice % 1000).toBe(0)
      }
    }
  })

  it('never proposes more than the cap per store, however big the expected profit', () => {
    const big = estimate({ ...defaultInput('driving'), visitorsExpected: 100_000, priceRatio: 0.9 })
    expect(big.profit).toBeGreaterThan(1_000_000)
    expect(big.adPrice).toBe(150_000)
    expect(estimate({ ...defaultInput('driving'), visitorsExpected: 100_000, priceCap: 90_000 }).adPrice).toBe(90_000)
  })

  it('adds the profit from customers who come back', () => {
    const result = estimate(defaultInput('hair'))
    // 4명 × 40% = 2명 × 3회 × 80,000원 × 50%
    expect(result.revisitors).toBe(2)
    expect(result.loyaltyProfit).toBe(240_000)
  })

  it('switches to the defaults of the chosen category and keeps the rest', () => {
    const base = { ...defaultInput('hair'), storeName: '착안경', visitorsExpected: 5000 }
    const next = withCategory(base, 'optical')
    expect(next).toMatchObject({ storeName: '착안경', visitorsExpected: 5000, spend: 120_000, margin: 0.4, conversion: 0.03 })
  })

  it('survives empty or broken numbers without proposing a price', () => {
    const result = estimate({ ...defaultInput(), visitorsExpected: Number.NaN, spend: -5 })
    expect(result).toMatchObject({ reach: 0, visits: 0, profit: 0, adPrice: 0, loyaltyProfit: 0 })
  })
})

describe('pitch slides', () => {
  const input = { ...defaultInput('hair'), storeName: '착헤어', location: '신촌역' }

  it('puts the store, place and category into the deck', () => {
    const slides = buildSlides(input)
    expect(slides).toHaveLength(6)
    expect(slides[0]).toMatchObject({ title: '수능이 끝나면, 착헤어로.', kicker: '신촌역 · 미용실 · 염색 제휴 제안' })
    expect(slides[0]!.coupon).toEqual({ store: '착헤어', category: '미용실 · 염색' })
    expect(slides[3]!.title).toBe('신촌역 근처 수험생이 매일 착을 열어요')
    expect(slides[3]!.stats!.map((stat) => stat.value)).toEqual(['2,000명', '3,700명'])
    expect(slides[3]!.chart).toMatchObject({ from: '10/28', to: '11/13', expected: 3700 })
    // 추세선은 마지막 실제 값에서 수능 당일 예상까지 매일 올라간다
    const ahead = slides[3]!.chart!.ahead
    expect(ahead).toHaveLength(6)
    expect(ahead.at(-1)).toBe(3700)
    expect(ahead.every((value, index) => value > (index === 0 ? 1855 : ahead[index - 1]!))).toBe(true)
  })

  it('shows what the service is with the store on the app screens, in a deck short enough for a visit', () => {
    const slides = buildSlides(input)
    expect(slides.length).toBeLessThanOrEqual(6)
    const service = slides[2]!
    expect(service.kicker).toBe('착은 이런 서비스예요')
    expect(service.phones!.map((phone) => phone.screen)).toEqual([
      { kind: 'desk' },
      { kind: 'ad', store: '착헤어', place: '신촌역' },
      { kind: 'coupon', store: '착헤어', category: '미용실 · 염색' },
    ])
    expect(service.phones!.map((phone) => phone.tag)).toEqual(['수능 전 · 매일', '1단계 · B안', '2단계 · A안'])
    expect(slides[1]!.callout).toBe('착이라면 수능 전에 알린 착헤어를, 수능 후의 실제 방문으로.')
    expect(slides[5]!.steps!.map((step) => step.value)).toEqual(['참여 의사 전달', '광고 정보 제출', '광고 노출 시작'])
  })

  it('shows the expected profit next to a smaller ad price', () => {
    const revenue = buildSlides(input)[4]!
    expect(revenue.kicker).toBe('착헤어 예상 수익')
    expect(revenue.steps!.map((step) => step.value)).toEqual(['3,700명', '111명', '4명', '320,000원'])
    expect(revenue.compare).toMatchObject({ profit: '160,000원', price: '48,000원', ratio: 0.3 })
    expect(revenue.compare!.summary).toContain('광고비를 빼고도 112,000원이 남아요')
  })

  it('pitches first-store loyalty with the extra yearly profit', () => {
    const loyalty = buildSlides(input)[5]!
    expect(loyalty.title).toBe('수험생의 첫 단골 매장이 되세요')
    expect(loyalty.stats!.at(-1)!.value).toBe('240,000원')
    expect(loyalty.bullets!.join(' ')).toContain('사회 초년생')
  })

  it('reads naturally without a store name, and picks the right particles', () => {
    expect(buildSlides(defaultInput())[0]!.title).toBe('수능이 끝나면, 우리 매장으로.')
    expect(josa('착안경', '으로', '로')).toBe('착안경으로')
    expect(josa('착헤어살롱', '을', '를')).toBe('착헤어살롱을')
    expect(josa('CHAK', '을', '를')).toBe('CHAK를')
    expect(josa('스마일', '으로', '로')).toBe('스마일로')
  })

  it('draws no trend when there is nothing to start from or no days left', () => {
    expect(trendTo(0, 3700, 6)).toEqual([])
    expect(trendTo(1855, 3700, 0)).toEqual([])
    expect(trendTo(1000, 2000, 2)).toEqual([1414, 2000])
  })

  it('names the file after the store', () => {
    expect(deckFileName(input)).toBe('CHAK_제휴제안_착헤어.pptx')
    expect(deckFileName({ ...input, storeName: '착/헤어 2호점' })).toBe('CHAK_제휴제안_착_헤어_2호점.pptx')
  })
})

describe('pitch deck page', () => {
  it('rebuilds the deck and the numbers as the store is typed in', () => {
    render(<PitchDeckPage />)
    fireEvent.change(screen.getByRole('textbox', { name: '매장 이름' }), { target: { value: '착안경' } })
    fireEvent.change(screen.getByRole('textbox', { name: '위치' }), { target: { value: '잠실역' } })
    fireEvent.change(screen.getByRole('combobox', { name: '업종' }), { target: { value: 'optical' } })

    expect(screen.getByRole('heading', { name: '수능이 끝나면, 착안경으로.' })).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(6)
    // 111명 × 3% = 3명 × 120,000원 × 40% = 144,000원 → 광고비 43,000원
    const result = within(screen.getByLabelText('계산 결과'))
    expect(result.getAllByText('144,000원').length).toBeGreaterThan(0) // 예상 수익(1년 추가 기대 수익도 같은 값)
    expect(result.getByText('43,000원')).toBeInTheDocument()
  })

  it('recalculates when an assumption is changed', () => {
    render(<PitchDeckPage />)
    fireEvent.change(screen.getByRole('spinbutton', { name: '수능 당일 예상 접속자 (명)' }), { target: { value: '7400' } })
    expect(within(screen.getByLabelText('계산 결과')).getByText('222명')).toBeInTheDocument()
  })

  it('downloads the deck that is shown', async () => {
    pptx.downloadDeck.mockResolvedValue(undefined)
    render(<PitchDeckPage />)
    fireEvent.change(screen.getByRole('textbox', { name: '매장 이름' }), { target: { value: '착헤어' } })
    fireEvent.click(screen.getByRole('button', { name: 'PPT 내려받기' }))
    await vi.waitFor(() => expect(pptx.downloadDeck).toHaveBeenCalledTimes(1))
    const [slides, fileName] = pptx.downloadDeck.mock.calls[0]!
    expect(slides[0].title).toBe('수능이 끝나면, 착헤어로.')
    expect(fileName).toBe('CHAK_제휴제안_착헤어.pptx')
  })

  it('says so when the file cannot be made', async () => {
    pptx.downloadDeck.mockRejectedValue(new Error('boom'))
    render(<PitchDeckPage />)
    fireEvent.click(screen.getByRole('button', { name: 'PPT 내려받기' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('PPT 파일을 만들지 못했어요')
  })
})

describe('pitch deck on the web', () => {
  const input = { ...defaultInput('optical'), storeName: '착안경', location: '잠실역', priceCap: 90_000 }

  it('carries the deck in the link and reads it back the same', () => {
    expect(decodeDeck(encodeDeck(input))).toEqual(input)
    expect(deckPath(input)).toMatch(/^\/promotion\/deck\?d=[A-Za-z0-9_-]+$/)
    // 기본값과 같은 값은 싣지 않아 주소가 짧다
    expect(encodeDeck(defaultInput()).length).toBeLessThan(40)
  })

  it('falls back to the defaults for a broken link and ignores values it does not know', () => {
    expect(decodeDeck(null)).toEqual(defaultInput())
    expect(decodeDeck('%%%')).toEqual(defaultInput())
    const odd = btoa(JSON.stringify({ categoryId: 'food', storeName: 'x'.repeat(80), spend: -1, margin: 'a', extra: 1 }))
    const read = decodeDeck(odd)
    expect(read.categoryId).toBe('food')
    expect(read.storeName).toHaveLength(30)
    expect(read.spend).toBe(15_000)
    expect(read.margin).toBe(0.3)
    expect(read).not.toHaveProperty('extra')
  })

  it('opens the same six slides from the link', () => {
    render(
      <MemoryRouter initialEntries={[deckPath(input)]}>
        <Routes>
          <Route path="/promotion/deck" element={<PitchDeckViewPage />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('착안경 × 착 제휴 제안')
    expect(screen.getAllByRole('article')).toHaveLength(6)
    expect(screen.getByRole('heading', { name: '수능이 끝나면, 착안경으로.' })).toBeInTheDocument()
    // 로고가 모든 장에 있고, 앱 화면에 매장 이름이 들어간다
    expect(document.querySelectorAll('.pslide__brand img')).toHaveLength(6)
    expect(document.querySelector('.pphone__coupon')).toHaveTextContent('착안경')
    expect(screen.getByRole('img', { name: /일 접속자 그래프/ })).toBeInTheDocument()
    expect(document.title).toBe('착안경 × 착 제휴 제안')
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex')
  })

  it('offers the web link from the admin page, following what is typed', () => {
    render(<PitchDeckPage />)
    fireEvent.change(screen.getByRole('textbox', { name: '매장 이름' }), { target: { value: '착안경' } })
    const link = screen.getByRole('link', { name: '웹으로 열기' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(decodeDeck(new URL(link.getAttribute('href')!, 'https://x').searchParams.get('d')).storeName).toBe('착안경')
  })
})
