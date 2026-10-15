/**
 * The access token lives in module memory only - never localStorage or
 * sessionStorage. A page reload drops it; restoreSession() gets a new one
 * from the HttpOnly refresh cookie.
 */
let accessToken: string | null = null

export function getAccessToken() {
  return accessToken
}

export function setAccessToken(token: string | null) {
  accessToken = token
}
