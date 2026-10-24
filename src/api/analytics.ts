import { apiFetch } from '@/api/client'
import { isApiEnabled } from '@/api/config'

const SESSION_KEY = 'chak.analytics.session'

/** One random id per browser tab session, so visits can be grouped without identifying anyone. */
function sessionId() {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY)
    if (existing) return existing
    const created = crypto.randomUUID()
    sessionStorage.setItem(SESSION_KEY, created)
    return created
  } catch {
    return crypto.randomUUID()
  }
}

let lastPath: string | null = null

/** Pages that are not part of what visitors do (operators' own console). */
const IGNORED = [/^\/admin(\/|$)/]

/**
 * Records that a page was opened, for the operators' visitor counts. Only the
 * path (no query string) and the referring site's origin are sent; the
 * server never stores IP addresses. Failures are ignored.
 */
export function trackPageView(pathname: string) {
  try {
    if (!isApiEnabled || IGNORED.some((pattern) => pattern.test(pathname))) return
    if (pathname === lastPath) return
    lastPath = pathname

    let referrer: string | undefined
    try {
      referrer = document.referrer ? new URL(document.referrer).origin : undefined
    } catch {
      referrer = undefined
    }
    // Counting visits is best effort: ad blockers and content blockers (the URL contains "analytics"),
    // pages closed mid-request and flaky mobile data all end as "Load failed". None of that is our bug,
    // so a failed visit count does not alert the team.
    void apiFetch('/api/public/analytics/events', {
      method: 'POST',
      quiet: true,
      body: {
        eventId: crypto.randomUUID(),
        eventType: 'PAGE_VIEW',
        sessionId: sessionId(),
        path: pathname.slice(0, 1000),
        referrer,
      },
    }).catch(() => undefined)
  } catch {
    // Tracking must never break the app.
  }
}

/** For tests. */
export function resetPageViewTracking() {
  lastPath = null
}
