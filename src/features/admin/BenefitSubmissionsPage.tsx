import { Fragment, useEffect, useState } from 'react'
import {
  changeAdminBenefitStatus,
  fetchAdminBenefitSubmission,
  fetchAdminBenefitSubmissions,
  type AdminBenefitDetail,
  type AdminBenefitSummary,
  type AdminInquiryStatus,
} from '@/api/admin'
import { BENEFIT_PAGES, optionLabel, visibleQuestions, type Values } from '../promotion/benefitSurvey'
import { formatDateTime } from './adminFormat'

const FILTERS = [
  { value: 'NEW', label: '새 신청' },
  { value: 'CONTACTED', label: '시안 보냄' },
  { value: 'CLOSED', label: '종료' },
  { value: undefined, label: '전체' },
] as const

const STATUS_LABEL: Record<AdminInquiryStatus, string> = { NEW: '새 신청', CONTACTED: '시안 보냄', CLOSED: '종료' }

/** 답변을 문항 순서대로 "문항 → 답"으로 펼친다. 고르지 않은 선택지에 딸린 문항은 답이 없어 자연히 빠진다. */
function answerRows(answers: AdminBenefitDetail['answers'], files: AdminBenefitDetail['files']) {
  const values = answers as Values
  const rows: { id: string; label: string; value: string; href?: string }[] = []
  for (const page of BENEFIT_PAGES) {
    for (const question of visibleQuestions(page, values)) {
      const answer = answers[question.id]
      if (answer === undefined) continue
      if (question.kind === 'file') {
        const file = files.find((item) => item.field === question.id)
        rows.push({ id: question.id, label: question.label, value: file?.fileName ?? String(answer), href: file?.url || undefined })
        continue
      }
      const text = Array.isArray(answer)
        ? answer.map((code) => optionLabel(question.id, code)).join(', ')
        : 'options' in question
          ? optionLabel(question.id, String(answer))
          : String(answer)
      rows.push({ id: question.id, label: question.label, value: text })
    }
  }
  return rows
}

/** 제휴 업체가 /promotion/apply/benefit에서 보낸 혜택 정보를 읽고 처리 상태를 바꾼다. 연락처가 들어 있어 운영자만 본다. */
export function BenefitSubmissionsPage() {
  const [status, setStatus] = useState<AdminInquiryStatus | undefined>('NEW')
  const [rows, setRows] = useState<AdminBenefitSummary[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [reload, setReload] = useState(0)
  const [openId, setOpenId] = useState<number | null>(null)
  const [detail, setDetail] = useState<AdminBenefitDetail | null>(null)

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

  const toggle = async (row: AdminBenefitSummary) => {
    if (openId === row.id) {
      setOpenId(null)
      return
    }
    setOpenId(row.id)
    setDetail(null)
    try {
      setDetail(await fetchAdminBenefitSubmission(row.id))
    } catch {
      setError('신청 내용을 불러오지 못했어요.')
    }
  }

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
              <Fragment key={row.id}>
                <tr>
                  <td>{formatDateTime(row.createdAt)}</td>
                  <td>
                    <strong>{row.brand}</strong>
                    <br />
                    {row.contactName}
                  </td>
                  <td>
                    <a href={`mailto:${row.email}`}>{row.email}</a>
                    <br />
                    {row.phone}
                  </td>
                  <td>
                    {row.headline}
                    <br />
                    <button type="button" aria-expanded={openId === row.id} onClick={() => toggle(row)}>
                      {openId === row.id ? '접기' : '자세히 보기'}
                    </button>
                  </td>
                  <td>
                    <span className="admin-actions">
                      <span>{STATUS_LABEL[row.status]}</span>
                      {row.status !== 'CONTACTED' && (
                        <button type="button" disabled={busyId === row.id} onClick={() => change(row, 'CONTACTED')}>시안 보냄</button>
                      )}
                      {row.status !== 'CLOSED' && (
                        <button type="button" disabled={busyId === row.id} onClick={() => change(row, 'CLOSED')}>종료</button>
                      )}
                    </span>
                  </td>
                </tr>
                {openId === row.id && (
                  <tr>
                    <td colSpan={5}>
                      {detail && detail.summary.id === row.id ? (
                        <dl className="admin-answers">
                          {answerRows(detail.answers, detail.files).map((item) => (
                            <div key={item.id}>
                              <dt>{item.label}</dt>
                              <dd>{item.href ? <a href={item.href} target="_blank" rel="noreferrer">{item.value}</a> : item.value}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <span className="admin__muted">불러오는 중이에요</span>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
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
