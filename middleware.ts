/**
 * Vercel Routing Middleware: serves index.html with the link card of the shared
 * path (see src/lib/ogCards.ts), so KakaoTalk and other scrapers that do not
 * run JavaScript see the right title and description. Only shared paths go
 * through here; everything else is served as before.
 */
import { withOgCard } from './src/lib/ogCards'

export const config = {
  matcher: [
    '/desk/:path*',
    '/prototype/claim',
    '/prototype/classroom/:classroomId/join',
    '/minigame/exam-career/result/:path*',
    '/minigame/study-type/result/:path*',
    '/minigame/guess-god/result/:path*',
  ],
}

export default async function middleware(request: Request) {
  const page = await fetch(new URL('/index.html', request.url)).catch(() => null)
  // Fall through to the normal SPA rewrite if the page cannot be read here.
  if (!page?.ok) return undefined

  const html = withOgCard(await page.text(), new URL(request.url).pathname)
  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
}
