import { ChevronRight, MessageCircleQuestion } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CHAT_PATH } from './chatRoutes'
import './chat.css'

/** 수험표 할인 모음 바로가기 아래에 두는 수능 도우미 바로가기. */
export function ChatShortcut() {
  const navigate = useNavigate()
  return (
    <button type="button" className="chat-shortcut" onClick={() => navigate(CHAT_PATH)}>
      <MessageCircleQuestion size={20} aria-hidden />
      <span>
        <strong>수능 도우미에게 물어보기</strong>
        <small>성적 발표, 정시 일정, 수험표 혜택까지</small>
      </span>
      <ChevronRight size={18} aria-hidden />
    </button>
  )
}
