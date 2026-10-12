import type { PropsWithChildren } from 'react'
import { AuthBootstrap } from '@/api/AuthBootstrap'
import { NotificationProvider } from '@/design-system/overlays'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <NotificationProvider>
      <AuthBootstrap>{children}</AuthBootstrap>
    </NotificationProvider>
  )
}
