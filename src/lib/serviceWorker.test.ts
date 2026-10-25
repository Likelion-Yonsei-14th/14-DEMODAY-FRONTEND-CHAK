import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'

type Listener = (event: Record<string, unknown>) => void

/** public/sw.js를 가짜 서비스 워커 환경에서 돌려, 알림을 보여 주고 누르면 열리는 동작을 확인한다. */
function load() {
  const listeners = new Map<string, Listener>()
  const showNotification = vi.fn().mockResolvedValue(undefined)
  const openWindow = vi.fn().mockResolvedValue(undefined)
  const matchAll = vi.fn().mockResolvedValue([])
  const self = {
    addEventListener: (type: string, listener: Listener) => listeners.set(type, listener),
    skipWaiting: vi.fn(),
    clients: { claim: vi.fn().mockResolvedValue(undefined), matchAll, openWindow },
    registration: { showNotification },
    location: { origin: 'https://www.chak.live' },
  }
  new Function('self', readFileSync('public/sw.js', 'utf8'))(self)
  return { listeners, showNotification, openWindow, matchAll }
}

const pushEvent = (payload: string | null) => {
  const waits: Promise<unknown>[] = []
  return {
    data: payload === null ? null : { json: () => JSON.parse(payload) },
    waitUntil: (promise: Promise<unknown>) => waits.push(promise),
    waits,
  }
}

describe('service worker (public/sw.js)', () => {
  it('shows the notification with the title, text and the page to open', async () => {
    const { listeners, showNotification } = load()
    const event = pushEvent('{"title":"착","body":"응원에 답장이 도착했어요","url":"/desk/abc/replies","tag":"reply"}')
    listeners.get('push')!(event)
    await Promise.all(event.waits)

    expect(showNotification).toHaveBeenCalledWith('착', expect.objectContaining({
      body: '응원에 답장이 도착했어요',
      tag: 'reply',
      icon: '/assets/brand/chak-icon-192.png',
      data: { url: '/desk/abc/replies' },
    }))
  })

  it('still shows something sensible for an empty or broken message, and never points outside the site', async () => {
    const { listeners, showNotification } = load()
    for (const payload of [null, 'not json', '{"url":"//evil.example.com/x"}', '{"url":"https://evil.example.com"}', '{"url":42}']) {
      const event = pushEvent(payload)
      listeners.get('push')!(event)
      await Promise.all(event.waits)
    }
    const calls = showNotification.mock.calls as Array<[string, { body: string; data: { url: string } }]>
    expect(calls).toHaveLength(5)
    for (const [title, options] of calls) {
      expect(title).toBe('착')
      expect(options.body).toBeTruthy()
      expect(options.data.url).toBe('/')
    }
  })

  it('opens the page when the notification is tapped: reuses an open tab of the site or opens a new one', async () => {
    const reused = load()
    const focus = vi.fn().mockResolvedValue(undefined)
    const navigate = vi.fn().mockResolvedValue({ focus })
    reused.matchAll.mockResolvedValue([{ url: 'https://www.chak.live/home', focus, navigate }])
    const close = vi.fn()
    const click = { notification: { close, data: { url: '/desk/abc/replies' } }, waitUntil: vi.fn() }
    reused.listeners.get('notificationclick')!(click)
    await click.waitUntil.mock.calls[0]![0]
    expect(close).toHaveBeenCalled()
    expect(navigate).toHaveBeenCalledWith('/desk/abc/replies')
    expect(focus).toHaveBeenCalled()

    const fresh = load()
    const openClick = { notification: { close: vi.fn(), data: { url: '//evil.example.com' } }, waitUntil: vi.fn() }
    fresh.listeners.get('notificationclick')!(openClick)
    await openClick.waitUntil.mock.calls[0]![0]
    expect(fresh.openWindow).toHaveBeenCalledWith('/')
  })
})
