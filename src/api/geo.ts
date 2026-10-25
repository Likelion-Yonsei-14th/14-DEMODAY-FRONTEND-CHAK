const GEO_KEY = 'chak.geo'
const GEO_TIMEOUT_MS = 2_000

export type VisitorGeo = { country: string | null; region: string | null }

let pending: Promise<VisitorGeo | null> | null = null

const COUNTRY = /^[A-Za-z]{2}$/
const REGION = /^[A-Za-z0-9 _.-]{1,40}$/

function clean(value: unknown): VisitorGeo | null {
  if (!value || typeof value !== 'object') return null
  const { country, region } = value as Record<string, unknown>
  const geo: VisitorGeo = {
    country: typeof country === 'string' && COUNTRY.test(country) ? country.toUpperCase() : null,
    region: typeof region === 'string' && REGION.test(region) ? region : null,
  }
  return geo.country || geo.region ? geo : null
}

/**
 * 방문자의 국가·시도 코드. 호스팅이 알려 주는 값(`/api/geo`)을 탭 세션 동안 한 번만 받아 둔다.
 * 받지 못하면 null이며 방문 기록은 위치 없이 그대로 보낸다(오래 기다리지 않는다).
 */
export function getVisitorGeo(): Promise<VisitorGeo | null> {
  try {
    const saved = clean(JSON.parse(sessionStorage.getItem(GEO_KEY) ?? 'null'))
    if (saved) return Promise.resolve(saved)
  } catch {
    // 저장소를 못 쓰면 매번 새로 받는다.
  }
  if (pending) return pending

  pending = (async () => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), GEO_TIMEOUT_MS)
    try {
      const response = await fetch('/api/geo', { signal: controller.signal, cache: 'no-store' })
      if (!response.ok) return null
      const geo = clean(await response.json())
      if (geo) {
        try {
          sessionStorage.setItem(GEO_KEY, JSON.stringify(geo))
        } catch {
          // ignore
        }
      }
      return geo
    } catch {
      return null
    } finally {
      window.clearTimeout(timer)
    }
  })()
  return pending
}

/** For tests. */
export function resetVisitorGeo() {
  pending = null
}
