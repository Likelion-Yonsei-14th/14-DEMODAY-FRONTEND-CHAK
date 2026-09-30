import { useMemo, useState } from 'react'
import { ArrowLeft, MoreHorizontal } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppBar, IconButton, useFeedback } from '@/design-system'
import { DeskObjectLayer } from '@/features/desk/DeskObjectLayer'
import { DeskScene } from '@/features/desk/DeskScene'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import {
  mergeSupportMessages,
  seededDeskObjects,
} from '@/features/supporter/seededMessages'
import { OwnerViewToggle } from './OwnerViewToggle'
import './OwnerDeskPage.css'

export function OwnerDeskPage() {
  const navigate = useNavigate()
  const { showToast } = useFeedback()
  const currentDesk = usePrototypeStore((state) => state.currentDesk)
  const storedMessages = usePrototypeStore((state) => state.messages)
  const [openingMessageId, setOpeningMessageId] = useState<string | null>(null)

  const messages = useMemo(
    () => mergeSupportMessages(storedMessages),
    [storedMessages],
  )
  const objects = useMemo(
    () => [...seededDeskObjects, ...currentDesk.objects],
    [currentDesk.objects],
  )

  const openObject = (messageId: string) => {
    if (openingMessageId) return
    setOpeningMessageId(messageId)

    window.setTimeout(() => {
      navigate(`/prototype/my/message/${messageId}`, {
        state: { from: 'owner-desk' },
      })
    }, 360)
  }

  return (
    <AppShell
      surface="transparent"
      contentClassName="owner-desk-shell"
      appBar={
        <AppBar
          title="내 책상"
          subtitle="지수님의 응원 공간"
          transparent
          leading={
            <IconButton
              label="프로토타입 목록으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate('/prototype')}
            />
          }
          trailing={
            <IconButton
              label="내 책상 더보기"
              icon={<MoreHorizontal size={22} aria-hidden />}
              onClick={() =>
                showToast('읽기 설정과 책상 꾸미기는 다음 단계에서 연결할게요.')
              }
            />
          }
        />
      }
    >
      <main className="owner-desk">
        <section className="owner-desk__toolbar">
          <OwnerViewToggle mode="desk" />
        </section>

        <section className="owner-desk__intro">
          <p className="owner-desk__eyebrow">MY DESK</p>
          <h2>
            친구들이 놓고 간 마음을
            <br />
            하나씩 열어보세요.
          </h2>
          <p>
            책상 위 물건을 누르면 친구가 꾸민 카드가 그대로 열려요.
          </p>
        </section>

        <div
          className={[
            'owner-desk__scene-wrap',
            openingMessageId ? 'owner-desk__scene-wrap--opening' : '',
          ].filter(Boolean).join(' ')}
        >
          <DeskScene ownerName="지수" />
          <DeskObjectLayer
            objects={objects}
            messages={messages}
            onObjectClick={openObject}
            openingMessageId={openingMessageId}
          />
        </div>

        <section className="owner-desk__summary">
          <div>
            <strong>{objects.length}개의 응원이 책상에 놓여 있어요.</strong>
            <span>찾기 어려울 때는 봉투 보기로 한 번에 모아볼 수 있어요.</span>
          </div>
          <button
            type="button"
            className="owner-desk__mail-link"
            onClick={() => navigate('/prototype/my/desk/cards')}
          >
            봉투로 모아보기
          </button>
        </section>
      </main>
    </AppShell>
  )
}
