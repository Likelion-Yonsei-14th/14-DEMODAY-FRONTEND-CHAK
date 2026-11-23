import { useEffect, useMemo, useRef, useState, type Ref } from 'react'
import { reportAdEvent, serveAd } from '@/api/community'
import { isApiEnabled } from '@/api/config'
import type { ApiAdvertisement } from '@/api/types'
import { isAdPreview, subscribeAdPreview, type PreviewBanner } from './adPreview'
import './AdBanner.css'

/** 광고 제안서의 "배너(옵션)" 지면. 규격은 3:1 · 1125×375px. */
export const BANNER_PLACEMENT = 'BANNER'

const newSessionId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`

/**
 * 화면 중간에 끼워 넣는 배너 광고 지면. 어떤 광고를 보여 줄지는 서버가 고른다
 * (광고마다 같은 노출 수, 대상 지역, 이 사람이 오늘 덜 본 것 먼저).
 * 광고를 받기 전이나 보여 줄 광고가 없으면 아무것도 그리지 않는다.
 */
export function AdBanner({
  placement = BANNER_PLACEMENT,
  className,
}: {
  placement?: string
  className?: string
}) {
  const [ad, setAd] = useState<ApiAdvertisement | null>(null)

  useEffect(() => {
    if (!isApiEnabled || isAdPreview) return
    let cancelled = false
    serveAd(placement)
      .then((served) => {
        if (!cancelled) setAd(served)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [placement])

  if (isAdPreview) return <PreviewSlot className={className} />
  return ad ? <SponsoredBanner ad={ad} className={className} /> : null
}

/** 운영자 화면이 보낸 시안을 이 자리에 그리고, 처음 한 번 화면 가운데로 스크롤한다. */
function PreviewSlot({ className }: { className?: string }) {
  const [ad, setAd] = useState<PreviewBanner | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const scrolled = useRef(false)

  useEffect(() => subscribeAdPreview((message) => setAd(message.ad)), [])

  useEffect(() => {
    if (!ad || scrolled.current) return
    scrolled.current = true
    // 페이지 데이터가 들어와 높이가 바뀐 뒤에 맞춘다.
    const timer = window.setTimeout(() => ref.current?.scrollIntoView({ block: 'center' }), 700)
    return () => window.clearTimeout(timer)
  }, [ad])

  return (
    <div ref={ref} className="ad-banner-preview-slot">
      {ad?.creativeUrl ? (
        <AdBannerView ad={ad} className={className} preview />
      ) : (
        <div className={['ad-banner', 'ad-banner--empty', className].filter(Boolean).join(' ')}>
          광고 이미지를 올리면 여기에 보여요
        </div>
      )}
    </div>
  )
}

function SponsoredBanner({ ad, className }: { ad: ApiAdvertisement; className?: string }) {
  const sessionId = useMemo(newSessionId, [ad.id])

  // 화면에 실리면 바로 노출 한 번. 스크롤해서 보이는지는 따지지 않는다.
  useEffect(() => {
    void reportAdEvent(ad.id, 'IMPRESSION', sessionId).catch(() => undefined)
  }, [ad.id, sessionId])

  return (
    <AdBannerView
      ad={ad}
      className={className}
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
