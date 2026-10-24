import { useEffect, useState } from 'react'
import { fetchStudyTypeStats, type StudyTypeStats } from '@/api/minigames'
import { STUDY_TYPE_RESULTS, isStudyTypeCode, type StudyTypeCode } from './studyTypeResults'

/** 다른 수험생들의 유형 분포. 서버에서 못 불러오면 아무것도 보여 주지 않는다. */
export function StudyTypeCrowd({ typeCode }: { typeCode: StudyTypeCode }) {
  const [stats, setStats] = useState<StudyTypeStats | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchStudyTypeStats()
      .then((next) => {
        if (!cancelled) setStats(next)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  if (!stats || stats.total === 0) return null
  const rows = stats.distribution
    .filter((share) => isStudyTypeCode(share.code))
    .sort((a, b) => b.count - a.count)
  const mine = rows.find((share) => share.code === typeCode)
  const max = Math.max(...rows.map((share) => share.percent), 1)

  return (
    <section className="study-type-section study-type-crowd" aria-labelledby="study-type-crowd-title">
      <h2 id="study-type-crowd-title">다른 수험생들은 어떤 유형일까?</h2>
      {mine && (
        <p>
          {STUDY_TYPE_RESULTS[typeCode].typeName} 유형은 지금까지 참여한 {stats.total.toLocaleString('ko-KR')}명 중{' '}
          <strong>{mine.percent}%</strong>예요.
        </p>
      )}
      <ol className="study-type-crowd__list">
        {rows.map((share) => {
          const code = share.code as StudyTypeCode
          return (
            <li key={share.code} className={share.code === typeCode ? 'is-current' : undefined}>
              <span className="study-type-crowd__name">{STUDY_TYPE_RESULTS[code].typeName}</span>
              <span className="study-type-crowd__bar" aria-hidden>
                <i style={{ width: `${(share.percent / max) * 100}%` }} />
              </span>
              <span className="study-type-crowd__percent">{share.percent}%</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
