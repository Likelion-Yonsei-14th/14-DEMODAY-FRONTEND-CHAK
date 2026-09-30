export type UserRole = 'owner' | 'creator' | 'supporter' | 'class-creator'

export type PrototypeUser = {
  id: string
  displayName: string
  role: UserRole
}
