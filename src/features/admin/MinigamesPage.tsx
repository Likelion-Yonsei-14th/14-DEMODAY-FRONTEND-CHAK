import { useEffect, useState } from 'react'
import {
  fetchMinigameStats,
  type AdminD1CourseStats,
  type AdminKeyCount,
  type AdminMinigameGame,
  type AdminMinigameStats,
} from '@/api/admin'
import { ACTIVITIES, AREAS, BUDGETS, COMPANIONS } from '@/features/minigame/d1Course/d1CourseConfig'
import { REGIONS } from '@/features/minigame/d1Course/d1CourseRegions'
import { STUDY_TYPE_RESULTS, isStudyTypeCode } from '@/features/minigame/studyType/studyTypeResults'
import { BarList } from './AdminBarList'
import { formatNumber } from './adminFormat'

const GAME_TITLES: Record<AdminMinigameGame['game'], string> = {
  GUESS_GOD: '오늘의 찍신은 나야!',
  SNEAKY_PHONE: '선생님 몰래 폰 하기',
}

function GameSection({ stats }: { stats: AdminMinigameGame }) {
  const leftOff = Math.max(0, stats.startedToday - stats.submittedToday)
  return (
    <section className="admin__panel" aria-label={GAME_TITLES[stats.game]}>
      <h2>{GAME_TITLES[stats.game]}</h2>
      <div className="admin-cards">
        <div><span>오늘 시작</span><strong>{formatNumber(stats.startedToday)}</strong></div>
        <div><span>오늘 끝까지 함</span><strong>{formatNumber(stats.submittedToday)}</strong></div>
        <div><span>오늘 중간에 그만둠</span><strong>{formatNumber(leftOff)}</strong></div>
        <div><span>최근 7일 참여</span><strong>{formatNumber(stats.submittedLast7Days)}</strong></div>
        <div><span>최근 14일 참여</span><strong>{formatNumber(stats.submittedLast14Days)}</strong></div>
        <div>
          <span>14일 평균 점수</span>
          <strong>{stats.averageScoreLast14Days === null ? '-' : stats.averageScoreLast14Days.toLocaleString('ko-KR')}</strong>
        </div>
        <div><span>랭킹에 오른 회원</span><strong>{formatNumber(stats.rankedMembers)}</strong></div>
        <div>
          <span>회원 최고 점수</span>
          <strong>{stats.bestMemberScore === null ? '-' : formatNumber(stats.bestMemberScore)}</strong>
        </div>
      </div>
      <h3>날짜별 참여</h3>
      <BarList
        rows={stats.days.map((day) => ({
          label: day.date.slice(5),
          value: day.members + day.guests,
          sub: `회원 ${day.members} · 비회원 ${day.guests}`,
        }))}
      />
    </section>
  )
}

const labelFrom = (options: readonly { id: string; label: string }[]) => (key: string) =>
  options.find((option) => option.id === key)?.label ?? key

/** 선택지별 응답 수를 막대로. 퍼센트는 `base`(응답 수)를 기준으로 한다. */
function choiceRows(rows: AdminKeyCount[], base: number, label: (key: string) => string) {
  return rows.map((row) => ({
    label: label(row.key),
    value: row.count,
    sub: base > 0 ? `${Math.round((row.count / base) * 1000) / 10}%` : undefined,
  }))
}

function D1CourseSection({ stats }: { stats: AdminD1CourseStats }) {
  const total = stats.total
  return (
    <section className="admin__panel" aria-label="수능 끝 D+1 코스 짜기">
      <h2>수능 끝 D+1 코스 짜기</h2>
      <div className="admin-cards">
        <div><span>전체 응답</span><strong>{formatNumber(total)}</strong></div>
        <div><span>오늘</span><strong>{formatNumber(stats.today)}</strong></div>
        <div><span>최근 7일</span><strong>{formatNumber(stats.last7Days)}</strong></div>
        <div><span>공유한 응답</span><strong>{formatNumber(stats.shared)}</strong></div>
      </div>
      {total === 0 ? (
        <p className="admin__muted">아직 응답이 없어요.</p>
      ) : (
        <>
          <h3>가고 싶은 곳</h3>
          <BarList rows={choiceRows(stats.areas, total, labelFrom(AREAS))} />
          <h3>하고 싶은 것 (중복 선택, 응답 대비 비율)</h3>
          <BarList rows={choiceRows(stats.activities, total, labelFrom(ACTIVITIES))} />
          <h3>누구와</h3>
          <BarList rows={choiceRows(stats.companions, total, labelFrom(COMPANIONS))} />
          <h3>예산</h3>
          <BarList rows={choiceRows(stats.budgets, total, labelFrom(BUDGETS))} />
          <h3>출발 지역</h3>
          <BarList rows={choiceRows(stats.regions, total, labelFrom(REGIONS))} />
        </>
      )}
    </section>
  )
}

export function MinigamesPage() {
  const [stats, setStats] = useState<AdminMinigameStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchMinigameStats()
      .then((next) => {
        if (cancelled) return
        setStats(next)
        setError(null)
      })
      .catch(() => {
        if (!cancelled) setError('통계를 불러오지 못했어요.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const study = stats?.studyType

  return (
    <>
      <header className="admin__header">
        <h1>미니게임</h1>
      </header>

      {error && <p className="admin__error">{error}</p>}
      {!stats && !error && <p>불러오는 중...</p>}

      {stats?.games.map((game) => <GameSection key={game.game} stats={game} />)}

      {stats?.d1Course && <D1CourseSection stats={stats.d1Course} />}

      {study && (
        <section className="admin__panel" aria-label="나의 수험생 유형은?">
          <h2>나의 수험생 유형은?</h2>
          <div className="admin-cards">
            <div><span>전체 결과</span><strong>{formatNumber(study.total)}</strong></div>
            <div><span>회원</span><strong>{formatNumber(study.members)}</strong></div>
            <div><span>오늘</span><strong>{formatNumber(study.today)}</strong></div>
            <div><span>최근 7일</span><strong>{formatNumber(study.last7Days)}</strong></div>
          </div>
          <h3>유형별 분포</h3>
          <BarList
            rows={[...study.distribution]
              .sort((a, b) => b.count - a.count)
              .map((share) => ({
                label: isStudyTypeCode(share.code) ? STUDY_TYPE_RESULTS[share.code].typeName : share.code,
                value: share.count,
                sub: `${share.percent}%`,
              }))}
          />
          <p className="admin__muted">비회원은 결과를 낼 때마다 한 건씩 늘어나는 참고용 숫자예요.</p>
        </section>
      )}

      <p className="admin__muted">
        비회원 기록은 30일, 끝내지 않은 판은 2일 뒤 지워져서 날짜별 표는 최근 14일만 보여 줘요.
      </p>
    </>
  )
}
