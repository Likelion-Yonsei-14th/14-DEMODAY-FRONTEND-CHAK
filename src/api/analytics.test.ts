import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const apiFetch = vi.fn()

async function load(apiUrl = 'http://api.test') {
  vi.resetModules()
  vi.stubEnv('VITE_API_URL', apiUrl)
  vi.doMock('@/api/client', () => ({ apiFetch }))
  const mod = await import('@/api/analytics')
  mod.resetPageViewTracking()
  return mod
}

describe('trackPageView', () => {
  beforeEach(() => {
    apiFetch.mockReset()
    apiFetch.mockResolvedValue({})
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.doUnmock('@/api/client')
  })

  it('sends a page view with only the path, a session id and a unique event id', async () => {
    const { trackPageView } = await load()
    trackPageView('/desk/abc')

    expect(apiFetch).toHaveBeenCalledTimes(1)
    const [path, options] = apiFetch.mock.calls[0] as [string, { method: string; body: Record<string, string> }]
    expect(path).toBe('/api/public/analytics/events')
    expect(options.method).toBe('POST')
    expect(options.body).toMatchObject({ eventType: 'PAGE_VIEW', path: '/desk/abc' })
    expect(options.body.eventId).toBeTruthy()
    expect(options.body.sessionId).toBeTruthy()
  })

  it('keeps one session id per tab session', async () => {
    const { trackPageView } = await load()
    trackPageView('/a')
    trackPageView('/b')
    const ids = apiFetch.mock.calls.map(([, o]) => (o as { body: { sessionId: string } }).body.sessionId)
    expect(new Set(ids).size).toBe(1)
  })

  it('does not repeat the same path back to back', async () => {
    const { trackPageView } = await load()
    trackPageView('/same')
    trackPageView('/same')
    trackPageView('/other')
    trackPageView('/same')
    expect(apiFetch).toHaveBeenCalledTimes(3)
  })

  it('ignores the operators console and runs only with a backend', async () => {
    const { trackPageView } = await load()
    trackPageView('/admin')
    trackPageView('/admin/users')
    expect(apiFetch).not.toHaveBeenCalled()

    const offline = await load('')
    offline.trackPageView('/home')
    expect(apiFetch).not.toHaveBeenCalled()
  })

  it('never throws when the request fails', async () => {
    apiFetch.mockRejectedValue(new Error('down'))
    const { trackPageView } = await load()
    expect(() => trackPageView('/x')).not.toThrow()
  })
})
