import { useCallback, useEffect, useState } from 'react'
import { fetchDiscountAdStats, type DiscountAdStat } from '@/api/discounts'
import { formatNumber } from '../adminFormat'

const percent = (part: number, whole: number) => (whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : '-')

/**
 * 혜택함 제휴 광고 집계. 노출·클릭은 횟수(같은 사람이 30분 안에 다시 본 것은 한 번), 본 사람·클릭한 사람은 사람 수.
 * 클릭률은 본 사람 중 링크를 눌러 나간 사람의 비율.
 */
export function DiscountAdStats() {
  const [rows, setRows] = useState<DiscountAdStat[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setError(null)
    fetchDiscountAdStats()
      .then(setRows)
      .catch(() => setError('혜택함 광고 집계를 불러오지 못했어요.'))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const sum = (key: keyof Pick<DiscountAdStat, 'impressions' | 'clicks' | 'todayImpressions' | 'todayClicks'>) =>
    (rows ?? []).reduce((total, row) => total + row[key], 0)

  return (
    <section className="admin__panel">
      <div className="discount-ad-stats__head">
        <h2>혜택함 제휴 광고</h2>
        <button type="button" className="ads-btn" onClick={load}>
          새로 고침
        </button>
      </div>
      <p className="admin__muted">
        수험표 할인 모음 맨 위에 도는 제휴 매장 혜택이에요. 가까운 매장 → 그 사람이 오늘 덜 본 광고 → 지금까지 노출이 적은 광고
        순으로 보여 줘서, 광고끼리 노출이 비슷해지고 사람마다 맨 위가 달라져요. 노출은 카드가 목록·지도에 실린 횟수(목록을 열면 제휴 카드가 모두 한 번씩)(같은 사람이
        30분 안에 다시 본 것은 한 번), 클릭은 매장 링크를 눌러 나간 횟수예요. 제휴 표시는 어드민 &gt; 혜택함 관리에서 켜요.
      </p>
      {error && <p className="admin__error">{error}</p>}
      {rows && (
        <p>
          오늘 노출 <strong>{formatNumber(sum('todayImpressions'))}</strong>회 · 클릭 <strong>{formatNumber(sum('todayClicks'))}</strong>회
          <span className="admin__muted">
            {' '}
            (전체 노출 {formatNumber(sum('impressions'))}회 · 클릭 {formatNumber(sum('clicks'))}회)
          </span>
        </p>
      )}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>매장 혜택</th>
              <th>노출 횟수</th>
              <th>본 사람</th>
              <th>클릭 횟수</th>
              <th>클릭한 사람</th>
              <th>클릭률</th>
              <th>오늘 노출 · 클릭</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((row) => (
              <tr key={row.id}>
                <td>
                  <strong>{row.brand}</strong>
                  {!row.sponsored && <span className="admin-badge admin-badge--muted"> 제휴 해제</span>}
                  {!row.visible && <span className="admin-badge admin-badge--muted"> 숨김</span>}
                  {row.sponsored && !row.located && <span className="admin-badge admin-badge--muted"> 지도 위치 없음</span>}
                  <br />
                  <span className="admin__muted">{row.benefit}</span>
                </td>
                <td>{formatNumber(row.impressions)}</td>
                <td>{formatNumber(row.reach)}명</td>
                <td>{formatNumber(row.clicks)}</td>
                <td>{formatNumber(row.clickers)}명</td>
                <td>{percent(row.clickers, row.reach)}</td>
                <td>
                  {formatNumber(row.todayImpressions)} · {formatNumber(row.todayClicks)}
                </td>
              </tr>
            ))}
            {rows && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="admin__muted">
                  제휴로 표시한 혜택이 아직 없어요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
