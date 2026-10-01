# Design System / Frontend Handoff

> 수험생 응원 서비스 코드 프로토타입의 현재 디자인시스템 구현 기준입니다.
>
> 이 문서는 **프론트엔드 개발자가 현재 프로토타입을 production 구조로 옮길 때 참고하는 인수인계 문서**입니다.
> 화면별 임시 스타일보다 `src/design-system`의 토큰과 공통 컴포넌트를 우선합니다.

## 0. 현재 기준과 우선순위

디자인 관련 기준이 충돌할 경우 아래 순서를 권장합니다.

1. 최신 제품/UX 결정
2. 이 문서와 `src/design-system` 실제 구현
3. 현재 활성화된 화면의 공통 패턴
4. 과거 Figma 탐색안 / 오래된 프로토타입 문구

현재 디자인 원칙:

> **UI는 깨끗하게, 콘텐츠는 살아있게.**

- 서비스 Shell은 차분하고 절제된 톤을 유지합니다.
- Coral은 주요 감정적 CTA에 제한적으로 사용합니다.
- 사용자가 직접 만드는 카드 콘텐츠는 손글씨, 그래픽, 스티커, 사진 등 훨씬 자유롭고 컬러풀할 수 있습니다.
- **서비스 UI 디자인시스템과 사용자 제작 카드 스타일 시스템은 분리해서 관리합니다.**

---

# 1. 코드 구조

```text
src/
├─ design-system/
│  ├─ tokens/           # color / type / spacing / radius / elevation / motion
│  ├─ components/       # Button, Field, Tabs, AppBar...
│  ├─ overlays/         # BottomSheet, Dialog, Toast, Snackbar
│  └─ index.ts
├─ layout/
│  ├─ AppShell.tsx
│  └─ AppShell.css
├─ styles/
│  ├─ reset.css
│  └─ global.css
├─ system/
│  └─ SystemPage.tsx    # 코드 기반 디자인시스템 gallery
└─ features/composer/
   ├─ fonts/            # 사용자 카드용 폰트
   ├─ backgroundAssets.ts
   ├─ stickerAssets.ts
   ├─ wordArt/
   ├─ cardRenderShared.css
   └─ cardRenderStyles.ts
```

일반 UI import:

```tsx
import {
  AppBar,
  Button,
  ChoiceCard,
  IconButton,
  TextField,
  BottomSheet,
  useFeedback,
} from '@/design-system'
```

글로벌 로딩 순서:

```tsx
import '@/features/composer/fonts/fonts.css'
import '@/styles/reset.css'
import '@/styles/global.css'
import '@/layout/AppShell.css'
```

`global.css`에서 `design-system/tokens/index.css`를 import합니다.

---

# 2. Color system

Source: `src/design-system/tokens/colors.css`

## 2.1 Neutral surfaces

| Token | Value | Intended use |
| --- | --- | --- |
| `--color-bg-canvas` | `#F6F3EC` | 앱 전체 기본 배경 |
| `--color-surface-base` | `#FFFDF8` | 카드, 입력, 기본 surface |
| `--color-surface-subtle` | `#F1EDE6` | 선택 전 보조 surface / hover |
| `--color-surface-muted` | `#EBE5DC` | 더 낮은 강조 surface |
| `--color-surface-raised` | `#FFFFFF` | Dialog, Sheet 등 떠 있는 surface |

## 2.2 Content

| Token | Value | Intended use |
| --- | --- | --- |
| `--color-content-primary` | `#292722` | 제목 / 기본 본문 / Primary button |
| `--color-content-secondary` | `#6F6961` | 설명 / metadata |
| `--color-content-tertiary` | `#928B82` | placeholder / 약한 정보 |
| `--color-content-disabled` | `#B4ADA4` | disabled / restricted |
| `--color-content-inverse` | `#FFFDF8` | 어두운 surface 위 text |

## 2.3 Border

| Token | Value |
| --- | --- |
| `--color-border-subtle` | `#E8E2D9` |
| `--color-border-default` | `#D9D1C7` |
| `--color-border-strong` | `#BDB4AA` |

