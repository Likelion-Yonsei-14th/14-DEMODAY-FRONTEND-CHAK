import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft } from 'lucide-react'
import { Button, IconButton } from '@/design-system'
import { isTossEnabled, isTossTestMode, payWithToss } from './tossPayments'
import './PaymentSheet.css'

export type PaymentLineItem = {
  label: string
  amount: number
}

type PaymentSheetProps = {
  open: boolean
  /** Defaults to "결제하기". */
  title?: string
  /** One short line above the item list, e.g. what's about to be unlocked. */
  description?: string
  items: PaymentLineItem[]
  onClose: () => void
  onConfirm: () => void
}

/**
 * The prototype's one shared "결제하기" screen - every "~원 결제하고 ..."
 * flow (acrylic charm, gems, university charm, locker decor, pennant)
 * opens this instead of its own ad-hoc confirm sheet. It's a fixed
 * full-screen overlay, not a route: the caller (and whatever draft state
 * it's holding - gem picks, charm material, locker decor choices) stays
 * mounted underneath the whole time.
 *
 * With VITE_TOSS_CLIENT_KEY set, "결제하기" opens the Toss Payments card
 * window and `onConfirm` only runs once the payment is approved. On mobile
 * Toss redirects away, so the flow resumes on /payment/success instead.
 */
export function PaymentSheet({
  open,
  title = '결제하기',
  description,
  items,
  onClose,
  onConfirm,
}: PaymentSheetProps) {
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) setError(null)
  }, [open])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const total = items.reduce((sum, item) => sum + item.amount, 0)

  const pay = async () => {
    if (!isTossEnabled) {
      onConfirm()
      return
    }
    const [first] = items
    const orderName =
      items.length > 1 ? `${first?.label} 외 ${items.length - 1}건` : (first?.label ?? title)

    setPaying(true)
    setError(null)
    try {
      const outcome = await payWithToss({ orderName, amount: total })
      if (outcome === 'paid') onConfirm()
    } catch (payError) {
      setError(payError instanceof Error ? payError.message : '결제에 실패했어요.')
    } finally {
      setPaying(false)
    }
  }

  return createPortal(
    <div
      className="payment-sheet"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="payment-sheet__frame">
        <header className="payment-sheet__topbar">
          <IconButton
            label="닫기"
            icon={<ArrowLeft size={21} aria-hidden />}
            onClick={onClose}
          />
          <span className="payment-sheet__title">{title}</span>
          <span className="payment-sheet__topbar-spacer" aria-hidden />
        </header>

        <div className="payment-sheet__body">
          {description && (
            <p className="payment-sheet__description">{description}</p>
          )}

          <ul className="payment-sheet__items">
            {items.map((item) => (
              <li className="payment-sheet__item" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.amount.toLocaleString()}원</strong>
              </li>
            ))}
          </ul>

          <div className="payment-sheet__total">
            <span>총 결제금액</span>
            <strong>{total.toLocaleString()}원</strong>
          </div>

          {error && (
            <p className="payment-sheet__error" role="alert">
              {error}
            </p>
          )}

          <p className="payment-sheet__note">
            {!isTossEnabled
              ? '프로토타입이라 실제 결제는 되지 않아요.'
              : isTossTestMode
                ? '토스페이먼츠 테스트 결제라 실제로 돈이 빠져나가지 않아요.'
                : '토스페이먼츠로 안전하게 결제돼요.'}
          </p>
        </div>

        <footer className="payment-sheet__footer">
          <Button variant="brand" fullWidth disabled={paying} onClick={pay}>
            {total.toLocaleString()}원 결제하기
          </Button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
