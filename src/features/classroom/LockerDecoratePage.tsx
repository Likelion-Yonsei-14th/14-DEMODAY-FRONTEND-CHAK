import { useState } from 'react'
import { ArrowLeft, Ban } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  AppBar,
  Button,
  IconButton,
  useFeedback,
} from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import { PaymentSheet } from '@/features/payment/PaymentSheet'
import { usePrototypeStore } from '@/store/prototypeStore'
import {
  LOCKER_DECOR_PRICE,
  getLockerDecorCharges,
  lockerBulbs,
  lockerPaints,
  type LockerDecor,
  type LockerPaint,
} from './lockerDecor'
import { ClassroomLockerScene } from './LockerScene'
import '@/features/supporter/supporterFlow.css'
import './Classroom.css'

const EMPTY_DECOR: LockerDecor = {}

/** The owner's paid locker upgrades: a hanging light and paint inside/out. */
export function LockerDecoratePage() {
  const navigate = useNavigate()
  const { classroomId, lockerId } = useParams()
  const { showToast } = useFeedback()
  const classroom = usePrototypeStore((state) => state.classroom)
  const member = usePrototypeStore((state) => state.classroomMember)
  const allMessages = usePrototypeStore((state) => state.messages)
  const saved = usePrototypeStore(
    (state) => (lockerId && state.lockerDecor[lockerId]) || EMPTY_DECOR,
  )
  const saveLockerDecor = usePrototypeStore((state) => state.saveLockerDecor)
  const [draft, setDraft] = useState<LockerDecor>(saved)
  const [open, setOpen] = useState(true)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const locker = classroom.lockers.find((item) => item.id === lockerId)

  if (!locker || !member || member.lockerId !== locker.id) {
    return (
      <Navigate
        to={`/prototype/classroom/${classroomId ?? classroom.id}/map`}
        replace
      />
    )
  }

  const lockerPath = `/prototype/classroom/${classroomId ?? classroom.id}/locker/${locker.id}`
  const charges = getLockerDecorCharges(saved, draft)
  const total = charges.reduce((sum, charge) => sum + charge.price, 0)
  const changed =
    draft.bulb !== saved.bulb ||
    draft.inside !== saved.inside ||
    draft.outside !== saved.outside

  const apply = () => {
    saveLockerDecor(locker.id, {
      ...draft,
      bulbOwned: saved.bulbOwned || Boolean(draft.bulb),
    })
    showToast(total > 0 ? `${total}원 결제하고 적용했어요.` : '사물함을 꾸몄어요.')
    navigate(lockerPath)
  }

  const paintRow = (
    label: string,
    key: 'inside' | 'outside',
    showOpen: boolean,
  ) => (
    <section className="locker-decorate__section">
      <header className="locker-decorate__header">
        <strong>{label}</strong>
        <span>칠할 때마다 {LOCKER_DECOR_PRICE}원</span>
      </header>
      <div className="locker-decorate__swatches" role="list">
        <button
          type="button"
          className={[
            'locker-decorate__swatch',
            'locker-decorate__swatch--none',
            !draft[key] ? 'locker-decorate__swatch--selected' : '',
          ].filter(Boolean).join(' ')}
          aria-pressed={!draft[key]}
          onClick={() => {
            setDraft((current) => ({ ...current, [key]: undefined }))
            setOpen(showOpen)
          }}
        >
          <span className="locker-decorate__chip" style={{ background: '#7f927f' }} />
          기본
        </button>
        {lockerPaints.map((paint) => (
          <button
            type="button"
            key={paint.id}
            className={[
              'locker-decorate__swatch',
              draft[key] === paint.id ? 'locker-decorate__swatch--selected' : '',
            ].filter(Boolean).join(' ')}
            aria-pressed={draft[key] === paint.id}
            onClick={() => {
              setDraft((current) => ({ ...current, [key]: paint.id as LockerPaint }))
              setOpen(showOpen)
            }}
          >
            <span className="locker-decorate__chip" style={{ background: paint.swatch }} />
            {paint.label}
          </button>
        ))}
      </div>
    </section>
  )

  return (
    <AppShell
      surface="base"
      contentClassName="classroom-locker-placement-shell"
      appBar={
        <AppBar
          title="사물함 꾸미기"
          leading={
            <IconButton
              label="내 사물함으로 돌아가기"
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
          disabled={!changed}
          onClick={() => (total > 0 ? setPaymentOpen(true) : apply())}
        >
          {total > 0 ? `${total}원 결제하고 적용하기` : '적용하기'}
        </Button>
      }
    >
      <main className="classroom-locker-placement locker-decorate">
        <ClassroomLockerScene
          locker={locker}
          messages={allMessages.filter((message) =>
            locker.messageIds.includes(message.id),
          )}
          open={open}
          owner
          decor={draft}
          onToggle={() => setOpen((value) => !value)}
        />
        <p className="classroom-locker-page__hint">
          문을 눌러 안과 밖을 번갈아 볼 수 있어요.
        </p>

        <section className="locker-decorate__section">
          <header className="locker-decorate__header">
            <strong>조명</strong>
            <span>
              {saved.bulbOwned
                ? '구매 완료 · 모양은 자유롭게 바꿔요'
                : `${LOCKER_DECOR_PRICE}원 · 한 번 사면 모양은 자유롭게`}
            </span>
          </header>
          <div className="locker-decorate__bulbs">
            <button
              type="button"
              className={[
                'locker-decorate__bulb',
                !draft.bulb ? 'locker-decorate__bulb--selected' : '',
              ].filter(Boolean).join(' ')}
              aria-pressed={!draft.bulb}
              onClick={() => {
                setDraft((current) => ({ ...current, bulb: undefined }))
                setOpen(true)
              }}
            >
              <Ban size={22} aria-hidden />
              끄기
            </button>
            {lockerBulbs.map((bulb) => (
              <button
                type="button"
                key={bulb.id}
                className={[
                  'locker-decorate__bulb',
                  draft.bulb === bulb.id ? 'locker-decorate__bulb--selected' : '',
                ].filter(Boolean).join(' ')}
                aria-pressed={draft.bulb === bulb.id}
                onClick={() => {
                  setDraft((current) => ({ ...current, bulb: bulb.id }))
                  setOpen(true)
                }}
              >
                <img src={bulb.source} alt="" draggable={false} />
                {bulb.label}
              </button>
            ))}
          </div>
        </section>

        {paintRow('안쪽 페인트', 'inside', true)}
        {paintRow('바깥 페인트', 'outside', false)}
      </main>

      <PaymentSheet
        open={paymentOpen}
        description="꾸민 사물함은 반 친구들에게도 그대로 보여요."
        items={charges.map((charge) => ({
          label: charge.label,
          amount: charge.price,
        }))}
        onClose={() => setPaymentOpen(false)}
        onConfirm={() => {
          setPaymentOpen(false)
          apply()
        }}
      />
    </AppShell>
  )
}
