import type { Grade, ResultStats } from './gradeDrawLogic'

export type GradeDrawTitleId =
  | 'csat-god'
  | 'worst-luck'
  | 'extremes'
  | 'top-luck'
  | 'korean-math'
  | 'destined'

export type GradeDrawTitle = {
  id: GradeDrawTitleId
  title: string
  quote: string
}

/** Listed in judging order: the first rule a report card meets wins. */
export const GRADE_DRAW_TITLES: Record<GradeDrawTitleId, GradeDrawTitle> = {
  'csat-god': {
    id: 'csat-god',
    title: '수능의 신',
    quote: '이 정도면 운이 아니라 기적입니다.',
  },
  'worst-luck': {
    id: 'worst-luck',
    title: '역대급 불운',
    quote: '이 확률을 뚫은 것도 어쩌면 재능일지도?',
  },
  extremes: {
    id: 'extremes',
    title: '극과 극 성적표',
    quote: '한 과목은 천재, 다른 과목은 운명의 장난.',
  },
  'top-luck': {
    id: 'top-luck',
    title: '운빨 최상위권',
    quote: '오늘은 수능의 신이 당신 편인가 봅니다.',
  },
  'korean-math': {
    id: 'korean-math',
    title: '국수 천재',
    quote: '국어와 수학, 오늘만큼은 완벽 정복!',
  },
  destined: {
    id: 'destined',
    title: '운명의 수험생',
    quote: '이것이 오늘 운명이 정해 준 성적표!',
  },
}

/**
 * Picks the one title for a finished report card. `grades` is in subject
 * order, so index 0 is 국어 and index 1 is 수학.
 */
export function determineResultTitle(grades: readonly Grade[]): GradeDrawTitle {
  const firsts = grades.filter((grade) => grade === 1).length
  const hasFirst = firsts > 0
  const hasNinth = grades.includes(9)

  if (grades.length > 0 && grades.every((grade) => grade === 1)) return GRADE_DRAW_TITLES['csat-god']
  if (grades.length > 0 && grades.every((grade) => grade === 9)) return GRADE_DRAW_TITLES['worst-luck']
  if (hasFirst && hasNinth) return GRADE_DRAW_TITLES.extremes
  if (firsts >= 3) return GRADE_DRAW_TITLES['top-luck']
  if (grades[0] === 1 && grades[1] === 1) return GRADE_DRAW_TITLES['korean-math']
  return GRADE_DRAW_TITLES.destined
}

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
