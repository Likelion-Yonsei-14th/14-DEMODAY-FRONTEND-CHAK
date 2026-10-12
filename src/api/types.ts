export type ApiUser = {
  id: number
  displayName: string
  email: string | null
  profileImageUrl: string | null
  admin: boolean
}

/**
 * refreshToken is deliberately absent: the backend sets it as an HttpOnly
 * cookie, and the frontend never reads or stores it.
 */
export type AuthTokenResponse = {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  user: ApiUser
}

export type ApiErrorBody = {
  code: string
  message: string
}

export type SliceResponse<T> = {
  content: T[]
  page: number
  size: number
  hasNext: boolean
}
