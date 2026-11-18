import { apiFetch } from '@/api/client'
import { getVisitorGeo } from '@/api/geo'
import type { Discount, DiscountCategory, DiscountExtra } from '@/features/discounts/discountData'

/** 서버가 주는 할인 한 건. 날짜는 한국 날짜("YYYY-MM-DD"), 없는 값은 null. */
export type ApiDiscount = {
  id: number
  brand: string
  category: string
  benefit: string
  start: string | null
  end: string | null
  conditions: string | null
  area: string
  place: string | null
  sourceUrl: string
  sourceDate: string | null
  highlight: string | null
  bring: string[]
  howTo: string | null
  /** 광고주가 정한 추가 항목. 이 칸이 생기기 전 서버는 보내지 않는다. */
  extras?: DiscountExtra[]
  companions: string | null
  branches: string | null
  image: string | null
  imageSource: string | null
  visible: boolean
  updatedByName: string | null
  updatedAt: string
  /** 제휴 광고와 지도 위치. 이 칸이 생기기 전 서버는 보내지 않는다. */
  sponsored?: boolean
  address?: string | null
  latitude?: number | null
  longitude?: number | null
}

export type DiscountInput = Omit<ApiDiscount, 'id' | 'updatedByName' | 'updatedAt' | 'extras'> & {
  extras: DiscountExtra[]
}

/** 서버 모양을 화면이 쓰는 모양으로. 빈 값은 화면 규칙대로 빈 글자나 없음으로 바꾼다. */
export function toDiscount(d: ApiDiscount): Discount {
  return {
    id: d.id,
    visible: d.visible,
    brand: d.brand,
    category: d.category as DiscountCategory,
    benefit: d.benefit,
    start: d.start,
    end: d.end,
    conditions: d.conditions ?? '',
    area: d.area,
    place: d.place ?? '',
    sourceUrl: d.sourceUrl,
    sourceDate: d.sourceDate ?? '',
    highlight: d.highlight ?? undefined,
    bring: d.bring.length > 0 ? d.bring : undefined,
    howTo: d.howTo ?? undefined,
    extras: d.extras && d.extras.length > 0 ? d.extras : undefined,
    companions: d.companions ?? undefined,
    branches: d.branches ?? undefined,
    image: d.image ?? undefined,
    imageSource: d.imageSource ?? undefined,
    sponsored: d.sponsored ?? false,
    address: d.address ?? undefined,
    latitude: d.latitude ?? undefined,
    longitude: d.longitude ?? undefined,
  }
}

const KST_DATE = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' })

/** 사용자 화면용: 켜 둔 혜택과, 마지막으로 고친 날(한국 날짜). */
export async function fetchDiscounts(): Promise<{ updated: string | null; items: Discount[] }> {
  const data = await apiFetch<{ updatedAt: string | null; items: ApiDiscount[] }>('/api/public/discounts', {
    auth: false,
  })
  return {
    updated: data.updatedAt ? KST_DATE.format(new Date(data.updatedAt)) : null,
    items: data.items.map(toDiscount),
  }
}

const ADMIN_PATH = '/api/admin/discounts'

export const fetchAdminDiscounts = () => apiFetch<ApiDiscount[]>(ADMIN_PATH)

export const createAdminDiscount = (input: DiscountInput) =>
  apiFetch<ApiDiscount>(ADMIN_PATH, { method: 'POST', body: input })

export const updateAdminDiscount = (id: number, input: DiscountInput) =>
  apiFetch<ApiDiscount>(`${ADMIN_PATH}/${id}`, { method: 'PUT', body: input })

export const deleteAdminDiscount = (id: number) => apiFetch<void>(`${ADMIN_PATH}/${id}`, { method: 'DELETE' })

/** 제휴 혜택 한 자리. distanceKm는 내 위치를 알려 줬고 매장 좌표가 있을 때만. */
export type SponsoredSlot = { id: number; distanceKm: number | null }
export type SponsoredOrder = { region: string | null; located: boolean; items: SponsoredSlot[] }

/**
 * 이 사람에게 보여 줄 제휴 혜택 순서. 가까운 매장 → 오늘 덜 본 광고 → 노출이 적은 광고 순(서버가 정한다).
 * point는 사용자가 "내 주변"을 눌러 알려 준 위치. 없으면 접속 지역으로 맞춘다.
 */
export async function fetchSponsoredOrder(point?: { lat: number; lng: number } | null): Promise<SponsoredOrder> {
  const geo = await getVisitorGeo().catch(() => null)
  return apiFetch<SponsoredOrder>('/api/public/discounts/sponsored', {
    query: {
      lat: point ? point.lat.toFixed(4) : undefined,
      lng: point ? point.lng.toFixed(4) : undefined,
      geoCountry: geo?.country ?? undefined,
      geoRegion: geo?.region ?? undefined,
    },
  })
}

export type DiscountEventType = 'IMPRESSION' | 'CLICK'
export type DiscountPlacement = 'LIST' | 'MAP'

/** 제휴 혜택 노출·클릭 한 건. 실패해도 화면에는 알리지 않는다. 링크로 떠나는 클릭도 남도록 keepalive. */
export async function reportDiscountEvent(id: number, type: DiscountEventType, placement: DiscountPlacement) {
  const geo = await getVisitorGeo().catch(() => null)
  await apiFetch<void>(`/api/public/discounts/${id}/events`, {
    method: 'POST',
    body: { type, placement, geoCountry: geo?.country ?? undefined, geoRegion: geo?.region ?? undefined },
    keepalive: true,
    quiet: true,
  }).catch(() => undefined)
}

/** 어드민 집계 한 줄. impressions·clicks는 횟수, reach·clickers는 사람 수. */
export type DiscountAdStat = {
  id: number
  brand: string
  benefit: string
  sponsored: boolean
  visible: boolean
  located: boolean
  impressions: number
  reach: number
  clicks: number
  clickers: number
  todayImpressions: number
  todayClicks: number
}

export const fetchDiscountAdStats = () => apiFetch<DiscountAdStat[]>(`${ADMIN_PATH}/stats`)
