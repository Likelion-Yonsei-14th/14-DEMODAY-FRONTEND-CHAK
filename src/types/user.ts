export type UserRole =
  | 'owner'
  | 'creator'
  | 'supporter'
  | 'class-creator'

export type PrototypeUser = {
  id: string
  displayName: string
  role: UserRole
}

export type AuthProvider = 'password' | 'google' | 'kakao'

/** How this device last signed in, kept after sign-out to suggest it again. */
export type LastLogin = {
  email: string
  provider: AuthProvider
}

export type AuthSession =
  | {
      status: 'anonymous'
    }
  | {
      status: 'authenticated'
      email: string
      provider: AuthProvider
      /** Set when the session comes from the real backend. */
      userId?: number
    }


export type SupporterSettings = {
  defaultNickname: string
  revealAfterExam: boolean
  pushEnabled: boolean
}
