import { apiFetch, refreshSession } from '@/api/client'
import {
  GOOGLE_CLIENT_ID,
  KAKAO_CLIENT_ID,
  getGoogleRedirectUri,
  getKakaoRedirectUri,
} from '@/api/config'
import { setAccessToken } from '@/api/tokenStore'
import type { ApiUser, AuthTokenResponse } from '@/api/types'

export type OAuthProvider = 'kakao' | 'google'

const stateKey = (provider: OAuthProvider) => `chak.${provider}.state`

/** Remembers a random state for the round trip, then sends the user to the provider. */
function redirectToProvider(
  provider: OAuthProvider,
  authorizeUrl: string,
  params: Record<string, string>,
) {
  const state = crypto.randomUUID()
  try {
    sessionStorage.setItem(stateKey(provider), state)
  } catch {
    // Storage can be unavailable (private mode); the callback then skips the check.
  }
  const url = new URL(authorizeUrl)
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('state', state)
  window.location.assign(url.toString())
}

/** Sends the user to Kakao's consent screen. */
export function startKakaoLogin() {
  redirectToProvider('kakao', 'https://kauth.kakao.com/oauth/authorize', {
    client_id: KAKAO_CLIENT_ID,
    redirect_uri: getKakaoRedirectUri(),
  })
}

/** Sends the user to Google's account chooser and consent screen. */
export function startGoogleLogin() {
  redirectToProvider('google', 'https://accounts.google.com/o/oauth2/v2/auth', {
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: getGoogleRedirectUri(),
    scope: 'openid email profile',
    prompt: 'select_account',
  })
}

/** Reads and clears the state saved before the redirect (one use only). */
export function consumeOAuthState(provider: OAuthProvider): string | null {
  try {
    const state = sessionStorage.getItem(stateKey(provider))
    sessionStorage.removeItem(stateKey(provider))
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

export async function loginWithGoogle(code: string): Promise<AuthTokenResponse> {
  const tokens = await apiFetch<AuthTokenResponse>('/api/auth/google', {
    method: 'POST',
    body: { code, redirectUri: getGoogleRedirectUri() },
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
