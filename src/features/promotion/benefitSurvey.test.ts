import { describe, expect, it } from 'vitest'
import { BENEFIT_PAGES, toAnswers, validatePage, visibleQuestions, type Values } from './benefitSurvey'

const ids = (page: number, values: Values) => visibleQuestions(BENEFIT_PAGES[page]!, values).map((question) => question.id)

describe('benefit survey questions', () => {
  it('has the four pages of the partner survey', () => {
    expect(BENEFIT_PAGES.map((page) => page.title)).toEqual(['업체 정보', '혜택 내용', '사용 방법', '참여 매장 · 시안 자료'])
  })

  it('shows follow-up questions only for the chosen benefit types', () => {
    expect(ids(1, {})).not.toContain('percent')
    const some = ids(1, { benefits: ['PERCENT', 'SPECIAL_PRICE'] })
    expect(some).toEqual(expect.arrayContaining(['percent', 'regularPrice', 'specialPrice']))
    expect(some).not.toContain('amount')
    expect(ids(1, { target: 'OTHER' })).toContain('targetOther')
  })

  it('asks how coupon codes are issued only when a code method is chosen', () => {
    expect(ids(2, { usageMethods: ['SHOW_EXAM_TICKET'] })).not.toContain('couponIssue')
    for (const method of ['REGISTER_IN_APP', 'MALL_COUPON_CODE', 'BOOKING_COUPON_CODE']) {
      expect(ids(2, { usageMethods: [method] })).toContain('couponIssue')
    }
    const unique = ids(2, { usageMethods: ['REGISTER_IN_APP'], couponIssue: 'UNIQUE_CODES' })
    expect(unique).toEqual(expect.arrayContaining(['couponQuantity', 'couponFileKey']))
    expect(unique).not.toContain('couponCode')
  })

  it('asks for the store list only for some stores', () => {
    expect(ids(3, { scope: 'ALL_STORES' })).not.toContain('storeList')
    expect(ids(3, { scope: 'SOME_STORES' })).toEqual(expect.arrayContaining(['storeList', 'storeFileKey']))
  })
})

describe('benefit survey validation', () => {
  const contact = { brand: '착커피', category: 'CAFE', contactName: '김담당', phone: '010-1234-5678', email: 'kim@chakcoffee.com' }

  it('needs the required contact answers and a valid email and phone', () => {
    expect(Object.keys(validatePage(BENEFIT_PAGES[0]!, {})).sort()).toEqual(['brand', 'category', 'contactName', 'email', 'phone'])
    expect(validatePage(BENEFIT_PAGES[0]!, contact)).toEqual({})
    expect(validatePage(BENEFIT_PAGES[0]!, { ...contact, email: 'nope' }).email).toBeDefined()
    expect(validatePage(BENEFIT_PAGES[0]!, { ...contact, phone: '전화' }).phone).toBeDefined()
  })

  const benefits: Values = {
    target: 'EXAM_TICKET_HOLDER', benefits: ['PERCENT'], percent: '20',
    headlineRaw: '수험생 전 음료 20% 할인', benefitDetail: '수험표를 보여주세요', startDate: '2026-11-20', endDate: '2026-12-31',
  }

  it('takes only whole numbers inside the allowed range', () => {
    expect(validatePage(BENEFIT_PAGES[1]!, benefits)).toEqual({})
    expect(validatePage(BENEFIT_PAGES[1]!, { ...benefits, percent: '20퍼' }).percent).toBe('숫자만 적어 주세요')
    expect(validatePage(BENEFIT_PAGES[1]!, { ...benefits, percent: '101' }).percent).toBeDefined()
    expect(validatePage(BENEFIT_PAGES[1]!, { ...benefits, percent: '0' }).percent).toBeDefined()
  })

  it('needs the follow-up answers of every chosen benefit', () => {
    const errors = validatePage(BENEFIT_PAGES[1]!, { ...benefits, benefits: ['PERCENT', 'FREE_GIFT'] })
    expect(Object.keys(errors)).toEqual(['giftItem'])
  })

  it('keeps the special price below the regular price and the period in order', () => {
    const special: Values = { ...benefits, benefits: ['SPECIAL_PRICE'], regularPrice: '5000', specialPrice: '5000' }
    expect(validatePage(BENEFIT_PAGES[1]!, special).specialPrice).toBeDefined()
    expect(validatePage(BENEFIT_PAGES[1]!, { ...special, specialPrice: '4000' })).toEqual({})
    expect(validatePage(BENEFIT_PAGES[1]!, { ...benefits, endDate: '2026-11-01' }).endDate).toBeDefined()
  })

  it('limits the headline to twenty characters', () => {
    expect(validatePage(BENEFIT_PAGES[1]!, { ...benefits, headlineRaw: '가'.repeat(21) }).headlineRaw).toBeDefined()
  })

  it('needs the logo and at least one place to show it on the last page', () => {
    const errors = validatePage(BENEFIT_PAGES[3]!, {})
    expect(Object.keys(errors).sort()).toEqual(['exposure', 'logoFileKey', 'reviewPeriod', 'scope'])
  })
})

describe('benefit survey answers', () => {
  it('sends numbers as numbers and leaves out follow-ups that are no longer shown', () => {
    const answers = toAnswers({
      brand: ' 착커피 ',
      benefits: ['PERCENT'],
      percent: '20',
      amount: '3000', // 금액 할인을 고르지 않았으니 빠져야 한다
      scope: 'ALL_STORES',
      storeList: '강남역점', // 일부 매장이 아니니 빠져야 한다
      couponGuideUrl: '',
    })
    expect(answers).toEqual({ brand: '착커피', benefits: ['PERCENT'], percent: 20, scope: 'ALL_STORES' })
  })
})
