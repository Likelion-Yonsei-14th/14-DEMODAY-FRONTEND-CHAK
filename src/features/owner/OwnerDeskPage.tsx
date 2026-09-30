import { useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppBar, IconButton } from '@/design-system'
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
  const currentDesk = usePrototypeStore((state) => state.currentDesk)
  const storedMessages = usePrototypeStore((state) => state.messages)
  const readMessageIds = usePrototypeStore((state) => state.readMessageIds)
  const [openingMessageId, setOpeningMessageId] = useState<string | null>(null)

  const messages = useMemo(
    () => mergeSupportMessages(storedMessages),
    [storedMessages],
  )
  const objects = useMemo(
    () => [...seededDeskObjects, ...currentDesk.objects],
    [currentDesk.objects],
  )
  const unreadCount = useMemo(() => {
    const messageById = new Map(
      messages.map((message) => [message.id, message]),
    )

    return objects.filter((object) => {
      const message = messageById.get(object.messageId)
      return (
        message &&
        message.status !== 'read' &&
        !readMessageIds.includes(object.messageId)
      )
    }).length
  }, [messages, objects, readMessageIds])

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
          subtitle="수능까지 D-42"
          transparent
          leading={
            <IconButton
              label="프로토타입 목록으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate('/prototype')}
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
          <h2>
            {unreadCount > 0 ? (
              <>
                아직 열어보지 않은 응원이
                <br />
                {unreadCount}개 있어요.
              </>
            ) : (
              <>
                친구들이 남긴 응원을
                <br />
                모두 열어봤어요.
              </>
            )}
          </h2>
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
            readMessageIds={readMessageIds}
          />
        </div>

      </main>
    </AppShell>
  )
}
