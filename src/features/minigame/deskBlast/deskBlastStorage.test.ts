import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hasSeenHint, loadBestScore, markHintSeen, saveBestScore } from './deskBlastStorage'

describe('best score on this device', () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('starts at zero and keeps only a higher score', () => {
    expect(loadBestScore()).toBe(0)

    expect(saveBestScore(500)).toBe(true)
    expect(loadBestScore()).toBe(500)
    expect(saveBestScore(300)).toBe(false)
    expect(saveBestScore(500)).toBe(false)
    expect(loadBestScore()).toBe(500)
    expect(saveBestScore(501)).toBe(true)
  })

  it('ignores scores that are not whole numbers', () => {
    expect(saveBestScore(-5)).toBe(false)
    expect(saveBestScore(12.5)).toBe(false)
    expect(saveBestScore(Number.NaN)).toBe(false)
    expect(loadBestScore()).toBe(0)
  })

  it('treats damaged or foreign data as no record', () => {
    for (const raw of ['not json', '{"version":2,"best":900}', '{"version":1,"best":"900"}', '{"version":1,"best":-3}', 'null']) {
      window.localStorage.setItem('chak:desk-blast:best', raw)

      expect(loadBestScore()).toBe(0)
    }
  })

  it('still works when storage is blocked: nothing is kept, nothing throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })

    expect(loadBestScore()).toBe(0)
    expect(saveBestScore(700)).toBe(true)
    expect(hasSeenHint()).toBe(false)
    expect(() => markHintSeen()).not.toThrow()
  })
})

describe('first-visit hint', () => {
  beforeEach(() => window.localStorage.clear())

  it('is unseen until marked, then stays seen', () => {
    expect(hasSeenHint()).toBe(false)

    markHintSeen()

    expect(hasSeenHint()).toBe(true)
  })
})
