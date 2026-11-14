/**
 * 접속자 그래프의 숫자. 실제 값은 서버가 주고, 수능 당일까지의 예상은 최근 증가율을 그대로 이어서 계산한다.
 * 집계가 없는 날(0명)은 증가율 계산과 배수 계산에서 뺀다.
 */

export type VisitorDay = { date: string; visitors: number }

/** 예상에 쓰는 최근 구간(일). 11/09 이후의 완만해진 증가세를 반영한다. */
export const GROWTH_WINDOW_DAYS = 4
/** 하루 증가율은 이 범위 안에서만 쓴다(줄어드는 예상이나 지나치게 가파른 예상은 그리지 않는다). */
export const MIN_DAILY_GROWTH = 1
export const MAX_DAILY_GROWTH = 1.25

const DAY_MS = 86_400_000
const toTime = (date: string) => Date.parse(`${date}T00:00:00Z`)
const toDate = (time: number) => new Date(time).toISOString().slice(0, 10)

export const daysBetween = (from: string, to: string) => Math.round((toTime(to) - toTime(from)) / DAY_MS)

/** 최근 구간의 하루 평균 증가율(복리). 값이 모자라면 1. */
export function dailyGrowth(days: readonly VisitorDay[]): number {
  const counted = days.filter((day) => day.visitors > 0)
  const last = counted.at(-1)
  if (!last) return 1
  const base = counted.find((day) => daysBetween(day.date, last.date) <= GROWTH_WINDOW_DAYS)
  if (!base || base.date === last.date) return 1
  const rate = (last.visitors / base.visitors) ** (1 / daysBetween(base.date, last.date))
  return Math.min(Math.max(rate, MIN_DAILY_GROWTH), MAX_DAILY_GROWTH)
}

/** 마지막 실제 날 다음 날부터 `until`(수능 당일)까지의 예상. 이미 지났으면 빈 배열. */
export function forecast(days: readonly VisitorDay[], until: string): VisitorDay[] {
  const last = days.filter((day) => day.visitors > 0).at(-1)
  if (!last) return []
  const rate = dailyGrowth(days)
  const result: VisitorDay[] = []
  for (let step = 1; step <= daysBetween(last.date, until); step += 1) {
    result.push({ date: toDate(toTime(last.date) + step * DAY_MS), visitors: Math.round(last.visitors * rate ** step) })
  }
  return result
}

export type Traction = {
  first: VisitorDay
  last: VisitorDay
  /** 첫날 대비 몇 배인지(반올림) */
  multiple: number
  /** 첫날부터 마지막 실제 날까지 며칠인지 */
  span: number
  forecast: VisitorDay[]
  /** 수능 당일 예상(100명 단위로 내림). 예상 구간이 없으면 null */
  expected: number | null
}

export function traction(days: readonly VisitorDay[], until: string): Traction | null {
  const counted = days.filter((day) => day.visitors > 0)
  const first = counted[0]
  const last = counted.at(-1)
  if (!first || !last) return null
  const ahead = forecast(days, until)
  const peak = ahead.at(-1)
  return {
    first,
    last,
    multiple: Math.round(last.visitors / first.visitors),
    span: daysBetween(first.date, last.date),
    forecast: ahead,
    expected: peak ? Math.floor(peak.visitors / 100) * 100 : null,
  }
}

/** '2026-11-09' → '11/09' */
export const shortDate = (date: string) => `${date.slice(5, 7)}/${date.slice(8, 10)}`
