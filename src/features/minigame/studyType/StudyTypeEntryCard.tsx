import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getCharacterSrc } from './studyTypeCharacters'
import { STUDY_TYPE_PATH } from './studyTypeRoutes'
import './StudyType.css'

/** Small door into the mini game, placed on existing screens. */
export function StudyTypeEntryCard() {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      className="study-type-entry"
      onClick={() => navigate(STUDY_TYPE_PATH)}
    >
      <img src={getCharacterSrc('PSA')} alt="" aria-hidden />
      <span>
        <small>잠깐 쉬어 가는 미니게임</small>
        <strong>나의 수험생 유형은?</strong>
      </span>
      <ChevronRight size={18} aria-hidden />
    </button>
  )
}
