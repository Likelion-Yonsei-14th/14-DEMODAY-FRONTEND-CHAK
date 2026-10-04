import { describe, expect, it } from 'vitest'
import {
  formatUnlockAt,
  getDailyUnlockAt,
  getMessageAvailability,
  resolvePreviewReadMode,
  resolveReadModeNow,
} from './dailyAvailability'

describe('message availability', () => {
  it('opens daily messages received before the cutoff at the same-day cutoff', () => {
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

  it('moves daily messages received after the cutoff to the next day', () => {
    const unlockAt = getDailyUnlockAt(
      '2026-10-02T22:30:00',
      '22:00',
    )

    expect(unlockAt.getDate()).toBe(3)
    expect(unlockAt.getHours()).toBe(22)
  })

  it('keeps a post-cutoff daily message locked until the following cutoff', () => {
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

  it('locks every time-capsule message until the single unlock moment', () => {
    const mode = {
      type: 'time-capsule' as const,
      unlockAt: '2026-11-18T20:00',
    }

    expect(
      getMessageAvailability(
        mode,
        '2026-10-01T12:00:00',
        new Date('2026-11-18T19:59:00'),
      ).available,
    ).toBe(false)

    expect(
      getMessageAvailability(
        mode,
        '2026-10-01T12:00:00',
        new Date('2026-11-18T20:00:00'),
      ).available,
    ).toBe(true)
  })

  it('keeps the capsule open for messages that arrive after unlock', () => {
    const mode = {
      type: 'time-capsule' as const,
      unlockAt: '2026-11-18T20:00',
    }

    expect(
      getMessageAvailability(
        mode,
        '2026-11-19T09:00:00',
        new Date('2026-11-19T09:01:00'),
      ).available,
    ).toBe(true)
  })

  it('supports hidden daily before/after preview states', () => {
    const mode = {
      type: 'daily' as const,
      unlockTime: '22:00',
    }
    const base = new Date('2026-10-02T12:00:00')

    expect(
      resolveReadModeNow(mode, '?daily=before', base).getHours(),
    ).toBe(21)
    expect(
      resolveReadModeNow(mode, '?daily=after', base).getHours(),
    ).toBe(22)
  })

  it('supports hidden capsule preview states without changing stored desk data', () => {
    const storedMode = {
      type: 'daily' as const,
      unlockTime: '22:00',
    }
    const previewMode = resolvePreviewReadMode(
      storedMode,
      '?capsule=before',
    )

    expect(previewMode).toEqual({
      type: 'time-capsule',
      unlockAt: '2026-11-18T20:00',
    })

    expect(
      resolveReadModeNow(
        previewMode,
        '?capsule=before',
        new Date('2026-10-02T12:00:00'),
      ).getTime(),
    ).toBe(new Date('2026-11-18T19:59:00').getTime())

    expect(
      resolveReadModeNow(
        previewMode,
        '?capsule=after',
        new Date('2026-10-02T12:00:00'),
      ).getTime(),
    ).toBe(new Date('2026-11-18T20:01:00').getTime())
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
