import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  fetchAdminUser,
  fetchAdminUsers,
  withdrawAdminUser,
  type AdminUserDetail,
  type AdminUserState,
  type AdminUserSummary,
} from '@/api/admin'
import { ApiError } from '@/api/client'
import { formatDate, formatDateTime, formatNumber, providerLabel } from './adminFormat'

const STATES: { value: AdminUserState; label: string }[] = [
  { value: 'ACTIVE', label: '활성' },
  { value: 'DELETED', label: '탈퇴' },
  { value: 'ALL', label: '전체' },
]

function UserDetailPanel({
  userId,
  onClose,
  onChanged,
}: {
  userId: number
  onClose: () => void
  onChanged: () => void
}) {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [forfeit, setForfeit] = useState(false)
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchAdminUser(userId)
      .then((result) => !cancelled && setDetail(result))
      .catch(() => !cancelled && setError('회원 정보를 불러오지 못했어요.'))
    return () => {
      cancelled = true
    }
  }, [userId])

  const withdraw = async () => {
    if (!detail) return
    setBusy(true)
    setError(null)
    try {
      setDetail(await withdrawAdminUser(userId, forfeit))
      setConfirming(false)
      onChanged()
    } catch (reason) {
      setError(
        reason instanceof ApiError && reason.code === 'BALANCE_REMAINING'
          ? '남은 찰떡이 있어요. 소멸에 동의하는 칸을 체크해야 진행할 수 있어요.'
          : reason instanceof ApiError && reason.code === 'ADMIN_ACCOUNT_PROTECTED'
            ? '운영자 계정은 탈퇴 처리할 수 없어요.'
            : '탈퇴 처리에 실패했어요.',
      )
    } finally {
      setBusy(false)
    }
  }

  if (!detail) {
    return (
      <aside className="admin-drawer">
        <button type="button" className="admin-drawer__close" onClick={onClose}>닫기</button>
        <p>{error ?? '불러오는 중...'}</p>
      </aside>
    )
  }

  const { user } = detail
  const deleted = user.deletedAt !== null
  const canWithdraw = !deleted && !user.admin
  const requireForfeit = detail.chaltteokBalance > 0

  return (
    <aside className="admin-drawer" aria-label="회원 상세">
      <button type="button" className="admin-drawer__close" onClick={onClose}>닫기</button>
      <h2>{user.displayName}{user.admin && <span className="admin-badge">운영자</span>}</h2>
      {deleted && <p className="admin-badge admin-badge--muted">{formatDateTime(user.deletedAt)} 탈퇴</p>}
      <dl className="admin-facts">
        <dt>회원 번호</dt><dd>{user.id}</dd>
        <dt>로그인</dt><dd>{providerLabel(user.provider)}</dd>
        <dt>이메일</dt><dd>{user.email ?? '-'}</dd>
        <dt>가입</dt><dd>{formatDateTime(user.createdAt)}</dd>
        <dt>마지막 로그인</dt><dd>{formatDateTime(user.lastLoginAt)}</dd>
        <dt>책상</dt><dd>{detail.deskId === null ? '없음' : detail.deskClosed ? '닫힘' : '열림'}</dd>
        <dt>받은 응원</dt><dd>{formatNumber(detail.receivedMessages)}</dd>
        <dt>보낸 응원</dt><dd>{formatNumber(detail.sentMessages)}</dd>
        <dt>찰떡 잔액</dt><dd>{formatNumber(detail.chaltteokBalance)}</dd>
      </dl>

      {error && <p className="admin__error" role="alert">{error}</p>}

      {canWithdraw && !confirming && (
        <button type="button" className="admin-danger" onClick={() => setConfirming(true)}>탈퇴 처리</button>
      )}

      {canWithdraw && confirming && (
        <div className="admin-confirm" role="alertdialog" aria-label="탈퇴 처리 확인">
          <p>
            이름·이메일·프로필을 지우고 로그인을 끊어요. <strong>보낸 응원은 남고</strong> 작성자가
            &lsquo;탈퇴한 사용자&rsquo;로 표시돼요. 책상은 닫혀요. 되돌릴 수 없어요.
          </p>
          {requireForfeit && (
            <label className="admin-check">
              <input type="checkbox" checked={forfeit} onChange={(e) => setForfeit(e.target.checked)} />
              남은 찰떡 {formatNumber(detail.chaltteokBalance)}개가 사라지는 것에 동의해요
            </label>
          )}
          <label className="admin-field">
            확인을 위해 이름 <strong>{user.displayName}</strong>을(를) 입력하세요
            <input value={typed} onChange={(e) => setTyped(e.target.value)} />
          </label>
          <div className="admin-confirm__actions">
            <button type="button" onClick={() => { setConfirming(false); setTyped('') }}>취소</button>
            <button
              type="button"
              className="admin-danger"
              disabled={busy || typed !== user.displayName || (requireForfeit && !forfeit)}
              onClick={withdraw}
            >
              {busy ? '처리 중...' : '탈퇴 처리하기'}
            </button>
          </div>
        </div>
      )}

      {detail.history.length > 0 && (
        <>
          <h3>작업 기록</h3>
          <ul className="admin-history">
            {detail.history.map((entry) => (
              <li key={`${entry.action}-${entry.createdAt}`}>
                {formatDateTime(entry.createdAt)} · {entry.action === 'WITHDRAW_USER' ? '탈퇴 처리' : entry.action}
                {entry.detail && ` (${entry.detail})`}
              </li>
            ))}
          </ul>
        </>
      )}
    </aside>
  )
}

