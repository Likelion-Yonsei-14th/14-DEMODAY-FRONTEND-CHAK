import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/app/router'
import '@/features/composer/fonts/fonts.css'
import '@/styles/reset.css'
import '@/styles/global.css'
import '@/layout/AppShell.css'
import { initErrorReporting } from '@/lib/errorReporter'

initErrorReporting()

// After a deploy, a tab that was open before it still points at old hashed files that no longer
// exist (the server answers with index.html). Reload once to pick up the new build.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  try {
    if (sessionStorage.getItem('chak-chunk-reload') === '1') return
    sessionStorage.setItem('chak-chunk-reload', '1')
  } catch {
    return
  }
  window.location.reload()
})

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
