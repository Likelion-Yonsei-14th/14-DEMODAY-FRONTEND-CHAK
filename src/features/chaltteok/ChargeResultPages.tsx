import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/design-system'
import { chaltteokApi, type ChargeResult } from '@/api/chaltteok'
import { ApiError } from '@/api/client'
import { AppShell } from '@/layout/AppShell'
import { formatChaltteok } from './chaltteok'
import { MockModeBadge } from './MockModeBadge'
import {
  markResumeCharged,
  readChargeContext,
  readChargeResult,
  saveChargeResult,
} from './returnFlow'
import './chaltteok.css'

type ConfirmState =
  | { status: 'confirming' }
  | { status: 'done'; result: ChargeResult }
  | { status: 'error'; message: string }

function confirmErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'AMOUNT_MISMATCH':
        return '결제 금액이 주문과 달라서 충전하지 않았어요.'
      case 'PAYMENT_EXPIRED':
        return '결제한 지 10분이 지나서 승인하지 못했어요. 다시 충전해 주세요.'
      case 'LOGIN_REQUIRED':
        return '로그인이 풀렸어요. 다시 로그인한 뒤 충전해 주세요.'
      default:
        return error.message || '충전을 완료하지 못했어요.'
    }
  }
  return '충전을 완료하지 못했어요. 잠시 후 다시 시도해 주세요.'
}

/** Toss redirects here with paymentKey / orderId / amount; the backend confirms and credits. */
export function ChargeSuccessPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [context] = useState(readChargeContext)
  const paymentKey = params.get('paymentKey')
  const orderId = params.get('orderId')
  const amount = Number(params.get('amount'))
  // A reload after a confirmed charge shows the stored result instead of confirming again.
  const [state, setState] = useState<ConfirmState>(() => {
    const done = orderId ? readChargeResult(orderId) : null
    return done ? { status: 'done', result: done } : { status: 'confirming' }
  })
  // StrictMode runs effects twice; the confirm must go out once.
  const requested = useRef(false)

  useEffect(() => {
    if (requested.current || state.status !== 'confirming') return
    requested.current = true

    if (!paymentKey || !orderId || !(amount > 0)) {
      setState({ status: 'error', message: '결제 정보를 확인할 수 없어요.' })
      return
    }
    // Same order, different amount: stop before the backend (which checks again).
    if (context?.orderId === orderId && context.amount !== amount) {
      setState({ status: 'error', message: '결제 금액이 주문과 달라서 충전하지 않았어요.' })
      return
    }

    chaltteokApi
      .confirmCharge({ paymentKey, orderId, amount })
      .then((result) => {
        saveChargeResult(result)
        if (context && context.need > 0) {
          markResumeCharged(context.returnTo, result.chargedAmount)
        }
        setState({ status: 'done', result })
      })
      .catch((error: unknown) =>
        setState({ status: 'error', message: confirmErrorMessage(error) }),
      )
  }, [amount, context, orderId, params, paymentKey, state.status])

  const fromPurchase = Boolean(context && context.need > 0)
  const returnTo = context?.returnTo ?? '/account'

  return (
    <AppShell
      surface="base"
      fixedAction={
        state.status !== 'confirming' && (
          <Button
            variant="brand"
            fullWidth
            onClick={() => navigate(returnTo, { replace: true })}
          >
            {state.status === 'done' && fromPurchase
              ? '구매하던 화면으로 돌아가기'
              : '돌아가기'}
          </Button>
        )
      }
    >
      <main className="chaltteok-result">
        <MockModeBadge />
        {state.status === 'confirming' && <h1>충전을 마무리하고 있어요…</h1>}
        {state.status === 'done' && (
          <>
            <span className="chaltteok-result__mark" aria-hidden>
              ✓
            </span>
            <h1>{formatChaltteok(state.result.chargedAmount)}을 충전했어요.</h1>
            <p>지금 보유 찰떡은 {formatChaltteok(state.result.balance)}이에요.</p>
            {fromPurchase && <p>돌아가서 구매 버튼을 다시 눌러 주세요.</p>}
          </>
        )}
        {state.status === 'error' && (
          <>
            <span
              className="chaltteok-result__mark chaltteok-result__mark--error"
              aria-hidden
            >
              !
            </span>
            <h1>충전하지 못했어요.</h1>
            <p>{state.message}</p>
          </>
        )}
      </main>
    </AppShell>
  )
}

/** Toss redirects here with code / message (no orderId when the buyer cancels). */
export function ChargeFailPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [context] = useState(readChargeContext)
  const code = params.get('code')
  const message =
    code === 'PAY_PROCESS_CANCELED'
      ? '결제를 취소했어요.'
      : (params.get('message') ?? '결제하지 못했어요.')
  const returnTo = context?.returnTo ?? '/account'

  const retry = () => {
    const query = new URLSearchParams({ returnTo })
    if (context?.need) query.set('need', String(context.need))
    if (context?.amount) query.set('amount', String(context.amount))
    navigate(`/chaltteok/charge?${query}`, { replace: true })
  }

  return (
    <AppShell
      surface="base"
      fixedAction={
        <div className="chaltteok-result__actions">
          <Button variant="secondary" fullWidth onClick={() => navigate(returnTo, { replace: true })}>
            돌아가기
          </Button>
          <Button variant="brand" fullWidth onClick={retry}>
            다시 시도
          </Button>
        </div>
      }
    >
      <main className="chaltteok-result">
        <MockModeBadge />
        <span
          className="chaltteok-result__mark chaltteok-result__mark--error"
          aria-hidden
        >
          !
        </span>
        <h1>충전하지 못했어요.</h1>
        <p>{message}</p>
        {code && code !== 'PAY_PROCESS_CANCELED' && (
          <p className="chaltteok-result__code">오류 코드: {code}</p>
        )}
      </main>
    </AppShell>
  )
}
