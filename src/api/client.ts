import { API_URL } from '@/api/config'
import { getAccessToken, setAccessToken } from '@/api/tokenStore'
import type { ApiErrorBody, AuthTokenResponse } from '@/api/types'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  /** The whole error body, for codes that carry extra fields (e.g. INSUFFICIENT_CHALTTEOK). */
  readonly body: Partial<ApiErrorBody> & Record<string, unknown>

  constructor(status: number, body: Partial<ApiErrorBody> & Record<string, unknown>) {
    super(body.message ?? 'Request failed')
    this.name = 'ApiError'
    this.status = status
    this.code = body.code ?? 'UNKNOWN'
    this.body = body
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | boolean | undefined>
  /** Send the Bearer token when one is held. Default true. */
  auth?: boolean
}

function buildUrl(path: string, query?: RequestOptions['query']) {
  const url = new URL(`${API_URL}${path}`, window.location.origin)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

async function send(path: string, options: RequestOptions, withToken: boolean) {
  const headers: Record<string, string> = {}
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getAccessToken()
  if (withToken && token) headers.Authorization = `Bearer ${token}`

  return fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers,
    // Required for the HttpOnly refresh cookie and the guest cookie.
    credentials: 'include',
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
}

async function parse<T>(response: Response): Promise<T> {
  const text = await response.text()
  const data = text ? JSON.parse(text) : undefined
  if (!response.ok) {
    throw new ApiError(response.status, (data ?? {}) as Partial<ApiErrorBody>)
  }
  return data as T
}

let refreshInFlight: Promise<AuthTokenResponse | null> | null = null

/**
 * Exchanges the HttpOnly refresh cookie for a new access token. Concurrent
 * callers share one request, because the backend rotates the refresh token
 * on every use (a second parallel call would be rejected).
 */
export function refreshSession(): Promise<AuthTokenResponse | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await send('/api/auth/refresh', { method: 'POST' }, false)
        const tokens = await parse<AuthTokenResponse>(response)
        setAccessToken(tokens.accessToken)
        return tokens
      } catch (error) {
        setAccessToken(null)
        if (error instanceof ApiError) return null
        throw error
      } finally {
        refreshInFlight = null
      }
    })()
  }
  return refreshInFlight
}

const isAuthPath = (path: string) => path.startsWith('/api/auth/')
const isPublicPath = (path: string) => path.startsWith('/api/public/')

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const useToken = options.auth !== false
  const response = await send(path, options, useToken)

  if (response.status !== 401 || !useToken || isAuthPath(path)) {
    return parse<T>(response)
  }

  // Expired or invalid access token: refresh once and retry.
  const refreshed = await refreshSession()
  if (refreshed) {
    return parse<T>(await send(path, options, true))
  }
  // Public endpoints also reject a bad token, so fall back to guest mode.
  if (isPublicPath(path)) {
    return parse<T>(await send(path, options, false))
  }
  return parse<T>(response)
}
