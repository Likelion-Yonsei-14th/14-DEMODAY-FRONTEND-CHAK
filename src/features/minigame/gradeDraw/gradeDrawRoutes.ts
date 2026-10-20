import { encodeGrades, type Grade } from './gradeDrawLogic'

export const GRADE_DRAW_PATH = '/minigame/grade-draw'
export const GRADE_DRAW_PLAY_PATH = `${GRADE_DRAW_PATH}/play`
/** Sends the viewer to their own finished report card, or back to drawing. */
export const GRADE_DRAW_MY_RESULT_PATH = `${GRADE_DRAW_PATH}/result`

/** Only the six grades go in the link - no ids, timestamps or other saved data. */
export const gradeDrawResultPath = (grades: readonly Grade[]) =>
  `${GRADE_DRAW_MY_RESULT_PATH}/${encodeGrades(grades)}`
