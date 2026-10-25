import { ApiError, apiFetch } from '@/api/client'
import type { ApiProductCode } from '@/api/types'
import { usePrototypeStore } from '@/store/prototypeStore'

/**
 * Every 찰떡 call the screens make goes through `chaltteokApi`.
 *
 * VITE_CHALTTEOK_API=server talks to the backend; anything else (the
 * default) runs the mock below on localStorage with the same shapes and
 * error codes, so switching needs no screen changes. Paths are proposals
 * in the backend spec - change them here only.
 */
export const chaltteokMode: 'mock' | 'server' =
  import.meta.env.VITE_CHALTTEOK_API === 'server' ? 'server' : 'mock'

const PATHS = {
  charges: '/api/chaltteok/charges',
  confirm: '/api/chaltteok/charges/confirm',
  balance: '/api/chaltteok/balance',
  purchases: '/api/chaltteok/purchases',
} as const

export type ChargeOrder = { orderId: string; amount: number; orderName: string }

export type ChargeConfirmRequest = {
  paymentKey: string
  orderId: string
  amount: number
}

export type ChargeResult = {
  orderId: string
  chargedAmount: number
  balance: number
}

export type ChaltteokBalance = {
  balance: number
  /** [제안] The buyer's Toss customerKey, needed before the widget renders. */
  customerKey?: string
}

export type PurchaseItem = {
  code: ApiProductCode
  ref?: string | null
  quantity?: number
}

export type PurchaseResult = {
  spent: number
  balance: number
  /**
   * [제안] A paid order the message send can attach as paymentOrderId.
   * If the backend drops this, only this file and the send code change.
   */
  orderId?: number
}

type ChaltteokApi = {
  createChargeOrder: (amount: number) => Promise<ChargeOrder>
  confirmCharge: (request: ChargeConfirmRequest) => Promise<ChargeResult>
  getBalance: () => Promise<ChaltteokBalance>
  purchase: (items: PurchaseItem[]) => Promise<PurchaseResult>
}

const serverApi: ChaltteokApi = {
  createChargeOrder: (amount) =>
    apiFetch<ChargeOrder>(PATHS.charges, { method: 'POST', body: { amount } }),
  confirmCharge: (request) =>
    apiFetch<ChargeResult>(PATHS.confirm, { method: 'POST', body: request }),
  getBalance: () => apiFetch<ChaltteokBalance>(PATHS.balance),
  purchase: (items) =>
    apiFetch<PurchaseResult>(PATHS.purchases, {
      method: 'POST',
      body: {
        items: items.map((item) => ({
          code: item.code,
          ref: item.ref ?? null,
          quantity: item.quantity ?? 1,
        })),
      },
    }),
}

/** Quick-pick buttons on the charge page; any whole amount in CHARGE_LIMITS can be typed too. */
export const CHARGE_PRESETS = [1000, 3000, 5000] as const

/**
 * 300원 is the lowest amount every widget method accepts (card 100, transfer
 * 200, phone 300). The backend enforces the same range.
 */
export const CHARGE_LIMITS = { min: 300, max: 50_000 } as const

export function isValidChargeAmount(amount: number) {
  return (
    Number.isInteger(amount) &&
    amount >= CHARGE_LIMITS.min &&
    amount <= CHARGE_LIMITS.max
  )
}

// ---------- mock (localStorage) ----------

// Mirrors the backend's ProductCode unit prices (the server is the source of truth).
const MOCK_UNIT_PRICES: Record<ApiProductCode, number> = {
  CHARM_ACRYLIC: 50,
  GEM: 5,
  UNIVERSITY_CHARM: 150,
  PENNANT: 150,
  LOCKER_BULB: 200,
  LOCKER_PAINT: 200,
}

const MOCK_KEY = 'chaltteok:mock'

type MockState = {
  wallets: Record<string, { balance: number; customerKey: string }>
  orders: Record<
    string,
    { user: string; amount: number; status: 'READY' | 'DONE'; result?: ChargeResult }
  >
  nextPurchaseId: number
}

function loadMock(): MockState {
  try {
    const raw = localStorage.getItem(MOCK_KEY)
    if (raw) return JSON.parse(raw) as MockState
  } catch {
    // Unreadable storage starts the mock from scratch.
  }
  return { wallets: {}, orders: {}, nextPurchaseId: 1 }
}

