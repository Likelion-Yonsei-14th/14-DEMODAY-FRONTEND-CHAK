import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('social login redirects', () => {
  const assign = vi.fn()

  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'google-client')
    vi.stubEnv('VITE_KAKAO_CLIENT_ID', 'kakao-client')
    vi.stubEnv('VITE_GOOGLE_REDIRECT_URI', 'http://localhost:5173/auth/google/callback')
    vi.stubGlobal('location', { origin: 'http://localhost:5173', assign })
    sessionStorage.clear()
    assign.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('sends Google an authorization-code request and remembers the state', async () => {
    const { startGoogleLogin, consumeOAuthState } = await import('@/api/auth')
    startGoogleLogin()

    const url = new URL(String(assign.mock.calls[0]?.[0]))
    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth')
    expect(url.searchParams.get('client_id')).toBe('google-client')
    expect(url.searchParams.get('redirect_uri')).toBe('http://localhost:5173/auth/google/callback')
    expect(url.searchParams.get('response_type')).toBe('code')
    expect(url.searchParams.get('scope')).toBe('openid email profile')
    expect(consumeOAuthState('google')).toBe(url.searchParams.get('state'))
    // one use only, and Kakao's state is kept separately
    expect(consumeOAuthState('google')).toBeNull()
    expect(consumeOAuthState('kakao')).toBeNull()
  })

  it('keeps Kakao login working on the shared redirect helper', async () => {
    const { startKakaoLogin, consumeOAuthState } = await import('@/api/auth')
    startKakaoLogin()

    const url = new URL(String(assign.mock.calls[0]?.[0]))
    expect(url.origin + url.pathname).toBe('https://kauth.kakao.com/oauth/authorize')
    expect(url.searchParams.get('client_id')).toBe('kakao-client')
    expect(consumeOAuthState('kakao')).toBe(url.searchParams.get('state'))
  })
})
