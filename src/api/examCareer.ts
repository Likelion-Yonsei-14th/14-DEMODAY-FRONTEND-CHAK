import { apiFetch } from '@/api/client'
import { isApiEnabled } from '@/api/config'

/**
 * One 수험생 커리어 시뮬레이터 play, kept only as statistics. It says when a
 * career began and, once it is over, where it ended up. No name, seed or
 * account goes with it; the server stamps the time.
 */
export type ExamCareerRun = {
  /** Stable for one career, so the start and the end land on the same row. */
  runId: string
  track: string
} & (
  | { finished: false }
  | {
      finished: true
      /** Retakes taken (0 is 현역). */
      attempt: number
      finalAverage: number
      /** University tier id, or "none" when the career ended without enrolling. */
      enrolled: string
      title: string
    }
)

/**
 * Records the play. Failures are ignored: the game never waits for or depends
 * on this. Sent without the login token so plays are not tied to accounts.
 */
export function saveExamCareerRun(run: ExamCareerRun) {
  try {
    if (!isApiEnabled) return
    void apiFetch('/api/public/minigames/exam-career/runs', {
      method: 'POST',
      auth: false,
      quiet: true,
      body: run,
    }).catch(() => undefined)
  } catch {
    // Collecting plays must never break the game.
  }
}
