/**
 * The link card for a desk link, with the owner's name in it. Link scrapers
 * (KakaoTalk, Slack, ...) do not run JavaScript, so vercel.json sends only
 * them here; everyone else gets the app. The page is the built card page for
 * desks, with its title and description replaced by the desk's.
 */
import { deskCard, withOgCard } from '../src/lib/ogCards'

export const config = { runtime: 'edge' }

/** The same backend the site's /api rewrite points to. */
const API_ORIGIN = 'https://d1itub0wenvsst.cloudfront.net'
const TOKEN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const BACKEND_TIMEOUT_MS = 2500

async function findDesk(token: string): Promise<{ displayName: string; roomClosed?: boolean } | null> {
  if (!TOKEN.test(token)) return null
  try {
    const response = await fetch(`${API_ORIGIN}/api/public/desks/${token}`, {
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    })
    if (!response.ok) return null
    const body = (await response.json()) as { displayName?: unknown; roomClosed?: unknown }
    if (typeof body.displayName !== 'string') return null
    return { displayName: body.displayName, roomClosed: body.roomClosed === true }
  } catch {
    return null
  }
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const [page, desk] = await Promise.all([
    fetch(new URL('/og/desk.html', url)).then((response) => (response.ok ? response.text() : null)),
    findDesk(url.searchParams.get('token') ?? ''),
  ])
  // Without the card page there is nothing to personalize: hand over the app.
  if (page === null) return Response.redirect(new URL('/', url), 302)

  return new Response(withOgCard(page, deskCard(desk)), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // A short cache, so a renamed desk shows its new name soon and the backend is not asked for every scrape.
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  })
}
