import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { addFavoriteDesk, fetchFavoriteDesks, removeFavoriteDesk } from '@/api/favorites'
import { IconButton, useFeedback } from '@/design-system'
import { Dialog } from '@/design-system/overlays'
import { setLoginReturn } from '@/features/chaltteok/returnFlow'
import { usePrototypeStore } from '@/store/prototypeStore'

/** The desk a signed-out supporter tried to star, starred for them once they log in and come back. */
const PENDING_KEY = 'chak:pending-favorite-desk'

function takePending(supporterToken: string) {
  try {
    const pending = sessionStorage.getItem(PENDING_KEY)
    if (pending !== supporterToken) return false
    sessionStorage.removeItem(PENDING_KEY)
    return true
  } catch {
    return false
  }
}

function savePending(supporterToken: string) {
  try {
    sessionStorage.setItem(PENDING_KEY, supporterToken)
  } catch {
    // Without storage they just tap the star again after logging in.
  }
}

/**
 * Star on a friend's desk. Signed in, it adds or removes the desk from the
 * account's favorites; signed out, it explains that and offers a login.
 */
export function FavoriteDeskButton({ supporterToken, displayName }: { supporterToken: string; displayName: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useFeedback()
  const signedIn = usePrototypeStore((state) => state.authSession.status === 'authenticated')
  const [favorite, setFavorite] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  // Until the server says whether this desk is starred, a tap could only guess.
  const [loadedFor, setLoadedFor] = useState<string | null>(null)

  useEffect(() => {
    if (!signedIn) return
    let cancelled = false
    const pending = takePending(supporterToken)
    fetchFavoriteDesks()
      .then(async (desks) => {
        if (cancelled) return
        const starred = desks.some((desk) => desk.supporterToken === supporterToken)
        setFavorite(starred)
        if (!starred && pending) {
          await addFavoriteDesk(supporterToken, displayName)
          if (cancelled) return
          setFavorite(true)
          showToast('즐겨찾는 책상에 담았어요.')
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoadedFor(supporterToken)
      })
    return () => {
      cancelled = true
    }
  }, [displayName, showToast, signedIn, supporterToken])

  const toggle = async () => {
    if (!signedIn) {
      setLoginOpen(true)
      return
    }
    if (busy || loadedFor !== supporterToken) return
    const next = !favorite
    setBusy(true)
    setFavorite(next)
    try {
      if (next) await addFavoriteDesk(supporterToken, displayName)
      else await removeFavoriteDesk(supporterToken)
      showToast(next ? '즐겨찾는 책상에 담았어요.' : '즐겨찾기에서 뺐어요.')
    } catch {
      setFavorite(!next)
      showToast('즐겨찾기를 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setBusy(false)
    }
  }

  const goLogin = () => {
    savePending(supporterToken)
    setLoginReturn({
      path: location.pathname,
      notice: `로그인하면 ${displayName}님의 책상을 즐겨찾기에 추가할 수 있어요.`,
    })
    navigate('/auth/login')
  }

  return (
    <>
      <IconButton
        label={favorite ? '즐겨찾기에서 빼기' : '즐겨찾기'}
        aria-pressed={favorite}
        className={favorite ? 'favorite-desk-button--on' : undefined}
        icon={<Star size={20} fill={favorite ? 'currentColor' : 'none'} aria-hidden />}
        onClick={() => void toggle()}
      />
      <Dialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        title={`로그인하면 ${displayName}님의 책상을 즐겨찾기에 추가할 수 있어요.`}
        primaryAction={{ label: '로그인', onClick: goLogin, variant: 'brand' }}
        secondaryAction={{ label: '로그인 없이 둘러보기', onClick: () => setLoginOpen(false) }}
      />
    </>
  )
}
