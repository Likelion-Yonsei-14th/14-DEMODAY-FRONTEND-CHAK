import { apiFetch, refreshSession } from '@/api/client'
import { KAKAO_CLIENT_ID, getKakaoRedirectUri } from '@/api/config'
import { setAccessToken } from '@/api/tokenStore'
import type { ApiUser, AuthTokenResponse } from '@/api/types'

const STATE_KEY = 'chak.kakao.state'

/** Sends the user to Kakao's consent screen. */
export function startKakaoLogin() {
  const state = crypto.randomUUID()
  try {
    sessionStorage.setItem(STATE_KEY, state)
  } catch {
    // Storage can be unavailable (private mode); the callback then skips the check.
  }
  const url = new URL('https://kauth.kakao.com/oauth/authorize')
  url.searchParams.set('client_id', KAKAO_CLIENT_ID)
  url.searchParams.set('redirect_uri', getKakaoRedirectUri())
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('state', state)
  window.location.assign(url.toString())
}

export function consumeKakaoState(): string | null {
  try {
    const state = sessionStorage.getItem(STATE_KEY)
    sessionStorage.removeItem(STATE_KEY)
    return state
  } catch {
    return null
  }
}

export async function loginWithKakao(code: string): Promise<AuthTokenResponse> {
  const tokens = await apiFetch<AuthTokenResponse>('/api/auth/kakao', {
    method: 'POST',
    body: { code, redirectUri: getKakaoRedirectUri() },
    auth: false,
  })
  setAccessToken(tokens.accessToken)
  return tokens
}

/** Rebuilds the session after a reload; null when the user is signed out. */
export async function restoreSession(): Promise<ApiUser | null> {
  const tokens = await refreshSession()
  return tokens?.user ?? null
}

export async function logout(): Promise<void> {
  try {
    await apiFetch<{ message: string }>('/api/auth/logout', { method: 'POST', body: {} })
  } finally {
    setAccessToken(null)
  }
}

export function fetchMe() {
  return apiFetch<ApiUser>('/api/users/me')
}
