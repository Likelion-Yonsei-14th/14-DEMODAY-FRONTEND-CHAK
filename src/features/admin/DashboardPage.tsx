import { useEffect, useState } from 'react'
import {
  fetchDailyStats,
  fetchRegionStats,
  type AdminDailyStats,
  type AdminRegionStats,
} from '@/api/admin'
import { BarList } from './AdminBarList'
import { formatNumber, kstDate } from './adminFormat'

const RANGES = [7, 14, 30, 60] as const

export function DashboardPage() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(14)
  const [daily, setDaily] = useState<AdminDailyStats | null>(null)
  const [regions, setRegions] = useState<AdminRegionStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const from = kstDate(days - 1)
    const to = kstDate(0)
    Promise.all([fetchDailyStats(from, to), fetchRegionStats(from, to)])
      .then(([dailyStats, regionStats]) => {
        if (cancelled) return
        setDaily(dailyStats)
        setRegions(regionStats)
        setError(null)
      })
      .catch(() => {
        if (!cancelled) setError('통계를 불러오지 못했어요.')
      })
    return () => {
      cancelled = true
    }
  }, [days])

  const today = daily?.days[daily.days.length - 1]
  const sum = (pick: (day: AdminDailyStats['days'][number]) => number) =>
    daily?.days.reduce((total, day) => total + pick(day), 0) ?? 0

  return (
    <>
      <header className="admin__header">
        <h1>대시보드</h1>
        <div className="admin__tabs" role="tablist" aria-label="기간">
          {RANGES.map((range) => (
            <button
              key={range}
              type="button"
              role="tab"
              aria-selected={days === range}
              onClick={() => setDays(range)}
            >
              최근 {range}일
            </button>
          ))}
        </div>
      </header>

      {error && <p className="admin__error">{error}</p>}
      {!daily && !error && <p>불러오는 중...</p>}

      {daily && (
        <>
          <section className="admin-cards" aria-label="요약">
            <div><span>총 회원</span><strong>{formatNumber(daily.totalUsers)}</strong></div>
            <div><span>총 책상</span><strong>{formatNumber(daily.totalDesks)}</strong></div>
            <div><span>총 응원</span><strong>{formatNumber(daily.totalMessages)}</strong></div>
            <div><span>오늘 접속자</span><strong>{formatNumber(today?.visitors ?? 0)}</strong></div>
            <div><span>기간 신규 가입</span><strong>{formatNumber(sum((d) => d.signups))}</strong></div>
            <div><span>기간 응원</span><strong>{formatNumber(sum((d) => d.messagesCreated))}</strong></div>
            <div><span>기간 충전</span><strong>{formatNumber(sum((d) => d.chargeAmount))}원</strong></div>
          </section>

          <section className="admin__panel">
            <h2>날짜별 접속자</h2>
            <BarList
              rows={daily.days.map((day) => ({
                label: day.date.slice(5),
                value: day.visitors,
                sub: `회원 ${day.memberVisitors} · 비회원 ${day.guestVisitors}`,
              }))}
            />
          </section>

          <section className="admin__panel">
            <h2>날짜별 활동</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>날짜</th><th>접속자</th><th>조회수</th><th>가입</th><th>책상</th><th>응원</th><th>충전(원)</th>
                  </tr>
                </thead>
                <tbody>
                  {[...daily.days].reverse().map((day) => (
                    <tr key={day.date}>
                      <td>{day.date}</td>
                      <td>{formatNumber(day.visitors)}</td>
                      <td>{formatNumber(day.pageViews)}</td>
                      <td>{formatNumber(day.signups)}</td>
                      <td>{formatNumber(day.desksCreated)}</td>
                      <td>{formatNumber(day.messagesCreated)}</td>
                      <td>{formatNumber(day.chargeAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {regions && (
        <section className="admin__panel">
          <h2>접속 지역 (시·도)</h2>
          {regions.items.length === 0 ? (
            <p className="admin__muted">
              아직 위치가 기록된 접속이 없어요.
              {regions.unknownPageViews > 0 && ` 위치를 알 수 없는 조회 ${formatNumber(regions.unknownPageViews)}건.`}
            </p>
          ) : (
            <BarList
              rows={regions.items.map((item) => ({
                label: item.regionName,
                value: item.pageViews,
                sub: `접속자 ${item.visitors}`,
              }))}
            />
          )}
          {regions.unknownPageViews > 0 && regions.items.length > 0 && (
            <p className="admin__muted">위치를 알 수 없는 조회 {formatNumber(regions.unknownPageViews)}건은 제외했어요.</p>
          )}
        </section>
      )}
    </>
  )
}
