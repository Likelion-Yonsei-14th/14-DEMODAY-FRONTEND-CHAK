export const EXAM_CAREER_PATH = '/minigame/exam-career'
export const EXAM_CAREER_PLAY_PATH = `${EXAM_CAREER_PATH}/play`

/** Only the final CSAT and its outcome go in the link (see examCareerShare). */
export const examCareerResultPath = (code: string) => `${EXAM_CAREER_PATH}/result/${code}`
