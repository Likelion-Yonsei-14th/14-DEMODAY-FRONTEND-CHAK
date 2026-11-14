import { describe, expect, it } from 'vitest'
import { EXAM_DATE, VISITOR_SNAPSHOT } from './promotionContent'
import { dailyGrowth, daysBetween, forecast, MAX_DAILY_GROWTH, shortDate, traction, type VisitorDay } from './promotionForecast'

const series = (start: string, values: number[]): VisitorDay[] =>
  values.map((visitors, index) => ({
    date: new Date(Date.parse(`${start}T00:00:00Z`) + index * 86_400_000).toISOString().slice(0, 10),
    visitors,
  }))

describe('visitor forecast', () => {
  it('continues the growth of the last four days up to the exam day', () => {
    const ahead = forecast(VISITOR_SNAPSHOT, EXAM_DATE)
    expect(ahead.map((day) => day.date)).toEqual(['2026-11-14', '2026-11-15', '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19'])
    // 1,170(11/09) → 1,855(11/13): 하루 약 12.2%
    expect(dailyGrowth(VISITOR_SNAPSHOT)).toBeCloseTo(1.1221, 3)
    expect(ahead.at(-1)!.visitors).toBeGreaterThan(3000)
    expect(ahead.every((day, index) => index === 0 || day.visitors > ahead[index - 1]!.visitors)).toBe(true)
  })

  it('sums up the real numbers: first day, latest day, how many times, how many days', () => {
    const result = traction(VISITOR_SNAPSHOT, EXAM_DATE)!
    expect(result.first).toEqual({ date: '2026-10-28', visitors: 131 })
    expect(result.last).toEqual({ date: '2026-11-13', visitors: 1855 })
    expect(result.multiple).toBe(14)
    expect(result.span).toBe(16)
    expect(result.expected).toBe(3700)
  })

  it('never draws a falling forecast and never a steeper one than the cap', () => {
    expect(dailyGrowth(series('2026-11-09', [1000, 900, 800, 700, 600]))).toBe(1)
    expect(dailyGrowth(series('2026-11-09', [100, 200, 400, 800, 1600]))).toBe(MAX_DAILY_GROWTH)
    expect(forecast(series('2026-11-15', [1000, 900, 800, 700, 600]), EXAM_DATE).map((day) => day.visitors)).toEqual([])
    expect(forecast(series('2026-11-13', [1000, 900, 800, 700, 600]), EXAM_DATE).map((day) => day.visitors)).toEqual([600, 600])
  })

  it('skips days without numbers when it measures growth', () => {
    const withGap = series('2026-11-09', [1000, 0, 1210, 0, 0])
    expect(dailyGrowth(withGap)).toBeCloseTo(1.1, 5)
    expect(traction(withGap, EXAM_DATE)!.last.date).toBe('2026-11-11')
  })

  it('has nothing to forecast once the exam day has passed, or without any numbers', () => {
    expect(forecast(series('2026-11-17', [10, 20, 30]), EXAM_DATE)).toEqual([])
    expect(traction(series('2026-11-17', [10, 20, 30]), EXAM_DATE)!.expected).toBeNull()
    expect(traction([], EXAM_DATE)).toBeNull()
    expect(traction(series('2026-11-01', [0, 0]), EXAM_DATE)).toBeNull()
  })

  it('formats dates and counts days', () => {
    expect(shortDate('2026-11-09')).toBe('11/09')
    expect(daysBetween('2026-10-28', '2026-11-13')).toBe(16)
  })
})
