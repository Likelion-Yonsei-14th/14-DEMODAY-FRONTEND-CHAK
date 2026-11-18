import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ArrowLeft, LocateFixed } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppBar, IconButton } from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import type { Discount } from './discountData'
import { DiscountCard } from './DiscountsPage'
import { useDiscounts } from './useDiscounts'
import { DISCOUNTS_PATH } from './discountRoutes'
import { seoulToday, visibleDiscounts } from './discounts'
import { formatKm, useMyLocation, useSponsoredImpression, useSponsoredOrder, withSponsoredFirst } from './sponsored'
import './discounts.css'
import './discountsMap.css'

const SEOUL_CENTER: L.LatLngTuple = [37.5665, 126.978]

type Placed = Discount & { id: number; latitude: number; longitude: number }

const isPlaced = (d: Discount): d is Placed =>
  d.sponsored === true && d.id !== undefined && d.latitude !== undefined && d.longitude !== undefined

/** 매장 핀: 착 로고를 붙인 말풍선 스티커. 고르면 조금 커진다. */
const pin = (selected: boolean) =>
  L.divIcon({
    className: selected ? 'discount-pin is-selected' : 'discount-pin',
    html: '<span><img src="/assets/brand/chak-mark.svg" alt="" /></span>',
    iconSize: [46, 54],
    iconAnchor: [23, 52],
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
    // 글자 없는 간단한 회색 바탕 지도. 길 이름까지 빽빽한 지도는 핀이 묻힌다. 국내는 13단계까지만 선명하다.
    const esri = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas'
    L.tileLayer(`${esri}/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`, {
      maxZoom: 16,
      maxNativeZoom: 13,
      attribution: '&copy; Esri, HERE, Garmin, OpenStreetMap',
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
      map.fitBounds(L.latLngBounds(stores.map((d) => [d.latitude, d.longitude] as L.LatLngTuple)), { padding: [40, 40], maxZoom: 13 })
    }
  }, [stores, selectedId, location.point])

  // 내 위치
  useEffect(() => {
    const map = mapRef.current
    if (!map || !location.point) return
    const at: L.LatLngTuple = [location.point.lat, location.point.lng]
    if (meRef.current) meRef.current.setLatLng(at)
    else meRef.current = L.marker(at, { icon: me, interactive: false }).addTo(map)
    map.setView(at, 13)
    fitted.current = true
  }, [location.point])

  const focus = (d: Placed) => {
    setSelectedId(d.id)
    mapRef.current?.setView([d.latitude, d.longitude], Math.max(mapRef.current.getZoom(), 13))
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
        <MapTint />
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
              {stores.map((d) => (
                <PartnerBanner
                  key={d.id}
                  d={d}
                  km={meta.get(d.id)?.distanceKm ?? null}
                  selected={d.id === selectedId}
                  onSelect={() => focus(d)}
                />
              ))}
            </ul>
          </section>
        )}
      </main>
    </AppShell>
  )
}

/**
 * 제휴 매장 한 곳을 배너로. 매장 이미지를 3:1로 크게 보여 주고 아래에 혜택 한 줄.
 * 누르면 지도가 그 매장으로 가고 혜택 카드가 열린다. 화면에 보이면 지도 노출로 센다.
 */
function PartnerBanner({ d, km, selected, onSelect }: { d: Placed; km: number | null; selected: boolean; onSelect: () => void }) {
  const ref = useRef<HTMLLIElement>(null)
  const [imageFailed, setImageFailed] = useState(false)
  useSponsoredImpression(ref, d.id, 'MAP')
  return (
    <li ref={ref}>
      <button type="button" className="partner-banner" aria-pressed={selected} onClick={onSelect}>
        <span className="partner-banner__media">
          {d.image && !imageFailed ? (
            <img src={d.image} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setImageFailed(true)} />
          ) : (
            <span className="partner-banner__fallback">
              <img src="/assets/brand/chak-mark.svg" alt="" />
              {d.brand}
            </span>
          )}
          {d.highlight && <strong className="partner-banner__highlight">{d.highlight}</strong>}
        </span>
        <span className="partner-banner__info">
          <strong>{d.brand}</strong>
          <span>{d.benefit}</span>
          <small>
            {km !== null ? `${formatKm(km)} · ` : ''}
            {d.address || d.place}
          </small>
        </span>
      </button>
    </li>
  )
}

/**
 * 회색 바탕 지도에 착 색을 입힌다: 밝기에 따라 물은 하늘색, 땅은 크림색, 길은 흰색.
 * 지도 타일에 CSS filter: url(#chak-map-tint)로 건다.
 */
export function MapTint() {
  // 밝기 0 → 1을 21칸으로 나눈 표. 물(약 0.78)은 파랑, 땅(약 0.92)은 크림, 길(1)은 흰색.
  const r = '0.42 0.44 0.46 0.48 0.5 0.52 0.54 0.56 0.58 0.6 0.62 0.64 0.66 0.56 0.56 0.62 0.70 0.90 0.96 0.975 1'
  const g = '0.6 0.61 0.62 0.63 0.64 0.65 0.66 0.67 0.68 0.69 0.7 0.71 0.72 0.75 0.75 0.81 0.85 0.89 0.93 0.95 0.995'
  const b = '0.7 0.71 0.72 0.73 0.74 0.75 0.76 0.77 0.78 0.79 0.8 0.81 0.82 0.85 0.85 0.89 0.91 0.83 0.86 0.89 0.97'
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden focusable="false">
      <filter id="chak-map-tint" colorInterpolationFilters="sRGB">
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncR type="table" tableValues={r} />
          <feFuncG type="table" tableValues={g} />
          <feFuncB type="table" tableValues={b} />
        </feComponentTransfer>
      </filter>
    </svg>
  )
}
