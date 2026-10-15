import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, IconButton, useFeedback } from '@/design-system'
import {
  chaltteokApi,
  readInsufficient,
  type PurchaseResult,
} from '@/api/chaltteok'
import { ApiError } from '@/api/client'
import type { ApiProductCode } from '@/api/types'
import { formatChaltteok } from '@/features/chaltteok/chaltteok'
import { MockModeBadge } from '@/features/chaltteok/MockModeBadge'
import {
  saveResume,
  setLoginReturn,
  takeChargedNotice,
} from '@/features/chaltteok/returnFlow'
import { useChaltteokBalance } from '@/features/chaltteok/useChaltteokBalance'
import './PaymentSheet.css'

export type PaymentLineItem = {
  label: string
  /** Display price in 찰떡; the server prices the purchase itself. */
  amount: number
  code: ApiProductCode
  quantity?: number
  ref?: string | null
}

type PaymentSheetProps = {
  open: boolean
  /** Defaults to "찰떡으로 구매". */
  title?: string
  /** One short line above the item list, e.g. what's about to be unlocked. */
  description?: string
  items: PaymentLineItem[]
  /**
   * The caller's picks (gems, paint, charm shape...). Parked before leaving
   * for the charge or login page and handed back by useResumeState.
   */
  resumeState?: unknown
  onClose: () => void
  onConfirm: (purchase: PurchaseResult) => void
}

/**
 * The prototype's one shared purchase screen - every paid flow (acrylic
 * charm, gems, university charm, locker decor, pennant) opens this. Items
 * are bought with 찰떡; when the balance is short it sends the buyer to the
 * charge page and back, and guests to login and back. It's a fixed
 * full-screen overlay, not a route, so the caller's draft stays mounted.
 */
export function PaymentSheet({
  open,
  title = '찰떡으로 구매',
  description,
  items,
  resumeState,
  onClose,
  onConfirm,
}: PaymentSheetProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const path = location.pathname + location.search
  const { showToast } = useFeedback()
  const { signedIn, balance, failed, reload, setBalance } = useChaltteokBalance(open)
  const [purchasing, setPurchasing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const purchasingRef = useRef(false)

  // Back from a charge started here: say so, and let the buyer press buy again.
  useEffect(() => {
    const charged = takeChargedNotice(path)
    if (charged) {
      showToast({
        message: `${formatChaltteok(charged)}을 충전했어요. 구매 버튼을 다시 눌러 주세요.`,
        tone: 'success',
      })
    }
  }, [path, showToast])

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
  const shortage = balance === null ? 0 : Math.max(0, total - balance)

  const goLogin = () => {
    saveResume(path, resumeState)
    setLoginReturn({ path, notice: '로그인하면 찰떡으로 구매할 수 있어요.' })
    navigate('/auth/login')
  }

  const goCharge = () => {
    saveResume(path, resumeState)
    const query = new URLSearchParams({ need: String(shortage), returnTo: path })
    navigate(`/chaltteok/charge?${query}`)
  }

  const purchase = async () => {
    if (purchasingRef.current) return
    purchasingRef.current = true
    setPurchasing(true)
    setError(null)
    try {
      const result = await chaltteokApi.purchase(
        items.map(({ code, quantity, ref }) => ({ code, quantity, ref })),
      )
      setBalance(result.balance)
      onConfirm(result)
    } catch (purchaseError) {
      const insufficient = readInsufficient(purchaseError)
      if (insufficient) {
        // The balance moved since we looked; show the real shortage.
        setBalance(insufficient.balance)
      } else if (purchaseError instanceof ApiError && purchaseError.code === 'LOGIN_REQUIRED') {
        goLogin()
      } else {
        setError('구매하지 못했어요. 잠시 후 다시 시도해 주세요.')
      }
    } finally {
      purchasingRef.current = false
      setPurchasing(false)
    }
  }

  let action: { label: string; onClick: () => void; disabled?: boolean }
  if (!signedIn) {
    action = { label: '로그인하고 구매하기', onClick: goLogin }
  } else if (balance === null) {
    action = failed
      ? { label: '잔액 다시 불러오기', onClick: reload }
      : { label: '잔액 확인 중…', onClick: () => undefined, disabled: true }
  } else if (shortage > 0) {
    action = { label: '찰떡 충전하기', onClick: goCharge }
  } else {
    action = { label: `${formatChaltteok(total)}으로 구매하기`, onClick: purchase }
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
          <span className="payment-sheet__topbar-spacer">
            <MockModeBadge />
          </span>
        </header>

        <div className="payment-sheet__body">
          {description && (
            <p className="payment-sheet__description">{description}</p>
          )}

          <ul className="payment-sheet__items">
            {items.map((item) => (
              <li className="payment-sheet__item" key={item.label}>
                <span>{item.label}</span>
                <strong>{formatChaltteok(item.amount)}</strong>
              </li>
            ))}
          </ul>

          <div className="payment-sheet__total">
            <span>필요한 찰떡</span>
            <strong>{formatChaltteok(total)}</strong>
          </div>

          {signedIn ? (
            <div className="payment-sheet__wallet">
              <span>보유 찰떡</span>
              <strong>
                {balance !== null
                  ? formatChaltteok(balance)
                  : failed
                    ? '불러오지 못했어요'
                    : '확인하는 중…'}
              </strong>
            </div>
          ) : (
            <p className="payment-sheet__notice">
              로그인하면 찰떡으로 구매할 수 있어요.
            </p>
          )}

          {shortage > 0 && (
            <p className="payment-sheet__notice" role="status">
              찰떡이 {shortage.toLocaleString()}개 부족해요. 충전하고 돌아오면 이어서
              구매할 수 있어요.
            </p>
          )}

          {error && (
            <p className="payment-sheet__error" role="alert">
              {error}
            </p>
          )}
        </div>

        <footer className="payment-sheet__footer">
          <Button
            variant="brand"
            fullWidth
            loading={purchasing}
            disabled={action.disabled || purchasing}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