function saveMock(state: MockState) {
  try {
    localStorage.setItem(MOCK_KEY, JSON.stringify(state))
  } catch {
    // Private mode: the mock balance just won't survive a reload.
  }
}

function mockUser() {
  const session = usePrototypeStore.getState().authSession
  if (session.status !== 'authenticated') {
    throw new ApiError(401, { code: 'LOGIN_REQUIRED', message: '로그인이 필요해요.' })
  }
  return session.userId ? `user-${session.userId}` : session.email
}

function mockWallet(state: MockState, user: string) {
  const wallet = state.wallets[user] ?? { balance: 0, customerKey: crypto.randomUUID() }
  state.wallets[user] = wallet
  return wallet
}

// A short wait so loading states show up in mock mode too.
const mockDelay = () => new Promise((resolve) => setTimeout(resolve, 300))

const mockApi: ChaltteokApi = {
  async createChargeOrder(amount) {
    await mockDelay()
    const user = mockUser()
    if (!isValidChargeAmount(amount)) {
      throw new ApiError(400, {
        code: 'INVALID_CHARGE_AMOUNT',
        message: '충전할 수 없는 금액이에요.',
      })
    }
    const state = loadMock()
    // Toss orderId: 6-64 chars of [A-Za-z0-9-_=]. In server mode the backend issues it.
    const orderId = `chg_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`
    state.orders[orderId] = { user, amount, status: 'READY' }
    saveMock(state)
    return { orderId, amount, orderName: `찰떡 ${amount.toLocaleString()}개` }
  },

  async confirmCharge({ orderId, amount }) {
    await mockDelay()
    const user = mockUser()
    const state = loadMock()
    const order = state.orders[orderId]
    if (!order || order.user !== user) {
      throw new ApiError(404, { code: 'ORDER_NOT_FOUND', message: '주문을 찾을 수 없어요.' })
    }
    if (order.amount !== amount) {
      throw new ApiError(400, {
        code: 'AMOUNT_MISMATCH',
        message: '결제 금액이 주문과 달라요.',
      })
    }
    // Same as the backend: a confirmed order answers with its first result.
    if (order.status === 'DONE' && order.result) return order.result

    const wallet = mockWallet(state, user)
    wallet.balance += amount
    order.status = 'DONE'
    order.result = { orderId, chargedAmount: amount, balance: wallet.balance }
    saveMock(state)
    return order.result
  },

  async getBalance() {
    await mockDelay()
    const user = mockUser()
    const state = loadMock()
    const wallet = mockWallet(state, user)
    saveMock(state)
    return { balance: wallet.balance, customerKey: wallet.customerKey }
  },

  async purchase(items) {
    await mockDelay()
    const user = mockUser()
    const state = loadMock()
    const wallet = mockWallet(state, user)
    const required = items.reduce(
      (sum, item) => sum + MOCK_UNIT_PRICES[item.code] * (item.quantity ?? 1),
      0,
    )
    if (wallet.balance < required) {
      throw new ApiError(402, {
        code: 'INSUFFICIENT_CHALTTEOK',
        message: '찰떡이 부족해요.',
        required,
        balance: wallet.balance,
      })
    }
    wallet.balance -= required
    const orderId = state.nextPurchaseId++
    saveMock(state)
    return { spent: required, balance: wallet.balance, orderId }
  },
}

/**
 * 운영 빌드가 서버 결제 없이 배포되면 mock으로 떨어지지 않고 모두 거절한다.
 * mock 충전·구매가 사용자에게 보이면 브라우저 안에서 공짜로 찰떡을 채우게 된다.
 */
const unavailable = () =>
  Promise.reject(
    new ApiError(503, { code: 'PAYMENT_NOT_CONFIGURED', message: '찰떡 결제는 아직 개발 중이에요.' }),
  )
const blockedApi: ChaltteokApi = {
  createChargeOrder: unavailable,
  confirmCharge: unavailable,
  getBalance: unavailable,
  purchase: unavailable,
}

export const chaltteokApi: ChaltteokApi =
  chaltteokMode === 'server' ? serverApi : import.meta.env.PROD ? blockedApi : mockApi

/** `{ required, balance }` when the error is a 402 INSUFFICIENT_CHALTTEOK. */
export function readInsufficient(error: unknown) {
  if (!(error instanceof ApiError) || error.code !== 'INSUFFICIENT_CHALTTEOK') return null
  const { required, balance } = error.body
  return typeof required === 'number' && typeof balance === 'number'
    ? { required, balance }
    : null
}
