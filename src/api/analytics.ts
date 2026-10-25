import { apiFetch } from '@/api/client'
import { isApiEnabled } from '@/api/config'
import { getVisitorGeo } from '@/api/geo'

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
 * path (no query string), the referring site's origin and the visitor's country and
 * province code (from the host, see /api/geo) are sent; the
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
    const eventId = crypto.randomUUID()
    const session = sessionId()
    void getVisitorGeo()
      .then((geo) =>
        apiFetch('/api/public/analytics/events', {
          method: 'POST',
          quiet: true,
          body: {
            eventId,
            eventType: 'PAGE_VIEW',
            sessionId: session,
            path: pathname.slice(0, 1000),
            referrer,
            // 시·도 수준의 위치만. 호스팅이 알려 준 값이고 IP는 어디에도 쓰지 않는다.
            geoCountry: geo?.country ?? undefined,
            geoRegion: geo?.region ?? undefined,
          },
        }),
      )
      .catch(() => undefined)
  } catch {
    // Tracking must never break the app.
  }
}

/** For tests. */
export function resetPageViewTracking() {
  lastPath = null
}
