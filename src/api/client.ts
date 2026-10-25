import { API_URL } from '@/api/config'
import { getAccessToken, setAccessToken } from '@/api/tokenStore'
import type { ApiErrorBody, AuthTokenResponse } from '@/api/types'
import { reportError } from '@/lib/errorReporter'

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
  /** Background request whose failure the user never notices: do not alert the team about network errors. */
  quiet?: boolean
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

  try {
    return await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers,
      // Required for the HttpOnly refresh cookie and the guest cookie.
      credentials: 'include',
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch (error) {
    // The browser could not reach the server at all (no response).
    if (!options.quiet) {
      reportError({
        kind: 'network_error',
        message: error instanceof Error ? error.message : 'Network request failed',
        apiPath: path,
      })
    }
    throw error
  }
}

async function parse<T>(response: Response): Promise<T> {
  const text = await response.text()
  // 서버가 아닌 곳(CloudFront·Vercel의 오류 페이지 등)이 HTML로 답할 수 있다. 그때도 상태 코드로 오류를 알려야 한다.
  let data: unknown
  let notJson = false
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      notJson = true
    }
  }
  if (!response.ok) {
    const error = new ApiError(response.status, (data ?? {}) as Partial<ApiErrorBody>)
    // 5xx means our server failed; 4xx are normal answers (wrong input, not logged in...).
    if (response.status >= 500) {
      reportError({
        kind: 'api_error',
        message: error.message,
        apiPath: new URL(response.url || window.location.href, window.location.origin).pathname,
        status: response.status,
        code: error.code,
      })
    }
    throw error
  }
  if (notJson) {
    // 성공(2xx)인데 JSON이 아닌 응답: 예를 들어 없는 주소가 홈 화면 HTML로 돌아온 경우.
    reportError({
      kind: 'api_error',
      message: 'Response was not JSON',
      apiPath: new URL(response.url || window.location.href, window.location.origin).pathname,
      status: response.status,
      code: 'INVALID_RESPONSE',
    })
    throw new ApiError(502, { code: 'INVALID_RESPONSE', message: '서버 응답을 읽지 못했어요.' })
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
