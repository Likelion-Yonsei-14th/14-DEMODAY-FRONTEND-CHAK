import { useEffect, useRef, useState, type RefObject } from 'react'
import { isApiEnabled } from '@/api/config'
import { fetchSponsoredOrder, reportDiscountEvent, type DiscountPlacement, type SponsoredOrder } from '@/api/discounts'
import { isAdPreview } from '@/features/ads/adPreview'
import type { Discount } from './discountData'

export type Point = { lat: number; lng: number }

/** 제휴 혜택 카드에 붙는 정보: 내 위치에서 거리(모르면 null)와 놓인 자리. */
export type SponsoredMeta = { distanceKm: number | null }

/**
 * 제휴 혜택을 서버가 정한 순서대로 맨 위에 올리고, 나머지는 원래 순서를 지킨다.
 * 순서를 아직 못 받았으면 제휴 혜택을 원래 순서대로 위에 둔다(받은 뒤 크게 튀지 않게).
 */
export function withSponsoredFirst(list: readonly Discount[], order: SponsoredOrder | null) {
  const rank = new Map<number, number>()
  const meta = new Map<number, SponsoredMeta>()
  order?.items.forEach((slot, index) => {
    rank.set(slot.id, index)
    meta.set(slot.id, { distanceKm: slot.distanceKm })
  })
  const isTop = (d: Discount) => d.sponsored === true && d.id !== undefined && (order === null || rank.has(d.id))
  const top = list.filter(isTop).sort((a, b) => (rank.get(a.id!) ?? 0) - (rank.get(b.id!) ?? 0))
  for (const d of top) if (!meta.has(d.id!)) meta.set(d.id!, { distanceKm: null })
  return { items: [...top, ...list.filter((d) => !isTop(d))], meta }
}

/** 이 사람에게 맞춘 제휴 혜택 순서. point(내 위치)가 바뀌면 다시 받는다. */
export function useSponsoredOrder(point: Point | null): SponsoredOrder | null {
  const [order, setOrder] = useState<SponsoredOrder | null>(null)
  const lat = point?.lat
  const lng = point?.lng
  useEffect(() => {
    if (!isApiEnabled || isAdPreview) return
    let cancelled = false
    fetchSponsoredOrder(lat !== undefined && lng !== undefined ? { lat, lng } : null)
      .then((next) => {
        if (!cancelled) setOrder(next)
      })
      .catch(() => {
        if (!cancelled) setOrder({ region: null, located: false, items: [] })
      })
    return () => {
      cancelled = true
    }
  }, [lat, lng])
  return order
}

const POINT_KEY = 'chak.discounts.point'

function savedPoint(): Point | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(POINT_KEY) ?? 'null') as Point | null
    return value && Number.isFinite(value.lat) && Number.isFinite(value.lng) ? value : null
  } catch {
    return null
  }
}

export type LocationState = 'idle' | 'asking' | 'ok' | 'denied' | 'unavailable'

/**
 * "내 주변" 위치. 사용자가 버튼을 눌렀을 때만 묻는다. 서버에는 소수 넷째 자리(약 10m)로 줄여 보내고 저장하지 않으며,
 * 이 탭에서는 목록과 지도가 같은 위치를 쓰도록 세션에만 둔다.
 */
export function useMyLocation() {
  const [point, setPoint] = useState<Point | null>(() => savedPoint())
  const [state, setState] = useState<LocationState>(() => (savedPoint() ? 'ok' : 'idle'))
  const request = () => {
    if (!('geolocation' in navigator)) {
      setState('unavailable')
      return
    }
    setState('asking')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          lat: Math.round(position.coords.latitude * 10000) / 10000,
          lng: Math.round(position.coords.longitude * 10000) / 10000,
        }
        try {
          sessionStorage.setItem(POINT_KEY, JSON.stringify(next))
        } catch {
          // 저장 못 해도 이번 화면에서는 쓴다.
        }
        setPoint(next)
        setState('ok')
      },
      (error) => setState(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable'),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 10 * 60_000 },
    )
  }
  return { point, state, request }
}

/**
 * 카드가 화면(목록·지도)에 실리면 바로 노출 한 번. 스크롤해서 보이는지는 따지지 않아서,
 * 목록을 열면 그 안의 제휴 카드가 모두 한 번씩 노출로 잡힌다. 같은 카드는 실려 있는 동안 한 번만 보낸다.
 * (같은 사람이 30분 안에 다시 본 것은 서버가 한 번으로 친다.)
 */
export function useSponsoredImpression(ref: RefObject<HTMLElement | null>, id: number | undefined, placement: DiscountPlacement | null) {
  const sent = useRef(false)
  useEffect(() => {
    if (!ref.current || id === undefined || placement === null || !isApiEnabled || isAdPreview || sent.current) return
    sent.current = true
    void reportDiscountEvent(id, 'IMPRESSION', placement)
  }, [ref, id, placement])
}

/** 제휴 혜택 링크를 눌러 나갔을 때. */
export function reportSponsoredClick(id: number | undefined, placement: DiscountPlacement) {
  if (id === undefined || !isApiEnabled || isAdPreview) return
  void reportDiscountEvent(id, 'CLICK', placement)
}

export const formatKm = (km: number) => (km < 1 ? `${Math.max(100, Math.round(km * 10) * 100)}m` : `${km.toFixed(km < 10 ? 1 : 0)}km`)
