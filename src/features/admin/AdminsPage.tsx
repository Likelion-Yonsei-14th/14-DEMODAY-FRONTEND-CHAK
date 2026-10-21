import { useEffect, useState, type FormEvent } from 'react'
import {
  cancelAdminInvite,
  fetchAdminAccess,
  grantAdmin,
  revokeAdmin,
  type AdminAccess,
  type AdminInvite,
  type AdminUserSummary,
} from '@/api/admin'
import { ApiError } from '@/api/client'
import { formatDateTime } from './adminFormat'

const errorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError) {
    if (error.code === 'ADMIN_SELF_REVOKE') return '본인의 권한은 해제할 수 없어요.'
    if (error.status === 400) return '이메일 형식을 확인해 주세요.'
  }
  return fallback
}

/** Grants operator access by email. Takes effect when that Google account signs in (or immediately if it already exists). */
export function AdminsPage() {
  const [access, setAccess] = useState<AdminAccess | null>(null)
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchAdminAccess()
      .then((result) => !cancelled && setAccess(result))
      .catch(() => !cancelled && setError('운영자 목록을 불러오지 못했어요.'))
    return () => {
      cancelled = true
    }
  }, [])

  const run = async (task: () => Promise<AdminAccess>, fallback: string) => {
    setBusy(true)
    try {
      setAccess(await task())
      setError(null)
      return true
    } catch (e) {
      setError(errorMessage(e, fallback))
      return false
    } finally {
      setBusy(false)
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const value = email.trim()
    if (!value) return
    if (await run(() => grantAdmin(value), '권한을 부여하지 못했어요.')) setEmail('')
  }

  const revoke = (user: AdminUserSummary) => {
    if (!window.confirm(`${user.displayName}님의 운영자 권한을 해제할까요?`)) return
    void run(() => revokeAdmin(user.id), '권한을 해제하지 못했어요.')
  }

  const cancel = (invite: AdminInvite) => {
    if (!window.confirm(`${invite.email} 초대를 취소할까요?`)) return
    void run(() => cancelAdminInvite(invite.id), '초대를 취소하지 못했어요.')
  }

  return (
    <>
      <header className="admin__header">
        <h1>운영자 관리</h1>
      </header>

      <form className="admin-form" onSubmit={submit}>
        <label>
          구글 계정 이메일
          <input
            type="email"
            value={email}
            maxLength={320}
            placeholder="name@example.com"
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <button type="submit" disabled={busy || !email.trim()}>권한 부여</button>
      </form>
      <p className="admin__muted">
        이미 가입한 구글 계정이면 바로, 아직이면 그 이메일로 처음 로그인할 때 운영자가 돼요. 카카오 계정에는 적용되지 않아요.
      </p>

      {error && <p className="admin__error">{error}</p>}

      <h2>운영자</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>이름</th><th>이메일</th><th>마지막 로그인</th><th>관리</th></tr>
          </thead>
          <tbody>
            {access?.admins.map((user) => (
              <tr key={user.id}>
                <td>{user.displayName}</td>
                <td>{user.email ?? '-'}</td>
                <td>{formatDateTime(user.lastLoginAt)}</td>
                <td>
                  <button type="button" className="admin-danger" disabled={busy} onClick={() => revoke(user)}>
                    권한 해제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>대기 중인 초대</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>이메일</th><th>등록</th><th>관리</th></tr>
          </thead>
          <tbody>
            {access?.invites.map((invite) => (
              <tr key={invite.id}>
                <td>{invite.email}</td>
                <td>{invite.bootstrap ? '최초 설정' : formatDateTime(invite.createdAt)}</td>
                <td>
                  <button type="button" disabled={busy} onClick={() => cancel(invite)}>초대 취소</button>
                </td>
              </tr>
            ))}
            {access && access.invites.length === 0 && (
              <tr><td colSpan={3} className="admin__muted">대기 중인 초대가 없어요.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
