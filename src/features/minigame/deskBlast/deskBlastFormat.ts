/** What a finished game shows on the result card. */
export type BlastResult = {
  score: number
  bestCombo: number
  lines: number
  playMs: number
  typeName: string
  line: string
  newBest: boolean
  previousBest: number
}

export const formatPlayTime = (ms: number) => {
  const total = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return minutes > 0 ? `${minutes}분 ${seconds}초` : `${seconds}초`
}

/** How a result compares with the record that stood before this game. */
export function recordText(score: number, previousBest: number) {
  if (previousBest <= 0) return '첫 기록이에요'
  if (score > previousBest) return `기존 최고 기록보다 ${(score - previousBest).toLocaleString('ko-KR')}점 높아요`
  if (score === previousBest) return '최고 기록과 같아요'
  return `최고 기록까지 ${(previousBest - score).toLocaleString('ko-KR')}점 남았어요`
}
