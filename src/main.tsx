import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/app/router'
import '@/features/composer/fonts/fonts.css'
import '@/styles/reset.css'
import '@/styles/global.css'
import '@/layout/AppShell.css'
import { initErrorReporting, suppressErrorReporting } from '@/lib/errorReporter'

initErrorReporting()

// After a deploy, a tab that was open before it still points at old hashed files that no longer
// exist (the server answers with index.html). Reload to pick up the new build.
//
// Calling preventDefault() makes Vite resolve the failed import() with `undefined` instead of
// throwing, so the caller then crashes on `undefined` (e.g. "Cannot destructure property
// 'AdminLayout'"). So only prevent it when we really reload; otherwise let the real error surface.
const CHUNK_RELOAD_KEY = 'chak-chunk-reload-at'
const CHUNK_RELOAD_COOLDOWN_MS = 30_000

window.addEventListener('vite:preloadError', (event) => {
  try {
    const last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? 0)
    // Reloaded moments ago and it still fails: not a stale tab, so don't loop.
    if (Date.now() - last < CHUNK_RELOAD_COOLDOWN_MS) return
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()))
  } catch {
    return
  }
  event.preventDefault()
  // The page is about to go away; what crashes in the meantime is not worth reporting.
  suppressErrorReporting()
  window.location.reload()
})

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
