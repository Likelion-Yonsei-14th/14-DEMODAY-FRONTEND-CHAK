# eun_demoday_prototype

수험생 응원 서비스의 **interactive UX specification**을 만드는 React 프로토타입입니다.

이 저장소는 production backend가 아니라 **화면, 상태, 상호작용을 검증하는 코드 기반 UX specification**입니다. 실제 인증, DB, Storage, 결제, 광고, Claim token, notification 등은 production 구현 범위입니다. 결제와 광고는 모두 **프로토타입 mock**이며 실제 돈이 오가거나 광고 네트워크를 호출하지 않습니다.

## Current status

`main`에 지금까지의 구현이 모두 합쳐져 있습니다 (`feat/recipient-multicard-viewer` → `feat/desk-collage-charms-gems` 순서로 merge).

### 서비스 뼈대

- Personal Desk 생성 / Claim / Owner 관리
- Supporter Desk → Unified Composer → 공개 범위 → 배치 → 완료
- 4:5 카드 최대 3페이지 + 공통 Recipient Reader
- Daily / Time Capsule 열람 로직
- 공개 응원 reaction / Owner의 one-way reply
- 보낸 공개 응원 삭제 / Supporter settings
- 이메일·Google 기반 account lifecycle mock
- Class / Group mode: Classroom Map, Blackboard, Locker, Classroom settings
- Personal Wrapped / Class Wrapped
- 학생 혜택 prototype
- semantic design system + live `/system` gallery

### 책상 꾸미기와 응원 오브젝트

- 사진으로 찍은 공부 책상 (낮/밤 자동 전환, `?scene=day|night`)
- 놓고 갈 것 고르기: 편지 / 부적 / 스티커
- 부적: 평면 스티커(무료) / 아크릴 3D(유료), 문구 직접 수정, 앞면 → 뒤집어서 응원 보기
- 보석 스티커(낱개 · 모양 세트)로 응원 오브젝트 꾸미기
- 편지지 템플릿(광고 보고 열기), 텍스트는 편지지의 쓰기 영역 안에만 배치
- 편지에 클립 · 마스킹 테이프 붙이기 (일부 광고 잠금)
- 책상 배치 영역 확대 + 책상이 꽉 차면 읽은 응원을 **바구니**에 정리

### 사물함 꾸미기

- 사진으로 찍은 사물함 (닫힘/열림, 가로로 넓은 형태, 밝은 내부)
- 교실 지도의 사물함 줄 + "사물함 전체 보기"
- 사물함에 놓고 갈 것 고르기: 편지 / 부적 / 스티커
- 사물함 스티커: 별 · 리본 · 가랜드(무료), 서울 18개교 대학 깃발(유료)
- 사물함 부적: 대학 굿즈 아크릴 키링 (연세대 · 고려대 · 서울대, 6가지 모양, 유료)
- 사물함 주인 전용 꾸미기: 조명(전구 2종), 안쪽/바깥 페인트 4색 (유료, 교실 지도에도 반영)

### 진입

- 신규 가입 → `/start`
- 재로그인 → `/home` (내 책상 가기 / 우리 반 가기)
- 반 만들기: 공간 이름 → **내 사물함 먼저 만들기** → 친구 초대 링크 공유 → 교실
- 직접 만든 책상의 Owner: "친구에게 응원 부탁하기"로 Supporter 링크 공유

## 무료 / 광고 / 유료 정리

| 공간 | 기능 | 누가 | 과금 | 가격 |
|---|---|---|---|---|
| 책상 | 편지 쓰기, 기본/그래픽 배경, 기본 스티커, 사진 | Supporter | 무료 | - |
| 책상 · 사물함 | 편지지 템플릿 8종 | Supporter | 광고 | 1회 시청 시 계속 사용 |
| 책상 · 사물함 | 클립 12종 (7 무료 / 5 광고), 마스킹 테이프 12종 (6 무료 / 6 광고) | Supporter | 무료 · 광고 | 1회 시청 시 계속 사용 |
| 책상 | 부적 · 평면 스티커 | Supporter | 무료 | - |
| 책상 | 부적 · 아크릴 3D | Supporter | 유료 | 50원 |
| 책상 | 보석 스티커 낱개 (최대 12개) | Supporter | 유료 | 개당 5원 |
| 책상 | 보석 모양 세트 (별 30 · 하트 26 · 클로버 27 · 스마일 28 · 번개 24) | Supporter | 유료 | 보석 수 × 5원 |
| 책상 | 스티커 선물 (글 없이) | Supporter | 무료 | - |
| 책상 | 바구니에 넣기 | Owner | 무료 | - |
| 책상 | 바구니 속 응원 다시 보기 | Owner | 광고 | 볼 때마다 1회 |
| 사물함 | 별 · 리본 · 가랜드 스티커 | Supporter | 무료 | - |
| 사물함 | 대학 깃발 스티커 (서울 18개교) | Supporter | 유료 | 개당 150원 |
| 사물함 | 대학 굿즈 아크릴 부적 | Supporter | 유료 | 개당 150원 |
| 사물함 | 조명 (동그란 전구 / 에디슨 전구) | Owner | 유료 | 200원 (1회 구매 후 모양 변경 무료) |
| 사물함 | 안쪽 페인트 / 바깥 페인트 (흰색 · 검은색 · 파스텔 핑크 · 파스텔 블루) | Owner | 유료 | 칠할 때마다 200원 |

