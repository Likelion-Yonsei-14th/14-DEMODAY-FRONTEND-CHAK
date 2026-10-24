import { beforeEach, describe, expect, it, vi } from 'vitest'
import { recordOutcomeOnce } from './studyTypeServer'

const record = vi.fn()

vi.mock('@/api/minigames', () => ({
  recordStudyType: (...args: unknown[]) => record(...args),
}))

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

beforeEach(() => {
  window.localStorage.clear()
  record.mockReset().mockResolvedValue({})
})

describe('recording a study type result', () => {
  it('sends the same answers only once, even if the result is opened again', async () => {
    const answers = { q1: 'P', q2: 'S' }
    recordOutcomeOnce('PSA', answers)
    await flush()
    recordOutcomeOnce('PSA', { q2: 'S', q1: 'P' })
    await flush()

    expect(record).toHaveBeenCalledTimes(1)
    expect(record).toHaveBeenCalledWith('PSA')
  })

  it('sends again for a new run of the test, and retries when the first send failed', async () => {
    record.mockRejectedValueOnce(new Error('offline'))
    recordOutcomeOnce('PSA', { q1: 'P' })
    await flush()
    recordOutcomeOnce('PSA', { q1: 'P' })
    await flush()
    expect(record).toHaveBeenCalledTimes(2)

    recordOutcomeOnce('LFN', { q1: 'L' })
    await flush()
    expect(record).toHaveBeenCalledTimes(3)
  })
})
