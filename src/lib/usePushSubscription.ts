import { useCallback, useEffect, useState } from 'react'
import {
  disablePush,
  enablePush,
  isPushSubscribed,
  notificationPermission,
  pushFailureMessage,
  pushSupport,
  PushError,
  type PushSupport,
} from '@/lib/push'

/** 답장 알림 구독 상태와 켜고 끄는 동작. 켜는 동작은 사용자가 누른 직후에 불러야 한다. */
export function usePushSubscription() {
  const [support] = useState<PushSupport>(pushSupport)
  const [subscribed, setSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void isPushSubscribed().then((value) => {
      if (!cancelled) setSubscribed(value)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const enable = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      await enablePush()
      setSubscribed(true)
      return true
    } catch (failure) {
      setError(pushFailureMessage(failure instanceof PushError ? failure.reason : 'failed'))
      return false
    } finally {
      setBusy(false)
    }
  }, [])

  const disable = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      await disablePush()
      setSubscribed(false)
    } finally {
      setBusy(false)
    }
  }, [])

  return { support, subscribed, busy, error, enable, disable, denied: notificationPermission() === 'denied' }
}
