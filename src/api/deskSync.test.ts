import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  updateDeskSettings: vi.fn(),
  loadOwnerDesk: vi.fn(),
  notifyApiError: vi.fn(),
}))
vi.mock('@/api/config', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/api/config')>()), isApiEnabled: true }))
vi.mock('@/api/community', () => ({ updateDeskSettings: mocks.updateDeskSettings }))
vi.mock('@/api/ownerLoader', () => ({ loadOwnerDesk: mocks.loadOwnerDesk }))
vi.mock('@/api/notify', () => ({ notifyApiError: mocks.notifyApiError }))

import { scheduleDeskSettingsSync } from './deskSync'
import type { Desk, OwnerSettings } from '@/types'

const snapshot = (readMode: Desk['readMode'], supporterToken: string | null = 'tok') => ({
  desk: { displayName: '지수', supporterToken: supporterToken ?? undefined, readMode } as unknown as Desk,
  settings: { publicFeedEnabled: true, defaultMessageVisibility: 'private', pushEnabled: true } as unknown as OwnerSettings,
})

const flush = async () => {
  await vi.advanceTimersByTimeAsync(700)
}

describe('saving the read-mode setting', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    Object.values(mocks).forEach((fn) => fn.mockReset())
    mocks.updateDeskSettings.mockResolvedValue({})
    mocks.loadOwnerDesk.mockResolvedValue(undefined)
  })
  afterEach(() => vi.useRealTimers())

  it('saves once after a burst of changes, then reloads the letters the server re-timed', async () => {
    scheduleDeskSettingsSync(() => snapshot({ type: 'daily', unlockTime: '20:00' }))
    scheduleDeskSettingsSync(() => snapshot({ type: 'daily', unlockTime: '21:00' }))
    scheduleDeskSettingsSync(() => snapshot({ type: 'daily', unlockTime: '22:00' }))
    await flush()

    expect(mocks.updateDeskSettings).toHaveBeenCalledTimes(1)
    expect(mocks.updateDeskSettings).toHaveBeenCalledWith(expect.objectContaining({ dailyUnlockTime: '22:00:00' }))
    expect(mocks.loadOwnerDesk).toHaveBeenCalledTimes(1)
    expect(mocks.updateDeskSettings.mock.invocationCallOrder[0]!).toBeLessThan(mocks.loadOwnerDesk.mock.invocationCallOrder[0]!)
  })

  it('does not reload when saving failed, and tells the user', async () => {
    mocks.updateDeskSettings.mockRejectedValue(new Error('boom'))

    scheduleDeskSettingsSync(() => snapshot({ type: 'daily', unlockTime: '22:00' }))
    await flush()

    expect(mocks.loadOwnerDesk).not.toHaveBeenCalled()
    expect(mocks.notifyApiError).toHaveBeenCalledTimes(1)
  })

  it('skips a half-typed capsule date without saving or reloading', async () => {
    scheduleDeskSettingsSync(() => snapshot({ type: 'time-capsule', unlockAt: '' }))
    await flush()

    expect(mocks.updateDeskSettings).not.toHaveBeenCalled()
    expect(mocks.loadOwnerDesk).not.toHaveBeenCalled()
  })

  it('does nothing for a desk that does not exist on the server yet', async () => {
    scheduleDeskSettingsSync(() => snapshot({ type: 'daily', unlockTime: '22:00' }, null))
    await flush()

    expect(mocks.updateDeskSettings).not.toHaveBeenCalled()
  })
})
