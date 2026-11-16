import type { Discount } from './discountData'

/** 오늘(한국 날짜) "YYYY-MM-DD". */
export function seoulToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

export type DiscountTiming = 'ongoing' | 'soon' | 'ended'

/** 진행 중, 아직 시작 전, 끝남. 날짜가 없으면 진행 중으로 본다. */
export function timingOf(discount: Discount, today: string): DiscountTiming {
  if (discount.end && discount.end < today) return 'ended'
  if (discount.start && discount.start > today) return 'soon'
  return 'ongoing'
}

const md = (date: string) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`

/** "11/19 ~ 12/31", "~ 11/30", "11/21 하루", "기간은 출처에서 확인". 해가 넘어가면 연도를 붙인다. */
export function periodLabel(discount: Discount): string {
  const { start, end } = discount
  const withYear = (date: string) => (date.slice(0, 4) !== '2026' ? `${date.slice(0, 4)}. ${md(date)}` : md(date))
  if (start && end && start === end) return `${md(start)} 하루`
  if (start && end) return `${md(start)} ~ ${withYear(end)}`
  if (end) return `~ ${withYear(end)}`
  if (start) return `${md(start)}부터`
  return '기간은 출처에서 확인'
}

/** 끝난 것은 빼고, 진행 중 → 곧 시작 순서로. 같은 묶음은 일찍 끝나는 것부터(급한 것 먼저). */
export function visibleDiscounts(
  discounts: readonly Discount[],
  today: string,
  filter: { category: string | null; area: string | null },
): Discount[] {
  const rank = { ongoing: 0, soon: 1, ended: 2 } as const
  return discounts
    .filter((d) => timingOf(d, today) !== 'ended')
    .filter((d) => !filter.category || d.category === filter.category)
    // 지역을 고르면 그 지역 혜택과 전국 혜택을 같이 보여 준다
    .filter((d) => !filter.area || d.area === filter.area || d.area === '전국')
    .sort(
      (a, b) =>
        rank[timingOf(a, today)] - rank[timingOf(b, today)] ||
        (a.end ?? '9999').localeCompare(b.end ?? '9999') ||
        a.brand.localeCompare(b.brand, 'ko'),
    )
}

/** 출처 표시용 짧은 주소("fnnews.com"). */
export function sourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^(www|view|m)\./, '')
  } catch {
    return '출처'
  }
}