export function UsersPage() {
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [state, setState] = useState<AdminUserState>('ACTIVE')
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState<AdminUserSummary[]>([])
  const [hasNext, setHasNext] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchAdminUsers(submitted, state, page)
      .then((result) => {
        if (cancelled) return
        setRows(result.content)
        setHasNext(result.hasNext)
        setError(null)
      })
      .catch(() => !cancelled && setError('회원 목록을 불러오지 못했어요.'))
    return () => {
      cancelled = true
    }
  }, [submitted, state, page, reload])

  const search = (event: FormEvent) => {
    event.preventDefault()
    setPage(0)
    setSubmitted(query.trim())
  }

  const onChanged = useCallback(() => setReload((value) => value + 1), [])

  return (
    <>
      <header className="admin__header">
        <h1>회원 관리</h1>
        <div className="admin__tabs" role="tablist" aria-label="회원 상태">
          {STATES.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={state === item.value}
              onClick={() => { setState(item.value); setPage(0) }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <form className="admin-search" onSubmit={search}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름, 이메일, 회원 번호로 검색"
          aria-label="회원 검색"
        />
        <button type="submit">검색</button>
      </form>

      {error && <p className="admin__error">{error}</p>}

      <div className="admin-table-wrap">
        <table className="admin-table admin-table--clickable">
          <thead>
            <tr><th>번호</th><th>이름</th><th>로그인</th><th>이메일</th><th>가입일</th><th>마지막 로그인</th></tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} onClick={() => setSelected(row.id)} aria-selected={selected === row.id}>
                <td>{row.id}</td>
                <td>{row.displayName}{row.admin && <span className="admin-badge">운영자</span>}{row.deletedAt && <span className="admin-badge admin-badge--muted">탈퇴</span>}</td>
                <td>{providerLabel(row.provider)}</td>
                <td>{row.email ?? '-'}</td>
                <td>{formatDate(row.createdAt)}</td>
                <td>{formatDateTime(row.lastLoginAt)}</td>
              </tr>
            ))}
            {rows.length === 0 && !error && (
              <tr><td colSpan={6} className="admin__muted">검색 결과가 없어요.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-pager">
        <button type="button" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>이전</button>
        <span>{page + 1} 페이지</span>
        <button type="button" disabled={!hasNext} onClick={() => setPage((p) => p + 1)}>다음</button>
      </div>

      {selected !== null && (
        <UserDetailPanel key={selected} userId={selected} onClose={() => setSelected(null)} onChanged={onChanged} />
      )}
    </>
  )
}
