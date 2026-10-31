import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
import { fetchRepliesToMe } from '@/api/community'
import { loadOwnerDesk, loadReactions } from '@/api/ownerLoader'
import { fetchPublicDesk, fetchPublicMessages } from '@/api/desks'
import { ApiError } from '@/api/client'
import { isApiEnabled } from '@/api/config'
import { cleanDeskToken } from '@/api/deskToken'
import { deskFromApi, publicMessagesFromApi, replyFromApi } from '@/api/mappers'
import { usePrototypeStore } from '@/store/prototypeStore'

type LoadState = 'loading' | 'ready' | 'not-found' | 'error'

const REFRESH_AFTER_HIDDEN_MS = 30_000

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
  const location = useLocation()
  const cleaned = cleanDeskToken(supporterToken)
  const [state, setState] = useState<LoadState>(isApiEnabled ? 'loading' : 'ready')

  useEffect(() => {
    if (!isApiEnabled || cleaned !== supporterToken) return
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

        // Replies to my letters and my own reactions load after the desk is shown.
        void Promise.all([
          fetchRepliesToMe().catch(() => []),
          loadReactions(mapped.messages.map((message) => message.id)),
        ]).then(([replies, reactions]) => {
          if (cancelled) return
          usePrototypeStore.setState({
            messageReplies: replies.map(replyFromApi),
            messageReactions: reactions,
          })
        })
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
  }, [supporterToken, cleaned])

  if (isApiEnabled && cleaned === null) return <Notice>존재하지 않는 응원 링크예요.</Notice>
  if (isApiEnabled && cleaned !== supporterToken) {
    // 끝에 붙은 군더더기를 떼고 같은 화면으로 다시 보낸다. 경로의 나머지(compose 등)와 검색어·해시는 그대로 둔다.
    const path = location.pathname.replace(/^\/desk\/[^/]+/, `/desk/${cleaned}`)
    return <Navigate to={`${path}${location.search}${location.hash}`} replace />
  }
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

    loadOwnerDesk(() => cancelled)
      .then(() => {
        if (cancelled) return
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

  // A page left open (a phone's in-app browser resumes without reloading) keeps
  // the letters it fetched, and letters that were locked then come without
  // their contents. Reload quietly when the page comes back after a while.
  useEffect(() => {
    if (!isApiEnabled || !authenticated) return
    let hiddenAt = 0
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now()
      } else if (hiddenAt && Date.now() - hiddenAt >= REFRESH_AFTER_HIDDEN_MS) {
        hiddenAt = 0
        loadOwnerDesk().catch(() => undefined)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [authenticated, userId])

  if (!isApiEnabled) return <Outlet />
  if (!authenticated) return <Navigate to="/auth/login" replace />
  if (state === 'no-desk') return <Navigate to="/prototype/create" replace />
  if (state === 'loading') return <Notice>내 책상을 불러오고 있어요...</Notice>
  if (state === 'error') return <Notice>내 책상을 불러오지 못했어요. 잠시 후 다시 시도해주세요.</Notice>
  return <Outlet />
}
