import { ApiError, apiFetch } from '@/api/client'
import type {
  ApiDeskWrite,
  ApiOwnerDesk,
  ApiOwnerMessage,
  ApiPublicDesk,
  ApiPublicMessage,
  ApiSendMessageRequest,
  SliceResponse,
} from '@/api/types'

const PAGE_SIZE = 100
const MAX_PAGES = 10

async function fetchAllPages<T>(
  path: string,
  query: Record<string, string | number | boolean | undefined> = {},
): Promise<T[]> {
  const all: T[] = []
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const slice = await apiFetch<SliceResponse<T>>(path, {
      query: { ...query, page, size: PAGE_SIZE },
    })
    all.push(...slice.content)
    if (!slice.hasNext) break
  }
  return all
}

// ---------- supporter side (no login required) ----------

export const fetchPublicDesk = (token: string) =>
  apiFetch<ApiPublicDesk>(`/api/public/desks/${token}`)

/** The owner may switch the public feed off; that is an empty list, not an error. */
export async function fetchPublicMessages(token: string): Promise<ApiPublicMessage[]> {
  try {
    return await fetchAllPages<ApiPublicMessage>(`/api/public/desks/${token}/messages`)
  } catch (error) {
    if (error instanceof ApiError && error.code === 'PUBLIC_FEED_DISABLED') return []
    throw error
  }
}

export const sendMessage = (token: string, request: ApiSendMessageRequest) =>
  apiFetch<ApiPublicMessage>(`/api/public/desks/${token}/messages`, {
    method: 'POST',
    body: request,
  })

// ---------- owner side (login required) ----------

export const createMyDesk = (body: ApiDeskWrite) =>
  apiFetch<ApiOwnerDesk>('/api/desks/me', { method: 'POST', body })

export const fetchMyDesk = () => apiFetch<ApiOwnerDesk>('/api/desks/me')

export const fetchOwnerMessages = () =>
  fetchAllPages<ApiOwnerMessage>('/api/desks/me/messages', { includeLocked: true })

export const markOwnerMessageRead = (deliveryId: number) =>
  apiFetch<ApiOwnerMessage>(`/api/desks/me/messages/${deliveryId}/read`, { method: 'PATCH' })

export const basketOwnerMessages = (deliveryIds: number[]) =>
  apiFetch<ApiOwnerMessage[]>('/api/desks/me/messages/basket', {
    method: 'POST',
    body: { deliveryIds },
  })
