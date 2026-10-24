import { submitGuessGodRound } from '@/api/minigames'
import { applyServerGrade, type GuessGodGame } from './guessGodLogic'

/** 서버가 이만큼 답이 없으면 이 기기에서 채점한다(랭킹에는 오르지 않는다). */
export const SERVER_GRADE_TIMEOUT_MS = 6_000

/**
 * 발급받은 판 번호로 서버에 답을 내고, 서버의 정답과 점수로 잠근 게임을 돌려준다.
 * 연결이 안 되거나 판이 만료됐거나 이미 낸 판이면 null: 호출하는 쪽이 이 기기에서 채점한다.
 */
export async function gradeOnServer(game: GuessGodGame): Promise<GuessGodGame | null> {
  if (!game.roundId) return null
  let timer: number | undefined
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = window.setTimeout(() => reject(new Error('timeout')), SERVER_GRADE_TIMEOUT_MS)
    })
    const grade = await Promise.race([submitGuessGodRound(game.roundId, game.userAnswers), timeout])
    return applyServerGrade(game, grade)
  } catch {
    return null
  } finally {
    window.clearTimeout(timer)
  }
}
