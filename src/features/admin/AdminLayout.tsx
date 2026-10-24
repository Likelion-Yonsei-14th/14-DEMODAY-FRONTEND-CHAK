import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { fetchMe } from '@/api/auth'
import type { ApiUser } from '@/api/types'
import { usePrototypeStore } from '@/store/prototypeStore'
import './admin.css'

type Gate = 'checking' | 'allowed' | 'signed-out' | 'forbidden'

/** The operators' console. Only accounts the server marks as admin get in; every call is checked again server-side. */
export function AdminLayout() {
  const authenticated = usePrototypeStore((state) => state.authSession.status === 'authenticated')
  const [gate, setGate] = useState<Gate>('checking')
  const [me, setMe] = useState<ApiUser | null>(null)

  useEffect(() => {
    if (!authenticated) {
      setGate('signed-out')
      return
    }
    let cancelled = false
    fetchMe()
      .then((user) => {
        if (cancelled) return
        setMe(user)
        setGate(user.admin ? 'allowed' : 'forbidden')
      })
      .catch(() => {
        if (!cancelled) setGate('forbidden')
      })
    return () => {
      cancelled = true
    }
  }, [authenticated])

  if (gate !== 'allowed') {
    return (
      <main className="admin-gate">
        <h1>CHAK 어드민</h1>
        {gate === 'checking' && <p>권한을 확인하고 있어요...</p>}
        {gate === 'signed-out' && (
          <>
            <p>운영자 계정으로 로그인해 주세요.</p>
            <Link to="/auth/login">로그인</Link>
          </>
        )}
        {gate === 'forbidden' && (
          <>
            <p>이 계정에는 어드민 권한이 없어요.</p>
            <Link to="/">처음으로</Link>
          </>
        )}
      </main>
    )
  }

  return (
    <div className="admin">
      <aside className="admin__nav">
        <strong className="admin__brand">CHAK 어드민</strong>
        <NavLink to="/admin" end>대시보드</NavLink>
        <NavLink to="/admin/users">회원 관리</NavLink>
        <NavLink to="/admin/reports">신고 처리</NavLink>
        <NavLink to="/admin/inquiries">상담 문의</NavLink>
        <NavLink to="/admin/admins">운영자 관리</NavLink>
        <span className="admin__me">{me?.displayName}</span>
        <Link to="/home" className="admin__back">서비스로 돌아가기</Link>
      </aside>
      <main className="admin__main">
        <Outlet />
      </main>
    </div>
  )
}
