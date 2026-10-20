import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { trackPageView } from '@/api/analytics'
import { AppProviders } from '@/app/providers'

/**
 * Rendered inside AuthBootstrap, so it only runs once the session is restored.
 * Otherwise a signed-in member's first view would be counted as a guest.
 */
function PageViewTracker() {
  const { pathname } = useLocation()

  useEffect(() => {
    trackPageView(pathname)
  }, [pathname])

  return null
}

export function App() {
  return (
    <AppProviders>
      <PageViewTracker />
      <Outlet />
    </AppProviders>
  )
}
