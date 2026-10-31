import { describe, expect, it } from 'vitest'
import { getMessageAvailability } from './dailyAvailability'
import type { ReadMode } from '@/types'

const daily: ReadMode = { type: 'daily', unlockTime: '22:00' }
const capsule = (unlockAt: string): ReadMode => ({ type: 'time-capsule', unlockAt })

describe('when a letter counts as open', () => {
  it('opens at the exact unlock moment, not a millisecond before', () => {
    const unlockAt = '2026-10-31T13:00:00.000Z'
    const at = new Date(unlockAt)

    expect(getMessageAvailability(daily, '2026-10-31T07:52:00Z', new Date(at.getTime() - 1), unlockAt).available).toBe(false)
    expect(getMessageAvailability(daily, '2026-10-31T07:52:00Z', at, unlockAt).available).toBe(true)
  })

  it("follows the server's unlock time, not the desk setting held on this screen", () => {
    // The owner just moved the desk to 'daily 22:00' here, but the server still
    // says this letter opened an hour ago.
    const now = new Date('2026-10-31T08:00:00Z')

    expect(getMessageAvailability(daily, '2026-10-31T07:52:00Z', now, '2026-10-31T07:00:00Z').available).toBe(true)
    // And the reverse: setting says open long ago, the server says still locked.
    expect(
      getMessageAvailability(capsule('2026-01-01T00:00:00Z'), '2026-10-31T07:52:00Z', now, '2026-11-01T00:00:00Z').available,
    ).toBe(false)
  })

  it('reports when a locked letter opens so the screen can say so', () => {
    const result = getMessageAvailability(daily, '2026-10-31T07:52:00Z', new Date('2026-10-31T08:00:00Z'), '2026-11-01T13:00:00Z')

    expect(result.available).toBe(false)
    expect(result.unlockAt?.toISOString()).toBe('2026-11-01T13:00:00.000Z')
  })

  it('treats an unreadable unlock time as locked rather than open', () => {
    const result = getMessageAvailability(daily, '2026-10-31T07:52:00Z', new Date(), 'not-a-date')

    expect(result.available).toBe(false)
  })

  it('a letter sent exactly at the daily cutoff still opens at that cutoff', () => {
    const created = new Date(2026, 9, 31, 22, 0, 0, 0)
    const result = getMessageAvailability(daily, created.toISOString(), new Date(created.getTime() + 1))

    expect(result.available).toBe(true)
    expect(result.unlockAt?.getTime()).toBe(created.getTime())
  })

  it('without a server time, a letter sent a minute after the cutoff waits for the next day', () => {
    const created = new Date(2026, 9, 31, 22, 1, 0, 0)
    const sameNight = new Date(2026, 9, 31, 23, 59, 0, 0)
    const nextEvening = new Date(2026, 10, 1, 22, 0, 0, 0)

    expect(getMessageAvailability(daily, created.toISOString(), sameNight).available).toBe(false)
    expect(getMessageAvailability(daily, created.toISOString(), nextEvening).available).toBe(true)
  })
})
