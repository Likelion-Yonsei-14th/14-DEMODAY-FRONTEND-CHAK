import { apiFetch, apiUrl } from '@/api/client'
import type { ApiAdvertisement } from '@/api/types'

/** 지금 운영자 화면에서 고를 수 있는 지면. 배너는 첫 화면·홈·편지 화면 중간의 3:1 띠. */
export const AD_PLACEMENT_LABEL: Record<string, string> = {
  BANNER: '배너 (첫 화면·홈·편지 화면)',
  UNLOCK: '편지지·소품 해제 영상',
  HOME: '홈 (예전 지면)',
  DESK: '책상 (예전 지면)',
  MESSAGE_COMPLETE: '편지 완료 (예전 지면)',
}

export type AdInput = Omit<ApiAdvertisement, 'id'>

export type AdSwitchState = { enabled: boolean; updatedAt: string | null }

export type AdMetrics = { advertisementId: number; from: string; to: string; counts: Record<string, number> }

export const fetchAdminAds = () => apiFetch<ApiAdvertisement[]>('/api/admin/ads')

export const createAdminAd = (input: AdInput) =>
  apiFetch<ApiAdvertisement>('/api/admin/ads', { method: 'POST', body: input })

export const updateAdminAd = (id: number, input: AdInput) =>
  apiFetch<ApiAdvertisement>(`/api/admin/ads/${id}`, { method: 'PATCH', body: input })

export const fetchAdMetrics = (id: number, from: string, to: string) =>
  apiFetch<AdMetrics>(`/api/admin/ads/${id}/metrics`, { query: { from, to } })

export const fetchAdSwitch = () => apiFetch<AdSwitchState>('/api/admin/ads/switch')

export const setAdSwitch = (enabled: boolean) =>
  apiFetch<AdSwitchState>('/api/admin/ads/switch', { method: 'PUT', body: { enabled } })

export const AD_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
export const AD_IMAGE_MAX_BYTES = 1024 * 1024

/** 이미지를 올리고, 광고의 creativeUrl로 쓸 절대 주소를 돌려준다. */
export async function uploadAdCreative(file: File) {
  const uploaded = await apiFetch<{ id: number; path: string }>('/api/admin/ads/creatives', {
    method: 'POST',
    file,
  })
  return apiUrl(uploaded.path)
}
