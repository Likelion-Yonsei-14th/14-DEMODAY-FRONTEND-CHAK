import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  changeAdminBenefitStatus,
  fetchAdminBenefitSubmission,
  type AdminBenefitDetail,
  type AdminInquiryStatus,
} from '@/api/admin'
import { optionLabel } from '../promotion/benefitSurvey'
import { benefitSections, isImageName } from './benefitAnswers'
import { formatDateTime } from './adminFormat'

const STATUS_LABEL: Record<AdminInquiryStatus, string> = { NEW: '새 신청', CONTACTED: '시안 보냄', CLOSED: '종료' }
const STATUS_ACTIONS: Record<AdminInquiryStatus, { to: AdminInquiryStatus; label: string }[]> = {
  NEW: [{ to: 'CONTACTED', label: '시안 보냄으로 표시' }, { to: 'CLOSED', label: '종료' }],
  CONTACTED: [{ to: 'CLOSED', label: '종료' }, { to: 'NEW', label: '새 신청으로 되돌리기' }],
  CLOSED: [{ to: 'NEW', label: '새 신청으로 되돌리기' }],
}

const period = (answers: AdminBenefitDetail['answers']) => {
  const start = answers.startDate
  const end = answers.endDate
  return typeof start === 'string' && typeof end === 'string' ? `${start} ~ ${end}` : '-'
}

/** 혜택 시안 신청 한 건의 전체 내용. 시안을 만들 때 필요한 것(문구·기간·혜택·로고)을 위에 모으고, 나머지는 신청서 순서대로 보여 준다. */
export function BenefitSubmissionDetailPage() {
  const { id } = useParams()
  const submissionId = Number(id)
  const [detail, setDetail] = useState<AdminBenefitDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchAdminBenefitSubmission(submissionId)
      .then((result) => !cancelled && setDetail(result))
      .catch(() => !cancelled && setError('신청 내용을 불러오지 못했어요.'))
    return () => {
      cancelled = true
    }
  }, [submissionId])

  const change = async (next: AdminInquiryStatus) => {
    if (!detail) return
    setBusy(true)
    try {
      const summary = await changeAdminBenefitStatus(submissionId, next)
      setDetail({ ...detail, summary })
      setError(null)
    } catch {
      setError('상태를 바꾸지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  const copyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  if (error && !detail) {
    return (
      <>
        <Link className="admin-back" to="/admin/benefits">← 혜택 시안 신청 목록</Link>
        <p className="admin__error">{error}</p>
      </>
    )
  }
  if (!detail) {
    return <p className="admin__muted">불러오는 중이에요</p>
  }

  const { summary, answers, files } = detail
  const sections = benefitSections(detail)
  const logo = files.find((file) => file.field === 'logoFileKey')
  const otherFiles = files.filter((file) => file.field !== 'logoFileKey')
  const benefits = Array.isArray(answers.benefits) ? answers.benefits.map((code) => optionLabel('benefits', code)) : []

  return (
    <article className="benefit-detail">
      <Link className="admin-back" to="/admin/benefits">← 혜택 시안 신청 목록</Link>

      <header className="benefit-detail__head">
        <div>
          <h1>{summary.brand}</h1>
          <p className="admin__muted">
            {optionLabel('category', summary.category)} · {formatDateTime(summary.createdAt)} 접수
            {summary.handledAt && ` · ${formatDateTime(summary.handledAt)} 처리`}
          </p>
        </div>
        <div className="benefit-detail__status">
          <span className={`admin-badge admin-badge--${summary.status.toLowerCase()}`}>{STATUS_LABEL[summary.status]}</span>
          {STATUS_ACTIONS[summary.status].map((action) => (
            <button key={action.to} type="button" disabled={busy} onClick={() => change(action.to)}>{action.label}</button>
          ))}
        </div>
      </header>

      {error && <p className="admin__error">{error}</p>}

      <section className="admin__panel benefit-detail__brief" aria-label="시안 제작 요약">
        <div className="benefit-detail__headline">
          <span>광고 문구</span>
          <strong>{summary.headline}</strong>
        </div>
        <dl>
          <div><dt>혜택 기간</dt><dd>{period(answers)}</dd></div>
          <div><dt>혜택</dt><dd>{benefits.length > 0 ? benefits.join(' · ') : '-'}</dd></div>
          <div>
            <dt>담당자</dt>
            <dd>
              {summary.contactName}
              <br />
              <a href={`tel:${summary.phone}`}>{summary.phone}</a>
              <br />
              <a href={`mailto:${summary.email}`}>{summary.email}</a>{' '}
              <button type="button" className="admin-link-button" onClick={() => copyEmail(summary.email)}>
                {copied ? '복사했어요' : '복사'}
              </button>
            </dd>
          </div>
        </dl>
      </section>

      {logo && logo.url && (
        <section className="admin__panel" aria-label="로고">
          <h2>로고</h2>
          <div className="benefit-detail__logo">
            {isImageName(logo.fileName) && <img src={logo.url} alt={`${summary.brand} 로고`} />}
            <div>
              <p>{logo.fileName}</p>
              <a className="admin-button-link" href={logo.url} target="_blank" rel="noreferrer">원본 열기·다운로드</a>
            </div>
          </div>
        </section>
      )}

      {otherFiles.length > 0 && (
        <section className="admin__panel" aria-label="첨부 파일">
          <h2>첨부 파일</h2>
          <ul className="benefit-detail__files">
            {otherFiles.map((file) => (
              <li key={file.field}>
                <a href={file.url} target="_blank" rel="noreferrer">{file.fileName}</a>
              </li>
            ))}
          </ul>
          <p className="admin__muted">다운로드 주소는 10분 동안만 열려요. 만료되면 새로고침하세요.</p>
        </section>
      )}

      {sections.map((section) => (
        <section key={section.title} className="admin__panel" aria-label={section.title}>
          <h2>{section.title}</h2>
          <dl className="benefit-detail__rows">
            {section.rows.map((row) => (
              <div key={row.id}>
                <dt>{row.label}</dt>
                <dd>
                  {row.items && (
                    <ul className="benefit-detail__chips">
                      {row.items.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  )}
                  {row.text !== undefined && row.text}
                  {row.file && (row.file.url ? <a href={row.file.url} target="_blank" rel="noreferrer">{row.file.name}</a> : row.file.name)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </article>
  )
}
