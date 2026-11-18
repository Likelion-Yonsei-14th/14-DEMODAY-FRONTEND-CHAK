import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ArrowLeft, LocateFixed } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppBar, IconButton } from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import type { Discount } from './discountData'
import { DiscountCard, useDiscounts } from './DiscountsPage'
import { DISCOUNTS_PATH } from './discountRoutes'
import { seoulToday, visibleDiscounts } from './discounts'
import { formatKm, useMyLocation, useSponsoredOrder, withSponsoredFirst } from './sponsored'
import './discounts.css'
import './discountsMap.css'

const SEOUL_CENTER: L.LatLngTuple = [37.5665, 126.978]

type Placed = Discount & { id: number; latitude: number; longitude: number }

const isPlaced = (d: Discount): d is Placed =>
  d.sponsored === true && d.id !== undefined && d.latitude !== undefined && d.longitude !== undefined

const pin = (selected: boolean) =>
  L.divIcon({
    className: selected ? 'discount-pin is-selected' : 'discount-pin',
    html: '<span></span>',
    iconSize: [28, 36],
    iconAnchor: [14, 34],
  })

const me = L.divIcon({ className: 'discount-me', html: '<span></span>', iconSize: [18, 18], iconAnchor: [9, 9] })

/**
 * 지도에서 제휴 매장 찾기. 좌표가 있는 제휴 혜택을 지도에 찍고, 고르면 아래에 혜택 카드를 보여 준다.
 * 아래 목록은 내 위치를 알려 주면 가까운 순, 아니면 혜택 목록과 같은 순서(덜 본 광고 먼저).
 */
export function DiscountsMapPage() {
  const navigate = useNavigate()
  const today = seoulToday()
  const loaded = useDiscounts()
  const location = useMyLocation()
  const order = useSponsoredOrder(location.point)
  const { items, meta } = useMemo(() => {
    const placed = visibleDiscounts(loaded?.items ?? [], today, { category: null, area: null }).filter(isPlaced)
    return withSponsoredFirst(placed, order)
  }, [loaded, today, order])
  // 내 위치를 알면 아래 목록은 가까운 순. 모르면 혜택 목록과 같은 순서.
  const stores = useMemo(() => {
    const placed = items as Placed[]
    if (!location.point) return placed
    const km = (d: Placed) => meta.get(d.id)?.distanceKm ?? Number.POSITIVE_INFINITY
    return [...placed].sort((a, b) => km(a) - km(b))
  }, [items, meta, location.point])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const selected = stores.find((d) => d.id === selectedId) ?? null

  const mapNode = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const meRef = useRef<L.Marker | null>(null)
  const fitted = useRef(false)

  useEffect(() => {
    if (!mapNode.current || mapRef.current) return
    const map = L.map(mapNode.current, { zoomControl: true, attributionControl: true }).setView(SEOUL_CENTER, 11)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      layerRef.current = null
      meRef.current = null
    }
  }, [])

  // 매장 핀
  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return
    layer.clearLayers()
    for (const d of stores) {
      L.marker([d.latitude, d.longitude], { icon: pin(d.id === selectedId), title: d.brand, keyboard: true })
        .on('click', () => setSelectedId(d.id))
        .addTo(layer)
    }
    if (!fitted.current && stores.length > 0 && !location.point) {
      fitted.current = true
      map.fitBounds(L.latLngBounds(stores.map((d) => [d.latitude, d.longitude] as L.LatLngTuple)), { padding: [40, 40], maxZoom: 14 })
    }
  }, [stores, selectedId, location.point])

  // 내 위치
  useEffect(() => {
    const map = mapRef.current
    if (!map || !location.point) return
    const at: L.LatLngTuple = [location.point.lat, location.point.lng]
    if (meRef.current) meRef.current.setLatLng(at)
    else meRef.current = L.marker(at, { icon: me, interactive: false }).addTo(map)
    map.setView(at, 14)
    fitted.current = true
  }, [location.point])

  const focus = (d: Placed) => {
    setSelectedId(d.id)
    mapRef.current?.setView([d.latitude, d.longitude], Math.max(mapRef.current.getZoom(), 15))
  }

  return (
    <AppShell
      surface="base"
      contentClassName="discounts-shell"
      appBar={
        <AppBar
          title="지도에서 제휴 매장 찾기"
          leading={
            <IconButton
              label="뒤로 가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(DISCOUNTS_PATH))}
            />
          }
        />
      }
    >
      <main className="discounts discounts-map">
        <div className="discounts-map__frame">
          <div ref={mapNode} className="discounts-map__map" role="application" aria-label="제휴 매장 지도" />
          <button
            type="button"
            className="discounts__locate discounts-map__locate"
            aria-pressed={location.state === 'ok'}
            disabled={location.state === 'asking'}
            onClick={location.request}
          >
            <LocateFixed size={16} aria-hidden />
            {location.state === 'asking' ? '위치 확인 중...' : '내 위치'}
          </button>
        </div>
        {location.state === 'denied' && (
          <p className="discounts__locate-note">위치 권한이 꺼져 있어요. 브라우저 설정에서 켜면 가까운 매장부터 보여요.</p>
        )}

        {selected && (
          <ul className="discounts__list discounts-map__selected" aria-label="고른 매장">
            <DiscountCard
              key={selected.id}
              d={selected}
              today={today}
              defaultOpen
              ad={{ ...(meta.get(selected.id) ?? { distanceKm: null }), placement: 'MAP' }}
            />
          </ul>
        )}

        {loaded && stores.length === 0 && <p className="discounts__empty">지도에 표시할 제휴 매장이 아직 없어요.</p>}
        {stores.length > 0 && (
          <section aria-label="제휴 매장 목록">
            <p className="discounts__count">
              제휴 매장 {stores.length}곳 · {location.point ? '가까운 순' : '내 위치를 켜면 가까운 순으로 보여요'}
            </p>
            <ul className="discounts-map__list">
              {stores.map((d) => {
                const km = meta.get(d.id)?.distanceKm ?? null
                return (
                  <li key={d.id}>
                    <button type="button" aria-pressed={d.id === selectedId} onClick={() => focus(d)}>
                      <strong>{d.brand}</strong>
                      <span>{d.benefit}</span>
                      <small>
                        {km !== null ? `${formatKm(km)} · ` : ''}
                        {d.address || d.place}
                      </small>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )}
      </main>
    </AppShell>
  )
}
