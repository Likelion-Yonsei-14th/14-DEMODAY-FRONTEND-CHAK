import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '@/features/discounts/discountsMap.css'

type Props = {
  address: string
  latitude: string
  longitude: string
  onChange: (next: { latitude: string; longitude: string }) => void
}

const SEOUL_CENTER: L.LatLngTuple = [37.5665, 126.978]
const pinIcon = L.divIcon({ className: 'discount-pin is-selected', html: '<span></span>', iconSize: [28, 36], iconAnchor: [14, 34] })

const parse = (lat: string, lng: string): L.LatLngTuple | null => {
  const a = Number(lat)
  const b = Number(lng)
  return lat.trim() && lng.trim() && Number.isFinite(a) && Number.isFinite(b) ? [a, b] : null
}

/**
 * 매장 위치 고르기. 주소로 찾거나(OpenStreetMap 검색) 지도를 눌러 핀을 옮긴다.
 * 네이버·카카오 지도에서 복사한 좌표를 칸에 바로 붙여 넣어도 된다.
 */
export function LocationPicker({ address, latitude, longitude, onChange }: Props) {
  const node = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const changeRef = useRef(onChange)
  changeRef.current = onChange
  const [searching, setSearching] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!node.current || mapRef.current) return
    const map = L.map(node.current).setView(SEOUL_CENTER, 11)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)
    map.on('click', (event: L.LeafletMouseEvent) => {
      changeRef.current({ latitude: event.latlng.lat.toFixed(6), longitude: event.latlng.lng.toFixed(6) })
    })
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const at = parse(latitude, longitude)
    if (!at) {
      markerRef.current?.remove()
      markerRef.current = null
      return
    }
    if (markerRef.current) markerRef.current.setLatLng(at)
    else markerRef.current = L.marker(at, { icon: pinIcon }).addTo(map)
    if (!map.getBounds().contains(at)) map.setView(at, 16)
  }, [latitude, longitude])

  const search = async () => {
    if (!address.trim()) {
      setMessage('주소를 먼저 넣어 주세요.')
      return
    }
    setSearching(true)
    setMessage(null)
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=kr&accept-language=ko&q=${encodeURIComponent(address.trim())}`
      const res = await fetch(url, { headers: { Accept: 'application/json' } })
      const found = (await res.json()) as { lat: string; lon: string; display_name: string }[]
      if (!found[0]) {
        setMessage('주소로 찾지 못했어요. 지도를 눌러 직접 찍거나, 네이버 지도의 좌표를 붙여 넣어 주세요.')
        return
      }
      onChange({ latitude: Number(found[0].lat).toFixed(6), longitude: Number(found[0].lon).toFixed(6) })
      mapRef.current?.setView([Number(found[0].lat), Number(found[0].lon)], 16)
      setMessage(`찾은 곳: ${found[0].display_name} — 핀이 매장 입구와 다르면 지도를 눌러 옮겨 주세요.`)
    } catch {
      setMessage('주소 찾기에 실패했어요. 지도를 눌러 직접 찍어 주세요.')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="location-picker">
      <div className="admin-actions">
        <button type="button" className="ads-btn" disabled={searching} onClick={search}>
          {searching ? '찾는 중...' : '주소로 위치 찾기'}
        </button>
        {parse(latitude, longitude) && (
          <button type="button" className="ads-btn" onClick={() => onChange({ latitude: '', longitude: '' })}>
            위치 지우기
          </button>
        )}
      </div>
      {message && <p className="admin__muted">{message}</p>}
      <div ref={node} className="location-picker__map" aria-label="매장 위치 지도. 누르면 핀을 옮겨요." />
    </div>
  )
}
