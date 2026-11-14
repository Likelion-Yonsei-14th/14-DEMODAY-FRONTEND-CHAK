/**
 * 매장별 홍보 자료의 수익 계산. 접속자와 비율은 모두 운영자가 화면에서 고칠 수 있는 가정값이다.
 * 예상 접속자 → 혜택함을 여는 수험생 → 매장 근처 수험생 → 방문 → 매출 → 수익 순으로 좁혀 간다.
 */

export type PitchCategory = {
  id: string
  label: string
  /** 한 번 방문에 쓰는 금액(원) */
  spend: number
  /** 매출에서 남는 비율 */
  margin: number
  /** 쿠폰을 본 수험생이 방문하는 비율 */
  conversion: number
}

/** 업종별 기본값. 참고용 가정이고 매장과 상의해 고쳐 쓴다. */
export const PITCH_CATEGORIES: readonly PitchCategory[] = [
  { id: 'hair', label: '미용실 · 염색', spend: 80_000, margin: 0.5, conversion: 0.04 },
  { id: 'optical', label: '렌즈 · 안경', spend: 120_000, margin: 0.4, conversion: 0.03 },
  { id: 'driving', label: '운전면허학원', spend: 700_000, margin: 0.2, conversion: 0.01 },
  { id: 'photo', label: '사진관', spend: 50_000, margin: 0.6, conversion: 0.04 },
  { id: 'fashion', label: '옷 · 패션', spend: 70_000, margin: 0.4, conversion: 0.03 },
  { id: 'park', label: '놀이공원 · 체험', spend: 45_000, margin: 0.3, conversion: 0.03 },
  { id: 'food', label: '음식점 · 카페', spend: 15_000, margin: 0.3, conversion: 0.08 },
  { id: 'nail', label: '네일 · 속눈썹 · 피부관리', spend: 50_000, margin: 0.55, conversion: 0.04 },
  { id: 'clinic', label: '성형외과 · 피부과', spend: 300_000, margin: 0.4, conversion: 0.015 },
  { id: 'fitness', label: '헬스 · PT · 필라테스', spend: 250_000, margin: 0.5, conversion: 0.02 },
  { id: 'phone', label: '휴대폰 · 전자기기', spend: 900_000, margin: 0.1, conversion: 0.01 },
  { id: 'play', label: '노래방 · PC방 · 방탈출', spend: 12_000, margin: 0.5, conversion: 0.08 },
  { id: 'cinema', label: '영화관 · 공연', spend: 14_000, margin: 0.3, conversion: 0.06 },
  { id: 'travel', label: '여행 · 숙박', spend: 150_000, margin: 0.3, conversion: 0.015 },
  { id: 'academy', label: '어학원 · 자격증 학원', spend: 400_000, margin: 0.4, conversion: 0.01 },
  { id: 'cosmetics', label: '화장품 · 향수', spend: 40_000, margin: 0.4, conversion: 0.04 },
  { id: 'etc', label: '기타', spend: 30_000, margin: 0.35, conversion: 0.04 },
]

export type PitchInput = {
  storeName: string
  location: string
  categoryId: string
  /** 지금 일 접속자 */
  visitorsNow: number
  /** 수능 당일 예상 일 접속자 */
  visitorsExpected: number
  /** 혜택함을 여는 비율 */
  openRate: number
  /** 그중 매장에 올 수 있는 거리의 수험생 비율 */
  localRate: number
  conversion: number
  spend: number
  margin: number
  /** 첫 방문 고객 중 다시 오는 비율 */
  revisitRate: number
  /** 다시 오는 고객의 1년 추가 방문 횟수 */
  revisitCount: number
  /** 광고비를 예상 수익의 몇 %로 잡을지(1 미만) */
  priceRatio: number
  /** 매장 한 곳에 제안하는 광고비의 상한(원). 박리다매라 낮게 둔다 */
  priceCap: number
}

export const categoryOf = (id: string) => PITCH_CATEGORIES.find((item) => item.id === id) ?? PITCH_CATEGORIES.at(-1)!

export function defaultInput(categoryId = 'hair'): PitchInput {
  const category = categoryOf(categoryId)
  return {
    storeName: '',
    location: '',
    categoryId: category.id,
    visitorsNow: 2000,
    visitorsExpected: 3700,
    openRate: 0.6,
    localRate: 0.05,
    conversion: category.conversion,
    spend: category.spend,
    margin: category.margin,
    revisitRate: 0.4,
    revisitCount: 3,
    priceRatio: 0.3,
    priceCap: 150_000,
  }
}

/** 업종을 바꾸면 그 업종의 객단가·수익률·전환율로 바꾼다. 나머지 입력은 그대로 둔다. */
export function withCategory(input: PitchInput, categoryId: string): PitchInput {
  const category = categoryOf(categoryId)
  return { ...input, categoryId: category.id, spend: category.spend, margin: category.margin, conversion: category.conversion }
}

export type PitchResult = {
  /** 혜택함에서 이 매장 쿠폰을 보게 될 매장 근처 수험생 수 */
  reach: number
  visits: number
  sales: number
  /** 광고로 기대하는 수익(매출 × 수익률) */
  profit: number
  /** 제안 광고비: 예상 수익보다 항상 작다 */
  adPrice: number
  /** 광고비를 빼고 남는 수익 */
  net: number
  /** 재방문으로 1년 동안 더 기대하는 수익 */
  loyaltyProfit: number
  revisitors: number
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(Number.isFinite(value) ? value : min, min), max)

export function estimate(input: PitchInput): PitchResult {
  const reach = Math.round(clamp(input.visitorsExpected, 0, 10_000_000) * clamp(input.openRate, 0, 1) * clamp(input.localRate, 0, 1))
  const visits = Math.round(reach * clamp(input.conversion, 0, 1))
  const spend = clamp(input.spend, 0, 100_000_000)
  const margin = clamp(input.margin, 0, 1)
  const sales = visits * spend
  const profit = Math.round(sales * margin)
  // 상한을 넘지 않게 하고 1,000원 단위로 내린다. 예상 수익과 같아지지 않게 한다
  const capped = Math.min(profit * clamp(input.priceRatio, 0, 0.95), clamp(input.priceCap, 0, 100_000_000))
  const adPrice = Math.max(Math.min(Math.floor(capped / 1000) * 1000, profit - 1), 0)
  const revisitors = Math.round(visits * clamp(input.revisitRate, 0, 1))
  const loyaltyProfit = Math.round(revisitors * clamp(input.revisitCount, 0, 365) * spend * margin)
  return { reach, visits, sales, profit, adPrice, net: profit - adPrice, loyaltyProfit, revisitors }
}

export const won = (value: number) => `${Math.round(value).toLocaleString('ko-KR')}원`
export const people = (value: number) => `${Math.round(value).toLocaleString('ko-KR')}명`
export const percent = (value: number) => `${Math.round(value * 1000) / 10}%`