## 2.4 Brand

| Token | Value | Intended use |
| --- | --- | --- |
| `--color-brand` | `#E88770` | 핵심 감정 CTA |
| `--color-brand-pressed` | `#D8745E` | hover/pressed, 강조 text |
| `--color-brand-soft` | `#F6D8CF` | badge / selection / soft accent |
| `--color-brand-on` | `#FFFAF7` | brand background 위 text |

### Brand usage

Brand 버튼은 모든 primary action에 사용하는 색이 아닙니다.

- **Primary (ink)**: 구조적/기능적 주요 액션
- **Brand (coral)**: “응원 놓고 가기”, “책상 만들기”, “내 책상으로 가져오기”처럼 서비스의 감정적 핵심 순간
- Secondary: 취소가 아닌 보조 액션 / 공유 / 다른 경로
- Tertiary: 낮은 중요도의 텍스트성 액션

## 2.5 Supporting palette

| Token | Value |
| --- | --- |
| `--color-sage` | `#A7B39B` |
| `--color-sage-soft` | `#E6EADF` |
| `--color-sky` | `#A9B8C9` |
| `--color-sky-soft` | `#E7EDF2` |
| `--color-butter` | `#E9C95B` |
| `--color-butter-soft` | `#F8EDBD` |
| `--color-pink-soft` | `#F2CED1` |
| `--color-lilac-soft` | `#DDD5E7` |

Supporting palette는 UI의 핵심 interaction color보다 illustration, badge, decorative surface 등에서 우선 사용합니다.

## 2.6 Feedback

| Token | Value |
| --- | --- |
| `--color-focus` | `#6E8FD1` |
| `--color-success` | `#4F7F65` |
| `--color-success-soft` | `#E3EEE6` |
| `--color-warning` | `#9A7424` |
| `--color-warning-soft` | `#F8EDC9` |
| `--color-danger` | `#B6524B` |
| `--color-danger-soft` | `#F6E1DE` |
| `--color-backdrop` | `rgba(41,39,34,.42)` |

---

# 3. Typography

Source: `src/design-system/tokens/typography.css`

## 3.1 UI font stack

현재 코드:

```css
--font-ui:
  'Wanted Sans',
  'Pretendard',
  'Noto Sans KR',
  -apple-system,
  BlinkMacSystemFont,
  'Segoe UI',
  sans-serif;
```

### ⚠ Pending product confirmation

현재 `fonts.css`에서는 **Pretendard Variable은 로드하지만 Wanted Sans는 별도 로드하지 않습니다.**

따라서 실제 브라우저 렌더링은 환경에 따라 Pretendard fallback이 될 수 있습니다.

Production에서 아래 중 하나를 확정해야 합니다.

- Wanted Sans를 실제 기본 UI font로 사용하고 정식 로딩
- Pretendard를 canonical UI font로 변경

확정 전에는 코드의 font stack을 유지합니다.

## 3.2 Type scale

| Style | Size / Line height | Weight | Tracking |
| --- | --- | --- | --- |
| Display XL | 40 / 52 | 700 | -0.02em |
| Display L | 32 / 44 | 700 | -0.02em |
| H1 | 28 / 40 | 700 | -0.015em |
| H2 | 24 / 36 | 700 | -0.015em |
| H3 | 20 / 30 | 700 | -0.01em |
| Title XL | 22 / 32 | 700 | -0.01em |
| Title L | 18 / 28 | 700 | -0.005em |
| Title M | 16 / 24 | 500 | default |
| Body L | 17 / 28 | 400 | default |
| Body M | 16 / 24 | 400 | default |
| Body S | 14 / 21 | 400 | default |
| Label L | 14 / 20 | 600 | default |
| Label M | 13 / 18 | 600 | default |
| Caption | 12 / 18 | 400 | default |
| Caption Strong | 12 / 18 | 600 | default |

Utility classes:

```text
.ds-display-xl
.ds-display-l
.ds-h1
.ds-h2
.ds-h3
.ds-title-xl
.ds-title-l
.ds-title-m
.ds-body-l
.ds-body-m
.ds-body-s
.ds-label-l
.ds-label-m
.ds-caption
.ds-caption-strong
```

