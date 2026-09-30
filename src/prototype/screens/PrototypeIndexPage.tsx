import { ChevronRight, Layers3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppBar, StatusBadge } from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import './prototype.css'

const routes = [
  {
    path: '/prototype/desk',
    title: 'Owner Desk',
    description: '오브젝트 중심 홈 · 누적 · Daily / Time Capsule',
    phase: 'Phase 4',
  },
  {
    path: '/prototype/composer',
    title: 'Unified Composer',
    description: '모드 선택 없이 배경 · 글자 · 문구 · 스티커 · 사진을 한 화면에서 편집',
    phase: 'Phase 2–3',
  },
  {
    path: '/prototype/reader',
    title: 'Common Reader',
    description: 'Desk/Locker 오브젝트를 눌렀을 때 열리는 공통 Reader',
    phase: 'Phase 4',
  },
  {
    path: '/prototype/claim',
    title: 'Creator / Claim',
    description: '친구가 먼저 만든 Desk를 실제 수험생이 소유권 이전',
    phase: 'Phase 5',
  },
  {
    path: '/prototype/classroom',
    title: 'Classroom',
    description: 'Blackboard · Locker · Object → Common Reader',
    phase: 'Phase 6',
  },
]

export function PrototypeIndexPage() {
  return (
    <AppShell
      surface="base"
      appBar={<AppBar title="Prototype" trailing={<StatusBadge tone="brand">P1</StatusBadge>} />}
    >
      <div className="prototype-index">
        <section className="prototype-index__hero">
          <span className="prototype-index__icon"><Layers3 size={22} aria-hidden /></span>
          <p className="prototype-index__eyebrow">INTERACTIVE UX SPEC</p>
          <h2>전체 서비스 플로우를<br />코드로 연결합니다.</h2>
          <p>
            로그인·회원가입 같은 부수 화면은 Figma에 남기고, 핵심 경험은 실제로 눌러볼 수 있는
            프로토타입으로 구현합니다.
          </p>
        </section>

        <Link className="prototype-system-link" to="/system">
          <span>
            <strong>Design System</strong>
            <small>토큰과 공통 컴포넌트 확인하기</small>
          </span>
          <ChevronRight size={20} aria-hidden />
        </Link>

        <section className="prototype-index__routes" aria-labelledby="prototype-routes-title">
          <header>
            <h3 id="prototype-routes-title">Core flows</h3>
            <p>각 단계는 이후 Phase에서 실제 인터랙션으로 교체됩니다.</p>
          </header>
          <div className="prototype-route-list">
            {routes.map((route) => (
              <Link className="prototype-route-card" to={route.path} key={route.path}>
                <span className="prototype-route-card__copy">
                  <span className="prototype-route-card__meta">{route.phase}</span>
                  <strong>{route.title}</strong>
                  <small>{route.description}</small>
                </span>
                <ChevronRight size={20} aria-hidden />
              </Link>
            ))}
          </div>
        </section>

        <aside className="prototype-index__note">
          <strong>현재 원칙</strong>
          <p>
            Figma의 예전 구조보다 이 프로토타입에서 합의한 최신 플로우를 우선합니다.
            특히 Composer는 한 줄/사진/꾸미기/편지 모드로 나누지 않습니다.
          </p>
        </aside>
      </div>
    </AppShell>
  )
}
