export const D1_COURSE_PATH = '/minigame/d1-course'
export const D1_COURSE_PLAY_PATH = `${D1_COURSE_PATH}/play`

/** Only the place and the three activities go in the link (see d1CourseShare). */
export const d1CourseResultPath = (code: string) => `${D1_COURSE_PATH}/result/${code}`
