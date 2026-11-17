import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAdPreviewHost, isAdPreview } from './adPreview'

describe('ad preview channel', () => {
  afterEach(() => vi.restoreAllMocks())

  it('is off on normal pages', () => {
    expect(isAdPreview).toBe(false)
  })

  it('answers a ready frame with the draft ad and token, and rebroadcasts changes', () => {
    let ad = { title: 'A', creativeUrl: 'https://x/a.png', destinationUrl: 'https://x' }
    const host = createAdPreviewHost(() => ({ ad, accessToken: 'tok' }))
    const frame = { postMessage: vi.fn() } as unknown as Window
    window.dispatchEvent(
      new MessageEvent('message', { data: { type: 'chak-ad-preview-ready' }, origin: window.location.origin, source: frame }),
    )
    expect(frame.postMessage).toHaveBeenCalledWith(
      { type: 'chak-ad-preview', ad, accessToken: 'tok' },
      window.location.origin,
    )

    ad = { ...ad, title: 'B' }
    host.broadcast()
    expect(frame.postMessage).toHaveBeenLastCalledWith(
      { type: 'chak-ad-preview', ad: expect.objectContaining({ title: 'B' }), accessToken: 'tok' },
      window.location.origin,
    )

    // 다른 출처의 신호는 무시한다.
    const stranger = { postMessage: vi.fn() } as unknown as Window
    window.dispatchEvent(
      new MessageEvent('message', { data: { type: 'chak-ad-preview-ready' }, origin: 'https://evil.example', source: stranger }),
    )
    expect(stranger.postMessage).not.toHaveBeenCalled()
    host.dispose()
  })
})
