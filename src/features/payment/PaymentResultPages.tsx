import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import {
  clearPendingOrder,
  confirmTossPayment,
  readPendingOrder,
} from './tossPayments'
import './PaymentSheet.css'

type ConfirmState =
  | { status: 'confirming' }
  | { status: 'done' }
  | { status: 'error'; message: string }

/** Toss redirects here (mobile flow) with paymentKey / orderId / amount. */
export function PaymentSuccessPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [order] = useState(readPendingOrder)
  const [state, setState] = useState<ConfirmState>({ status: 'confirming' })
  const requested = useRef(false)

  useEffect(() => {
    // StrictMode runs effects twice; a payment must only be confirmed once.
    if (requested.current) return
    requested.current = true

    const paymentKey = params.get('paymentKey')
    const orderId = params.get('orderId')
    const amount = Number(params.get('amount'))

    if (!paymentKey || !order || order.orderId !== orderId || order.amount !== amount) {
      setState({ status: 'error', message: '결제 정보가 주문과 달라요.' })
      return
    }

    confirmTossPayment({ paymentKey, orderId, amount })
      .then(() => {
        clearPendingOrder()
        setState({ status: 'done' })
      })
      .catch((error: Error) =>
        setState({ status: 'error', message: error.message }),
      )
  }, [params, order])

  const goBack = () => navigate(order?.returnTo ?? '/home', { replace: true })

  return (
    <AppShell
      surface="base"
      fixedAction={
        state.status !== 'confirming' && (
          <Button variant="brand" fullWidth onClick={goBack}>
            돌아가기
          </Button>
        )
      }
    >
      <main className="payment-result">
        {state.status === 'confirming' && <h1>결제를 승인하고 있어요…</h1>}
        {state.status === 'done' && (
          <>
            <span className="payment-result__mark" aria-hidden>
              ✓
            </span>
            <h1>결제가 완료됐어요.</h1>
            <p>
              {order?.orderName} · {order?.amount.toLocaleString()}원
            </p>
          </>
        )}
        {state.status === 'error' && (
          <>
            <span
              className="payment-result__mark payment-result__mark--error"
              aria-hidden
            >
              !
            </span>
            <h1>결제를 완료하지 못했어요.</h1>
            <p>{state.message}</p>
          </>
        )}
      </main>
    </AppShell>
  )
}

/** Toss redirects here with code / message when the payment fails or is canceled. */
export function PaymentFailPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [order] = useState(readPendingOrder)

  useEffect(() => clearPendingOrder(), [])

  return (
    <AppShell
      surface="base"
      fixedAction={
        <Button
          variant="brand"
          fullWidth
          onClick={() =>
            navigate(order?.returnTo ?? '/home', { replace: true })
          }
        >
          돌아가기
        </Button>
      }
    >
      <main className="payment-result">
        <span
          className="payment-result__mark payment-result__mark--error"
          aria-hidden
        >
          !
        </span>
        <h1>결제가 취소됐어요.</h1>
        <p>{params.get('message') ?? '다시 시도해 주세요.'}</p>
      </main>
    </AppShell>
  )
}