### Implementation note

현재 feature CSS 일부에는 29px, 30px 등의 화면 전용 값이 남아 있습니다.
Production 정리 시 반복되는 값은 위 typography token으로 회수하고, 정말 화면 특수 값만 local CSS에 남기는 것을 권장합니다.

---

# 4. Spacing

Source: `src/design-system/tokens/spacing.css`

기본 단위는 **4px**입니다.

| Token | Value |
| --- | ---: |
| `--space-0` | 0 |
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-7` | 28px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |
| `--space-14` | 56px |
| `--space-16` | 64px |
| `--page-gutter` | 20px |

화면 좌우 기본 gutter는 20px입니다.

---

# 5. Radius

Source: `src/design-system/tokens/radius.css`

| Token | Value |
| --- | ---: |
| `--radius-xs` | 8px |
| `--radius-sm` | 12px |
| `--radius-md` | 16px |
| `--radius-lg` | 20px |
| `--radius-xl` | 24px |
| `--radius-2xl` | 28px |
| `--radius-full` | 999px |

현재 UI는 전반적으로 **12–24px의 부드러운 rounded surface**를 기본 인상으로 사용합니다.

---

# 6. Elevation

Source: `src/design-system/tokens/elevation.css`

| Token | Use |
| --- | --- |
| `--shadow-card` | 일반 떠 있는 card |
| `--shadow-floating` | Dialog / Toast / 높은 floating layer |
| `--shadow-sheet` | Bottom sheet |
| `--highlight-inset` | 밝은 surface의 미세한 top highlight |

강한 Material-style 그림자보다 **낮은 대비의 따뜻한 shadow**가 기본입니다.

---

# 7. Motion

Source: `src/design-system/tokens/motion.css`

| Token | Value |
| --- | --- |
| `--duration-fast` | 120ms |
| `--duration-normal` | 200ms |
| `--duration-slow` | 320ms |
| `--ease-standard` | cubic-bezier(0.2, 0, 0, 1) |
| `--ease-emphasized` | cubic-bezier(0.2, 0.8, 0.2, 1) |

`prefers-reduced-motion: reduce`에서는 duration을 1ms로 낮춥니다.

원칙:

- 단순 press / hover: fast
- 일반 state transition: normal
- Sheet / 중요한 enter transition: slow 또는 emphasized
- 콘텐츠 감성 animation은 reduced-motion 대응 필수

---

# 8. App layout

Source: `src/layout/AppShell.tsx`, `AppShell.css`

`AppShell` props:

```ts
surface?: 'base' | 'paper' | 'transparent'
appBar?: ReactNode
bottomNavigation?: ReactNode
fixedAction?: ReactNode
contentClassName?: string
```

현재 prototype layout:

- minimum viewport: 320px
- app shell max width: 430px
- mobile safe-area 대응
- fixed CTA는 sticky bottom
- 520px 이상에서는 중앙에 430px shell + rounded outer frame

### ⚠ Pending product confirmation

현재 430px 제한은 **프로토타입의 모바일 앱 같은 경험을 보여주기 위한 구조**입니다.

Production에서 다음 중 무엇을 canonical로 볼지 확정 필요:

1. 모바일 중심 430px fixed shell 유지
2. 모바일 우선이지만 tablet / desktop에서 responsive width 확장

확정 전에는 현재 AppShell을 prototype reference로 간주합니다.

---

# 9. Common components

Source: `src/design-system/components`

## Button

Variants:

```ts
'primary' | 'brand' | 'secondary' | 'tertiary'
```

Sizes:

```ts
'm' | 'l'
```

Current heights:

- M: min 48px
- L: min 56px

Props:

```ts
loading?: boolean
fullWidth?: boolean
leadingIcon?: ReactNode
trailingIcon?: ReactNode
```

Loading state는 disabled와 동일하게 interaction을 막고 spinner를 표시합니다.

## IconButton

Sizes:

- M: 44 × 44
- L: 48 × 48

Variants:

- ghost
- surface

**아이콘만 있는 버튼은 반드시 `label`을 전달해 aria-label을 제공합니다.**

## TextField / TextArea

지원 상태:

- label
- required
- helper
- error
- focus
- placeholder

기본 input min height: 52px

Error가 helper보다 우선 노출됩니다.

## Checkbox / Radio

Native input을 유지하고 visual indicator를 custom rendering합니다.

지원:

- `label`
- `helper`
- native input props

## ChoiceCard

큰 단일 선택지에 사용합니다.

예:

- 책상을 누구를 위해 만드는지
- Daily / Time Capsule 선택
- 공개 / 비공개

Selected state:

- strong border
- warm selected surface
- coral check

## ChoiceChip

작은 옵션 / compact filtering / 빠른 선택에 사용합니다.

Selected state에서는 dark ink background + inverse text를 사용합니다.

## Tabs

현재 Composer의 5개 도구 탭 등에 사용합니다.

지원:

- icon
- active
- restricted

Restricted item은 숨기지 않고 `onRestricted`로 이유를 설명할 수 있습니다.

## AssetTile

배경 / sticker / asset library의 선택 tile입니다.

지원:

- selected
- restricted
- badge
- supportsLongCard (legacy capability field)

> `supportsLongCard`는 과거 Long Card 탐색에서 만들어진 필드입니다.
> 현재 multi-card 정책과의 관계는 아래 Pending 섹션 참고.

## StatusBadge

Tone:

```ts
'neutral' | 'brand' | 'success' | 'warning' | 'danger'
```

## AppBar

Props:

- title
- subtitle
- leading
- trailing
- transparent

Current behavior:

- sticky top
- default blurred warm canvas background
- transparent mode 지원
- leading/trailing 48px slot으로 중앙 title 정렬

## BottomNavigation

Item:

```ts
{
  id: string
  label: string
  icon: ReactNode
}
```

현재 active item은 `aria-current="page"`를 사용합니다.

---

# 10. Overlay / feedback

Source: `src/design-system/overlays`

## BottomSheet

- Portal → document.body
- backdrop click close
- ESC close
- open 중 body scroll lock
- max width 430px
- max height 82dvh / 760px
- optional title / description / headerAction

주요 옵션 편집을 새 페이지로 보내지 않고 현재 맥락 위에서 처리할 때 사용합니다.

## Dialog

- centered modal
- backdrop click / ESC close
- primary / secondary action
- 최대 width 360px

삭제 확인, 중요한 정책 변경 등 **결정이 필요한 modal**에 사용합니다.

## Toast

API:

```ts
showToast('메시지')

