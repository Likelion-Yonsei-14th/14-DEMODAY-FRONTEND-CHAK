import { useState } from 'react'
import { Archive } from 'lucide-react'
import { BottomSheet, Button } from '@/design-system'
import { AdUnlockSheet } from '@/features/composer/AdUnlockSheet'
import { DeskObjectVisual } from '@/features/desk/DeskObjectLayer'
import { deskObjectLabels } from '@/features/supporter/supporterFlow'
import type { DeskObject, Message } from '@/types'

type DeskBasketSheetProps = {
  open: boolean
  /** Newest first. */
  objects: DeskObject[]
  messages: Message[]
  tidyableCount: number
  onTidy: () => void
  onClose: () => void
  onOpenMessage: (messageId: string) => void
}

type BasketItem = {
  id: string
  name: string
  messageId: string
}

/**
 * The living box beside the desk. Putting cheers in is free; every time a
 * cheer is taken back out to read, the owner watches one ad (prototype).
 */
export function DeskBasketSheet({
  open,
  objects,
  messages,
  tidyableCount,
  onTidy,
  onClose,
  onOpenMessage,
}: DeskBasketSheetProps) {
  const [adItem, setAdItem] = useState<BasketItem | null>(null)
  const messageById = new Map(messages.map((message) => [message.id, message]))

  return (
    <>
      <BottomSheet
        open={open && !adItem}
        onClose={onClose}
        title="바구니"
        description="넣는 건 무료예요. 다시 꺼내 볼 때마다 광고를 하나 봐야 해요."
      >
        <div className="desk-basket">
          {objects.length === 0 ? (
            <p className="desk-basket__empty">
              아직 비어 있어요. 책상이 꽉 차면 읽은 응원을 여기에 넣을 수 있어요.
            </p>
          ) : (
            <ul className="desk-basket__list">
              {objects.map((object) => {
                const message = messageById.get(object.messageId)
                const sender = message?.senderName ?? '친구'
                return (
                  <li key={object.id}>
                    <button
                      type="button"
                      className="desk-basket__item"
                      onClick={() =>
                        setAdItem({
                          id: object.messageId,
                          name: `${sender}의 ${deskObjectLabels[object.representationType]}`,
                          messageId: object.messageId,
                        })
                      }
                    >
                      <span
                        className={`desk-basket__thumb desk-object--${object.representationType}`}
                        style={
                          object.color
                            ? ({ '--desk-object-color': object.color } as React.CSSProperties)
                            : undefined
                        }
                      >
                        <DeskObjectVisual
                          type={object.representationType}
                          assetId={object.assetId}
                          material={object.material}
                          charmPhrase={object.charmPhrase}
                          gems={object.gems}
                          seed={object.id}
                        />
                      </span>
                      <span className="desk-basket__meta">
                        <strong>{sender}</strong>
                        <span>{deskObjectLabels[object.representationType]}</span>
                      </span>
                      <span className="desk-basket__ad">AD 다시 보기</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          <Button
            variant="secondary"
            fullWidth
            disabled={tidyableCount === 0}
            onClick={onTidy}
          >
            <Archive size={16} aria-hidden />
            {tidyableCount > 0
              ? `읽은 응원 ${tidyableCount}개 넣기 · 무료`
              : '넣을 수 있는 읽은 응원이 없어요'}
          </Button>
        </div>
      </BottomSheet>

      <AdUnlockSheet
        item={adItem}
        kindLabel="응원"
        description="바구니에 넣은 응원은 꺼내 볼 때마다 광고를 하나 봐야 해요."
        onClose={() => setAdItem(null)}
        onUnlocked={(item) => {
          setAdItem(null)
          onOpenMessage(item.messageId)
        }}
      />
    </>
  )
}
