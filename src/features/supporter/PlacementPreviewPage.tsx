import { useMemo, useState } from 'react'
import { ArrowLeft, Eye, LockKeyhole } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppBar, Button, IconButton } from '@/design-system'
import { DeskScene } from '@/features/desk/DeskScene'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import {
  deskObjectLabels,
  resolveDeskObjectType,
  resolveDeskZone,
} from './supporterFlow'
import './supporterFlow.css'

export function PlacementPreviewPage() {
  const navigate = useNavigate()
  const draft = usePrototypeStore((state) => state.composerDraft)
  const currentDesk = usePrototypeStore((state) => state.currentDesk)
  const placeComposerMessage = usePrototypeStore((state) => state.placeComposerMessage)
  const [placing, setPlacing] = useState(false)

  const objectType = useMemo(() => resolveDeskObjectType(draft), [draft])
  const zone = resolveDeskZone(currentDesk.objects.length)
  const visibilityPrivate = draft.visibility === 'private'

  const placeMessage = () => {
    if (placing) return
    setPlacing(true)

    window.setTimeout(() => {
      placeComposerMessage()
      navigate('/prototype/support/jisu/complete', { replace: true })
    }, 620)
  }

  return (
    <AppShell
      surface="transparent"
      contentClassName="placement-shell"
      appBar={
        <AppBar
          title="책상에 놓기"
          subtitle="마지막으로 한 번 확인해보세요."
          transparent
          leading={
            <IconButton
              label="응원 만들기로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate('/prototype/support/jisu/compose')}
            />
          }
        />
      }
      fixedAction={
        <Button
          variant="brand"
          fullWidth
          loading={placing}
          onClick={placeMessage}
        >
          이대로 놓고 가기
        </Button>
      }
    >
      <main className="placement-preview">
        <section className="placement-preview__copy">
          <p className="supporter-flow__eyebrow">DESK PREVIEW</p>
          <h2>내 응원은 이렇게<br />지수의 책상에 놓여요.</h2>
          <p>
            위치는 책상이 자연스럽게 보이도록 자동으로 정리해둘게요.
          </p>
        </section>

        <div className="placement-preview__scene">
          <DeskScene
            ownerName="지수"
            extraObjectType={objectType}
            highlightExtraObject={placing}
          />
        </div>

        <section className="placement-preview__summary">
          <div className="placement-preview__summary-row">
            <span>형태</span>
            <strong>{deskObjectLabels[objectType]}</strong>
          </div>
          <div className="placement-preview__summary-row">
            <span>놓이는 자리</span>
            <strong>{zoneLabel(zone)}</strong>
          </div>
          <div className="placement-preview__summary-row">
            <span>공개 범위</span>
            <strong className="placement-preview__visibility">
              {visibilityPrivate ? (
                <LockKeyhole size={15} aria-hidden />
              ) : (
                <Eye size={15} aria-hidden />
              )}
              {visibilityPrivate ? '지수만 보기' : '함께 보기'}
            </strong>
          </div>
        </section>
      </main>
    </AppShell>
  )
}

function zoneLabel(zone: ReturnType<typeof resolveDeskZone>) {
  const labels = {
    left: '책상 왼쪽',
    center: '책상 가운데',
    right: '책상 오른쪽',
    back: '뒤쪽',
    front: '앞쪽',
  }

  return labels[zone]
}
