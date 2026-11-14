import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { defaultInput, estimate, PITCH_CATEGORIES, withCategory } from './pitchModel'
import { buildSlides, deckFileName, josa } from './pitchSlides'

const pptx = vi.hoisted(() => ({ downloadDeck: vi.fn() }))
vi.mock('./pitchPptx', () => pptx)

import { PitchDeckPage } from './PitchDeckPage'

describe('pitch estimate', () => {
  it('narrows the expected visitors down to visits, profit and an ad price below the profit', () => {
    const result = estimate(defaultInput('hair'))
    // 3,700 × 60% × 15% = 333명 → 4% = 13명 → 80,000원 × 50%
    expect(result.reach).toBe(333)
    expect(result.visits).toBe(13)
    expect(result.sales).toBe(1_040_000)
    expect(result.profit).toBe(520_000)
    expect(result.adPrice).toBe(260_000)
    expect(result.net).toBe(260_000)
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

  it('adds the profit from customers who come back', () => {
    const result = estimate(defaultInput('hair'))
    // 13명 × 40% = 5명 × 3회 × 80,000원 × 50%
    expect(result.revisitors).toBe(5)
    expect(result.loyaltyProfit).toBe(600_000)
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
    expect(slides[2]!.title).toBe('신촌역 근처 수험생이 매일 착을 열어요')
    expect(slides[2]!.stats!.map((stat) => stat.value)).toEqual(['2,000명', '3,700명'])
  })

  it('shows the expected profit next to a smaller ad price', () => {
    const revenue = buildSlides(input)[4]!
    expect(revenue.kicker).toBe('착헤어 예상 수익')
    expect(revenue.stats!.map((stat) => stat.value)).toEqual(['333명', '13명', '520,000원', '260,000원'])
    expect(revenue.bullets!.join(' ')).toContain('광고비를 빼고도 260,000원이 남아요')
  })

  it('pitches first-store loyalty with the extra yearly profit', () => {
    const loyalty = buildSlides(input)[5]!
    expect(loyalty.title).toBe('수험생의 첫 단골 매장이 되세요')
    expect(loyalty.stats!.at(-1)!.value).toBe('600,000원')
    expect(loyalty.bullets!.join(' ')).toContain('사회 초년생')
  })

  it('reads naturally without a store name, and picks the right particles', () => {
    expect(buildSlides(defaultInput())[0]!.title).toBe('수능이 끝나면, 우리 매장으로.')
    expect(josa('착안경', '으로', '로')).toBe('착안경으로')
    expect(josa('착헤어살롱', '을', '를')).toBe('착헤어살롱을')
    expect(josa('CHAK', '을', '를')).toBe('CHAK를')
    expect(josa('스마일', '으로', '로')).toBe('스마일로')
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
    // 333명 × 3% = 10명 × 120,000원 × 40% = 480,000원 → 광고비 240,000원
    const result = within(screen.getByLabelText('계산 결과'))
    expect(result.getByText('480,000원')).toBeInTheDocument()
    expect(result.getByText('240,000원')).toBeInTheDocument()
  })

  it('recalculates when an assumption is changed', () => {
    render(<PitchDeckPage />)
    fireEvent.change(screen.getByRole('spinbutton', { name: '수능 당일 예상 접속자 (명)' }), { target: { value: '7400' } })
    expect(within(screen.getByLabelText('계산 결과')).getByText('666명')).toBeInTheDocument()
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
