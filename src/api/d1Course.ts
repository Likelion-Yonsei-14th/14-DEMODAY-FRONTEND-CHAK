import { apiFetch } from '@/api/client'
import { isApiEnabled } from '@/api/config'

/**
 * One answer of the 수능 끝 D+1 코스 짜기 mini game, kept only as statistics
 * (e.g. "홍대에 관심 있는 수험생 N명, 그중 염색 계획 62%"). No name, contact
 * or account goes with it; the server stamps the time.
 */
export type D1CourseResponse = {
  /** Random per play. Sending the same id again updates that answer (used to mark it shared). */
  responseId: string
  /** 시·도 id, e.g. "seoul", "gyeonggi". */
  startRegion: string
  /** Korean name within the region ("마포구", "수원시", "양평군"); null for 세종. */
  startDistrict: string | null
  area: string
  /** Exactly three, in the order picked. */
  activities: string[]
  companion: string
  budget: string
  shared: boolean
}

/**
 * Records the answer. Failures are ignored: the game never waits for or
 * depends on this. Sent without the login token so answers are not tied to
 * accounts.
 */
export function saveD1CourseResponse(response: D1CourseResponse) {
  try {
    if (!isApiEnabled) return
    void apiFetch('/api/public/minigames/d1-course/responses', {
      method: 'POST',
      auth: false,
      quiet: true,
      body: response,
    }).catch(() => undefined)
  } catch {
    // Collecting answers must never break the game.
  }
}
