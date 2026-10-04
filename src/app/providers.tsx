import type { PropsWithChildren } from 'react'
import { NotificationProvider } from '@/design-system/overlays'

export function AppProviders({ children }: PropsWithChildren) {
  return <NotificationProvider>{children}</NotificationProvider>
}
