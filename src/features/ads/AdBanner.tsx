import { useEffect, useMemo, useRef, useState, type Ref } from 'react'
import { fetchAds, reportAdEvent } from '@/api/community'
import { isApiEnabled } from '@/api/config'
import type { ApiAdvertisement } from '@/api/types'
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
 * 광고를 받기 전이나 등록된 광고가 없으면 아무것도 그리지 않는다.
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
  const [ad, setAd] = useState<ApiAdvertisement | null>(null)

  useEffect(() => {
    if (!isApiEnabled) return
    let cancelled = false
    void getBannerAds(placement).then((ads) => {
      if (!cancelled) setAd(ads[slot % ads.length] ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [placement, slot])

  return ad ? <SponsoredBanner ad={ad} className={className} /> : null
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
    <AdBannerView
      ad={ad}
      className={className}
      linkRef={ref}
      onClick={() => void reportAdEvent(ad.id, 'CLICK', sessionId).catch(() => undefined)}
    />
  )
}

type BannerLook = Pick<ApiAdvertisement, 'title' | 'creativeUrl' | 'destinationUrl'>

/**
 * 배너 한 장의 생김새. 실제 지면과 운영자 화면의 시안 미리보기가 같은 모양을 쓴다.
 * `preview`면 눌러도 이동하지 않고 노출·클릭을 세지 않는다.
 */
export function AdBannerView({
  ad,
  className,
  linkRef,
  onClick,
  preview = false,
}: {
  ad: BannerLook
  className?: string
  linkRef?: Ref<HTMLAnchorElement>
  onClick?: () => void
  preview?: boolean
}) {
  return (
    <aside className={['ad-banner', className].filter(Boolean).join(' ')} aria-label="광고">
      <a
        ref={linkRef}
        className="ad-banner__link"
        href={ad.destinationUrl}
        target="_blank"
        rel="sponsored noopener noreferrer"
        onClick={(event) => {
          if (preview) {
            event.preventDefault()
            return
          }
          onClick?.()
        }}
      >
        <img className="ad-banner__creative" src={ad.creativeUrl} alt={ad.title} loading={preview ? 'eager' : 'lazy'} />
        <span className="ad-banner__badge">광고</span>
      </a>
    </aside>
  )
}
