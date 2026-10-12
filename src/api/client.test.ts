import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch, ApiError } from '@/api/client'
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
})
