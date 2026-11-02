import { useEffect, useState } from 'react'
import { ArrowLeft, ChevronRight, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { fetchFavoriteDesks, type ApiFavoriteDesk } from '@/api/favorites'
import { AppBar, Button, IconButton } from '@/design-system'
import { setLoginReturn } from '@/features/chaltteok/returnFlow'
import { AppShell } from '@/layout/AppShell'
import { supporterPath } from '@/prototype/supporterRoute'
import { usePrototypeStore } from '@/store/prototypeStore'
import './FavoriteDesksPage.css'

/** Friends' desks the signed-in user starred, one tap away from Home. */
export function FavoriteDesksPage() {
  const navigate = useNavigate()
  const signedIn = usePrototypeStore((state) => state.authSession.status === 'authenticated')
  const [desks, setDesks] = useState<ApiFavoriteDesk[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading')

  useEffect(() => {
    if (!signedIn) return
    let cancelled = false
    fetchFavoriteDesks()
      .then((list) => {
        if (cancelled) return
        setDesks(list)
        setState('ready')
      })
      .catch(() => {
        if (!cancelled) setState('failed')
      })
    return () => {
      cancelled = true
    }
  }, [signedIn])

  let body
  if (!signedIn) {
    body = (
      <section className="favorite-desks__empty">
        <h1>로그인하면 친구의 책상을 즐겨찾기에 추가할 수 있어요.</h1>
        <p>친구의 책상을 즐겨찾기에 추가하면 여기에 보여요.</p>
        <Button
          variant="brand"
          onClick={() => {
            setLoginReturn({ path: '/favorite-desks', notice: '로그인하면 즐겨찾는 책상을 볼 수 있어요.' })
            navigate('/auth/login')
          }}
        >
          로그인
        </Button>
      </section>
    )
  } else if (state === 'loading' || state === 'failed' || desks.length === 0) {
    body = (
      <section className="favorite-desks__empty">
        <span className="favorite-desks__icon" aria-hidden>
          <Star size={21} />
        </span>
        <h1>
          {state === 'loading'
            ? '불러오고 있어요...'
            : state === 'failed'
              ? '즐겨찾는 책상을 불러오지 못했어요.'
              : '아직 즐겨찾는 책상이 없어요.'}
        </h1>
        {state === 'ready' && <p>친구의 책상을 즐겨찾기에 추가하면 여기에 보여요.</p>}
      </section>
    )
  } else {
    body = (
      <ul className="favorite-desks__list">
        {desks.map((desk) => (
          <li key={desk.supporterToken}>
            <button
              type="button"
              className="favorite-desk-row"
              onClick={() => navigate(supporterPath(desk.supporterToken))}
            >
              <Star size={16} fill="currentColor" aria-hidden />
              <strong>{desk.displayName}님의 책상</strong>
              <ChevronRight size={18} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <AppShell
      surface="base"
      contentClassName="favorite-desks-shell"
      appBar={
        <AppBar
          title="즐겨찾는 책상"
          leading={
            <IconButton
              label="홈으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate('/home')}
            />
          }
        />
      }
    >
      <main className="favorite-desks">{body}</main>
    </AppShell>
  )
}
