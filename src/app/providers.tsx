import type { PropsWithChildren } from 'react'
import { ApiNotices } from '@/api/ApiNotices'
import { AuthBootstrap } from '@/api/AuthBootstrap'
import { NotificationProvider } from '@/design-system/overlays'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <NotificationProvider>
      <ApiNotices />
      <AuthBootstrap>{children}</AuthBootstrap>
    </NotificationProvider>
  )
}
