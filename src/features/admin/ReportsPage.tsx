import { useEffect, useState } from 'react'
import { actOnReport, fetchAdminReports, type AdminReport, type ReportAction } from '@/api/admin'
import { formatDateTime } from './adminFormat'

const FILTERS = [
  { value: 'PENDING', label: '처리 대기' },
  { value: undefined, label: '전체' },
] as const

export function ReportsPage() {
  const [status, setStatus] = useState<string | undefined>('PENDING')
  const [rows, setRows] = useState<AdminReport[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchAdminReports(status, 0)
      .then((result) => {
        if (cancelled) return
        setRows(result.content)
        setError(null)
      })
      .catch(() => !cancelled && setError('신고 목록을 불러오지 못했어요.'))
    return () => {
      cancelled = true
    }
  }, [status, reload])

  const act = async (report: AdminReport, action: ReportAction) => {
    const message =
      action === 'REMOVE_MESSAGE' ? '이 응원을 삭제할까요? 되돌릴 수 없어요.' : '이 신고를 기각할까요?'
    if (!window.confirm(message)) return
    setBusyId(report.id)
    try {
      await actOnReport(report.id, action)
      setReload((value) => value + 1)
    } catch {
      setError('처리에 실패했어요.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <header className="admin__header">
        <h1>신고 처리</h1>
        <div className="admin__tabs" role="tablist" aria-label="신고 상태">
          {FILTERS.map((filter) => (
            <button
              key={filter.label}
              type="button"
              role="tab"
              aria-selected={status === filter.value}
              onClick={() => setStatus(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </header>

      {error && <p className="admin__error">{error}</p>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>접수</th><th>작성자</th><th>사유</th><th>응원 상태</th><th>처리</th></tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{formatDateTime(row.createdAt)}</td>
                <td>{row.messageAuthorDisplayName}</td>
                <td>{row.reason ?? '-'}</td>
                <td>{row.messageStatus} · {row.messageVisibility === 'PUBLIC' ? '공개' : '비공개'}</td>
                <td>
                  {row.status === 'PENDING' ? (
                    <span className="admin-actions">
                      <button type="button" disabled={busyId === row.id} onClick={() => act(row, 'DISMISS')}>기각</button>
                      <button type="button" className="admin-danger" disabled={busyId === row.id} onClick={() => act(row, 'REMOVE_MESSAGE')}>응원 삭제</button>
                    </span>
                  ) : (
                    `${row.status}${row.resolvedAt ? ` · ${formatDateTime(row.resolvedAt)}` : ''}`
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && !error && (
              <tr><td colSpan={5} className="admin__muted">신고가 없어요.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
