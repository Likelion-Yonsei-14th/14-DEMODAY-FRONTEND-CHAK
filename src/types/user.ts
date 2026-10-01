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

export type AuthProvider = 'password' | 'google'

export type AuthSession =
  | {
      status: 'anonymous'
    }
  | {
      status: 'authenticated'
      email: string
      provider: AuthProvider
    }
