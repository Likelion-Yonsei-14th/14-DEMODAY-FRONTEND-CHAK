import { useState, type ReactNode } from 'react'
import {
  Image as ImageIcon,
  Palette,
  Sparkles,
  Sticker,
  Type,
  WandSparkles,
} from 'lucide-react'
import { AppShell } from '@/layout/AppShell'
import {
  AppBar,
  AssetTile,
  BottomSheet,
  Button,
  Checkbox,
  ChoiceCard,
  ChoiceChip,
  Dialog,
  Radio,
  StatusBadge,
  Tabs,
  TextArea,
  TextField,
  useFeedback,
} from '@/design-system'
import type { TabItem } from '@/design-system'
import './SystemPage.css'

const colors = [
  ['Canvas', 'var(--color-bg-canvas)'],
  ['Surface', 'var(--color-surface-base)'],
  ['Ink', 'var(--color-content-primary)'],
  ['Coral', 'var(--color-brand)'],
  ['Sage', 'var(--color-sage)'],
  ['Sky', 'var(--color-sky)'],
  ['Butter', 'var(--color-butter)'],
  ['Lilac', 'var(--color-lilac-soft)'],
]

const editorTabs: TabItem[] = [
  { id: 'background', label: '배경', icon: <Palette size={18} aria-hidden /> },
  { id: 'text', label: '글자', icon: <Type size={18} aria-hidden /> },
  { id: 'phrase', label: '문구', icon: <WandSparkles size={18} aria-hidden /> },
  { id: 'sticker', label: '스티커', icon: <Sticker size={18} aria-hidden /> },
  { id: 'photo', label: '사진', icon: <ImageIcon size={18} aria-hidden /> },
]

