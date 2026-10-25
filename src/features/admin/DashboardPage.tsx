import { useEffect, useState } from 'react'
import {
  fetchDailyStats,
  fetchRegionStats,
  type AdminDailyStats,
  type AdminRegionStats,
} from '@/api/admin'
import { BarList, type BarRow } from './AdminBarList'
import { formatNumber, kstDate } from './adminFormat'

const RANGES = [7, 14, 30, 60] as const

/** 비율을 소수 첫째 자리까지. 정수로 떨어지면 소수점은 뺀다. */
const percent = (part: number, total: number) => `${Math.round((part / total) * 1000) / 10}%`

/** 접속 지역(시·도). 위치를 알 수 없는 조회도 같은 표에 넣어 전체 중 비중을 한눈에 본다. */
function RegionSection({ regions }: { regions: AdminRegionStats }) {
  const known = regions.items.reduce((sum, item) => sum + item.pageViews, 0)
  const total = known + regions.unknownPageViews
  const rows: BarRow[] = regions.items.map((item) => ({
    label: item.regionName,
    value: item.pageViews,
    sub: `접속자 ${formatNumber(item.visitors)} · ${percent(item.pageViews, total)}`,
  }))
  if (regions.unknownPageViews > 0) {
    rows.push({
      label: '위치 미상',
      value: regions.unknownPageViews,
      sub: percent(regions.unknownPageViews, total),
      muted: true,
    })
  }

  return (
    <section className="admin__panel">
      <h2>접속 지역 (시·도, 조회수 기준)</h2>
      {total === 0 ? (
        <p className="admin__muted">아직 기록된 접속이 없어요.</p>
      ) : (
        <>
          <BarList rows={rows} />
          {regions.items.length === 0 && (
            <p className="admin__muted">아직 위치가 기록된 접속이 없어요. 위치가 쌓이면 지역별로 나뉘어 보여요.</p>
          )}
          {regions.unknownPageViews > 0 && (
            <p className="admin__muted">
              위치 미상은 위치 수집을 시작하기 전의 접속이거나 위치를 받지 못한 접속이에요.
            </p>
          )}
          {(regions.overseasPageViews ?? 0) > 0 && (
            <p className="admin__muted">해외 접속 {formatNumber(regions.overseasPageViews ?? 0)}건은 제외했어요.</p>
          )}
        </>
      )}
    </section>
  )
}

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

      {regions && <RegionSection regions={regions} />}
    </>
  )
}
