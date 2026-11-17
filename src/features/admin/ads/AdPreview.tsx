import { useEffect, useRef, useState } from 'react'
import { fetchOwnerMessages } from '@/api/desks'
import { getAccessToken } from '@/api/tokenStore'
import { AD_PREVIEW_PARAM, createAdPreviewHost } from '@/features/ads/adPreview'
import { composeShots, downloadDataUrl } from './adPreviewImage'

export type PreviewAd = { title: string; creativeUrl: string; destinationUrl: string }

type ScreenId = 'home' | 'discounts' | 'letter'

const SCREENS: { id: ScreenId; label: string }[] = [
  { id: 'home', label: '홈' },
  { id: 'discounts', label: '수험표 할인 모음' },
  { id: 'letter', label: '편지 화면' },
]

/** 배너 규격은 3:1 · 1125×375px. 다르면 위아래나 양옆이 잘린다. */
const IDEAL_RATIO = 3
const IDEAL_WIDTH = 1125

/** 휴대폰 한 화면 크기로 실제 페이지를 띄운 뒤 줄여서 보여 준다. */
const DEVICE = { width: 390, height: 780 }
const SCALE = 0.86

/**
 * 운영자가 광고를 등록하면서 실제 화면에 어떻게 끼워지는지 보는 시안.
 * 실제 페이지를 iframe으로 띄우고 배너 자리에 등록 중인 광고를 넣는다. 광고 스위치가 꺼져 있어도 보인다.
 * 미리보기 안에서는 눌러도 아무 일도 일어나지 않고, 방문·노출도 세지 않는다.
 */
export function AdPreview({ ad, switchOn }: { ad: PreviewAd; switchOn: boolean }) {
  const [screen, setScreen] = useState<ScreenId>('home')
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  const [broken, setBroken] = useState(false)
  // 편지 화면은 운영자 책상에 열어 볼 수 있는 편지가 있어야 보인다.
  const [letterId, setLetterId] = useState<string | null | undefined>(undefined)

  const adRef = useRef(ad)
  const hostRef = useRef<ReturnType<typeof createAdPreviewHost> | null>(null)
  useEffect(() => {
    const host = createAdPreviewHost(() => ({
      ad: adRef.current.creativeUrl ? adRef.current : null,
      accessToken: getAccessToken(),
    }))
    hostRef.current = host
    return () => {
      host.dispose()
      hostRef.current = null
    }
  }, [])
  useEffect(() => {
    adRef.current = ad
    hostRef.current?.broadcast()
  }, [ad])

  useEffect(() => {
    let cancelled = false
    fetchOwnerMessages()
      .then((messages) => {
        if (cancelled) return
        const open = messages.find((message) => !message.locked && message.kind === 'CARD')
        setLetterId(open ? String(open.messageId) : null)
      })
      .catch(() => {
        if (!cancelled) setLetterId(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setSize(null)
    setBroken(false)
    if (!ad.creativeUrl) return
    const image = new Image()
    image.onload = () => setSize({ w: image.naturalWidth, h: image.naturalHeight })
    image.onerror = () => setBroken(true)
    image.src = ad.creativeUrl
  }, [ad.creativeUrl])

  const pathOf = (id: ScreenId) =>
    id === 'home' ? '/home' : id === 'discounts' ? '/discounts' : letterId ? `/my/message/${letterId}` : null
  const path = pathOf(screen)

  // 세 화면을 모두 띄워 두고(보이는 것만 앞에), 저장할 때 각 화면이 스스로 찍은 이미지를 받아 온다.
  const frameRefs = useRef<Partial<Record<ScreenId, HTMLIFrameElement | null>>>({})
  const [saving, setSaving] = useState<'one' | 'all' | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const captureScreen = async (id: ScreenId) => {
    const frame = frameRefs.current[id]?.contentWindow
    const host = hostRef.current
    if (!frame || !host) return null
    return host.capture(frame)
  }

  const fileBase = `광고시안-${(ad.title || '광고').replace(/[\\/:*?"<>|]/g, '').slice(0, 30)}`

  const saveOne = async () => {
    setSaving('one')
    setSaveError(null)
    try {
      const dataUrl = await captureScreen(screen)
      if (!dataUrl) throw new Error('capture failed')
      downloadDataUrl(dataUrl, `${fileBase}-${SCREENS.find((s) => s.id === screen)?.label}.png`)
    } catch {
      setSaveError('이미지를 만들지 못했어요. 화면이 다 뜬 뒤 다시 눌러 주세요.')
    } finally {
      setSaving(null)
    }
  }

  const saveAll = async () => {
    setSaving('all')
    setSaveError(null)
    try {
      const shots: { label: string; dataUrl: string }[] = []
      for (const s of SCREENS) {
        if (!pathOf(s.id)) continue
        const dataUrl = await captureScreen(s.id)
        if (dataUrl) shots.push({ label: s.label, dataUrl })
      }
      if (shots.length === 0) throw new Error('capture failed')
      downloadDataUrl(await composeShots(shots, ad.title || '광고'), `${fileBase}-전체.png`)
    } catch {
      setSaveError('이미지를 만들지 못했어요. 화면이 다 뜬 뒤 다시 눌러 주세요.')
    } finally {
      setSaving(null)
    }
  }

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

      <div
        className="ad-preview__device"
        style={{ width: DEVICE.width * SCALE, height: DEVICE.height * SCALE }}
        data-testid="ad-preview-phone"
      >
        {SCREENS.map((s) => {
          const src = pathOf(s.id)
          return src ? (
            <iframe
              key={s.id}
              ref={(el) => {
                frameRefs.current[s.id] = el
              }}
              title={`${s.label} 미리보기`}
              src={`${src}?${AD_PREVIEW_PARAM}=1`}
              aria-hidden={s.id !== screen}
              tabIndex={s.id === screen ? 0 : -1}
              className={s.id === screen ? 'is-active' : undefined}
              style={{ width: DEVICE.width, height: DEVICE.height, transform: `scale(${SCALE})` }}
            />
          ) : null
        })}
        {path ? null : (
          <p className="ad-preview__unavailable">
            {letterId === undefined
              ? '편지를 찾는 중이에요...'
              : '운영자 계정 책상에 열어 볼 수 있는 편지가 없어 편지 화면은 미리 볼 수 없어요. 배너는 편지 마지막 장의 반응·답장 버튼 아래에 같은 크기로 들어가요.'}
          </p>
        )}
      </div>

      <div className="ad-preview__save">
        <button type="button" className="ads-btn" disabled={saving !== null || !path} onClick={saveOne}>
          {saving === 'one' ? '만드는 중...' : '이 화면 이미지로 저장'}
        </button>
        <button type="button" className="ads-btn" disabled={saving !== null} onClick={saveAll}>
          {saving === 'all' ? '만드는 중...' : '세 화면 한 장으로 저장'}
        </button>
      </div>
      {saveError && <p className="admin__error">{saveError}</p>}

      <ul className="ad-preview__notes">
        <li>실제 화면이에요. 스크롤해서 둘러볼 수 있고, 눌러도 아무 일도 일어나지 않아요.</li>
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

