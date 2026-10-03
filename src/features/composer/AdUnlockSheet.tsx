import { useEffect, useState } from 'react'
import { BottomSheet, Button } from '@/design-system'

/** How long the prototype "ad" plays before the reward unlocks, in seconds. */
const AD_SECONDS = 5

export type AdUnlockItem = {
  id: string
  name: string
  source?: string
}

type AdUnlockSheetProps<T extends AdUnlockItem> = {
  item: T | null
  /** What is being unlocked, e.g. '편지지' or '클립'. */
  kindLabel?: string
  /** 'contain' previews a cut-out (clip, tape); 'cover' a full sheet. */
  previewFit?: 'cover' | 'contain'
  /** Replaces the default "keep using it" copy. */
  description?: string
  onClose: () => void
  onUnlocked: (item: T) => void
}

/**
 * Prototype rewarded-ad flow: a placeholder "ad" counts down, then the
 * stationery unlocks. No real ad network is called.
 */
export function AdUnlockSheet<T extends AdUnlockItem>({
  item: background,
  kindLabel = '편지지',
  previewFit = 'cover',
  description,
  onClose,
  onUnlocked,
}: AdUnlockSheetProps<T>) {
  const [remaining, setRemaining] = useState(AD_SECONDS)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    setRemaining(AD_SECONDS)
    setPlaying(false)
  }, [background?.id])

  useEffect(() => {
    if (!playing || remaining <= 0) return
    const timer = window.setTimeout(() => setRemaining((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [playing, remaining])

  const finished = playing && remaining <= 0

  return (
    <BottomSheet
      open={Boolean(background)}
      onClose={onClose}
      title={`광고 보고 ${kindLabel} 열기`}
      description={
        description ??
        `광고 하나를 끝까지 보면 이 ${kindLabel}${hasBatchim(kindLabel) ? '을' : '를'} 계속 쓸 수 있어요.`
      }
    >
      {background && (
        <div className="ad-unlock">
          <div
            className={[
              'ad-unlock__preview',
              previewFit === 'contain' ? 'ad-unlock__preview--contain' : '',
            ].filter(Boolean).join(' ')}
          >
            {background.source && (
              <img src={background.source} alt="" draggable={false} />
            )}
            <span className="ad-unlock__name">{background.name}</span>
          </div>

          <div
            className={[
              'ad-unlock__player',
              playing ? 'ad-unlock__player--playing' : '',
            ].filter(Boolean).join(' ')}
            aria-live="polite"
          >
            <span className="ad-unlock__badge">AD</span>
            <span className="ad-unlock__copy">
              {!playing
                ? '광고 영역 (프로토타입)'
                : finished
                  ? '광고가 끝났어요'
                  : `광고 재생 중… ${remaining}초`}
            </span>
            <span
              className="ad-unlock__progress"
              style={{
                width: `${playing ? ((AD_SECONDS - remaining) / AD_SECONDS) * 100 : 0}%`,
              }}
            />
          </div>

          <p className="ad-unlock__note">
            프로토타입이라 실제 광고는 나오지 않아요.
          </p>

          {finished ? (
            <Button variant="brand" fullWidth onClick={() => onUnlocked(background)}>
              {kindLabel} 열기
            </Button>
          ) : (
            <Button
              variant="brand"
              fullWidth
              disabled={playing}
              onClick={() => setPlaying(true)}
            >
              {playing ? '광고 보는 중…' : '광고 보기'}
            </Button>
          )}
        </div>
      )}
    </BottomSheet>
  )
}

/** Whether the last Hangul syllable ends in a consonant (을/를 choice). */
function hasBatchim(word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  return code >= 0 && code <= 11171 && code % 28 !== 0
}
