import { useEffect, useState, type PropsWithChildren } from 'react'
import { restoreSession } from '@/api/auth'
import { fetchUnlocks } from '@/api/community'
import { isApiEnabled } from '@/api/config'
import { usePrototypeStore } from '@/store/prototypeStore'

/**
 * With a backend configured, the server is the source of truth for login:
 * on startup the HttpOnly refresh cookie either restores the session or the
 * (possibly stale, persisted) local login state is cleared.
 *
 * Children render only after that first attempt settles, so auth-dependent
 * redirects (e.g. "/" -> "/home") never act on a not-yet-restored session.
 */
export function AuthBootstrap({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(!isApiEnabled)

  useEffect(() => {
    if (!isApiEnabled) return
    let cancelled = false

    restoreSession()
      .then((user) => {
        if (cancelled) return
        const { signInWithServer, signOut, authSession } = usePrototypeStore.getState()
        if (user) signInWithServer(user)
        else if (authSession.status === 'authenticated') signOut()
      })
      .catch(() => {
        // Network failure: keep the current state and let the next request retry.
      })
      .finally(() => {
        if (cancelled) return
        setReady(true)
        // Stationery and decor unlocked by watching ads (members and guests).
        fetchUnlocks()
          .then((unlocks) => {
            usePrototypeStore.setState({
              unlockedStationeryIds: unlocks
                .filter((unlock) => unlock.category === 'STATIONERY')
                .map((unlock) => unlock.assetId),
              unlockedDecorIds: unlocks
                .filter((unlock) => unlock.category === 'DECOR')
                .map((unlock) => unlock.assetId),
            })
          })
          .catch(() => undefined)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return ready ? children : null
}
