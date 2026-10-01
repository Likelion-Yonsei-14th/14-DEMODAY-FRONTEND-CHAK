import { Check, Share2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, useFeedback } from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import { DeskObjectVisual } from '@/features/desk/DeskObjectLayer'
import { buildPrototypeShareUrl } from '@/prototype/shareUrl'
import { deskObjectLabels } from './supporterFlow'
import './supporterFlow.css'

export function SupportCompletePage() {
  const navigate = useNavigate()
  const { showToast } = useFeedback()
  const currentDesk = usePrototypeStore((state) => state.currentDesk)
  const messages = usePrototypeStore((state) => state.messages)

  const latestObject = currentDesk.objects[currentDesk.objects.length - 1]
  const recipientName = currentDesk.displayName
  const latestMessage = latestObject
    ? messages.find((message) => message.id === latestObject.messageId)
    : undefined

  const shareDesk = async () => {
    const shareUrl = buildPrototypeShareUrl('/prototype/support/jisu')

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${recipientName}님의 응원 책상`,
          text: `${recipientName}님의 책상에 응원 하나 놓고 가줘!`,
          url: shareUrl,
        })
        return
      }

      await navigator.clipboard.writeText(shareUrl)
      showToast(`${recipientName}님의 책상 링크를 복사했어요.`)
    } catch {
      // 사용자가 공유 시트를 닫은 경우에는 별도 오류 메시지를 띄우지 않습니다.
    }
  }

  return (
    <AppShell
      surface="base"
      contentClassName="support-complete-shell"
      fixedAction={
        <Button
          variant="brand"
          fullWidth
          onClick={() => navigate('/prototype/support/jisu')}
        >
          {recipientName}님의 책상으로 돌아가기
        </Button>
      }
    >
      <main className="support-complete">
        <div className="support-complete__mark" aria-hidden>
          <Check size={30} strokeWidth={2.4} />
        </div>

        <section className="support-complete__copy">
          <h1>응원이 {recipientName}님의<br />책상에 놓였어요.</h1>
          <p>
            {recipientName}님이 열어볼 때까지 책상 위에서 조용히 기다리고 있을 거예요.
          </p>
        </section>

        <div
          className={[
            'support-complete__object',
            latestObject
              ? `desk-object--${latestObject.representationType}`
              : 'desk-object--memo',
          ].join(' ')}
          style={{
            '--desk-object-color':
              latestObject?.color ??
              latestMessage?.previewColor ??
              '#F4C6BC',
          } as React.CSSProperties}
          aria-hidden
        >
          <DeskObjectVisual
            type={latestObject?.representationType ?? 'memo'}
          />
          <span className="support-complete__spark support-complete__spark--one">✦</span>
          <span className="support-complete__spark support-complete__spark--two">·</span>
        </div>

        {latestObject && (
          <section className="support-complete__receipt">
            <div>
              <span>책상에 놓인 형태</span>
              <strong>{deskObjectLabels[latestObject.representationType]}</strong>
            </div>
            <div>
              <span>공개 범위</span>
              <strong>{latestMessage?.visibility === 'private' ? `${recipientName}님만 보기` : '함께 보기'}</strong>
            </div>
          </section>
        )}

        <Button
          variant="secondary"
          fullWidth
          leadingIcon={<Share2 size={18} aria-hidden />}
          onClick={shareDesk}
        >
          친구에게 이 책상 알려주기
        </Button>
      </main>
    </AppShell>
  )
}
