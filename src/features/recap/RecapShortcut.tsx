import { ChevronRight, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { isRecapOpen, RECAP_OPENS_LABEL } from './recapSchedule'
import './recapShortcut.css'

/** 홈에서 배너와 미니게임 사이에 두는 나의 수능 리캡 바로가기. 수험표 할인·수능 도우미 바로가기와 같은 크기. */
export function RecapShortcut() {
  const navigate = useNavigate()
  return (
    <button type="button" className="recap-shortcut" onClick={() => navigate('/recap')}>
      <Sparkles size={20} aria-hidden />
      <span>
        <strong>나의 수능 리캡</strong>
        <small>
          {isRecapOpen()
            ? '한 해 동안 애쓴 나를 돌아봐요'
            : `${RECAP_OPENS_LABEL}, 시험이 끝나면 열려요`}
        </small>
      </span>
      <ChevronRight size={18} aria-hidden />
    </button>
  )
}
