import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { usePrototypeStore } from '@/store/prototypeStore'
import { useHomePath } from './homePath'

afterEach(() => {
  act(() => usePrototypeStore.getState().signOut())
})

describe('useHomePath', () => {
  it('sends a signed-in user to /home and everyone else to the welcome screen', () => {
    act(() => usePrototypeStore.getState().signOut())
    const { result } = renderHook(() => useHomePath())
    expect(result.current).toBe('/')

    act(() => usePrototypeStore.getState().signIn('jisu@gmail.com', 'google'))
    expect(result.current).toBe('/home')
  })
})
