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
    reportError({ kind: 'js_error', message: "TypeError: undefined is not an object (evaluating 'window.webkit.messageHandlers')" })
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
    vi.useFakeTimers()
    vi.advanceTimersByTime(5_000)
    vi.useRealTimers()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('network errors', () => {
  let visibility: DocumentVisibilityState = 'visible'

  const hide = () => {
    visibility = 'hidden'
    document.dispatchEvent(new Event('visibilitychange'))
  }
  const show = () => {
    visibility = 'visible'
    document.dispatchEvent(new Event('visibilitychange'))
  }
  const bodies = () => fetchMock.mock.calls.map(([, init]) => JSON.parse((init as RequestInit).body as string))

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.useFakeTimers()
    visibility = 'visible'
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility)
    fetchMock.mockReset()
    fetchMock.mockResolvedValue(new Response(null, { status: 202 }))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('sends one report for requests that failed together on a screen that stayed open', async () => {
    const { reportError } = await load()
    reportError({ kind: 'network_error', message: 'Load failed', apiPath: '/api/desks/me/messages' })
    reportError({ kind: 'network_error', message: 'Load failed', apiPath: '/api/desks/me/replies' })
    reportError({ kind: 'network_error', message: 'Load failed', apiPath: '/api/desks/me/supporters?x=1' })
    expect(fetchMock).not.toHaveBeenCalled()

    vi.advanceTimersByTime(2_000)
    expect(bodies()).toHaveLength(1)
    expect(bodies()[0]).toMatchObject({ kind: 'network_error', apiPath: '/api/desks/me/messages' })
    expect(bodies()[0].message).toBe('Load failed (같이 실패한 요청 2건: /api/desks/me/replies, /api/desks/me/supporters)')
  })

  it('drops failures while the page is hidden or being left', async () => {
    const { reportError } = await load()
    hide()
    reportError({ kind: 'network_error', message: 'Load failed', apiPath: '/api/a' })
    show()
    window.dispatchEvent(new Event('pagehide'))
    reportError({ kind: 'network_error', message: 'Load failed', apiPath: '/api/b' })
    vi.advanceTimersByTime(5_000)
    expect(fetchMock).not.toHaveBeenCalled()
    window.dispatchEvent(new Event('pageshow'))
  })

  it('drops failures when the app goes to the background right after, or just came back', async () => {
    const { reportError } = await load()
    reportError({ kind: 'network_error', message: 'Load failed', apiPath: '/api/a' })
    vi.advanceTimersByTime(500)
    hide()
    vi.advanceTimersByTime(2_000)
    expect(fetchMock).not.toHaveBeenCalled()

    // 돌아오자마자 끊긴 요청도 앱 전환 탓이다.
    show()
    vi.advanceTimersByTime(1_000)
    reportError({ kind: 'network_error', message: 'Load failed', apiPath: '/api/b' })
    vi.advanceTimersByTime(2_000)
    expect(fetchMock).not.toHaveBeenCalled()

    // 한참 뒤 화면을 보고 있는 중에 실패하면 알린다.
    vi.advanceTimersByTime(10_000)
    reportError({ kind: 'network_error', message: 'Failed to fetch', apiPath: '/api/c' })
    vi.advanceTimersByTime(2_000)
    expect(bodies()).toMatchObject([{ apiPath: '/api/c' }])
  })

  it('still sends other errors right away', async () => {
    const { reportError } = await load()
    hide()
    reportError({ kind: 'api_error', message: 'boom', apiPath: '/api/x', status: 500 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
