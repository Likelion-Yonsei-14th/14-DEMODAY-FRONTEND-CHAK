import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LOOK_LABEL, readLook, saveLook } from './deskBlastLook'

describe('which look the game has', () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('is the night desk when nothing says otherwise', () => {
    expect(readLook('')).toBe('arcade')
  })

  it('follows ?look= first, then what this device remembers', () => {
    saveLook('objects')

    expect(readLook('')).toBe('objects')
    expect(readLook('?look=arcade')).toBe('arcade')
    expect(readLook('?look=objects')).toBe('objects')
  })

  it('ignores a look it does not know, from the address or from storage', () => {
    window.localStorage.setItem('chak:desk-blast:look', 'neon')

    expect(readLook('?look=neon')).toBe('arcade')
    expect(readLook('')).toBe('arcade')
  })

  it('still works when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })

    expect(readLook('')).toBe('arcade')
    expect(() => saveLook('objects')).not.toThrow()
  })

  it('has a name for each look', () => {
    expect(LOOK_LABEL).toEqual({ arcade: '심야 책상', objects: '실물 문구' })
  })
})
