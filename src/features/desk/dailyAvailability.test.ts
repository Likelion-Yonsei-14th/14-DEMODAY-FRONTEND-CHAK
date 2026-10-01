import { describe, expect, it } from 'vitest'
import {
  formatUnlockAt,
  getDailyUnlockAt,
  getMessageAvailability,
  resolveReadModeNow,
} from './dailyAvailability'

describe('daily message availability', () => {
  it('opens messages received before the cutoff at the same-day cutoff', () => {
    const unlockAt = getDailyUnlockAt(
      '2026-10-02T21:40:00',
      '22:00',
    )

    expect(unlockAt.getFullYear()).toBe(2026)
    expect(unlockAt.getMonth()).toBe(9)
    expect(unlockAt.getDate()).toBe(2)
    expect(unlockAt.getHours()).toBe(22)
    expect(unlockAt.getMinutes()).toBe(0)
  })

  it('moves messages received after the cutoff to the next day', () => {
    const unlockAt = getDailyUnlockAt(
      '2026-10-02T22:30:00',
      '22:00',
    )

    expect(unlockAt.getDate()).toBe(3)
    expect(unlockAt.getHours()).toBe(22)
  })

  it('keeps a post-cutoff message locked until the following cutoff', () => {
    const mode = {
      type: 'daily' as const,
      unlockTime: '22:00',
    }
    const createdAt = '2026-10-02T22:30:00'

    expect(
      getMessageAvailability(
        mode,
        createdAt,
        new Date('2026-10-03T21:59:00'),
      ).available,
    ).toBe(false)

    expect(
      getMessageAvailability(
        mode,
        createdAt,
        new Date('2026-10-03T22:00:00'),
      ).available,
    ).toBe(true)
  })

  it('supports hidden before/after preview states through the query string', () => {
    const mode = {
      type: 'daily' as const,
      unlockTime: '22:00',
    }
    const base = new Date('2026-10-02T12:00:00')

    expect(
      resolveReadModeNow(mode, '?daily=before', base).getHours(),
    ).toBe(21)
    expect(
      resolveReadModeNow(mode, '?daily=before', base).getMinutes(),
    ).toBe(59)
    expect(
      resolveReadModeNow(mode, '?daily=after', base).getHours(),
    ).toBe(22)
    expect(
      resolveReadModeNow(mode, '?daily=after', base).getMinutes(),
    ).toBe(1)
  })

  it('formats same-day and next-day unlock moments for the owner', () => {
    const now = new Date('2026-10-02T12:00:00')

    expect(
      formatUnlockAt(new Date('2026-10-02T22:00:00'), now),
    ).toBe('오늘 오후 10:00')
    expect(
      formatUnlockAt(new Date('2026-10-03T22:00:00'), now),
    ).toBe('내일 오후 10:00')
  })
})
