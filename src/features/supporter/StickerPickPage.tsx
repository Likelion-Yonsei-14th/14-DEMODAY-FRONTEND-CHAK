import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  AppBar,
  AssetTile,
  Button,
  IconButton,
  TextField,
} from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import { deskStickers } from './deskStickers'
import './supporterFlow.css'

export function StickerPickPage() {
  const navigate = useNavigate()
  const recipientName = usePrototypeStore(
    (state) => state.currentDesk.displayName,
  )
  const defaultNickname = usePrototypeStore(
    (state) => state.supporterSettings.defaultNickname,
  )
  const stickerDraft = usePrototypeStore((state) => state.stickerDraft)
  const setStickerDraft = usePrototypeStore((state) => state.setStickerDraft)

  return (
    <AppShell
      surface="transparent"
      appBar={
        <AppBar
          title="스티커 고르기"
          transparent
          leading={
            <IconButton
              label={`${recipientName}님의 책상으로 돌아가기`}
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate('/prototype/support/jisu')}
            />
          }
        />
      }
      fixedAction={
        <Button
          variant="brand"
          fullWidth
          onClick={() => navigate('/prototype/support/jisu/placement')}
        >
          책상에 붙이러 가기
        </Button>
      }
    >
      <main className="sticker-pick">
        <section className="placement-preview__copy">
          <h2>
            {recipientName}님 책상에
            <br />
            붙일 스티커를 골라요.
          </h2>
          <p>글은 쓰지 않아도 돼요. 골라서 붙이면 끝!</p>
        </section>

        <section className="sticker-pick__grid" aria-label="스티커">
          {deskStickers.map((sticker) => (
            <AssetTile
              key={sticker.id}
              name={sticker.name}
              selected={stickerDraft.stickerId === sticker.id}
              thumbnail={
                <img
                  className="sticker-pick__image"
                  src={sticker.source}
                  alt=""
                  draggable={false}
                />
              }
              onClick={() => setStickerDraft({ stickerId: sticker.id })}
            />
          ))}
        </section>

        <TextField
          id="sticker-sender-name"
          label="내 이름 (선택)"
          helper={`${recipientName}님에게만 보여요. 비워두면 '익명의 친구'로 남아요.`}
          placeholder={defaultNickname || '이름 또는 닉네임'}
          maxLength={12}
          value={stickerDraft.senderName}
          onChange={(event) =>
            setStickerDraft({ senderName: event.target.value })
          }
        />
      </main>
    </AppShell>
  )
}
