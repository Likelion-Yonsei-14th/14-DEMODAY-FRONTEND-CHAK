import { Check, Share2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, useFeedback } from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import { DeskObjectVisual } from '@/features/desk/DeskObjectLayer'
import { buildPrototypeShareUrl } from '@/prototype/shareUrl'
import { DEFAULT_SUPPORTER_TOKEN, supporterPath } from '@/prototype/supporterRoute'
import { deskObjectLabels } from './supporterFlow'
import './supporterFlow.css'

export function SupportCompletePage() {
  const navigate = useNavigate()
  const { supporterToken = DEFAULT_SUPPORTER_TOKEN } = useParams()
  const { showToast } = useFeedback()
  const currentDesk = usePrototypeStore((state) => state.currentDesk)
  const messages = usePrototypeStore((state) => state.messages)

  const latestObject = currentDesk.objects[currentDesk.objects.length - 1]
  const recipientName = currentDesk.displayName
  const latestMessage = latestObject
    ? messages.find((message) => message.id === latestObject.messageId)
    : undefined
  const stickerPlaced = latestObject?.representationType === 'sticker'

  const shareDesk = async () => {
    const shareUrl = buildPrototypeShareUrl(supporterPath(supporterToken))

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${recipientName}님의 응원 책상`,
          text: `${recipientName} 책상에 응원 하나 놓고 가줘!`,
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
          onClick={() => navigate(supporterPath(supporterToken))}
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
          <h1>
            {stickerPlaced ? '스티커가' : '응원이'} {recipientName}님의
            <br />
            책상에 {stickerPlaced ? '붙었어요.' : '놓였어요.'}
          </h1>
          <p>
            {stickerPlaced
              ? `누가 붙였는지는 ${recipientName}님만 볼 수 있어요.`
              : `${recipientName}님이 열어볼 때까지 책상 위에서 조용히 기다리고 있을 거예요.`}
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
              '#D8644A',
          } as React.CSSProperties}
          aria-hidden
        >
          <DeskObjectVisual
            type={latestObject?.representationType ?? 'memo'}
            assetId={latestObject?.assetId}
            material={latestObject?.material}
            charmPhrase={latestObject?.charmPhrase}
            gems={latestObject?.gems}
          />
          <span className="support-complete__spark support-complete__spark--one">✦</span>
          <span className="support-complete__spark support-complete__spark--two">·</span>
        </div>

        {latestObject && (
          <section className="support-complete__receipt">
            <div>
              <span>책상에 놓인 형태</span>
              <strong>
                {deskObjectLabels[latestObject.representationType]}
                {latestObject.representationType === 'charm' &&
                latestObject.material
                  ? latestObject.material === 'acrylic'
                    ? ' · 아크릴 3D'
                    : ' · 평면 스티커'
                  : ''}
              </strong>
            </div>
            {(latestObject.gems?.length ?? 0) > 0 && (
              <div>
                <span>꾸미기</span>
                <strong>보석 스티커 {latestObject.gems?.length}개</strong>
              </div>
            )}
            {!stickerPlaced && (
              <div>
                <span>공개 범위</span>
                <strong>{latestMessage?.visibility === 'private' ? `${recipientName}님만 보기` : '함께 보기'}</strong>
              </div>
            )}
          </section>
        )}

        <Button
          variant="secondary"
          fullWidth
          leadingIcon={<Share2 size={18} aria-hidden />}
          onClick={shareDesk}
        >
          응원 링크 보내기
        </Button>
      </main>
    </AppShell>
  )
}
