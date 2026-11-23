import { useEffect, useState } from 'react'
import {
  fetchActiveUsers,
  fetchDailyStats,
  fetchRegionStats,
  type AdminActiveUsers,
  type AdminDailyStats,
  type AdminRegionStats,
} from '@/api/admin'
import { fetchOutreach, type Outreach } from '@/api/adminOutreach'
import { BarList, type BarRow } from './AdminBarList'
import { formatNumber, kstDate } from './adminFormat'

const RANGES = [7, 14, 30, 60] as const

// 주최측에서 정정한 두 날짜의 총 DAU. 회원·비회원 및 다른 통계는 API 원자료를 유지한다.
const ORGANIZER_DAU: Record<string, number> = {
  '2026-11-21': 2656,
  '2026-11-22': 2113,
}
const isCorrectedDau = (date: string) => ORGANIZER_DAU[date] !== undefined
const displayDau = (date: string, recorded: number) => ORGANIZER_DAU[date] ?? recorded

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

/**
 * 활성 사용자(DAU·WAU·MAU). 위 기간 탭과 상관없이 집계를 시작한 날부터 센다.
 * 날짜별 막대는 그날까지 30일 동안 들어온 서로 다른 사람 수라, 날짜끼리 더하면 안 된다.
 */
function ActiveSection({ active }: { active: AdminActiveUsers }) {
  const last = active.days[active.days.length - 1]
  if (!last) return null
  return (
    <section className="admin__panel">
      <h2>활성 사용자 ({active.from.slice(5).replace('-', '/')}부터)</h2>
      <section className="admin-cards" aria-label="활성 사용자">
        <div>
          <span>MAU (최근 30일)</span>
          <strong>{formatNumber(last.mau)}</strong>
          <span>회원 {formatNumber(last.mauMembers)} · 비회원 {formatNumber(last.mauGuests)}</span>
        </div>
        <div><span>WAU (최근 7일)</span><strong>{formatNumber(last.wau)}</strong></div>
        <div><span>DAU (오늘)</span><strong>{formatNumber(last.dau)}</strong></div>
        <div>
          <span>집계 시작 후 순 방문자</span>
          <strong>{formatNumber(active.rangeVisitors)}</strong>
          <span>회원 {formatNumber(active.rangeMembers)} · 비회원 {formatNumber(active.rangeGuests)}</span>
        </div>
      </section>
      <h3>날짜별 MAU (그날까지 30일)</h3>
      <BarList
        rows={active.days.map((day) => ({
          label: day.date.slice(5),
          value: day.mau,
          sub: `WAU ${formatNumber(day.wau)} · DAU ${formatNumber(displayDau(day.date, day.dau))}${isCorrectedDau(day.date) ? ' (주최측 정정)' : ''}`,
        }))}
      />
      {active.days.some((day) => isCorrectedDau(day.date)) && (
        <p className="admin__muted">11/21·11/22 DAU만 주최측 정정값입니다. WAU·MAU는 시스템 집계입니다.</p>
      )}
    </section>
  )
}

/** 광고 수익. 연락 현황에서 입금 완료된 곳의 광고비를 더하고, 합의했지만 아직 입금 전인 금액은 따로 보여 준다. */
function adRevenue(rows: Outreach[]) {
  const total = (status: Outreach['status']) =>
    rows.filter((row) => row.status === status).reduce((sum, row) => sum + (row.offerPrice ?? 0), 0)
  return {
    paid: total('PAID'),
    paidCount: rows.filter((row) => row.status === 'PAID').length,
    pending: total('AGREED'),
    pendingCount: rows.filter((row) => row.status === 'AGREED').length,
  }
}

export function DashboardPage() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(14)
  const [daily, setDaily] = useState<AdminDailyStats | null>(null)
  const [regions, setRegions] = useState<AdminRegionStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [active, setActive] = useState<AdminActiveUsers | null>(null)
  const [outreach, setOutreach] = useState<Outreach[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchOutreach()
      .then((rows) => !cancelled && setOutreach(rows))
      .catch(() => !cancelled && setOutreach(null))
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchActiveUsers()
      .then((result) => !cancelled && setActive(result))
      .catch(() => !cancelled && setActive(null))
    return () => {
      cancelled = true
    }
  }, [])

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
            {outreach && (() => {
              const revenue = adRevenue(outreach)
              return (
                <div>
                  <span>광고 수익 (입금 완료 {revenue.paidCount}곳)</span>
                  <strong>{formatNumber(revenue.paid)}원</strong>
                  <span>입금 대기 {formatNumber(revenue.pending)}원 · {revenue.pendingCount}곳</span>
                </div>
              )
            })()}
          </section>

          {active && <ActiveSection active={active} />}

          <section className="admin__panel">
            <h2>날짜별 접속자</h2>
            <BarList
              rows={daily.days.map((day) => ({
                label: day.date.slice(5),
                value: displayDau(day.date, day.visitors),
                sub: `${isCorrectedDau(day.date) ? '주최측 정정 · 원자료 ' : ''}회원 ${day.memberVisitors} · 비회원 ${day.guestVisitors}`,
              }))}
            />
            {daily.days.some((day) => isCorrectedDau(day.date)) && (
              <p className="admin__muted">11/21·11/22 총 접속자만 주최측 정정값입니다. 회원·비회원 수는 시스템 원자료입니다.</p>
            )}
          </section>

          <section className="admin__panel">
            <h2>날짜별 활동</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>날짜</th><th>접속자</th><th>조회수</th><th>가입</th><th>책상</th><th>응원</th>
                  </tr>
                </thead>
                <tbody>
                  {[...daily.days].reverse().map((day) => (
                    <tr key={day.date}>
                      <td>{day.date}</td>
                      <td>{formatNumber(displayDau(day.date, day.visitors))}{isCorrectedDau(day.date) && ' *'}</td>
                      <td>{formatNumber(day.pageViews)}</td>
                      <td>{formatNumber(day.signups)}</td>
                      <td>{formatNumber(day.desksCreated)}</td>
                      <td>{formatNumber(day.messagesCreated)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {daily.days.some((day) => isCorrectedDau(day.date)) && (
              <p className="admin__muted">* 11/21·11/22 접속자는 주최측 정정값입니다.</p>
            )}
          </section>
        </>
      )}

      {regions && <RegionSection regions={regions} />}
    </>
  )
}
