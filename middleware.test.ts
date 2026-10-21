// @vitest-environment node
import { describe, expect, it } from 'vitest'
import middleware, { config } from './middleware'

const run = async (headers: Record<string, string>) =>
  await middleware(new Request('https://www.chak.live/api/public/analytics/events', { method: 'POST', headers }))

describe('geo middleware', () => {
  it('also matches API requests next to the shared link paths', () => {
    expect(config.matcher).toContain('/api/:path*')
  })

  it('forwards the visitor country and province and continues', async () => {
    const response = await run({ 'x-vercel-ip-country': 'KR', 'x-vercel-ip-country-region': '11' })
    expect(response!.headers.get('x-middleware-next')).toBe('1')
    expect(response!.headers.get('x-middleware-request-x-chak-geo-country')).toBe('KR')
    expect(response!.headers.get('x-middleware-request-x-chak-geo-region')).toBe('11')
  })

  it('blanks the headers when the location is unknown, so a browser cannot spoof them', async () => {
    const response = await run({ 'x-chak-geo-country': 'US', 'x-chak-geo-region': 'CA' })
    expect(response!.headers.get('x-middleware-request-x-chak-geo-country')).toBe('')
    expect(response!.headers.get('x-middleware-request-x-chak-geo-region')).toBe('')
  })
})