가격 상수는 코드에 있습니다: `ACRYLIC_CHARM_PRICE`, `GEM_PRICE`, `PENNANT_PRICE`, `UNIVERSITY_CHARM_PRICE`, `LOCKER_DECOR_PRICE`.

대학 깃발과 대학 굿즈 부적은 **학교 이름과 학교 색에 가까운 색만** 사용하고 엠블럼 · 마스코트 · 로고 글자는 쓰지 않습니다. 실제 판매 전에는 학교 상표 사용 허락 여부를 확인해야 합니다.

## Team source of truth

팀원이 기능을 추가하거나 기획/디자인 판단을 할 때는 아래 문서를 먼저 확인합니다.

1. [Team Product Guide](docs/TEAM_PRODUCT_GUIDE.md) — 서비스 전체 구조, 확정 원칙, 역할/권한, 전체 플로우, 현재 구현 상태
2. [Product Decisions](docs/PRODUCT_DECISIONS.md) — 세부 제품/UX 결정
3. [Design System / Frontend Handoff](docs/DESIGN_SYSTEM.md) — 디자인 토큰, 공통 컴포넌트, 카드/에셋 구현 규칙
4. [Vercel Deployment](docs/VERCEL_DEPLOYMENT.md) — 배포

오래된 Figma 탐색안과 최신 문서가 충돌하면 **최신 제품 결정이 우선**합니다.

## Run locally

```bash
npm install
npm run dev
```

Useful routes:

| Route | 화면 |
|---|---|
| `/start` | 서비스 진입 (신규) |
| `/home` | 재로그인 후 홈: 내 책상 가기 / 우리 반 가기 |
| `/prototype` | 전체 prototype index |
| `/prototype/create` | personal desk creation |
| `/prototype/my/desk` | Owner personal desk (`?desk=full`: 책상 꽉 참 미리보기) |
| `/prototype/support/jisu` | Supporter가 보는 책상 |
| `/prototype/claim` | recipient Claim |
| `/prototype/classroom/create` | Class / Group creation |
| `/prototype/classroom/:classroomId/map` | 교실 지도 |
| `/prototype/classroom/:classroomId/locker/:lockerId` | 사물함 |
| `/prototype/classroom/:classroomId/locker/:lockerId/decorate` | 사물함 꾸미기 (주인만) |
| `/prototype/wrapped` | post-exam Personal Wrapped |
| `/prototype/classroom/:classroomId/wrapped` | Class Wrapped |
| `/prototype/offers` | student benefits |
| `/system` | live code design system |

책상과 사물함 화면은 `?scene=day` / `?scene=night`로 낮/밤을 고정해서 볼 수 있습니다. 프로토타입 상태는 브라우저 `localStorage`(`eun-demoday-prototype`)에 저장되므로, 브라우저마다 데이터가 다릅니다.

## Quality checks

```bash
npm run lint
npm test
npm run build
```

GitHub Actions workflow는 push / pull request에서 동일한 lint, test, build 명령을 실행하도록 정의되어 있습니다.

## Assets

- 책상 · 교실 · 사물함 사진, 부적, 보석, 스티커, 클립/테이프, 별/리본/가랜드, 전구, 리빙박스 이미지는 `public/assets/` 아래에 WebP로 있습니다.
- 사물함 페인트는 원본 사진을 다시 칠한 레이어(`public/assets/classroom/paint/`)로, 대학 깃발은 코드로 렌더링한 이미지로, 대학 굿즈 부적은 SVG 컴포넌트(`UniversityCharm.tsx`)로 만듭니다.

## Tech

- React 19
- Vite
- TypeScript
- React Router
- Zustand
- Vitest
- ESLint / Prettier
