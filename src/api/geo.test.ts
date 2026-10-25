import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getVisitorGeo, resetVisitorGeo } from './geo'

const json = (body: unknown, ok = true) => ({ ok, json: async () => body }) as Response

describe('visitor geo', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    sessionStorage.clear()
    resetVisitorGeo()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('asks the host once per tab session and remembers the answer', async () => {
    fetchMock.mockResolvedValue(json({ country: 'kr', region: '11' }))

    expect(await getVisitorGeo()).toEqual({ country: 'KR', region: '11' })
    resetVisitorGeo()
    expect(await getVisitorGeo()).toEqual({ country: 'KR', region: '11' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]![0]).toBe('/api/geo')
  })

  it('shares one request between visits that start together', async () => {
    fetchMock.mockResolvedValue(json({ country: 'KR', region: '26' }))
    await Promise.all([getVisitorGeo(), getVisitorGeo(), getVisitorGeo()])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('gives null when the function is missing, fails, or sends nonsense', async () => {
    fetchMock.mockResolvedValue(json({}, false))
    expect(await getVisitorGeo()).toBeNull()

    resetVisitorGeo()
    fetchMock.mockRejectedValue(new Error('offline'))
    expect(await getVisitorGeo()).toBeNull()

    resetVisitorGeo()
    fetchMock.mockResolvedValue(json({ country: '<b>', region: '<script>' }))
    expect(await getVisitorGeo()).toBeNull()

    resetVisitorGeo()
    fetchMock.mockResolvedValue(json({ country: null, region: null }))
    expect(await getVisitorGeo()).toBeNull()
  })

  it('does not hold the visit back for more than a couple of seconds', async () => {
    vi.useFakeTimers()
    fetchMock.mockImplementation((_url: string, init: { signal: AbortSignal }) =>
      new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted')))),
    )
    const result = getVisitorGeo()
    await vi.advanceTimersByTimeAsync(2_001)
    expect(await result).toBeNull()
  })
})
