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
  saveOAuthState(provider, state)
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
  let state: string | null = null
  try {
    state = sessionStorage.getItem(stateKey(provider))
    sessionStorage.removeItem(stateKey(provider))
  } catch {
    // Fall through to the cookie fallback below.
  }
  const cookieState = readStateCookie(provider)
  clearStateCookie(provider)
  return state || cookieState
}

/**
 * Whether the callback's state is the one saved before the redirect.
 * Fails closed: a callback with no saved state (a link opened in a fresh tab,
 * a replayed URL) is rejected, so nobody can be signed in with someone else's code.
 */
export function isExpectedOAuthState(expected: string | null, actual: string | null): boolean {
  return Boolean(expected) && Boolean(actual) && expected === actual
}

const STATE_COOKIE_MAX_AGE = 600

const stateCookieName = (provider: OAuthProvider) => `chak_${provider}_state`

/**
 * sessionStorage first; when it is unavailable (some private modes and in-app
 * browsers) a short-lived first-party cookie keeps the state for the round trip.
 * SameSite=Lax is still sent on the provider's top-level redirect back to us.
 */
function saveOAuthState(provider: OAuthProvider, state: string) {
  try {
    sessionStorage.setItem(stateKey(provider), state)
    return
  } catch {
    // Use the cookie fallback.
  }
  try {
    const secure = window.location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `${stateCookieName(provider)}=${encodeURIComponent(state)}; Max-Age=${STATE_COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}`
  } catch {
    // No storage at all: the callback will refuse the login and ask to retry.
  }
}

function readStateCookie(provider: OAuthProvider): string | null {
  try {
    const prefix = `${stateCookieName(provider)}=`
    const entry = document.cookie.split('; ').find((part) => part.startsWith(prefix))
    return entry ? decodeURIComponent(entry.slice(prefix.length)) || null : null
  } catch {
    return null
  }
}

function clearStateCookie(provider: OAuthProvider) {
  try {
    document.cookie = `${stateCookieName(provider)}=; Max-Age=0; Path=/; SameSite=Lax`
  } catch {
    // Nothing to clear.
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
