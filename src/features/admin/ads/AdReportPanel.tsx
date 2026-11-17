import { useEffect, useState } from 'react'
import { fetchAdReport, type AdReport } from '@/api/adminAds'
import type { ApiAdvertisement } from '@/api/types'
import { formatNumber } from '../adminFormat'
import { md, rate, reportText } from './adReportText'

/** 한 광고의 날짜별·지역별 노출·도달·클릭. 도달은 그 광고를 본 서로 다른 사람 수. */
export function AdReportPanel({ ad }: { ad: ApiAdvertisement }) {
  const [report, setReport] = useState<AdReport | null>(null)
  const [failed, setFailed] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchAdReport(ad.id)
      .then((r) => {
        if (!cancelled) setReport(r)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [ad.id])

  if (failed) return <p className="admin__error">보고서를 불러오지 못했어요.</p>
  if (!report) return <p className="admin__muted">보고서를 불러오는 중이에요...</p>

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reportText(ad, report))
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="ads-report">
      <div className="ads-report__totals">
        <div><span>노출</span><strong>{formatNumber(report.totals.impressions)}회</strong></div>
        <div><span>도달</span><strong>{formatNumber(report.totals.reach)}명</strong></div>
        <div><span>클릭</span><strong>{formatNumber(report.totals.clicks)}회</strong></div>
        <div><span>클릭률</span><strong>{rate(report.totals.clicks, report.totals.impressions)}</strong></div>
        <button type="button" className="ads-btn" onClick={copy}>
          {copied ? '복사했어요' : '광고주용 요약 복사'}
        </button>
      </div>
      <div className="ads-report__tables">
        <table className="admin-table">
          <caption>날짜별 (한국 날짜)</caption>
          <thead><tr><th>날짜</th><th>노출</th><th>도달</th><th>클릭</th></tr></thead>
          <tbody>
            {report.days.map((d) => (
              <tr key={d.date}>
                <td>{md(d.date)}</td>
                <td>{formatNumber(d.impressions)}</td>
                <td>{formatNumber(d.reach)}</td>
                <td>{formatNumber(d.clicks)}</td>
              </tr>
            ))}
            {report.days.length === 0 && <tr><td colSpan={4} className="admin__muted">아직 노출이 없어요.</td></tr>}
          </tbody>
        </table>
        <table className="admin-table">
          <caption>지역별</caption>
          <thead><tr><th>지역</th><th>노출</th><th>도달</th><th>클릭</th></tr></thead>
          <tbody>
            {report.regions.map((r) => (
              <tr key={r.region}>
                <td>{r.region}</td>
                <td>{formatNumber(r.impressions)}</td>
                <td>{formatNumber(r.reach)}</td>
                <td>{formatNumber(r.clicks)}</td>
              </tr>
            ))}
            {report.regions.length === 0 && <tr><td colSpan={4} className="admin__muted">아직 노출이 없어요.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="admin__muted">
        노출은 화면에 절반 이상 보인 횟수, 도달은 본 사람 수예요(회원은 계정, 손님은 브라우저 하나를 한 사람으로 세요).
      </p>
    </div>
  )
}
