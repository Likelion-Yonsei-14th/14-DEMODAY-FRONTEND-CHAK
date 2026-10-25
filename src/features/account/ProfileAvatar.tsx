import { UserRound } from 'lucide-react'

type ProfileAvatarProps = {
  src?: string
  size: number
  className?: string
}

/** The account's photo, or the placeholder person icon when there is none. */
export function ProfileAvatar({ src, size, className = '' }: ProfileAvatarProps) {
  return (
    <span
      className={['profile-avatar', className].filter(Boolean).join(' ')}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {src ? <img src={src} alt="" draggable={false} /> : <UserRound size={Math.round(size / 2)} />}
    </span>
  )
}
