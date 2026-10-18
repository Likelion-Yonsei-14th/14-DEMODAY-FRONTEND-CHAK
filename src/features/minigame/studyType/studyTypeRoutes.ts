import { STUDY_TYPE_RESULTS, type StudyTypeCode } from './studyTypeResults'

export const STUDY_TYPE_PATH = '/minigame/study-type'

export const studyTypeResultPath = (typeCode: StudyTypeCode) =>
  `${STUDY_TYPE_PATH}/result/${STUDY_TYPE_RESULTS[typeCode].slug}`