showToast({
  message: '메시지',
  tone: 'success',
  duration: 2400,
})
```

Tone:

- neutral
- success
- warning
- danger

Default duration: 2400ms

Toast는 **결과 / 오류 / 제약 상태 피드백**에 사용하고, 화면을 보면 알 수 있는 설명을 반복하는 용도로 쓰지 않습니다.

## Snackbar

API:

```ts
showSnackbar({
  message: '응원을 삭제했어요.',
  actionLabel: '되돌리기',
  onAction: restore,
})
```

Default duration: 5000ms

사용자에게 즉시 되돌리기 action이 필요한 경우 사용합니다.

`NotificationProvider`는 `AppProviders`에서 전역 제공됩니다.

---

# 11. Icons

현재 공통 아이콘 라이브러리:

```text
lucide-react
```

원칙:

- 일반 기능 아이콘은 Lucide 우선
- 자체 서비스 illustration / sticker / word art와 기능 아이콘을 혼용하지 않음
- 아이콘 단독 button은 접근 가능한 label 필수
- UI icon color는 가능하면 semantic content token 상속

---

# 12. Accessibility defaults

현재 구현에 포함된 기준:

- `:focus-visible` global outline
- Button native disabled
- IconButton aria-label
- Tabs: `role="tablist"`, `role="tab"`, `aria-selected`
- ChoiceCard / ChoiceChip: `aria-pressed`
- BottomSheet / Dialog: `role="dialog"`, `aria-modal`
- Escape close
- BottomSheet scroll lock
- Toast/Snackbar: `aria-live="polite"`
- reduced-motion 대응
- safe-area inset 대응

Production에서 추가 검증 필요:

- full keyboard focus trapping in Dialog / BottomSheet
- focus restore after overlay close
- WCAG contrast audit
- screen reader end-to-end QA

---

# 13. User-created card style system

**이 섹션은 일반 UI 디자인 토큰과 별개입니다.**

사용자가 만드는 응원 카드는 브랜드 shell보다 훨씬 자유롭습니다.

## 13.1 Composer fonts

Source: `src/features/composer/fonts/fontRegistry.ts`

Handwriting:

- 김유이체
- 손편지체
- 바른히피
- 중학생
- 잘하고 있어
- 정은체
- 연지체
- 하나손글씨

Sans:

- Pretendard
- 나눔스퀘어 네오

현재 prototype은 Naver/Clova Nanum 계열을 CDN wrapper로 가져옵니다.

`fonts.css` 주석 기준 production 권장안:

> 공식 배포본 self-hosting 우선 검토

## 13.2 Composer text size

| Option | px |
| --- | ---: |
| 작게 | 18 |
| 보통 | 23 |
| 크게 | 30 |

Default: 23px

Handwriting line-height: 1.46  
Sans line-height: 1.55

## 13.3 Composer text colors

| Name | Value |
| --- | --- |
| 먹색 | `#3C3833` |
| 코랄 | `#B85F50` |
| 블루 | `#4D6F91` |
| 그린 | `#56705A` |
| 퍼플 | `#735E83` |
| 브라운 | `#755B4C` |

