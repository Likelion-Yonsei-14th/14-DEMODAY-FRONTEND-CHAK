import { useCallback, useEffect, useRef, useState } from 'react'
import { chaltteokApi } from '@/api/chaltteok'
import { usePrototypeStore } from '@/store/prototypeStore'

type BalanceState = {
  balance: number | null
  customerKey?: string
  failed: boolean
}

/** The signed-in user's 찰떡 balance. Guests have none, so nothing is fetched. */
export function useChaltteokBalance(enabled = true) {
  const signedIn = usePrototypeStore(
    (state) => state.authSession.status === 'authenticated',
  )
  const [state, setState] = useState<BalanceState>({ balance: null, failed: false })
  // A balance that arrives after the screen is gone is dropped, not applied.
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const reload = useCallback(() => {
    if (!signedIn) return
    setState((current) => ({ ...current, failed: false }))
    chaltteokApi
      .getBalance()
      .then(({ balance, customerKey }) => {
        if (mounted.current) setState({ balance, customerKey, failed: false })
      })
      .catch(() => {
        if (mounted.current) setState((current) => ({ ...current, failed: true }))
      })
  }, [signedIn])

  useEffect(() => {
    if (enabled) reload()
  }, [enabled, reload])

  const setBalance = useCallback(
    (balance: number) => setState((current) => ({ ...current, balance })),
    [],
  )

  return { signedIn, ...state, reload, setBalance }
}
