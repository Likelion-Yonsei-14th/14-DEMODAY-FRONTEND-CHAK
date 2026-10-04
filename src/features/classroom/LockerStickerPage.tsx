import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  AppBar,
  AssetTile,
  BottomSheet,
  Button,
  IconButton,
} from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import {
  getLockerSticker,
  lockerStickerGroups,
  lockerStickers,
} from './lockerStickers'
import '@/features/supporter/supporterFlow.css'
import './Classroom.css'

/** Stars, bows and garlands are free; a college pennant is a paid sticker. */
export function LockerStickerPickPage() {
  const navigate = useNavigate()
  const { classroomId, lockerId } = useParams()
  const classroom = usePrototypeStore((state) => state.classroom)
  const stickerDraft = usePrototypeStore((state) => state.stickerDraft)
  const setStickerDraft = usePrototypeStore((state) => state.setStickerDraft)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const locker = classroom.lockers.find((item) => item.id === lockerId)

  if (!locker) {
    return (
      <Navigate
        to={`/prototype/classroom/${classroomId ?? classroom.id}/map`}
        replace
      />
    )
  }

  const lockerPath = `/prototype/classroom/${classroomId ?? classroom.id}/locker/${locker.id}`
  const selected = getLockerSticker(stickerDraft.stickerId)
  const price = selected?.price ?? 0
  const goPlace = () => navigate(`${lockerPath}/placement`)

  return (
    <AppShell
      surface="base"
      appBar={
        <AppBar
          title="스티커 고르기"
          leading={
            <IconButton
              label={`${locker.studentName}님의 사물함으로 돌아가기`}
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate(lockerPath)}
            />
          }
        />
      }
      fixedAction={
        <Button
          variant="brand"
          fullWidth
          disabled={!selected}
          onClick={() => (price > 0 ? setPaymentOpen(true) : goPlace())}
        >
          {price > 0 ? `${price}원 결제하고 붙이러 가기` : '사물함에 붙이러 가기'}
        </Button>
      }
    >
      <main className="sticker-pick locker-sticker-pick">
        <section className="placement-preview__copy">
          <h2>
            {locker.studentName}님 사물함에
            <br />
            붙일 스티커를 골라요.
          </h2>
          <p>
            글은 쓰지 않아도 돼요. 누가 붙였는지는 {locker.studentName}님만 봐요.
          </p>
        </section>

        {lockerStickerGroups.map((group) => (
          <section
            key={group.id}
            className="locker-sticker-pick__group"
            aria-label={group.label}
          >
            <header className="locker-sticker-pick__header">
              <strong>{group.label}</strong>
              <span>{group.description}</span>
            </header>
            <div
              className={[
                'sticker-pick__grid',
                `locker-sticker-pick__grid--${group.id}`,
              ].join(' ')}
            >
              {lockerStickers
                .filter((sticker) => sticker.group === group.id)
                .map((sticker) => (
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
            </div>
          </section>
        ))}
      </main>

      <BottomSheet
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        title="이대로 결제하고 붙일까요?"
        description="대학 깃발은 사물함 안에 걸려서 친구의 목표를 응원해요."
      >
        {selected && (
          <div className="charm-payment">
            <div className="charm-payment__row">
              <span>대학 깃발 · {selected.name}</span>
              <strong>{price}원</strong>
            </div>
            <div className="charm-payment__row charm-payment__row--total">
              <span>합계</span>
              <strong>{price}원</strong>
            </div>
            <p className="charm-payment__note">
              프로토타입이라 실제 결제는 되지 않아요.
            </p>
            <Button
              variant="brand"
              fullWidth
              onClick={() => {
                setPaymentOpen(false)
                goPlace()
              }}
            >
              {price}원 결제하기
            </Button>
          </div>
        )}
      </BottomSheet>
    </AppShell>
  )
}