이 색들은 **카드 작성용 팔레트**이며 서비스 UI semantic colors와 동일 개념이 아닙니다.

## 13.4 Card basic backgrounds

Source: `backgroundAssets.ts`

| ID | Tone |
| --- | --- |
| Cream | `#F8F1E7` |
| Coral | `#F7D8CF` |
| Sage | `#DFE8D7` |
| Sky | `#DCE7EF` |
| Butter | `#F8ECC3` |

Graphic backgrounds는 `/public/assets/backgrounds`의 image asset registry에서 관리합니다.

Asset definition:

```ts
type ComposerBackground = {
  id: string
  name: string
  group: 'basic' | 'graphic'
  kind: 'css' | 'image'
  className?: string
  source?: string
  tone: string
  fit?: 'cover' | 'contain'
  supportsLongCard: boolean
}
```

Production에서 새 asset을 추가할 때 **component에 직접 하드코딩하지 말고 registry에 추가**합니다.

## 13.5 Stickers

Source: `stickerAssets.ts`

Sticker registry:

```ts
type StickerAsset = {
  id: string
  name: string
  source: string
  baseWidthPercent: number
  tags?: string[]
}
```

현재 prototype:

- 숫자 1
- 숫자 2
- 숫자 3
- 강조 효과

새 sticker도 registry 기반으로 추가합니다.

## 13.6 Word Art

Source: `src/features/composer/wordArt`

현재 registry:

- 네가
- 성공하는
- 이유
- 잘 될 거야

Word Art는 자체 SVG React component로 관리합니다.

## 13.7 Photos

Shared rendering supports:

- plain
- white frame
- polaroid

Transparent image의 plain frame에는 drop-shadow를 사용합니다.

---

# 14. Card renderer parity

중요 파일:

- `src/features/composer/cardRenderShared.css`
- `src/features/composer/cardRenderStyles.ts`

작성 화면과 수험생 Reader는 **같은 카드 geometry / styling rule을 공유해야 합니다.**

원칙:

> Composer에서 보이는 결과와 Recipient Reader에서 보이는 결과가 달라지지 않게 한다.

공유 대상:

- card width / radius / shadow
- background gradient
- text geometry
- word art geometry
- sticker geometry
- photo frame
- photo rotation / scale
- z-index

새 카드 표현을 추가할 때 Editor와 Reader를 따로 스타일링하지 말고 shared renderer 계층을 먼저 확장합니다.

