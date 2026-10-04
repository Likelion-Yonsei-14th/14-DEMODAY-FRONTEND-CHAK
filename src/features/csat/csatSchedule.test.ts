import { describe, expect, it } from 'vitest'
import {
  getCsatDdayLabel,
  getCsatExamDate,
  getDefaultCapsuleUnlockAt,
} from './csatSchedule'

describe('CSAT schedule', () => {
  it('uses the official 2027 academic-year CSAT date', () => {
    const date = getCsatExamDate()

    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(10)
    expect(date.getDate()).toBe(19)
  })

  it('calculates D-day from the current calendar date', () => {
    expect(
      getCsatDdayLabel(new Date(2026, 9, 2, 12, 0)),
    ).toBe('수능까지 D-48')
  })

  it('uses the CSAT eve at 8 PM as the default capsule opening', () => {
    expect(getDefaultCapsuleUnlockAt()).toBe(
      '2026-11-18T20:00',
    )
  })

  it('handles exam day and dates after the exam', () => {
    expect(
      getCsatDdayLabel(new Date(2026, 10, 19, 8, 0)),
    ).toBe('오늘이 수능이에요')

    expect(
      getCsatDdayLabel(new Date(2026, 10, 20, 8, 0)),
    ).toBe('수능이 끝났어요')
  })
})
