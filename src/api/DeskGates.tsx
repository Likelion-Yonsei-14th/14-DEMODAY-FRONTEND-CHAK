import { useEffect, useState } from 'react'
import { Navigate, Outlet, useParams } from 'react-router-dom'
import {
  fetchMyDesk,
  fetchOwnerMessages,
  fetchPublicDesk,
  fetchPublicMessages,
} from '@/api/desks'
import { ApiError } from '@/api/client'
import { isApiEnabled } from '@/api/config'
import {
  deskFromApi,
  ownerMessagesFromApi,
  publicMessagesFromApi,
} from '@/api/mappers'
import { usePrototypeStore } from '@/store/prototypeStore'

type LoadState = 'loading' | 'ready' | 'not-found' | 'error'

function Notice({ children }: { children: string }) {
  return <main style={{ padding: 24, textAlign: 'center' }}>{children}</main>
}

/**
 * Wraps every /desk/:supporterToken route. It loads the desk and its public
 * letters once per token and keeps them in the store while the supporter moves
 * between pages (view -> compose -> place -> done).
 */
export function SupporterDeskGate() {
  const { supporterToken = '' } = useParams()
  const [state, setState] = useState<LoadState>(isApiEnabled ? 'loading' : 'ready')

  useEffect(() => {
    if (!isApiEnabled) return
    let cancelled = false
    setState('loading')

    Promise.all([fetchPublicDesk(supporterToken), fetchPublicMessages(supporterToken)])
      .then(([desk, items]) => {
        if (cancelled) return
        const store = usePrototypeStore.getState()
        const mapped = publicMessagesFromApi(items, String(desk.id))
        store.hydrateDesk({
          desk: deskFromApi(desk, store.currentDesk, mapped.objects, supporterToken),
          messages: mapped.messages,
          readMessageIds: [],
          basketMessageIds: [],
          ownerSettings: {
            publicFeedEnabled: desk.publicFeedEnabled,
            roomClosed: desk.roomClosed,
          },
        })
        setState('ready')
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setState(
          error instanceof ApiError && error.code === 'DESK_NOT_FOUND' ? 'not-found' : 'error',
        )
      })

    return () => {
      cancelled = true
    }
  }, [supporterToken])

  if (state === 'loading') return <Notice>책상을 불러오고 있어요...</Notice>
  if (state === 'not-found') return <Notice>존재하지 않는 응원 링크예요.</Notice>
  if (state === 'error') return <Notice>책상을 불러오지 못했어요. 잠시 후 다시 시도해주세요.</Notice>
  return <Outlet />
}

/**
 * Wraps the signed-in owner's own desk routes. Needs a login; a user without a
 * desk is sent to the desk creation flow.
 */
export function OwnerDeskGate() {
  const authenticated = usePrototypeStore((s) => s.authSession.status === 'authenticated')
  const userId = usePrototypeStore((s) =>
    s.authSession.status === 'authenticated' ? s.authSession.userId : undefined,
  )
  const [state, setState] = useState<LoadState | 'no-desk'>(isApiEnabled ? 'loading' : 'ready')

  useEffect(() => {
    if (!isApiEnabled || !authenticated) return
    let cancelled = false
    setState('loading')

    fetchMyDesk()
      .then(async (desk) => {
        const items = await fetchOwnerMessages()
        if (cancelled) return
        const store = usePrototypeStore.getState()
        const mapped = ownerMessagesFromApi(items, String(desk.id))
        store.hydrateDesk({
          desk: deskFromApi(desk, store.currentDesk, mapped.objects, desk.supporterToken),
          messages: mapped.messages,
          readMessageIds: mapped.readMessageIds,
          basketMessageIds: mapped.basketMessageIds,
          ownerSettings: {
            publicFeedEnabled: desk.publicFeedEnabled,
            roomClosed: desk.roomClosed,
          },
        })
        setState('ready')
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setState(
          error instanceof ApiError && error.code === 'DESK_NOT_FOUND' ? 'no-desk' : 'error',
        )
      })

    return () => {
      cancelled = true
    }
  }, [authenticated, userId])

  if (!isApiEnabled) return <Outlet />
  if (!authenticated) return <Navigate to="/auth/login" replace />
  if (state === 'no-desk') return <Navigate to="/prototype/create" replace />
  if (state === 'loading') return <Notice>내 책상을 불러오고 있어요...</Notice>
  if (state === 'error') return <Notice>내 책상을 불러오지 못했어요. 잠시 후 다시 시도해주세요.</Notice>
  return <Outlet />
}
