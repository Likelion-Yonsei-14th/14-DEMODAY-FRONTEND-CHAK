/**
 * Backend connection settings. When VITE_API_URL is not set the app keeps
 * running on its local mock state (prototype mode), so previews without a
 * backend keep working.
 */
const rawApiUrl = import.meta.env.VITE_API_URL as string | undefined

export const API_URL = rawApiUrl ? rawApiUrl.replace(/\/+$/, '') : ''

export const isApiEnabled = API_URL !== ''

export const KAKAO_CLIENT_ID =
  (import.meta.env.VITE_KAKAO_CLIENT_ID as string | undefined) ?? ''

export function getKakaoRedirectUri() {
  return (
    (import.meta.env.VITE_KAKAO_REDIRECT_URI as string | undefined) ??
    `${window.location.origin}/auth/kakao/callback`
  )
}
