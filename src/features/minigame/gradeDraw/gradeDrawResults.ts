import type { ResultStats } from './gradeDrawLogic'

/** Short remarks read straight off the drawn grades; never a judgment of the student. */
export function getResultComments(stats: ResultStats): string[] {
  const comments: string[] = []
  const spread = stats.worstGrade - stats.bestGrade

  if (stats.firstGradeCount >= 3) {
    comments.push(`1등급이 ${stats.firstGradeCount}개나 나왔어요!`)
  } else if (stats.firstGradeCount > 0) {
    comments.push(`1등급 과목이 ${stats.firstGradeCount}개 있어요.`)
  }

  if (spread >= 5) {
    comments.push('과목 간 등급 차이가 꽤 크네요.')
  } else if (spread <= 1) {
    comments.push('과목별 등급이 거의 비슷한, 아주 고른 성적표예요.')
  } else if (spread <= 2) {
    comments.push('오늘은 전체적으로 안정적인 성적표가 나왔어요.')
  }

  if (comments.length === 0) comments.push('과목마다 개성이 살아 있는 성적표예요.')
  return comments
}
