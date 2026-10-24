import { recordStudyType } from '@/api/minigames'
import type { StudyTypeCode } from './studyTypeResults'

const RECORDED_KEY = 'study-type-recorded'

/**
 * 테스트를 끝낸 답안 한 벌은 한 번만 서버 통계에 넣는다. 결과 화면을 다시 열거나 되돌아와도 중복되지 않게
 * 마지막으로 보낸 답안을 기억해 둔다. 서버에 닿지 못해도 사용자에게는 아무 일도 없다.
 */
export function recordOutcomeOnce(typeCode: StudyTypeCode, answers: Record<string, unknown>) {
  const signature = JSON.stringify(Object.entries(answers).sort(([a], [b]) => a.localeCompare(b)))
  try {
    if (window.localStorage.getItem(RECORDED_KEY) === signature) return
  } catch {
    // 저장소를 못 쓰면 중복 방지 없이 그대로 보낸다.
  }
  recordStudyType(typeCode)
    .then(() => {
      try {
        window.localStorage.setItem(RECORDED_KEY, signature)
      } catch {
        // ignore
      }
    })
    .catch(() => {
      // 통계는 참고용이라 실패해도 넘어간다.
    })
}
