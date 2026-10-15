import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { chaltteokApi, chaltteokMode, readInsufficient } from '@/api/chaltteok'
import { ApiError } from '@/api/client'
import { pickChargeAmount } from '@/features/chaltteok/chaltteok'
import { usePrototypeStore } from '@/store/prototypeStore'

// The mock waits a little to show loading states; skip that in tests.
async function settle<T>(promise: Promise<T>) {
  await vi.runAllTimersAsync()
  return promise
}

async function rejection(promise: Promise<unknown>) {
  const caught = promise.catch((error: unknown) => error)
  await vi.runAllTimersAsync()
  return caught
}

function signInAs(email: string) {
  usePrototypeStore.setState({
    authSession: { status: 'authenticated', email, provider: 'password' },
  })
}

async function charge(amount: number) {
  const order = await settle(chaltteokApi.createChargeOrder(amount))
  return settle(
    chaltteokApi.confirmCharge({ paymentKey: 'test', orderId: order.orderId, amount }),
  )
}

describe('chaltteok mock api', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    signInAs('jisu@example.com')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('runs as the mock unless VITE_CHALTTEOK_API=server', () => {
    expect(chaltteokMode).toBe('mock')
  })

  it('issues a Toss-valid string orderId for an allowed amount', async () => {
    const order = await settle(chaltteokApi.createChargeOrder(3000))

    expect(order.orderId).toMatch(/^[A-Za-z0-9_=-]{6,64}$/)
    expect(order).toMatchObject({ amount: 3000, orderName: '찰떡 3,000개' })
  })

  it('accepts any whole amount from 300 to 50,000', async () => {
    for (const amount of [300, 1234, 50_000]) {
      const order = await settle(chaltteokApi.createChargeOrder(amount))
      expect(order.amount).toBe(amount)
    }
  })

  it('refuses amounts outside 300-50,000 or with fractions', async () => {
    for (const amount of [5, 299, 50_001, 1500.5]) {
      const error = await rejection(chaltteokApi.createChargeOrder(amount))
      expect(error).toBeInstanceOf(ApiError)
      expect((error as ApiError).code).toBe('INVALID_CHARGE_AMOUNT')
    }
  })

  it('credits a charge once, even when the confirm is sent again', async () => {
    const order = await settle(chaltteokApi.createChargeOrder(1000))
    const request = { paymentKey: 'test', orderId: order.orderId, amount: 1000 }

    const first = await settle(chaltteokApi.confirmCharge(request))
    const again = await settle(chaltteokApi.confirmCharge(request))

    expect(first).toEqual({ orderId: order.orderId, chargedAmount: 1000, balance: 1000 })
    expect(again).toEqual(first)
    expect((await settle(chaltteokApi.getBalance())).balance).toBe(1000)
  })

  it('rejects a confirm whose amount differs from the order', async () => {
    const order = await settle(chaltteokApi.createChargeOrder(1000))
    const error = await rejection(
      chaltteokApi.confirmCharge({ paymentKey: 'test', orderId: order.orderId, amount: 5000 }),
    )

    expect((error as ApiError).code).toBe('AMOUNT_MISMATCH')
    expect((await settle(chaltteokApi.getBalance())).balance).toBe(0)
  })

  it('deducts a purchase at server prices and returns a paid order id', async () => {
    await charge(1000)

    const result = await settle(
      chaltteokApi.purchase([{ code: 'CHARM_ACRYLIC' }, { code: 'GEM', quantity: 4 }]),
    )

    expect(result).toMatchObject({ spent: 70, balance: 930 })
    expect(result.orderId).toEqual(expect.any(Number))
  })

  it('refuses a purchase the balance cannot cover, like the real API', async () => {
    const error = await rejection(chaltteokApi.purchase([{ code: 'PENNANT' }]))

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(402)
    expect(readInsufficient(error)).toEqual({ required: 150, balance: 0 })
  })

  it('keeps a separate balance per signed-in user', async () => {
    await charge(1000)
    signInAs('minjun@example.com')

    expect((await settle(chaltteokApi.getBalance())).balance).toBe(0)
  })

  it('does not let guests use 찰떡', async () => {
    usePrototypeStore.setState({ authSession: { status: 'anonymous' } })

    const error = await rejection(chaltteokApi.getBalance())

    expect((error as ApiError).code).toBe('LOGIN_REQUIRED')
  })
})

describe('pickChargeAmount', () => {
  it('preselects the smallest option that covers the shortage', () => {
    expect(pickChargeAmount(0)).toBe(1000)
    expect(pickChargeAmount(70)).toBe(1000)
    expect(pickChargeAmount(1001)).toBe(3000)
    expect(pickChargeAmount(5000)).toBe(5000)
  })

  it('starts on the shortage itself past the largest preset, within the limits', () => {
    expect(pickChargeAmount(9000)).toBe(9000)
    expect(pickChargeAmount(80_000)).toBe(50_000)
  })
})
