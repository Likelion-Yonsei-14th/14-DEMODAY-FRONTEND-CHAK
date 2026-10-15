import { useEffect, useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ANONYMOUS } from '@tosspayments/tosspayments-sdk'
import {
  AppBar,
  Button,
  ChoiceCard,
  IconButton,
  TextField,
  useFeedback,
} from '@/design-system'
import {
  CHARGE_LIMITS,
  CHARGE_PRESETS,
  chaltteokApi,
  isValidChargeAmount,
} from '@/api/chaltteok'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import { formatChaltteok, isChargePreset, pickChargeAmount } from './chaltteok'
import { MockModeBadge } from './MockModeBadge'
import { safePath, saveChargeContext, setLoginReturn } from './returnFlow'
import { useChaltteokBalance } from './useChaltteokBalance'
import { tossClientKey, useTossPaymentWidgets } from './useTossPaymentWidgets'
import './chaltteok.css'

const METHODS_ID = 'chaltteok-payment-methods'
const AGREEMENT_ID = 'chaltteok-agreement'
const LIMITS_TEXT = `${CHARGE_LIMITS.min.toLocaleString()}원부터 ${CHARGE_LIMITS.max.toLocaleString()}원까지`

/**
 * 찰떡 충전 - the one charge screen behind both entrances:
 * a purchase that came up short (?need=N&returnTo=…) and "찰떡 충전하기".
 * orderId and amount sent to Toss always come from createChargeOrder.
 */
