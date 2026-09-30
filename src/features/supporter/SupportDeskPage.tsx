import {
  ArrowLeft,
  Layers3,
  MoreHorizontal,
  Share2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppBar, Button, IconButton, useFeedback } from '@/design-system'
import { DeskObjectLayer } from '@/features/desk/DeskObjectLayer'
import { DeskScene } from '@/features/desk/DeskScene'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import './SupportDeskPage.css'

const seededObjectCount = 5

export function SupportDeskPage() {
  const navigate = useNavigate()
  const { showToast } = useFeedback()
  const currentDesk = usePrototypeStore((state) => state.currentDesk)
  const messages = usePrototypeStore((state) => state.messages)
  const objectCount = seededObjectCount + currentDesk.objects.length

  return (
    <AppShell
      surface="transparent"
      contentClassName="support-desk-shell"
      appBar={
        <AppBar
          title="지수의 책상"
          subtitle="수능까지 D-42"
          transparent
          leading={
            <IconButton
              label="프로토타입 목록으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate('/prototype')}
            />
          }
          trailing={
            <div className="support-desk__app-actions">
              <IconButton
                label="도착한 응원을 카드 보기로 보기"
                icon={<Layers3 size={20} aria-hidden />}
                onClick={() => navigate('/prototype/support/jisu/cards')}
              />
              <IconButton
                label="더보기"
                icon={<MoreHorizontal size={22} aria-hidden />}
                onClick={() =>
                  showToast(
                    '공유·신고 같은 부수 기능은 이후 단계에서 연결할게요.',
                  )
                }
              />
            </div>
          }
        />
      }
      fixedAction={
        <div className="support-desk__action">
          <Button
            variant="brand"
            fullWidth
            onClick={() => navigate('/prototype/support/jisu/compose')}
          >
            응원 놓고 가기
          </Button>
        </div>
      }
    >
      <div className="support-desk">
        <section className="support-desk__intro">
          <p className="support-desk__eyebrow">JISU'S DESK</p>
          <h2>
            친구들이 하나씩
            <br />
            마음을 놓고 갔어요.
          </h2>
          <p>
            책상 위 물건들은 누군가 남긴 응원이에요. 지수에게도 하나 놓고
            가볼까요?
          </p>
        </section>

        <div className="support-desk__scene-wrap">
          <DeskScene ownerName="지수" />
          <DeskObjectLayer
            objects={currentDesk.objects}
            messages={messages}
            onObjectClick={(messageId) =>
              navigate(`/prototype/support/jisu/message/${messageId}`)
            }
          />
        </div>

        <div className="support-desk__meta">
          <div>
            <strong>{objectCount}개의 응원이 기다리는 중</strong>
            <span>사진, 메모, 편지와 작은 행운들이 쌓이고 있어요.</span>
          </div>
          <button
            type="button"
            className="support-desk__share"
            onClick={() =>
              showToast(
                '친구에게 공유하는 기능은 완료 화면에서 먼저 연결했어요.',
              )
            }
          >
            <Share2 size={16} aria-hidden />
            공유
          </button>
        </div>
      </div>
    </AppShell>
  )
}
