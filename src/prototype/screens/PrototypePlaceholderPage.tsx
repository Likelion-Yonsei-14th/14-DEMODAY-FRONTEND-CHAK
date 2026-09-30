import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppBar, IconButton, StatusBadge } from '@/design-system'
import { AppShell } from '@/layout/AppShell'

type PlaceholderPageProps = {
  title: string
  phase: string
  summary: string
  decisions: string[]
}

export function PrototypePlaceholderPage({
  title,
  phase,
  summary,
  decisions,
}: PlaceholderPageProps) {
  return (
    <AppShell
      surface="base"
      appBar={
        <AppBar
          title={title}
          leading={
            <Link to="/prototype" aria-label="프로토타입 목록으로 돌아가기">
              <IconButton label="뒤로" icon={<ArrowLeft size={21} aria-hidden />} tabIndex={-1} />
            </Link>
          }
          trailing={<StatusBadge>{phase}</StatusBadge>}
        />
      }
    >
      <div className="prototype-placeholder-page">
        <div className="prototype-placeholder-page__card">
          <StatusBadge tone="warning">SKELETON</StatusBadge>
          <h2>{title}</h2>
          <p>{summary}</p>
        </div>

        <section className="prototype-placeholder-page__decisions">
          <h3>확정된 UX 원칙</h3>
          <ul>
            {decisions.map((decision) => (
              <li key={decision}>
                <CheckCircle2 size={18} aria-hidden />
                <span>{decision}</span>
              </li>
            ))}
          </ul>
        </section>

        <p className="prototype-placeholder-page__footnote">
          이 화면은 Phase 1의 라우트 골격입니다. 해당 Phase에서 실제 UI와 상태 전환으로 교체합니다.
        </p>
      </div>
    </AppShell>
  )
}
