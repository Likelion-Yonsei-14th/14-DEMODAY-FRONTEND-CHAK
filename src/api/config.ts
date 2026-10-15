/**
 * Backend connection settings.
 *
 * - VITE_API_URL set to a URL: call that backend (cross-origin, e.g. local dev).
 * - VITE_API_URL set to "/": call the same origin, where the host proxies /api
 *   to the backend (the production setup, see vercel.json).
 * - VITE_API_URL set to an empty string: run on local mock state (prototype mode).
 * - VITE_API_URL not set: production builds use "/", dev servers use mock state.
 */
const configured = import.meta.env.VITE_API_URL as string | undefined
const rawApiUrl = configured ?? (import.meta.env.PROD ? '/' : '')

export const API_URL = rawApiUrl.replace(/\/+$/, '')

export const isApiEnabled = rawApiUrl !== ''

export const KAKAO_CLIENT_ID =
  (import.meta.env.VITE_KAKAO_CLIENT_ID as string | undefined) ?? ''

export const GOOGLE_CLIENT_ID =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? ''

export function getGoogleRedirectUri() {
  return (
    (import.meta.env.VITE_GOOGLE_REDIRECT_URI as string | undefined) ??
    `${window.location.origin}/auth/google/callback`
  )
}

export function getKakaoRedirectUri() {
  return (
    (import.meta.env.VITE_KAKAO_REDIRECT_URI as string | undefined) ??
    `${window.location.origin}/auth/kakao/callback`
  )
}