---

# 15. Desk visual system

Desk는 일반 Design System component라기보다 **서비스 핵심 scene component**입니다.

현재 원칙:

- 따뜻하고 차분한 2.5D
- 약간 위에서 내려다보는 시점
- 스탠드 / 책 / 식물은 fixed environment
- 메시지 object가 가장 중요한 foreground content
- 중앙과 하단의 placement zone을 충분히 확보
- background decoration이 message object보다 시선을 빼앗지 않음

Desk message object와 실제 카드 콘텐츠는 별개의 representation입니다.

예:

```text
실제 응원 카드
→ 책상에서는 Memo / Letter / Photo Card / Poster / Charm 형태로 표현
→ 선택하면 실제 카드 Reader가 열림
```

---

# 16. Design-system implementation rules

프론트 개발 시 권장:

### Do

- color는 semantic token 우선
- spacing은 `--space-*` 우선
- radius는 `--radius-*` 우선
- 공통 interaction은 `@/design-system` component 재사용
- 카드 asset은 registry 기반
- Editor / Reader rendering은 shared rule 유지
- safe-area 고려
- reduced-motion 유지
- 버튼/아이콘 접근성 label 유지

### Avoid

- 화면마다 새로운 hex color 추가
- 기존 Button과 같은 UI를 feature CSS로 재작성
- 사용자 카드 색을 서비스 UI semantic token으로 승격
- 설명성 copy를 UI control 옆에 반복해서 추가
- Editor와 Reader에 동일 요소를 각각 구현
- 기능 없는 decorative English label 추가

---

# 17. Prototype-only / production migration notes

현재 코드는 **interactive UX specification**입니다.

Production 전환 시 별도로 검토할 항목:

- Supabase Database / Storage 연동
- 실제 auth
- Claim token 및 ownership 검증
- image upload/storage
- server persistence
- URL room routing
- font self-hosting
- responsive layout 확정
- full accessibility QA
- design token TypeScript/Figma token sync 여부

현재 Zustand + persisted browser state는 production persistence 계약이 아닙니다.

---

# 18. Pending confirmations

아래는 현재 코드만으로 제품 규칙을 확정할 수 없는 항목입니다.

## P1. UI 기본 폰트

현재 token: Wanted Sans → Pretendard fallback  
현재 실제 webfont loading: Pretendard

**확인 필요:** Wanted Sans / Pretendard 중 production canonical UI font

## P2. Desktop responsive policy

현재 prototype: max-width 430px mobile shell

**확인 필요:** production도 430px 중심으로 유지할지, tablet/desktop responsive layout으로 확장할지

## P3. Long Card legacy cleanup

예전 `SystemPage`, `PRODUCT_DECISIONS.md`, 일부 asset capability에는 Long Card가 남아 있습니다.

현재 활성 제품 방향은 **표준 카드 최대 3장**을 사용하는 multi-card 방식입니다.

**확인 필요:** Long Card 관련 설명/데모/asset capability를 legacy로 선언하고 제거·정리할지

---

# 19. Reference files

Foundation:

- `src/design-system/tokens/colors.css`
- `src/design-system/tokens/typography.css`
- `src/design-system/tokens/spacing.css`
- `src/design-system/tokens/radius.css`
- `src/design-system/tokens/elevation.css`
- `src/design-system/tokens/motion.css`

Components:

- `src/design-system/components/`
- `src/design-system/overlays/`

Layout:

- `src/layout/AppShell.tsx`
- `src/layout/AppShell.css`
- `src/styles/global.css`

Card/content:

- `src/features/composer/fonts/`
- `src/features/composer/backgroundAssets.ts`
- `src/features/composer/stickerAssets.ts`
- `src/features/composer/wordArt/`
- `src/features/composer/cardRenderShared.css`
- `src/features/composer/cardRenderStyles.ts`

Live gallery:

- `/system`
- `src/system/SystemPage.tsx`

> Note: `/system`의 일부 Long Card 예시는 최신 multi-card 결정 이전의 legacy exploration입니다.
