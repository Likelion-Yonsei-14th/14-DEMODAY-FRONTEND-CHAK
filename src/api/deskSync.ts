import { updateDeskSettings } from '@/api/community'
import { isApiEnabled } from '@/api/config'
import { readModeToApi } from '@/api/mappers'
import { notifyApiError } from '@/api/notify'
import type { Desk, OwnerSettings } from '@/types'

const DEBOUNCE_MS = 600
let timer: number | undefined

type Snapshot = { desk: Desk; settings: OwnerSettings }

/**
 * Saves the owner's desk settings (read mode, public feed, push) to the
 * backend. The screen updates instantly; this sends the latest values once the
 * user stops changing them, because time pickers fire many changes in a row.
 */
export function scheduleDeskSettingsSync(read: () => Snapshot) {
  if (!isApiEnabled) return
  window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    const { desk, settings } = read()
    // Only desks that came from the backend can be saved there.
    if (!desk.supporterToken) return

    let mode
    try {
      mode = readModeToApi(desk.readMode)
    } catch {
      return // a half-typed date; the next change will sync
    }

    updateDeskSettings({
      displayName: desk.displayName,
      ...mode,
      publicFeedEnabled: settings.publicFeedEnabled,
      defaultMessageVisibility: settings.defaultMessageVisibility === 'public' ? 'PUBLIC' : 'PRIVATE',
      applyVisibilityToExisting: false,
      pushEnabled: settings.pushEnabled,
    })
      // The backend re-times letters that are still locked, so the list this
      // screen holds (their unlock times and contents) is out of date now.
      .then(() => import('@/api/ownerLoader').then(({ loadOwnerDesk }) => loadOwnerDesk()))
      .catch(() => notifyApiError('설정을 저장하지 못했어요. 잠시 후 다시 시도해주세요.'))
  }, DEBOUNCE_MS)
}
