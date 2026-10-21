/**
 * Vercel Routing Middleware for /api/*.
 *
 * Vercel does not attach its geolocation headers to requests it proxies to an external
 * address (our rewrite to CloudFront), so the backend never saw where a visitor was.
 * Here the visitor's country and province are copied into headers the backend reads
 * (X-Chak-Geo-*). Only those two codes are forwarded, never the IP, and any value the
 * browser sent under the same names is overwritten.
 */
export const config = { matcher: '/api/:path*' }

const COUNTRY_HEADER = 'x-chak-geo-country'
const REGION_HEADER = 'x-chak-geo-region'

export default function middleware(request: Request) {
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