export function ChargePage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { showToast } = useFeedback()
  const authSession = usePrototypeStore((state) => state.authSession)
  const displayName = usePrototypeStore((state) => state.currentUser.displayName)
  const signedIn = authSession.status === 'authenticated'
  const need = Math.max(0, Number(params.get('need')) || 0)
  const returnTo = safePath(params.get('returnTo')) ?? '/account'
  // ?amount= comes back from the fail page's "다시 시도".
  const [initialAmount] = useState(() => {
    const retried = Number(params.get('amount'))
    return isValidChargeAmount(retried) ? retried : pickChargeAmount(need)
  })
  const [choice, setChoice] = useState<number | 'custom'>(
    isChargePreset(initialAmount) ? initialAmount : 'custom',
  )
  const [customInput, setCustomInput] = useState(
    isChargePreset(initialAmount) ? '' : String(initialAmount),
  )
  const amount = choice === 'custom' ? Number(customInput) : choice
  const amountValid = isValidChargeAmount(amount)
  const { balance, customerKey, failed } = useChaltteokBalance(signedIn)
  // Wait for the balance call: in server mode it carries the customerKey.
  const widgetCustomerKey =
    tossClientKey && balance !== null ? (customerKey ?? ANONYMOUS) : undefined
  const { widgets, ready, agreed, error } = useTossPaymentWidgets({
    customerKey: widgetCustomerKey,
    // While a typed amount is out of range the widget keeps a valid one; paying is off anyway.
    amount: amountValid ? amount : CHARGE_LIMITS.min,
    methodsSelector: `#${METHODS_ID}`,
    agreementSelector: `#${AGREEMENT_ID}`,
  })
  const [paying, setPaying] = useState(false)
  const payingRef = useRef(false)

  useEffect(() => {
    if (signedIn) return
    setLoginReturn({
      path: window.location.pathname + window.location.search,
      notice: '로그인하면 찰떡을 충전할 수 있어요.',
    })
    navigate('/auth/login', { replace: true })
  }, [signedIn, navigate])

  if (!signedIn) return null

  const canPay =
    amountValid &&
    !paying &&
    (tossClientKey ? ready && agreed : balance !== null)
  const customError =
    choice === 'custom' && customInput !== '' && !amountValid
      ? `${LIMITS_TEXT} 1원 단위로 충전할 수 있어요.`
      : undefined

  const pay = async () => {
    if (payingRef.current || !amountValid) return
    payingRef.current = true
    setPaying(true)
    try {
      const order = await chaltteokApi.createChargeOrder(amount)
      saveChargeContext({ returnTo, need, orderId: order.orderId, amount: order.amount })
      const origin = window.location.origin

      if (!tossClientKey) {
        // No client key: skip Toss, the success page runs the confirm as usual.
        const query = new URLSearchParams({
          paymentKey: `mock_${order.orderId}`,
          orderId: order.orderId,
          amount: String(order.amount),
        })
        navigate(`/chaltteok/charge/success?${query}`)
        return
      }
      if (!widgets) return
      if (order.amount !== amount) {
        await widgets.setAmount({ currency: 'KRW', value: order.amount })
      }
      // Redirects on PC and mobile alike: success/fail pages take it from here.
      await widgets.requestPayment({
        orderId: order.orderId,
        orderName: order.orderName,
        successUrl: `${origin}/chaltteok/charge/success`,
        failUrl: `${origin}/chaltteok/charge/fail`,
        customerEmail: authSession.email || undefined,
        customerName: displayName,
      })
    } catch (payError) {
      if ((payError as { code?: string }).code !== 'USER_CANCEL') {
        showToast({
          message:
            payError instanceof Error ? payError.message : '결제를 시작하지 못했어요.',
          tone: 'danger',
        })
      }
    } finally {
      payingRef.current = false
      setPaying(false)
    }
  }

  return (
    <AppShell
      surface="base"
      appBar={
        <AppBar
          title="찰떡 충전"
          leading={
            <IconButton
              label="돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate(returnTo)}
            />
          }
          trailing={<MockModeBadge />}
        />
      }
      fixedAction={
        <Button
          variant="brand"
          fullWidth
          loading={paying}
          disabled={!canPay}
          onClick={pay}
        >
          {!amountValid
            ? '충전할 금액을 입력해 주세요'
            : tossClientKey
              ? `${amount.toLocaleString()}원 결제하기`
              : `mock 충전 · ${formatChaltteok(amount)}`}
        </Button>
      }
    >
      <main className="chaltteok-charge">
        <section className="chaltteok-charge__balance">
          <span>보유 찰떡</span>
          <strong>
            {balance !== null
              ? formatChaltteok(balance)
              : failed
                ? '불러오지 못했어요'
                : '확인하는 중…'}
          </strong>
        </section>

        {need > 0 && (
          <p className="chaltteok-charge__need" role="status">
            찰떡이 {need.toLocaleString()}개 부족해요. 충전하면 구매하던 화면으로
            돌아갈 수 있어요.
          </p>
        )}

        <section className="chaltteok-charge__options" aria-label="충전할 찰떡">
          <h2>충전할 찰떡</h2>
          {CHARGE_PRESETS.map((option) => (
            <ChoiceCard
              key={option}
              title={formatChaltteok(option)}
              description={`${option.toLocaleString()}원`}
              selected={choice === option}
              disabled={paying}
              onClick={() => setChoice(option)}
            />
          ))}
          <ChoiceCard
            title="직접 입력"
            description={`${LIMITS_TEXT}, 1원 단위`}
            selected={choice === 'custom'}
            disabled={paying}
            onClick={() => setChoice('custom')}
          />
          {choice === 'custom' && (
            <TextField
              id="chaltteok-custom-amount"
              label="충전할 금액 (원)"
              inputMode="numeric"
              autoComplete="off"
              placeholder={`예: ${(1500).toLocaleString()}`}
              helper={
                amountValid
                  ? `${formatChaltteok(amount)}이 충전돼요.`
                  : `1원 = 1찰떡 · ${LIMITS_TEXT}`
              }
              error={customError}
              value={customInput}
              disabled={paying}
              autoFocus={!customInput}
              onChange={(event) =>
                setCustomInput(event.target.value.replace(/\D/g, '').slice(0, 6))
              }
            />
          )}
        </section>

        {tossClientKey ? (
          <section className="chaltteok-charge__widget" aria-label="결제 수단과 약관">
            <div id={METHODS_ID} />
            <div id={AGREEMENT_ID} />
            {error ? (
              <p className="chaltteok-charge__status" role="alert">
                {error}
              </p>
            ) : (
              !ready && (
                <p className="chaltteok-charge__status">결제 수단을 불러오는 중…</p>
              )
            )}
          </section>
        ) : (
          <p className="chaltteok-charge__status">
            토스 클라이언트 키(VITE_TOSS_CLIENT_KEY)가 없어서 결제위젯 없이 mock으로
            충전해요.
          </p>
        )}
      </main>
    </AppShell>
  )
}
