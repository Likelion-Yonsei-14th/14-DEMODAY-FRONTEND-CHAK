import { ChevronRight, Layers3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppBar, StatusBadge } from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import './prototype.css'

const routes = [
  {
    path: '/prototype/create',
    title: 'Desk Creation',
    description: '본인/주변인 선택 → 읽기 방식 설정 → 응원 책상 생성',
    phase: 'LIVE',
  },
  {
    path: '/prototype/support/jisu',
    title: 'Supporter Core',
    description: '친구로 방문 → 응원 만들기 → 책상에 직접 놓고 가기',
    phase: 'LIVE',
  },
  {
    path: '/prototype/my/desk',
    title: 'Owner Desk',
    description: '수험생 본인 · 책상 오브젝트 열람 ↔ 봉투 Stack 전환 · Common Reader',
    phase: 'LIVE',
  },
  {
    path: '/prototype/composer',
    title: 'Unified Composer Spec',
    description: '모드 선택 없이 배경 · 글자 · 문구 · 스티커 · 사진을 한 화면에서 편집',
    phase: 'LIVE',
  },
  {
    path: '/prototype/reader',
    title: 'Common Reader',
    description: 'Desk/Locker 오브젝트를 눌렀을 때 열리는 공통 Reader',
    phase: 'LIVE',
  },
  {
    path: '/prototype/claim',
    title: 'Creator / Claim',
    description: '친구가 먼저 만든 Desk를 실제 수험생이 소유권 이전',
    phase: 'LIVE',
  },
  {
    path: '/prototype/classroom',
    title: 'Classroom',
    description: 'Blackboard · Locker · Object → Common Reader',
    phase: 'Phase 6',
  },
]

const qaStates = [
  {
    path: '/prototype/my/desk?daily=before',
    title: 'Daily · 열리기 전',
    description: '오늘 묶음이 아직 잠겨 있는 상태',
  },
  {
    path: '/prototype/my/desk?daily=after',
    title: 'Daily · 열린 뒤',
    description: '오늘 묶음이 활성화된 상태',
  },
  {
    path: '/prototype/my/desk?capsule=before',
    title: '한 번에 열어보기 · 열리기 전',
    description: '모아둔 응원이 모두 잠긴 상태',
  },
  {
    path: '/prototype/my/desk?capsule=after',
    title: '한 번에 열어보기 · 열린 뒤',
    description: '모아둔 응원이 한 번에 활성화된 상태',
  },
]

export function PrototypeIndexPage() {
  return (
    <AppShell
      surface="base"
      appBar={<AppBar title="Prototype" trailing={<StatusBadge tone="brand">QA</StatusBadge>} />}
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
            <p>실제 사용자 흐름과 주요 상태를 바로 확인합니다.</p>
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

        <section className="prototype-index__routes" aria-labelledby="prototype-qa-title">
          <header>
            <h3 id="prototype-qa-title">QA states</h3>
            <p>시간을 기다리지 않고 열람 상태를 바로 비교합니다.</p>
          </header>
          <div className="prototype-route-list">
            {qaStates.map((state) => (
              <Link className="prototype-route-card" to={state.path} key={state.path}>
                <span className="prototype-route-card__copy">
                  <span className="prototype-route-card__meta">QA</span>
                  <strong>{state.title}</strong>
                  <small>{state.description}</small>
                </span>
                <ChevronRight size={20} aria-hidden />
              </Link>
            ))}
          </div>
        </section>

        <aside className="prototype-index__note">
          <strong>현재 원칙</strong>
          <p>
            Desk는 살짝 위에서 내려다보는 2.5D 일러스트 공간으로 구현합니다. 구조 UI는 차분하게,
            친구가 남기는 메시지 오브젝트는 더 컬러풀하고 장난스럽게 표현합니다.
          </p>
        </aside>
      </div>
    </AppShell>
  )
}
