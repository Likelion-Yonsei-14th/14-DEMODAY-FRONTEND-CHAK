import { apiFetch } from '@/api/client'
import type {
  ApiAdvertisement,
  ApiReaction,
  ApiReply,
  ApiReplyScope,
  ApiSentMessage,
  ApiSupporter,
  ApiUnlock,
  ApiUnlockCategory,
  SliceResponse,
} from '@/api/types'

// ---------- reactions & reports ----------

export const fetchMyReactions = (messageIds: number[]) =>
  messageIds.length === 0
    ? Promise.resolve({} as Record<string, ApiReaction>)
    : apiFetch<Record<string, ApiReaction>>('/api/public/messages/reactions', {
        query: { ids: messageIds.join(',') },
      })

export const setReaction = (messageId: number, type: ApiReaction) =>
  apiFetch(`/api/public/messages/${messageId}/reaction`, { method: 'PUT', body: { type } })

export const clearReaction = (messageId: number) =>
  apiFetch(`/api/public/messages/${messageId}/reaction`, { method: 'DELETE' })

export const reportMessage = (messageId: number, reason?: string) =>
  apiFetch(`/api/public/messages/${messageId}/report`, {
    method: 'POST',
    body: reason ? { reason } : {},
  })

// ---------- replies ----------

export const sendReply = (body: {
  scope: ApiReplyScope
  sourceMessageId?: number
  targetMessageIds: number[]
  text: string
}) => apiFetch<ApiReply>('/api/desks/me/replies', { method: 'POST', body })

export const fetchOwnerReplies = () => apiFetch<ApiReply[]>('/api/desks/me/replies')

export const fetchRepliesToMe = () => apiFetch<ApiReply[]>('/api/public/replies/mine')

// ---------- owner: hidden supporters ----------

export const fetchSupporters = () => apiFetch<ApiSupporter[]>('/api/desks/me/supporters')

export const blockSupporter = (deliveryId: number) =>
  apiFetch<{ id: number }>('/api/desks/me/blocks', { method: 'POST', body: { deliveryId } })

export const unblockSupporter = (blockId: number) =>
  apiFetch(`/api/desks/me/blocks/${blockId}`, { method: 'DELETE' })

// ---------- sent messages ----------

export const fetchSentMessages = (page: number, size: number) =>
  apiFetch<SliceResponse<ApiSentMessage>>('/api/public/messages/mine', { query: { page, size } })

export const deleteSentMessage = (messageId: number) =>
  apiFetch(`/api/public/messages/${messageId}`, { method: 'DELETE' })

// ---------- desk settings ----------

export type DeskSettingsBody = {
  displayName: string
  readModeType: 'DAILY' | 'TIME_CAPSULE'
  dailyUnlockTime: string | null
  capsuleUnlockAt: string | null
  publicFeedEnabled: boolean
  defaultMessageVisibility: 'PUBLIC' | 'PRIVATE'
  applyVisibilityToExisting: boolean
  pushEnabled: boolean
}

export const updateDeskSettings = (body: DeskSettingsBody) =>
  apiFetch('/api/desks/me/settings', { method: 'PATCH', body })

export const closeDesk = () => apiFetch('/api/desks/me/close', { method: 'POST' })
export const openDesk = () => apiFetch('/api/desks/me/open', { method: 'POST' })

// ---------- ad unlocks ----------

export const fetchUnlocks = () => apiFetch<ApiUnlock[]>('/api/public/unlocks', { quiet: true })

export const unlockWithAd = (category: ApiUnlockCategory, assetId: string, adSessionId?: string) =>
  apiFetch<ApiUnlock>('/api/public/unlocks', {
    method: 'POST',
    body: { category, assetId, adSessionId },
  })

export const fetchAds = (placement: string) =>
  apiFetch<ApiAdvertisement[]>('/api/public/ads', { query: { placement } })

export const reportAdEvent = (
  advertisementId: number,
  eventType: 'IMPRESSION' | 'VIEW_STARTED' | 'VIEW_COMPLETED' | 'CLICK',
  sessionId: string,
  viewDurationMs?: number,
) =>
  apiFetch(`/api/public/ads/${advertisementId}/events`, {
    method: 'POST',
    body: { eventType, sessionId, viewDurationMs },
  })
