import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch, ApiError, refreshSession } from '@/api/client'
import * as reporter from '@/lib/errorReporter'
import { getAccessToken, setAccessToken } from '@/api/tokenStore'

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const tokens = {
  accessToken: 'new-access',
  tokenType: 'Bearer',
  expiresIn: 1800,
  user: { id: 1, displayName: '지수', email: null, profileImageUrl: null, admin: false },
}

type Call = [string, { credentials?: string; headers: Record<string, string> }]

describe('apiFetch', () => {
  const fetchMock = vi.fn()
  const call = (index: number) => fetchMock.mock.calls[index] as Call

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
    setAccessToken(null)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends credentials and the Bearer token', async () => {
    setAccessToken('abc')
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { ok: true }))

    await apiFetch('/api/users/me')

    const [, init] = call(0)
    expect(init.credentials).toBe('include')
    expect(init.headers.Authorization).toBe('Bearer abc')
  })

  it('refreshes once on 401 and retries with the new token', async () => {
    setAccessToken('expired')
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { code: 'UNAUTHORIZED', message: 'x' }))
      .mockResolvedValueOnce(jsonResponse(200, tokens))
      .mockResolvedValueOnce(jsonResponse(200, { id: 1 }))

    const result = await apiFetch<{ id: number }>('/api/users/me')

    expect(result.id).toBe(1)
    expect(getAccessToken()).toBe('new-access')
    expect(call(1)[0]).toContain('/api/auth/refresh')
    expect(call(2)[1].headers.Authorization).toBe('Bearer new-access')
  })

  it('shares a single refresh between concurrent 401s', async () => {
    setAccessToken('expired')
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/api/auth/refresh')) return Promise.resolve(jsonResponse(200, tokens))
      const retried = (fetchMock.mock.calls as Call[]).filter(([u]) => u === url).length > 1
      return Promise.resolve(
        retried ? jsonResponse(200, {}) : jsonResponse(401, { code: 'UNAUTHORIZED', message: 'x' }),
      )
    })

    await Promise.all([apiFetch('/api/desks/me'), apiFetch('/api/users/me')])

    const refreshCalls = (fetchMock.mock.calls as Call[]).filter(([u]) => String(u).includes('/api/auth/refresh'))
    expect(refreshCalls).toHaveLength(1)
  })

  it('falls back to guest mode on public endpoints when refresh fails', async () => {
    setAccessToken('expired')
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { code: 'UNAUTHORIZED', message: 'x' }))
      .mockResolvedValueOnce(jsonResponse(401, { code: 'INVALID_REFRESH_TOKEN', message: 'x' }))
      .mockResolvedValueOnce(jsonResponse(200, { id: 7 }))

    const result = await apiFetch<{ id: number }>('/api/public/desks/token')

    expect(result.id).toBe(7)
    expect(call(2)[1].headers.Authorization).toBeUndefined()
    expect(getAccessToken()).toBeNull()
  })

  it('throws ApiError with the backend code', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(409, { code: 'DESK_CLOSED', message: '종료' }))

    await expect(apiFetch('/api/public/desks/t/messages', { method: 'POST', body: {} }))
      .rejects.toMatchObject({ status: 409, code: 'DESK_CLOSED' })
    await expect(Promise.reject(new ApiError(500, {}))).rejects.toBeInstanceOf(ApiError)
  })

  it('reports network failures unless the request is marked quiet', async () => {
    const report = vi.spyOn(reporter, 'reportError').mockImplementation(() => undefined)
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(apiFetch('/api/x')).rejects.toThrow()
    expect(report).toHaveBeenCalledTimes(1)

    await expect(apiFetch('/api/public/unlocks', { quiet: true })).rejects.toThrow()
    expect(report).toHaveBeenCalledTimes(1)
    report.mockRestore()
  })

  describe('refreshSession network retries', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('retries a refresh that got no response and restores the session without alerting', async () => {
      const report = vi.spyOn(reporter, 'reportError').mockImplementation(() => undefined)
      fetchMock
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce(jsonResponse(200, tokens))

      const pending = refreshSession()
      await vi.runAllTimersAsync()

      await expect(pending).resolves.toMatchObject({ accessToken: 'new-access' })
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(getAccessToken()).toBe('new-access')
      expect(report).not.toHaveBeenCalled()
      report.mockRestore()
    })

    it('alerts once and rejects after three failed attempts', async () => {
      const report = vi.spyOn(reporter, 'reportError').mockImplementation(() => undefined)
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

      const pending = refreshSession()
      const outcome = pending.catch((e: unknown) => e)
      await vi.runAllTimersAsync()

      expect(await outcome).toBeInstanceOf(TypeError)
      expect(fetchMock).toHaveBeenCalledTimes(3)
      expect(report).toHaveBeenCalledTimes(1)
      report.mockRestore()
    })

    it('does not retry when the server answered, even with a rejection', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(401, { code: 'INVALID_REFRESH_TOKEN', message: 'x' }))

      await expect(refreshSession()).resolves.toBeNull()
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('responses that are not JSON', () => {
    const html = (status: number) =>
      new Response('<!DOCTYPE HTML><HTML><H1>504 Gateway Timeout ERROR</H1></HTML>', {
        status,
        headers: { 'Content-Type': 'text/html' },
      })

    it('turns a CloudFront error page into an ApiError with its status and tells the team about a 5xx', async () => {
      const report = vi.spyOn(reporter, 'reportError').mockImplementation(() => undefined)
      fetchMock.mockResolvedValueOnce(html(504))

      const error = await apiFetch('/api/public/health').catch((e: unknown) => e)

      expect(error).toBeInstanceOf(ApiError)
      expect((error as ApiError).status).toBe(504)
      expect((error as ApiError).code).toBe('UNKNOWN')
      expect(report).toHaveBeenCalledWith(expect.objectContaining({ kind: 'api_error', status: 504 }))
      report.mockRestore()
    })

    it('keeps a 4xx HTML page as a normal ApiError without alerting', async () => {
      const report = vi.spyOn(reporter, 'reportError').mockImplementation(() => undefined)
      fetchMock.mockResolvedValueOnce(html(403))

      const error = await apiFetch('/api/x').catch((e: unknown) => e)

      expect((error as ApiError).status).toBe(403)
      expect(report).not.toHaveBeenCalled()
      report.mockRestore()
    })

    it('does not accept a 200 HTML page as data (a route that fell through to the home page)', async () => {
      const report = vi.spyOn(reporter, 'reportError').mockImplementation(() => undefined)
      fetchMock.mockResolvedValueOnce(html(200))

      const error = await apiFetch('/api/missing').catch((e: unknown) => e)

      expect(error).toBeInstanceOf(ApiError)
      expect((error as ApiError).code).toBe('INVALID_RESPONSE')
      expect(report).toHaveBeenCalledWith(expect.objectContaining({ code: 'INVALID_RESPONSE' }))
      report.mockRestore()
    })

    it('still answers an empty success body with undefined', async () => {
      fetchMock.mockResolvedValueOnce(new Response(null, { status: 202 }))
      await expect(apiFetch('/api/public/analytics/events', { method: 'POST' })).resolves.toBeUndefined()
    })
  })
})
