import { beforeEach, describe, expect, it, vi } from 'vitest'

const client = vi.hoisted(() => ({ apiFetch: vi.fn() }))
vi.mock('@/api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/client')>()),
  apiFetch: client.apiFetch,
}))

import { fetchOwnerMessages } from './desks'

const letter = (id: number) => ({ messageId: id })
const slice = (ids: number[], hasNext: boolean) => ({ content: ids.map(letter), hasNext })

describe('loading every letter of the owner', () => {
  beforeEach(() => client.apiFetch.mockReset())

  it('asks for locked letters too and reads pages until the server says there is no next', async () => {
    client.apiFetch
      .mockResolvedValueOnce(slice([1, 2], true))
      .mockResolvedValueOnce(slice([3], false))

    const all = await fetchOwnerMessages()

    expect(all.map((m) => m.messageId)).toEqual([1, 2, 3])
    expect(client.apiFetch).toHaveBeenCalledTimes(2)
    const [, second] = client.apiFetch.mock.calls[1] as [string, { query: Record<string, unknown> }]
    expect(second.query).toMatchObject({ includeLocked: true, page: 1, size: 100 })
  })

  it('returns an empty list for a desk with no letters', async () => {
    client.apiFetch.mockResolvedValueOnce(slice([], false))

    await expect(fetchOwnerMessages()).resolves.toEqual([])
  })

  it('fails as a whole when a later page fails, so a half list is never shown as the whole', async () => {
    client.apiFetch
      .mockResolvedValueOnce(slice([1], true))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(fetchOwnerMessages()).rejects.toThrow('Failed to fetch')
  })

  it('stops after 10 pages even if the server keeps saying there is more', async () => {
    client.apiFetch.mockImplementation(async () => slice([1], true))

    const all = await fetchOwnerMessages()

    expect(client.apiFetch).toHaveBeenCalledTimes(10)
    expect(all).toHaveLength(10)
  })
})
