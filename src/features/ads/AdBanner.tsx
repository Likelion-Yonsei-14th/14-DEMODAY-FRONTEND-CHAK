import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fetchAds, reportAdEvent } from '@/api/community'
import { isApiEnabled } from '@/api/config'
import type { ApiAdvertisement } from '@/api/types'
import { promotionStatus } from '@/features/promotion/promotionContent'
import './AdBanner.css'

/** 광고 제안서의 "배너(옵션)" 지면. 규격은 3:1 · 1125×375px. */
export const BANNER_PLACEMENT = 'BANNER'

/** 한 화면에서 같은 광고를 여러 지면이 나눠 받도록 placement별로 한 번만 묻는다. */
const bannerAds = new Map<string, Promise<ApiAdvertisement[]>>()

function getBannerAds(placement: string) {
  let ads = bannerAds.get(placement)
  if (!ads) {
    ads = fetchAds(placement)
      .then((list) => list.filter((ad) => ad.active))
      .catch(() => {
        bannerAds.delete(placement)
        return []
      })
    bannerAds.set(placement, ads)
  }
  return ads
}

const newSessionId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`

/**
 * 화면 중간에 끼워 넣는 배너 광고 지면. `slot`은 같은 화면의 몇 번째 지면인지로,
 * 광고가 여러 개면 지면마다 다른 광고를 돌려 보여 준다.
 * 등록된 광고가 없으면 광고 접수 기간에는 자리 안내(→ /promotion)를, 그 뒤에는 아무것도 그리지 않는다.
 */
export function AdBanner({
  slot = 0,
  placement = BANNER_PLACEMENT,
  className,
}: {
  slot?: number
  placement?: string
  className?: string
}) {
  const [ad, setAd] = useState<ApiAdvertisement | null | undefined>(isApiEnabled ? undefined : null)

  useEffect(() => {
    if (!isApiEnabled) return
    let cancelled = false
    void getBannerAds(placement).then((ads) => {
      if (!cancelled) setAd(ads.length ? ads[slot % ads.length] : null)
    })
    return () => {
      cancelled = true
    }
  }, [placement, slot])

  // 광고를 묻는 동안은 자리만 잡아 두어 아래 내용이 밀리지 않게 한다.
  if (ad === undefined) {
    return <div className={['ad-banner', 'ad-banner--loading', className].filter(Boolean).join(' ')} aria-hidden />
  }
  if (ad) return <SponsoredBanner ad={ad} className={className} />
  if (promotionStatus() === 'OPEN') return <HouseBanner className={className} />
  return null
}

function SponsoredBanner({ ad, className }: { ad: ApiAdvertisement; className?: string }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const sessionId = useMemo(newSessionId, [ad.id])

  // 절반 이상 화면에 들어왔을 때 한 번만 노출로 센다.
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const report = () => void reportAdEvent(ad.id, 'IMPRESSION', sessionId).catch(() => undefined)
    if (typeof IntersectionObserver === 'undefined') {
      report()
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          report()
          observer.disconnect()
        }
      },
      { threshold: 0.5 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [ad.id, sessionId])

  return (
    <aside className={['ad-banner', className].filter(Boolean).join(' ')} aria-label="광고">
      <a
        ref={ref}
        className="ad-banner__link"
        href={ad.destinationUrl}
        target="_blank"
        rel="sponsored noopener noreferrer"
        onClick={() => void reportAdEvent(ad.id, 'CLICK', sessionId).catch(() => undefined)}
      >
        <img className="ad-banner__creative" src={ad.creativeUrl} alt={ad.title} loading="lazy" />
        <span className="ad-banner__badge">광고</span>
      </a>
    </aside>
  )
}

/** 아직 광고가 없는 지면: 사장님께 이 자리를 알린다. */
function HouseBanner({ className }: { className?: string }) {
  return (
    <aside className={['ad-banner', 'ad-banner--house', className].filter(Boolean).join(' ')} aria-label="광고">
      <Link className="ad-banner__link ad-banner__house" to="/promotion">
        <span className="ad-banner__house-tag">광고 · 제휴</span>
        <strong>이 자리에 우리 가게를 알려 보세요</strong>
        <span className="ad-banner__house-body">
          매일 응원을 열러 오는 수험생에게 보여요
          <ChevronRight size={16} aria-hidden />
        </span>
      </Link>
    </aside>
  )
}
