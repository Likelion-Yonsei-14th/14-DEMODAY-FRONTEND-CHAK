/** Choices of 수능 끝 D+1 코스 짜기. Ids are what the survey stores, so keep them stable. */

export type Option<Id extends string = string> = { id: Id; label: string }

export const AREAS = [
  { id: 'hongdae', label: '홍대' },
  { id: 'gangnam', label: '강남' },
  { id: 'jamsil', label: '잠실' },
  { id: 'seongsu', label: '성수' },
  { id: 'sinchon', label: '신촌' },
  { id: 'konkuk', label: '건대' },
  { id: 'local', label: '우리 동네' },
] as const satisfies readonly Option[]

/** `course` is how the activity reads in the finished course line. */
export const ACTIVITIES = [
  { id: 'dye', label: '염색', course: '염색' },
  { id: 'lens', label: '렌즈', course: '렌즈 맞추기' },
  { id: 'photo', label: '사진관', course: '사진관' },
  { id: 'clothes', label: '옷 쇼핑', course: '옷 쇼핑' },
  { id: 'karaoke', label: '노래방', course: '노래방' },
  { id: 'escape', label: '방탈출', course: '방탈출' },
  { id: 'themepark', label: '놀이공원', course: '놀이공원' },
  { id: 'food', label: '맛집', course: '맛집 탐방' },
  { id: 'license', label: '운전면허', course: '운전면허 학원' },
] as const satisfies readonly (Option & { course: string })[]

export const COMPANIONS = [
  { id: 'alone', label: '혼자' },
  { id: 'small', label: '2~3명' },
  { id: 'group', label: '4명+' },
  { id: 'family', label: '가족' },
] as const satisfies readonly Option[]

export const BUDGETS = [
  { id: 'under30k', label: '~3만 원' },
  { id: '30kTo100k', label: '3~10만 원' },
  { id: 'over100k', label: '10만 원+' },
] as const satisfies readonly Option[]

export type AreaId = (typeof AREAS)[number]['id']
export type ActivityId = (typeof ACTIVITIES)[number]['id']
export type CompanionId = (typeof COMPANIONS)[number]['id']
export type BudgetId = (typeof BUDGETS)[number]['id']

export const ACTIVITY_COUNT = 3
export const NICKNAME_MAX_LENGTH = 10

/** The "none of these" place, shown with where the player starts. */
export const LOCAL_AREA: AreaId = 'local'

export const labelOf = <Id extends string>(options: readonly Option<Id>[], id: Id) =>
  options.find((option) => option.id === id)!.label

export const courseLabelOf = (id: ActivityId) => ACTIVITIES.find((activity) => activity.id === id)!.course

/** Fisher-Yates on a copy. Answer options are shown in a new order each play so no position collects more answers. */
export function shuffled<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1))
    ;[result[index], result[swap]] = [result[swap]!, result[index]!]
  }
  return result
}

/** "홍대" or, for 우리 동네, where the player starts ("마포구 우리 동네", see startText). */
export function placeText(area: AreaId, start: string | null) {
  if (area !== LOCAL_AREA) return labelOf(AREAS, area)
  return start ? `${start} 우리 동네` : '우리 동네'
}

export const courseLine = (activities: readonly ActivityId[]) => activities.map(courseLabelOf).join(' → ')
