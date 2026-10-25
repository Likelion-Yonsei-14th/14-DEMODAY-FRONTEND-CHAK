import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/client'

const apiFetch = vi.fn()
vi.mock('@/api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/client')>()),
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}))

import { disablePush, enablePush, isPushSubscribed, pushFailureMessage, pushHelp, PushError, pushSupport } from './push'

/** 서버 공개키(65바이트)를 base64url로 만든 값. */
const PUBLIC_KEY = btoa(String.fromCharCode(4, ...Array.from({ length: 64 }, (_, i) => i + 1)))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

function stubBrowser({ userAgent = 'Mozilla/5.0 Chrome', capable = true, permission = 'granted', standalone = false } = {}) {
  const subscription = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
    toJSON: () => ({ endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys: { p256dh: 'P', auth: 'A' } }),
    unsubscribe: vi.fn().mockResolvedValue(true),
  }
  const registration = {
    pushManager: { getSubscription: vi.fn().mockResolvedValue(null), subscribe: vi.fn().mockResolvedValue(subscription) },
  }
  const serviceWorker = {
    register: vi.fn().mockResolvedValue(registration),
    ready: Promise.resolve(registration),
    getRegistration: vi.fn().mockResolvedValue(registration),
  }
  vi.stubGlobal('navigator', { userAgent, standalone, ...(capable ? { serviceWorker } : {}) })
  if (capable) {
    vi.stubGlobal('PushManager', class {})
    vi.stubGlobal('Notification', { permission, requestPermission: vi.fn().mockResolvedValue(permission) })
    ;(window as unknown as Record<string, unknown>).PushManager = class {}
    ;(window as unknown as Record<string, unknown>).Notification = (globalThis as unknown as Record<string, unknown>).Notification
  } else {
    delete (window as unknown as Record<string, unknown>).PushManager
    delete (window as unknown as Record<string, unknown>).Notification
    vi.stubGlobal('Notification', undefined)
  }
  return { subscription, registration, serviceWorker }
}

beforeEach(() => apiFetch.mockReset())
afterEach(() => {
  vi.unstubAllGlobals()
  delete (window as unknown as Record<string, unknown>).PushManager
  delete (window as unknown as Record<string, unknown>).Notification
})

describe('what this browser can do', () => {
  it('tells apart browsers that can, iPhones that need the app installed, in-app browsers and the rest', () => {
    stubBrowser()
    expect(pushSupport()).toBe('supported')

    stubBrowser({ userAgent: 'Mozilla/5.0 (iPhone) Safari', capable: false })
    expect(pushSupport()).toBe('needs-install')

    stubBrowser({ userAgent: 'Mozilla/5.0 (Linux; Android) KAKAOTALK 10.0', capable: true })
    expect(pushSupport()).toBe('in-app')

    stubBrowser({ userAgent: 'Mozilla/5.0 old browser', capable: false })
    expect(pushSupport()).toBe('unsupported')
  })

  it('has a helpful line for every case that cannot turn it on', () => {
    expect(pushHelp('needs-install')).toContain('홈 화면에 추가')
    expect(pushHelp('in-app')).toContain('Safari나 Chrome')
    expect(pushHelp('unsupported')).toContain('지원하지 않아요')
    expect(pushHelp('supported')).toBeNull()
    for (const reason of ['denied', 'not-available', 'identity-required', 'unsupported', 'failed'] as const) {
      expect(pushFailureMessage(reason).length).toBeGreaterThan(5)
    }
  })
})

describe('turning notifications on', () => {
  it('asks permission, subscribes with the server key and saves the subscription', async () => {
    const { registration, serviceWorker } = stubBrowser()
    apiFetch.mockResolvedValueOnce({ enabled: true, publicKey: PUBLIC_KEY }).mockResolvedValueOnce(undefined)

    await enablePush()

    expect(serviceWorker.register).toHaveBeenCalledWith('/sw.js')
    const options = registration.pushManager.subscribe.mock.calls[0]![0] as { userVisibleOnly: boolean; applicationServerKey: Uint8Array }
    expect(options.userVisibleOnly).toBe(true)
    expect(options.applicationServerKey).toHaveLength(65)
    expect(options.applicationServerKey[0]).toBe(4)
    const [path, request] = apiFetch.mock.calls[1] as [string, { method: string; body: unknown }]
    expect(path).toBe('/api/public/push/subscription')
    expect(request).toMatchObject({ method: 'PUT', body: { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys: { p256dh: 'P', auth: 'A' } } })
  })

  it('stops at once when the person says no, without calling the server', async () => {
    stubBrowser({ permission: 'denied' })
    await expect(enablePush()).rejects.toMatchObject({ reason: 'denied' })
    expect(apiFetch).not.toHaveBeenCalled()
  })

  it('says it is not ready when the server has no keys yet', async () => {
    stubBrowser()
    apiFetch.mockResolvedValueOnce({ enabled: false, publicKey: null })
    await expect(enablePush()).rejects.toMatchObject({ reason: 'not-available' })
  })

  it('asks for a first message when the server does not know the guest yet', async () => {
    stubBrowser()
    apiFetch.mockResolvedValueOnce({ enabled: true, publicKey: PUBLIC_KEY })
      .mockRejectedValueOnce(new ApiError(401, { code: 'IDENTITY_REQUIRED', message: 'x' }))
    await expect(enablePush()).rejects.toMatchObject({ reason: 'identity-required' })
  })

  it('reports an unexpected failure as a plain failure and refuses where push does not exist', async () => {
    stubBrowser()
    apiFetch.mockResolvedValueOnce({ enabled: true, publicKey: PUBLIC_KEY }).mockRejectedValueOnce(new Error('network'))
    await expect(enablePush()).rejects.toBeInstanceOf(PushError)

    stubBrowser({ capable: false })
    await expect(enablePush()).rejects.toMatchObject({ reason: 'unsupported' })
  })
})

describe('turning notifications off', () => {
  it('removes the subscription on the server and in the browser', async () => {
    const { subscription, registration } = stubBrowser()
    registration.pushManager.getSubscription.mockResolvedValue(subscription)
    apiFetch.mockResolvedValue(undefined)

    expect(await isPushSubscribed()).toBe(true)
    await disablePush()

    expect(apiFetch).toHaveBeenCalledWith('/api/public/push/subscription', expect.objectContaining({ method: 'DELETE', body: { endpoint: subscription.endpoint } }))
    expect(subscription.unsubscribe).toHaveBeenCalled()
  })

  it('still unsubscribes the browser when the server cannot be reached, and does nothing without a subscription', async () => {
    const { subscription, registration } = stubBrowser()
    registration.pushManager.getSubscription.mockResolvedValue(subscription)
    apiFetch.mockRejectedValue(new Error('offline'))
    await disablePush()
    expect(subscription.unsubscribe).toHaveBeenCalled()

    registration.pushManager.getSubscription.mockResolvedValue(null)
    apiFetch.mockReset()
    await disablePush()
    expect(apiFetch).not.toHaveBeenCalled()
    expect(await isPushSubscribed()).toBe(false)
  })
})
