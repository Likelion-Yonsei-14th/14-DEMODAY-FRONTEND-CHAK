# eun_demoday_prototype

수험생 응원 서비스의 **interactive UX specification**을 만드는 React 프로토타입입니다.

## Current status

현재 가장 많은 기능이 누적된 작업 브랜치는 `feat/recipient-multicard-viewer`입니다.

구현된 주요 범위:

- Personal Desk 생성 / Claim / Owner 관리
- Supporter Desk → Unified Composer → 공개 범위 → 배치 → 완료
- 4:5 카드 최대 3페이지 + 공통 Recipient Reader
- Daily / Time Capsule 열람 로직
- 공개 응원 reaction / Owner의 one-way reply
- 보낸 공개 응원 삭제 / Supporter settings
- 이메일·Google 기반 account lifecycle mock
- Class / Group mode: Classroom Map, Blackboard, Locker
- Personal Wrapped / Class Wrapped
- 학생 혜택 prototype
- semantic design system + live `/system` gallery

이 저장소는 production backend가 아니라 **화면, 상태, 상호작용을 검증하는 코드 기반 UX specification**입니다. 실제 인증, DB, Storage, Claim token, notification 등은 production 구현 범위입니다.

## Team source of truth

팀원이 기능을 추가하거나 기획/디자인 판단을 할 때는 아래 문서를 먼저 확인합니다.

1. [Team Product Guide](docs/TEAM_PRODUCT_GUIDE.md) — 서비스 전체 구조, 확정 원칙, 역할/권한, 전체 플로우, 현재 구현 상태
2. [Product Decisions](docs/PRODUCT_DECISIONS.md) — 세부 제품/UX 결정
3. [Design System / Frontend Handoff](docs/DESIGN_SYSTEM.md) — 디자인 토큰, 공통 컴포넌트, 카드/에셋 구현 규칙

오래된 Figma 탐색안과 최신 문서가 충돌하면 **최신 제품 결정이 우선**합니다.

## Run locally

```bash
npm install
npm run dev
```

Useful routes:

- `/start` — 서비스 진입
- `/prototype` — 전체 prototype index
- `/prototype/my/desk` — Owner personal desk
- `/prototype/create` — personal desk creation
- `/prototype/claim` — recipient Claim
- `/prototype/classroom/create` — Class / Group creation
- `/prototype/wrapped` — post-exam Wrapped
- `/prototype/offers` — student benefits
- `/system` — live code design system

## Quality checks

```bash
npm run lint
npm test
npm run build
```

GitHub Actions workflow는 push / pull request에서 동일한 lint, test, build 명령을 실행하도록 정의되어 있습니다.

## Tech

- React 19
- Vite
- TypeScript
- React Router
- Zustand
- Vitest
- ESLint / Prettier
