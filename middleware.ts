/**
 * Vercel Routing Middleware (a project can have only one, so it does two jobs):
 *
 * - Shared paths: serves index.html with the link card of the shared path (see
 *   src/lib/ogCards.ts), so KakaoTalk and other scrapers that do not run JavaScript
 *   see the right title and description. Everything else is served as before.
 * - /api/*: Vercel does not attach its geolocation headers to requests it proxies to an
 *   external address (our rewrite to CloudFront), so the backend never saw where a visitor
 *   was. The visitor's country and province are copied into headers the backend reads
 *   (X-Chak-Geo-*). Only those two codes are forwarded, never the IP, and any value the
 *   browser sent under the same names is overwritten.
 */
import { withOgCard } from './src/lib/ogCards'

export const config = {
  matcher: [
    '/api/:path*',
    '/desk/:path*',
    '/prototype/claim',
    '/prototype/classroom/:classroomId/join',
    '/minigame/exam-career/result/:path*',
    '/minigame/study-type/result/:path*',
    '/minigame/guess-god/result/:path*',
  ],
}

const COUNTRY_HEADER = 'x-chak-geo-country'
const REGION_HEADER = 'x-chak-geo-region'

function withGeoHeaders(request: Request) {
  const country = request.headers.get('x-vercel-ip-country') ?? ''
  const region = request.headers.get('x-vercel-ip-country-region') ?? ''

  // Vercel's middleware protocol: continue to the next step and add these request headers.
  return new Response(null, {
    headers: {
      'x-middleware-next': '1',
      [`x-middleware-request-${COUNTRY_HEADER}`]: country,
      [`x-middleware-request-${REGION_HEADER}`]: region,
    },
  })
}

export default async function middleware(request: Request) {
  if (new URL(request.url).pathname.startsWith('/api/')) return withGeoHeaders(request)

  const page = await fetch(new URL('/index.html', request.url)).catch(() => null)
  // Fall through to the normal SPA rewrite if the page cannot be read here.
  if (!page?.ok) return undefined

  const html = withOgCard(await page.text(), new URL(request.url).pathname)
  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
}
