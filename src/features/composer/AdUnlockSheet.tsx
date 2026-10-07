import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { BottomSheet, Button, IconButton } from '@/design-system'

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
 * Prototype rewarded-ad flow: tapping "광고 보기" takes over the full screen
 * like a real rewarded-video ad, counts down, then the stationery unlocks.
 * No real ad network is called.
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

  // BottomSheet locks body scroll on its own while it's open, but it
  // unmounts the moment playback starts (the fullscreen player replaces
  // it), which would release that lock mid-ad. Pick the lock up exactly
  // at that handoff - keyed on `playing`, not on `background`, so this
  // effect's own save/restore never overlaps with the sheet's.
  useEffect(() => {
    if (!playing) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [playing])

  const finished = playing && remaining <= 0

  if (playing && background) {
    return createPortal(
      <AdFullscreenPlayer
        item={background}
        kindLabel={kindLabel}
        remaining={remaining}
        finished={finished}
        onClose={onClose}
        onUnlocked={() => onUnlocked(background)}
      />,
      document.body,
    )
  }

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

          <p className="ad-unlock__note">
            전체 화면으로 광고 하나를 끝까지 보면 열려요.
          </p>

          <Button variant="brand" fullWidth onClick={() => setPlaying(true)}>
            광고 보기
          </Button>
        </div>
      )}
    </BottomSheet>
  )
}

type AdFullscreenPlayerProps<T extends AdUnlockItem> = {
  item: T
  kindLabel: string
  remaining: number
  finished: boolean
  onClose: () => void
  onUnlocked: () => void
}

/** Full-screen rewarded-ad takeover, portaled above everything else. */
function AdFullscreenPlayer<T extends AdUnlockItem>({
  item,
  kindLabel,
  remaining,
  finished,
  onClose,
  onUnlocked,
}: AdFullscreenPlayerProps<T>) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (finished && event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [finished, onClose])

  return (
    <div
      className="ad-fullscreen"
      role="dialog"
      aria-modal="true"
      aria-label={`${kindLabel} 광고`}
    >
      <div className="ad-fullscreen__frame">
        <header className="ad-fullscreen__topbar">
          <span className="ad-unlock__badge">AD</span>
          {finished ? (
            <IconButton
              label="닫기"
              icon={<X size={20} aria-hidden />}
              onClick={onClose}
            />
          ) : (
            <span className="ad-fullscreen__timer">{remaining}초</span>
          )}
        </header>

        <div className="ad-fullscreen__stage" aria-live="polite">
          <span className="ad-fullscreen__stage-copy">
            {finished ? '광고가 끝났어요' : '광고 재생 중…'}
          </span>
          {item.source && (
            <img
              className="ad-fullscreen__preview"
              src={item.source}
              alt=""
              draggable={false}
            />
          )}
          <span className="ad-fullscreen__name">{item.name}</span>
        </div>

        <div className="ad-fullscreen__progress-track">
          <span
            className="ad-fullscreen__progress"
            style={{ width: `${((AD_SECONDS - remaining) / AD_SECONDS) * 100}%` }}
          />
        </div>

        <footer className="ad-fullscreen__footer">
          <p className="ad-unlock__note">
            프로토타입이라 실제 광고는 나오지 않아요.
          </p>

          {finished ? (
            <Button variant="brand" fullWidth onClick={onUnlocked}>
              {kindLabel} 열기
            </Button>
          ) : (
            <Button variant="brand" fullWidth disabled>
              광고 재생 중… {remaining}초
            </Button>
          )}
        </footer>
      </div>
    </div>
  )
}

/** Whether the last Hangul syllable ends in a consonant (을/를 choice). */
function hasBatchim(word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  return code >= 0 && code <= 11171 && code % 28 !== 0
}
