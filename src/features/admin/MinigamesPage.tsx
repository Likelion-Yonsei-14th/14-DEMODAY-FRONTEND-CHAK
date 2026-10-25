import { useEffect, useState } from 'react'
import { fetchMinigameStats, type AdminMinigameGame, type AdminMinigameStats } from '@/api/admin'
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
