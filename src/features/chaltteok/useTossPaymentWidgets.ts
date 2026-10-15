import { useEffect, useRef, useState } from 'react'
import {
  loadTossPayments,
  type TossPaymentsWidgets,
} from '@tosspayments/tosspayments-sdk'

/** 결제위젯(주문서형) client key - test_gck_… / live_gck_…. Empty = mock charge button. */
export const tossClientKey =
  (import.meta.env.VITE_TOSS_CLIENT_KEY as string | undefined) ?? ''

type Options = {
  customerKey: string | undefined
  amount: number
  methodsSelector: string
  agreementSelector: string
}

/**
 * Loads the Toss 결제위젯 and renders the payment-method and agreement UIs.
 * `ready` turns true only after both have rendered; `agreed` follows the
 * required terms. Renders are chained so StrictMode's mount-unmount-mount
 * never draws twice into the same element.
 */
export function useTossPaymentWidgets({
  customerKey,
  amount,
  methodsSelector,
  agreementSelector,
}: Options) {
  const [widgets, setWidgets] = useState<TossPaymentsWidgets | null>(null)
  const [ready, setReady] = useState(false)
  // The widget only reports changes; requestPayment still refuses unagreed terms.
  const [agreed, setAgreed] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const renderChain = useRef<Promise<unknown>>(Promise.resolve())
  const amountRef = useRef(amount)

  useEffect(() => {
    amountRef.current = amount
  }, [amount])

  useEffect(() => {
    if (!tossClientKey || !customerKey) return
    let cancelled = false
    loadTossPayments(tossClientKey)
      .then((tossPayments) => {
        if (!cancelled) setWidgets(tossPayments.widgets({ customerKey }))
      })
      .catch(() => {
        if (!cancelled) setError('결제 화면을 불러오지 못했어요.')
      })
    return () => {
      cancelled = true
    }
  }, [customerKey])

  useEffect(() => {
    if (!widgets) return
    let cancelled = false
    let rendered: { destroy: () => unknown }[] = []

    renderChain.current = renderChain.current
      .then(async () => {
        if (cancelled) return
        await widgets.setAmount({ currency: 'KRW', value: amountRef.current })
        const [methods, agreement] = await Promise.all([
          widgets.renderPaymentMethods({ selector: methodsSelector, variantKey: 'DEFAULT' }),
          widgets.renderAgreement({ selector: agreementSelector, variantKey: 'AGREEMENT' }),
        ])
        rendered = [methods, agreement]
        if (cancelled) {
          await Promise.all(rendered.map((widget) => widget.destroy()))
          return
        }
        agreement.on('agreementStatusChange', (status) =>
          setAgreed(status.agreedRequiredTerms),
        )
        setReady(true)
      })
      .catch(() => {
        if (!cancelled) setError('결제 화면을 불러오지 못했어요. 새로고침해 주세요.')
      })

    return () => {
      cancelled = true
      setReady(false)
      const toDestroy = rendered
      rendered = []
      renderChain.current = renderChain.current
        .then(() => Promise.all(toDestroy.map((widget) => widget.destroy())))
        .catch(() => undefined)
    }
  }, [widgets, methodsSelector, agreementSelector])

  // Changing the option after render only updates the amount.
  useEffect(() => {
    if (widgets && ready) void widgets.setAmount({ currency: 'KRW', value: amount })
  }, [widgets, ready, amount])

  return { widgets, ready, agreed, error }
}
