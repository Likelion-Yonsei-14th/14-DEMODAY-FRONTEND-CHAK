import { useEffect, useState } from 'react'
import { AdBannerView } from '@/features/ads/AdBanner'

export type PreviewAd = { title: string; creativeUrl: string; destinationUrl: string }

const SCREENS = [
  { id: 'welcome', label: '첫 화면' },
  { id: 'home', label: '홈' },
  { id: 'letter', label: '편지 화면' },
] as const

type ScreenId = (typeof SCREENS)[number]['id']

/** 배너 규격은 3:1 · 1125×375px. 다르면 위아래나 양옆이 잘린다. */
const IDEAL_RATIO = 3
const IDEAL_WIDTH = 1125

function Block({ label, tall = false, tone = 'plain' }: { label: string; tall?: boolean; tone?: 'plain' | 'brand' }) {
  return (
    <div className={`ad-preview__block ad-preview__block--${tone}${tall ? ' ad-preview__block--tall' : ''}`}>{label}</div>
  )
}

function Games() {
  return (
    <div className="ad-preview__games">
      <span>미니게임</span>
      <div>
        {Array.from({ length: 4 }, (_, i) => (
          <i key={i} />
        ))}
      </div>
    </div>
  )
}

/**
 * 운영자가 광고를 등록하면서 실제 화면에 어떻게 끼워지는지 보는 시안.
 * 광고 스위치가 꺼져 있어도 여기서는 항상 보여 준다.
 */
export function AdPreview({ ad, switchOn }: { ad: PreviewAd; switchOn: boolean }) {
  const [screen, setScreen] = useState<ScreenId>('home')
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  const [broken, setBroken] = useState(false)

  useEffect(() => {
    setSize(null)
    setBroken(false)
    if (!ad.creativeUrl) return
    const image = new Image()
    image.onload = () => setSize({ w: image.naturalWidth, h: image.naturalHeight })
    image.onerror = () => setBroken(true)
    image.src = ad.creativeUrl
  }, [ad.creativeUrl])

  const banner = ad.creativeUrl ? (
    <AdBannerView ad={ad} preview />
  ) : (
    <div className="ad-preview__empty">이미지를 올리면 여기에 보여요 (3:1)</div>
  )

  const ratio = size ? size.w / size.h : null
  const ratioOff = ratio !== null && Math.abs(ratio - IDEAL_RATIO) > 0.08
  const small = size !== null && size.w < IDEAL_WIDTH

  return (
    <div className="ad-preview">
      <div className="admin__tabs" role="tablist" aria-label="미리 볼 화면">
        {SCREENS.map((s) => (
          <button key={s.id} type="button" role="tab" aria-selected={screen === s.id} onClick={() => setScreen(s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="ad-preview__phone" data-testid="ad-preview-phone">
        {screen === 'welcome' && (
          <>
            <Block label="수능 D-day · 로그인" tall />
            <Block label="오늘의 질문 · 수험표 할인 모음" tone="brand" />
            {banner}
            <Games />
          </>
        )}
        {screen === 'home' && (
          <>
            <Block label="내 책상" tall />
            <Block label="+ 새 책상 만들기" />
            <Block label="오늘의 질문 · 수험표 할인 모음" tone="brand" />
            {banner}
            <Games />
          </>
        )}
        {screen === 'letter' && (
          <>
            <Block label="받은 편지" tall />
            <Block label="답장하기 · 다음 편지" />
            {banner}
          </>
        )}
      </div>

      <ul className="ad-preview__notes">
        {!switchOn && <li>광고 스위치가 꺼져 있어 지금은 사용자에게 보이지 않아요. 켜면 이렇게 보여요.</li>}
        {broken && <li className="admin__error">이미지를 불러오지 못했어요. 주소를 확인해 주세요.</li>}
        {size && (
          <li className={ratioOff || small ? 'admin__error' : undefined}>
            이미지 {size.w}×{size.h}
            {ratioOff ? ' · 3:1이 아니라 잘려 보여요' : ''}
            {small ? ` · 가로 ${IDEAL_WIDTH}px보다 작아 흐려 보일 수 있어요` : ''}
            {!ratioOff && !small ? ' · 규격에 맞아요' : ''}
          </li>
        )}
        <li>권장 규격 1125×375px (3:1), PNG·JPEG·WEBP·GIF, 1MB까지</li>
      </ul>
    </div>
  )
}
