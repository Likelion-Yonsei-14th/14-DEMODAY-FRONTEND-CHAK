import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  changeAdminBenefitStatus,
  fetchAdminBenefitSubmissions,
  type AdminBenefitSummary,
  type AdminInquiryStatus,
} from '@/api/admin'
import { optionLabel } from '../promotion/benefitSurvey'
import { formatDateTime } from './adminFormat'

const FILTERS = [
  { value: 'NEW', label: '새 신청' },
  { value: 'CONTACTED', label: '시안 보냄' },
  { value: 'CLOSED', label: '종료' },
  { value: undefined, label: '전체' },
] as const

const STATUS_LABEL: Record<AdminInquiryStatus, string> = { NEW: '새 신청', CONTACTED: '시안 보냄', CLOSED: '종료' }

/** 제휴 업체가 /promotion/apply/benefit에서 보낸 혜택 정보 목록. 한 건의 전체 내용은 상세 화면(/admin/benefits/:id)에서 본다. 연락처가 들어 있어 운영자만 본다. */
export function BenefitSubmissionsPage() {
  const [status, setStatus] = useState<AdminInquiryStatus | undefined>('NEW')
  const [rows, setRows] = useState<AdminBenefitSummary[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchAdminBenefitSubmissions(status, 0)
      .then((result) => {
        if (cancelled) return
        setRows(result.content)
        setError(null)
      })
      .catch(() => !cancelled && setError('혜택 시안 신청 목록을 불러오지 못했어요.'))
    return () => {
      cancelled = true
    }
  }, [status, reload])

  const change = async (row: AdminBenefitSummary, next: AdminInquiryStatus) => {
    setBusyId(row.id)
    try {
      await changeAdminBenefitStatus(row.id, next)
      setReload((value) => value + 1)
    } catch {
      setError('상태를 바꾸지 못했어요.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <header className="admin__header">
        <h1>혜택 시안 신청</h1>
        <div className="admin__tabs" role="tablist" aria-label="처리 상태">
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
            <tr><th>접수</th><th>브랜드 · 담당자</th><th>연락처</th><th>광고 문구</th><th>상태</th></tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{formatDateTime(row.createdAt)}</td>
                <td>
                  <Link to={`/admin/benefits/${row.id}`}><strong>{row.brand}</strong></Link>
                  <br />
                  {optionLabel('category', row.category)} · {row.contactName}
                </td>
                <td>
                  <a href={`mailto:${row.email}`}>{row.email}</a>
                  <br />
                  {row.phone}
                </td>
                <td>{row.headline}</td>
                <td>
                  <span className="admin-actions">
                    <span>{STATUS_LABEL[row.status]}</span>
                    {row.status !== 'CONTACTED' && (
                      <button type="button" disabled={busyId === row.id} onClick={() => change(row, 'CONTACTED')}>시안 보냄</button>
                    )}
                    {row.status !== 'CLOSED' && (
                      <button type="button" disabled={busyId === row.id} onClick={() => change(row, 'CLOSED')}>종료</button>
                    )}
                    <Link className="admin-button-link" to={`/admin/benefits/${row.id}`}>상세</Link>
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !error && (
              <tr><td colSpan={5} className="admin__muted">혜택 시안 신청이 없어요.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
