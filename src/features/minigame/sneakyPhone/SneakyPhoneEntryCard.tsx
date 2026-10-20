import { ChevronRight, Smartphone } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SNEAKY_PHONE_PATH } from './sneakyPhoneRoutes'
import './SneakyPhone.css'

/** Small door into the mini game, placed on existing screens. */
export function SneakyPhoneEntryCard({ className = '' }: { className?: string }) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      className={['sneaky-entry', className].filter(Boolean).join(' ')}
      onClick={() => navigate(SNEAKY_PHONE_PATH)}
    >
      <span className="sneaky-entry__icon" aria-hidden>
        <Smartphone size={22} />
      </span>
      <span className="sneaky-entry__text">
        <small>잠깐 쉬어 가는 미니게임</small>
        <strong>선생님 몰래 폰 하기</strong>
      </span>
      <ChevronRight size={18} aria-hidden />
    </button>
  )
}
