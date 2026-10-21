import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fetchMock = vi.fn()

async function load(env: Record<string, string> = { VITE_API_URL: 'http://api.test', VITE_ERROR_REPORTING: 'on' }) {
  vi.resetModules()
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value)
  return import('@/lib/errorReporter')
}

describe('errorReporter', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    fetchMock.mockResolvedValue(new Response(null, { status: 202 }))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('posts a trimmed report to the backend', async () => {
    const { reportError, getLastReportId } = await load()
    reportError({ kind: 'api_error', message: 'boom', apiPath: '/api/x?token=secret', status: 500, code: 'INTERNAL_SERVER_ERROR' })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('http://api.test/api/public/client-errors')
    expect(init.keepalive).toBe(true)
    const body = JSON.parse(init.body as string)
    expect(body).toMatchObject({ kind: 'api_error', message: 'boom', apiPath: '/api/x', status: 500 })
    expect(body.reportId).toBe(getLastReportId())
    expect(JSON.stringify(body)).not.toContain('secret')
  })

  it('does nothing without a backend or when reporting is off', async () => {
    const { reportError } = await load({ VITE_API_URL: '', VITE_ERROR_REPORTING: 'on' })
    reportError({ kind: 'js_error', message: 'x' })
    expect(fetchMock).not.toHaveBeenCalled()

    const second = await load({ VITE_API_URL: 'http://api.test', VITE_ERROR_REPORTING: 'off' })
    second.reportError({ kind: 'js_error', message: 'x' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('skips known noise', async () => {
    const { reportError } = await load()
    reportError({ kind: 'js_error', message: 'ResizeObserver loop completed with undelivered notifications.' })
    reportError({ kind: 'js_error', message: 'Script error.' })
    reportError({ kind: 'unhandled_rejection', message: 'The user aborted a request.' })
    reportError({ kind: 'js_error', message: 'x', stack: 'at chrome-extension://abc/content.js:1:1' })
    reportError({ kind: 'js_error', message: 'Uncaught Error: Error invoking postMessage: Java object is gone', stack: 'at sendDataToNative (iabjs://x:1:1)' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reports the same error only once a minute', async () => {
    const { reportError } = await load()
    reportError({ kind: 'js_error', message: 'same' })
    reportError({ kind: 'js_error', message: 'same' })
    reportError({ kind: 'js_error', message: 'different' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('stops after ten reports in one session', async () => {
    const { reportError } = await load()
    for (let i = 0; i < 25; i++) reportError({ kind: 'js_error', message: `error ${i}` })
    expect(fetchMock).toHaveBeenCalledTimes(10)
  })

  it('never throws even when the request fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    const { reportError } = await load()
    expect(() => reportError({ kind: 'js_error', message: 'x' })).not.toThrow()
  })

  it('does not report offline network errors', async () => {
    const { reportError } = await load()
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    reportError({ kind: 'network_error', message: 'Failed to fetch', apiPath: '/api/x' })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
