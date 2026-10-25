import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const apiFetch = vi.fn()
const getVisitorGeo = vi.fn()

/** 위치를 기다린 뒤 보내므로 한 번 비워 준다. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

async function load(apiUrl = 'http://api.test') {
  vi.resetModules()
  vi.stubEnv('VITE_API_URL', apiUrl)
  vi.doMock('@/api/client', () => ({ apiFetch }))
  vi.doMock('@/api/geo', () => ({ getVisitorGeo }))
  const mod = await import('@/api/analytics')
  mod.resetPageViewTracking()
  return mod
}

describe('trackPageView', () => {
  beforeEach(() => {
    apiFetch.mockReset()
    apiFetch.mockResolvedValue({})
    getVisitorGeo.mockReset()
    getVisitorGeo.mockResolvedValue(null)
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.doUnmock('@/api/client')
    vi.doUnmock('@/api/geo')
  })

  it('sends a page view with only the path, a session id and a unique event id', async () => {
    const { trackPageView } = await load()
    trackPageView('/desk/abc')
    await flush()

    expect(apiFetch).toHaveBeenCalledTimes(1)
    const [path, options] = apiFetch.mock.calls[0] as [string, { method: string; body: Record<string, string> }]
    expect(path).toBe('/api/public/analytics/events')
    expect(options.method).toBe('POST')
    expect(options).toMatchObject({ quiet: true })
    expect(options.body).toMatchObject({ eventType: 'PAGE_VIEW', path: '/desk/abc' })
    expect(options.body.eventId).toBeTruthy()
    expect(options.body.sessionId).toBeTruthy()
  })

  it('keeps one session id per tab session', async () => {
    const { trackPageView } = await load()
    trackPageView('/a')
    trackPageView('/b')
    await flush()
    const ids = apiFetch.mock.calls.map(([, o]) => (o as { body: { sessionId: string } }).body.sessionId)
    expect(new Set(ids).size).toBe(1)
  })

  it('does not repeat the same path back to back', async () => {
    const { trackPageView } = await load()
    trackPageView('/same')
    trackPageView('/same')
    trackPageView('/other')
    trackPageView('/same')
    await flush()
    expect(apiFetch).toHaveBeenCalledTimes(3)
  })

  it('ignores the operators console and runs only with a backend', async () => {
    const { trackPageView } = await load()
    trackPageView('/admin')
    trackPageView('/admin/users')
    await flush()
    expect(apiFetch).not.toHaveBeenCalled()

    const offline = await load('')
    offline.trackPageView('/home')
    await flush()
    expect(apiFetch).not.toHaveBeenCalled()
  })

  it('never throws when the request fails', async () => {
    apiFetch.mockRejectedValue(new Error('down'))
    const { trackPageView } = await load()
    expect(() => trackPageView('/x')).not.toThrow()
    await flush()
  })

  it('adds the visitor country and province when the host provided them', async () => {
    getVisitorGeo.mockResolvedValue({ country: 'KR', region: '11' })
    const { trackPageView } = await load()
    trackPageView('/home')
    await flush()
    expect(apiFetch.mock.calls[0]![1]).toMatchObject({ body: { geoCountry: 'KR', geoRegion: '11' } })
  })

  it('still counts the visit when the location is unavailable', async () => {
    getVisitorGeo.mockResolvedValue(null)
    const { trackPageView } = await load()
    trackPageView('/home')
    await flush()
    const body = (apiFetch.mock.calls[0]![1] as { body: Record<string, unknown> }).body
    expect(body.path).toBe('/home')
    expect(body.geoCountry).toBeUndefined()
    expect(body.geoRegion).toBeUndefined()
  })
})