export function SystemPage() {
  const [tab, setTab] = useState('background')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState('cream')
  const [selectedChip, setSelectedChip] = useState('daily')
  const { showToast, showSnackbar } = useFeedback()

  return (
    <AppShell
      surface="paper"
      appBar={<AppBar title="Design System" subtitle="Phase 1 · code specification" />}
    >
      <div className="system-page">
        <section className="system-hero">
          <StatusBadge tone="brand">FOUNDATION</StatusBadge>
          <h2>UI는 깨끗하게,<br />콘텐츠는 살아있게.</h2>
          <p>
            Figma 디자인시스템을 코드 토큰과 재사용 가능한 컴포넌트로 옮긴 기준 페이지예요.
            이후 화면은 여기 있는 규칙을 조립해서 만듭니다.
          </p>
        </section>

        <SystemSection title="Colors" description="UI shell은 차분하고, Coral은 감정적인 핵심 CTA에 제한적으로 사용합니다.">
          <div className="system-colors">
            {colors.map(([name, value]) => (
              <div className="system-color" key={name}>
                <span className="system-color__swatch" style={{ background: value }} />
                <span>{name}</span>
              </div>
            ))}
          </div>
        </SystemSection>

        <SystemSection title="Typography" description="UI 텍스트와 사용자 제작 손글씨/워드아트는 별도 체계로 관리합니다.">
          <div className="system-type-stack">
            <div className="ds-display-l">수험생의 책상에 마음을 놓고 가요.</div>
            <div className="ds-h2">오늘 열어볼 응원이 있어요.</div>
            <div className="ds-title-l">지수가 받은 응원 12개</div>
            <div className="ds-body-m">짧게 적어도, 사진을 넣어도, 마음껏 꾸며도 괜찮아요.</div>
            <div className="ds-caption">Caption · 12 / 18</div>
          </div>
        </SystemSection>

        <SystemSection title="Buttons" description="Brand 버튼은 ‘응원 놓고 가기’ 같은 감정적 순간에 사용합니다.">
          <div className="system-button-stack">
            <Button fullWidth>Primary</Button>
            <Button variant="brand" fullWidth>응원 놓고 가기</Button>
            <Button variant="secondary" fullWidth>Secondary</Button>
            <Button variant="tertiary" fullWidth>Tertiary</Button>
            <Button disabled fullWidth>Disabled</Button>
            <Button loading fullWidth>Loading</Button>
          </div>
        </SystemSection>

        <SystemSection title="Fields & selections">
          <div className="system-form-stack">
            <TextField id="system-name" label="보내는 사람" placeholder="이름을 입력해주세요" helper="상대방에게 표시될 이름이에요." />
            <TextArea id="system-message" label="응원 메시지" placeholder="하고 싶은 말을 적어주세요" />
            <Checkbox label="공개 응원으로 남기기" helper="다른 친구들도 볼 수 있어요." defaultChecked />
            <Radio name="read-mode-demo" label="Daily" helper="하루를 마무리하며 하나씩 읽어요." defaultChecked />
            <Radio name="read-mode-demo" label="Time Capsule" helper="정해진 날 한 번에 열어봐요." />
          </div>
        </SystemSection>

        <SystemSection title="Choice components">
          <div className="system-chip-row">
            <ChoiceChip selected={selectedChip === 'daily'} onClick={() => setSelectedChip('daily')}>Daily</ChoiceChip>
            <ChoiceChip selected={selectedChip === 'capsule'} onClick={() => setSelectedChip('capsule')}>Time Capsule</ChoiceChip>
          </div>
          <div className="system-choice-stack">
            <ChoiceCard
              title="기본 카드"
              description="4:5 · 자유 배치"
              selected
              icon={<Sparkles size={20} aria-hidden />}
            />
            <ChoiceCard
              title="Long Card"
              description="본문 자동 레이아웃 · 지원 에셋만 사용"
              icon={<Type size={20} aria-hidden />}
            />
          </div>
        </SystemSection>

        <SystemSection title="Composer Tabs" description="Standard와 Long Card 모두 같은 탭 구조를 유지합니다.">
          <div className="system-tabs-demo">
            <Tabs
              items={editorTabs}
              value={tab}
              onChange={setTab}
              onRestricted={(item) => showToast(`${item.label}은 긴 카드에서 사용할 수 없는 요소예요.`)}
              ariaLabel="에디터 도구"
            />
          </div>
        </SystemSection>

        <SystemSection title="Asset Tiles" description="Long Card에서 못 쓰는 에셋은 숨기지 않고 Restricted 상태로 보여줍니다.">
          <div className="system-asset-grid">
            <AssetTile
              name="Cream"
              selected={selectedAsset === 'cream'}
              supportsLongCard
              onClick={() => setSelectedAsset('cream')}
              thumbnail={<span className="system-thumb system-thumb--cream" />}
            />
            <AssetTile
              name="Star Pattern"
              selected={selectedAsset === 'star'}
              supportsLongCard
              onClick={() => setSelectedAsset('star')}
              thumbnail={<span className="system-thumb system-thumb--star">✦ ✧ ✦</span>}
            />
            <AssetTile
              name="Clover Frame"
              restricted
              onClick={() => showToast('긴 카드에서는 사용할 수 없는 배경이에요.')}
              thumbnail={<span className="system-thumb system-thumb--clover">♧</span>}
            />
            <AssetTile
              name="내 사진"
              restricted
              onClick={() => showToast('사진 전체 배경은 4:5 카드에서만 사용할 수 있어요.')}
              thumbnail={<span className="system-thumb system-thumb--photo"><ImageIcon size={24} /></span>}
            />
          </div>
        </SystemSection>

        <SystemSection title="Feedback & overlays">
          <div className="system-button-stack">
            <Button variant="secondary" onClick={() => setSheetOpen(true)} fullWidth>Bottom Sheet 열기</Button>
            <Button variant="secondary" onClick={() => setDialogOpen(true)} fullWidth>Dialog 열기</Button>
            <Button variant="secondary" onClick={() => showToast('긴 카드에서는 사용할 수 없는 요소예요.')} fullWidth>Toast 보기</Button>
            <Button
              variant="secondary"
              onClick={() =>
                showSnackbar({
                  message: '응원을 삭제했어요.',
                  actionLabel: '되돌리기',
                  onAction: () => showToast('응원을 다시 복구했어요.'),
                })
              }
              fullWidth
            >
              Snackbar 보기
            </Button>
          </div>
        </SystemSection>
      </div>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="배경"
        description="캔버스는 그대로 보이고 옵션만 위로 올라오는 구조예요."
      >
        <div className="system-sheet-grid">
          <span className="system-sheet-card system-sheet-card--cream">기본</span>
          <span className="system-sheet-card system-sheet-card--sage">Sage</span>
          <span className="system-sheet-card system-sheet-card--pink">Pink</span>
        </div>
      </BottomSheet>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="긴 카드로 이어쓸까요?"
        description="글이 길어지고 있어요. 긴 카드로 바꾸면 내용을 더 편하게 이어서 쓸 수 있어요."
        secondaryAction={{ label: '이대로 정리하기', onClick: () => setDialogOpen(false) }}
        primaryAction={{
          label: '긴 카드로 이어쓰기',
          variant: 'brand',
          onClick: () => {
            setDialogOpen(false)
            showToast({ message: 'Long Card로 바꿨어요.', tone: 'success' })
          },
        }}
      />
    </AppShell>
  )
}

function SystemSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="system-section">
      <header className="system-section__header">
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </header>
      {children}
    </section>
  )
}
