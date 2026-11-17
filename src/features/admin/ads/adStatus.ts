import type { ApiAdvertisement } from '@/api/types'

export type AdStatus = 'off' | 'scheduled' | 'ended' | 'live'

export function adStatus(ad: Pick<ApiAdvertisement, 'active' | 'startsAt' | 'endsAt'>, now = Date.now()): AdStatus {
  if (!ad.active) return 'off'
  if (new Date(ad.startsAt).getTime() > now) return 'scheduled'
  if (new Date(ad.endsAt).getTime() <= now) return 'ended'
  return 'live'
}

export const STATUS_LABEL: Record<AdStatus, string> = {
  off: '꺼둠',
  scheduled: '예약',
  ended: '기간 끝',
  live: '게재 기간',
}
