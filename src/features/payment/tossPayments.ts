import { ANONYMOUS, loadTossPayments } from '@tosspayments/tosspayments-sdk'

const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY as string | undefined

/** Without a client key the PaymentSheet stays a pure mock. */
export const isTossEnabled = Boolean(clientKey)
export const isTossTestMode = clientKey?.startsWith('test_') ?? false

const PENDING_ORDER_KEY = 'toss-pending-order'

export type PendingOrder = {
  orderId: string
  orderName: string
  amount: number
  /** Where the success / fail page sends the buyer back to. */
  returnTo: string
}

type TossOrder = { orderName: string; amount: number }

// The SDK's overloads resolve to the redirect (void) signature; this is the
// Promise-flow result it actually returns when no successUrl is given.
type PromisePaymentResult = {
  paymentKey: string
  orderId: string
  amount: { value: number }
}

/**
 * - `paid`: approved in-page (PC iframe window) - the caller continues.
 * - `canceled`: the buyer closed the window.
 * - `redirected`: mobile - the browser is leaving for Toss and comes back
 *   on /payment/success or /payment/fail.
 */
export type TossPaymentOutcome = 'paid' | 'canceled' | 'redirected'

function createOrderId() {
  return `chak-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

// Toss only supports the Promise (iframe) flow on PC; mobile has to redirect.
function isMobile() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

export async function confirmTossPayment(params: {
  paymentKey: string
  orderId: string
  amount: number
}) {
  const response = await fetch('/api/payments/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const body = (await response.json().catch(() => ({}))) as {
    message?: string
  }
  if (!response.ok) {
    throw new Error(body.message ?? '결제 승인에 실패했어요.')
  }
  return body
}

export async function payWithToss({
  orderName,
  amount,
}: TossOrder): Promise<TossPaymentOutcome> {
  if (!clientKey) throw new Error('VITE_TOSS_CLIENT_KEY가 설정되지 않았어요.')

  const tossPayments = await loadTossPayments(clientKey)
  const payment = tossPayments.payment({ customerKey: ANONYMOUS })
  const orderId = createOrderId()
  const request = {
    method: 'CARD',
    amount: { currency: 'KRW', value: amount },
    orderId,
    orderName,
  } as const

  if (isMobile()) {
    const pending: PendingOrder = {
      orderId,
      orderName,
      amount,
      returnTo: window.location.pathname + window.location.search,
    }
    sessionStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(pending))
    await payment.requestPayment({
      ...request,
      successUrl: `${window.location.origin}/payment/success`,
      failUrl: `${window.location.origin}/payment/fail`,
    })
    return 'redirected'
  }

  try {
    const result = (await payment.requestPayment({
      ...request,
      windowTarget: 'iframe',
    })) as unknown as PromisePaymentResult
    if (result.orderId !== orderId || result.amount.value !== amount) {
      throw new Error('결제 정보가 주문과 달라요.')
    }
    await confirmTossPayment({
      paymentKey: result.paymentKey,
      orderId,
      amount,
    })
    return 'paid'
  } catch (error) {
    if ((error as { code?: string }).code === 'USER_CANCEL') return 'canceled'
    throw error
  }
}

export function readPendingOrder(): PendingOrder | null {
  try {
    const raw = sessionStorage.getItem(PENDING_ORDER_KEY)
    return raw ? (JSON.parse(raw) as PendingOrder) : null
  } catch {
    return null
  }
}

export function clearPendingOrder() {
  sessionStorage.removeItem(PENDING_ORDER_KEY)
}
