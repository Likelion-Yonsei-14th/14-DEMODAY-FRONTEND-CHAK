import {
  ArrowLeft,
  MessageCircleMore,
  Send,
  Share2,
} from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppBar, Button, IconButton, useFeedback } from '@/design-system'
import { DeskObjectLayer } from '@/features/desk/DeskObjectLayer'
import { DeskScene } from '@/features/desk/DeskScene'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import { buildPrototypeShareUrl } from '@/prototype/shareUrl'
import { getCsatDdayLabel } from '@/features/csat/csatSchedule'
import {
  mergeSupportMessages,
  seededDeskObjects,
} from './seededMessages'
import './SupportDeskPage.css'

export function SupportDeskPage() {
  const navigate = useNavigate()
  const { showToast } = useFeedback()
  const currentDesk = usePrototypeStore((state) => state.currentDesk)
  const storedMessages = usePrototypeStore((state) => state.messages)
  const ownerSettings = usePrototypeStore((state) => state.ownerSettings)
  const supporterIdentityName = usePrototypeStore(
    (state) => state.supporterIdentityName,
  )
  const messageReplies = usePrototypeStore(
    (state) => state.messageReplies,
  )
  const publicHiddenMessageIds = usePrototypeStore(
    (state) => state.publicHiddenMessageIds,
  )
  const publicBlockedSupporters = usePrototypeStore(
    (state) => state.publicBlockedSupporters,
  )
  const messages = useMemo(
    () =>
      mergeSupportMessages(storedMessages).filter(
        (message) =>
          !publicHiddenMessageIds.includes(message.id) &&
          !publicBlockedSupporters.includes(message.senderName),
      ),
    [
      publicBlockedSupporters,
      publicHiddenMessageIds,
      storedMessages,
    ],
  )
  const visibleMessageIds = useMemo(
    () => new Set(messages.map((message) => message.id)),
    [messages],
  )
  const objects = useMemo(
    () =>
      [...seededDeskObjects, ...currentDesk.objects].filter(
        (object) => visibleMessageIds.has(object.messageId),
      ),
    [currentDesk.objects, visibleMessageIds],
  )
  const receivedReplyCount = supporterIdentityName
    ? messageReplies.filter((reply) =>
        reply.targetSenderNames.includes(supporterIdentityName),
      ).length
    : 0
  const objectCount = objects.length
  const recipientName = currentDesk.displayName

  const openObject = (messageId: string) => {
    const message = messages.find((item) => item.id === messageId)
    if (!message) return

    if (message.visibility === 'private') {
      showToast(`${recipientName}님만 열어볼 수 있는 응원이에요.`)
      return
    }

    if (!ownerSettings.publicFeedEnabled) {
      showToast('공개 응원 함께 보기가 꺼져 있어요.')
      return
    }

    navigate(`/prototype/support/jisu/message/${messageId}`, {
      state: { from: 'support-desk' },
    })
  }

  const shareDesk = async () => {
    const url = buildPrototypeShareUrl('/prototype/support/jisu')

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${recipientName}님의 응원 책상`,
          text: `${recipientName}님에게 응원 하나 남겨주세요.`,
          url,
        })
        return
      }

      await navigator.clipboard.writeText(url)
      showToast('책상 링크를 복사했어요.')
    } catch {
      // 공유 시트를 닫은 경우에는 별도 오류를 노출하지 않습니다.
    }
  }

  return (
    <AppShell
      surface="transparent"
      contentClassName="support-desk-shell"
      appBar={
        <AppBar
          title={`${recipientName}님의 책상`}
          subtitle={getCsatDdayLabel()}
          transparent
          leading={
            <IconButton
              label="프로토타입 목록으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate('/prototype')}
            />
          }
          trailing={
            supporterIdentityName ? (
              <IconButton
                label={
                  receivedReplyCount > 0
                    ? `받은 답장 ${receivedReplyCount}개`
                    : '받은 답장'
                }
                icon={<MessageCircleMore size={20} aria-hidden />}
                onClick={() =>
                  navigate('/prototype/support/jisu/replies')
                }
              />
            ) : undefined
          }
        />
      }
      fixedAction={
        ownerSettings.roomClosed ? undefined : (
          <div className="support-desk__action">
            <Button
              variant="brand"
              fullWidth
              onClick={() => navigate('/prototype/support/jisu/compose')}
            >
              응원 놓고 가기
            </Button>
          </div>
        )
      }
    >
      <div className="support-desk">
        <section className="support-desk__intro">
          {ownerSettings.roomClosed ? (
            <>
              <h2>
                {recipientName}님의
                <br />
                응원 받기가 끝났어요.
              </h2>
              <p>그동안 모인 공개 응원은 계속 둘러볼 수 있어요.</p>
            </>
          ) : (
            <>
              <h2>
                친구들이 하나씩
                <br />
                {recipientName}님의 책상을 채우고 있어요.
              </h2>
              <p>
                {recipientName}님에게 전하고 싶은 마음이 있다면,
                <br />
                응원 하나를 남겨보세요.
              </p>
            </>
          )}
        </section>

        <div className="support-desk__scene-wrap">
          <DeskScene ownerName={`${recipientName}님`} />
          <DeskObjectLayer
            objects={objects}
            messages={messages}
            onObjectClick={openObject}
            showUnreadState={false}
          />
        </div>

        <div className="support-desk__meta">
          <div>
            <strong>{objectCount}개의 응원이 기다리는 중</strong>
            <span>사진, 메모, 편지와 작은 행운들이 쌓이고 있어요.</span>
          </div>
          <div className="support-desk__meta-actions">
            {supporterIdentityName && (
              <button
                type="button"
                className="support-desk__share"
                onClick={() =>
                  navigate('/prototype/support/jisu/sent')
                }
              >
                <Send size={15} aria-hidden />
                내 응원
              </button>
            )}
            <button
              type="button"
              className="support-desk__share"
              onClick={shareDesk}
            >
              <Share2 size={16} aria-hidden />
              공유
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
