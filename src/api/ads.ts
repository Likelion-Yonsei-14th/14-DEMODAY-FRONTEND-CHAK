import { fetchAds, reportAdEvent } from '@/api/community'
import { isApiEnabled } from '@/api/config'
import type { ApiAdvertisement } from '@/api/types'

/** The ad shown when something is unlocked by watching. Null when none is registered. */
let unlockAd: Promise<ApiAdvertisement | null> | null = null

function getUnlockAd() {
  if (!unlockAd) {
    unlockAd = fetchAds('UNLOCK')
      .then((ads) => ads[0] ?? null)
      .catch(() => {
        unlockAd = null
        return null
      })
  }
  return unlockAd
}

/** Reports that one ad impression started. Failures are ignored; the unlock call decides. */
export async function reportAdStart(sessionId: string) {
  if (!isApiEnabled) return
  const ad = await getUnlockAd()
  if (!ad) return
  await reportAdEvent(ad.id, 'IMPRESSION', sessionId).catch(() => undefined)
  await reportAdEvent(ad.id, 'VIEW_STARTED', sessionId).catch(() => undefined)
}

/** Reports that the ad played to the end - the proof the backend checks before unlocking. */
export async function reportAdCompleted(sessionId: string, durationMs: number) {
  if (!isApiEnabled) return
  const ad = await getUnlockAd()
  if (!ad) return
  await reportAdEvent(ad.id, 'VIEW_COMPLETED', sessionId, durationMs).catch(() => undefined)
}
