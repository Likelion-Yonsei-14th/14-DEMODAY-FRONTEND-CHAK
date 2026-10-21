import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { chaltteokApi } from '@/api/chaltteok'
import { usePrototypeStore } from '@/store/prototypeStore'
import { useChaltteokBalance } from './useChaltteokBalance'

afterEach(() => {
  vi.restoreAllMocks()
  act(() => usePrototypeStore.getState().signOut())
})

describe('useChaltteokBalance', () => {
  it('shows the balance once it arrives', async () => {
    act(() => usePrototypeStore.getState().signIn('jisu@gmail.com', 'google'))
    vi.spyOn(chaltteokApi, 'getBalance').mockResolvedValue({ balance: 30, customerKey: 'c-1' } as never)
    const { result } = renderHook(() => useChaltteokBalance())
    await act(async () => {})
    expect(result.current.balance).toBe(30)
  })

})
