import { ACTIVITIES, ACTIVITY_COUNT, AREAS, type ActivityId, type AreaId } from './d1CourseConfig'

/** What a shared link carries: where and what. No name, district, companion or budget. */
export type SharedCourse = { area: AreaId; activities: ActivityId[] }

/** A short, readable code such as "hongdae-dye-photo-escape". */
export const shareCodeOf = (course: SharedCourse) => [course.area, ...course.activities].join('-')

/** Reads a shared code back; anything malformed gives null. */
export function parseShareCode(code: string | undefined): SharedCourse | null {
  const [areaText, ...activityTexts] = (code ?? '').split('-')
  const area = AREAS.find((item) => item.id === areaText)?.id
  if (!area || activityTexts.length !== ACTIVITY_COUNT || new Set(activityTexts).size !== ACTIVITY_COUNT) return null
  const activities = activityTexts.map((text) => ACTIVITIES.find((item) => item.id === text)?.id)
  if (activities.some((id) => id === undefined)) return null
  return { area, activities: activities as ActivityId[] }
}
