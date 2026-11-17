import { getVisitorGeo } from '@/api/geo'
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

/**
 * 이 사람에게 보여 줄 광고 하나(서버가 같은 노출 수·지역 맞춤으로 고른다). 없으면 null.
 * 위치는 서버가 호스팅 헤더로 먼저 알고, 헤더가 빠질 때를 위해 시·도 코드를 같이 보낸다.
 */
export async function serveAd(placement: string): Promise<ApiAdvertisement | null> {
  const geo = await getVisitorGeo().catch(() => null)
  const ad = await apiFetch<ApiAdvertisement | undefined>('/api/public/ads/serve', {
    query: { placement, geoCountry: geo?.country ?? undefined, geoRegion: geo?.region ?? undefined },
    quiet: true,
  })
  return ad ?? null
}

export const reportAdEvent = async (
  advertisementId: number,
  eventType: 'IMPRESSION' | 'VIEW_STARTED' | 'VIEW_COMPLETED' | 'CLICK',
  sessionId: string,
  viewDurationMs?: number,
) => {
  // 지역별 도달 보고용 시·도(헤더가 빠질 때 대비). IP는 보내지 않는다.
  const geo = await getVisitorGeo().catch(() => null)
  return apiFetch(`/api/public/ads/${advertisementId}/events`, {
    method: 'POST',
    quiet: true,
    body: {
      eventType,
      sessionId,
      viewDurationMs,
      geoCountry: geo?.country ?? undefined,
      geoRegion: geo?.region ?? undefined,
    },
  })
}
