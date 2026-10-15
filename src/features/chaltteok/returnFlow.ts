import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import type { ChargeResult } from '@/api/chaltteok'

/*
 * Leaving a product screen for the charge page or the login page reloads
 * it on the way back, so the screen's picks (gems, paint, charm shape...)
 * are parked in sessionStorage keyed by its path and handed back once.
 */

const RESUME_KEY = 'chaltteok:resume'
const LOGIN_RETURN_KEY = 'chak:login-return'
const CHARGE_CONTEXT_KEY = 'chaltteok:charge'
const CHARGE_RESULT_PREFIX = 'chaltteok:charge-result:'
// A round trip that takes longer than this is treated as abandoned.
const RESUME_TTL_MS = 30 * 60 * 1000

type ResumeRecord = {
  path: string
  state: unknown
  savedAt: number
  /** Set by the charge success page: how many 찰떡 were just added. */
  charged?: number
}

export type LoginReturn = { path: string; notice?: string }

export type ChargeContext = {
  /** Where "돌아가기" goes after charging. */
  returnTo: string
  /** Came from a purchase that was short by this much (루트 1). */
  need: number
  orderId?: string
  amount?: number
}

function read<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) sessionStorage.removeItem(key)
    else sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage off (private mode): the round trip just won't restore picks.
  }
}

/** Only same-app paths, so a crafted ?returnTo= can't send people elsewhere. */
export function safePath(path: string | null | undefined) {
  return path && path.startsWith('/') && !path.startsWith('//') ? path : null
}

function readResume(path: string) {
  const record = read<ResumeRecord>(RESUME_KEY)
  if (!record || record.path !== path) return null
  if (Date.now() - record.savedAt > RESUME_TTL_MS) return null
  return record
}

export function saveResume(path: string, state: unknown) {
  write(RESUME_KEY, { path, state, savedAt: Date.now() } satisfies ResumeRecord)
}

export function markResumeCharged(path: string, charged: number) {
  const record = readResume(path)
  if (record) write(RESUME_KEY, { ...record, charged })
}

/** "N찰떡 충전 완료" for this path, once. */
export function takeChargedNotice(path: string) {
  const record = readResume(path)
  if (!record?.charged) return null
  write(RESUME_KEY, { ...record, charged: undefined })
  return record.charged
}

/**
 * The picks this screen saved before leaving, or undefined. Read during
 * the first render (so useState can start from them) and cleared after.
 */
export function useResumeState<T>(): T | undefined {
  const location = useLocation()
  const path = location.pathname + location.search
  const [resumed] = useState(() => readResume(path)?.state as T | undefined)

  useEffect(() => {
    // The charged notice is read by PaymentSheet (a child, so its effect runs first).
    if (resumed !== undefined && readResume(path)) write(RESUME_KEY, null)
  }, [path, resumed])

  return resumed
}

export function setLoginReturn(value: LoginReturn) {
  write(LOGIN_RETURN_KEY, value)
}

export function peekLoginReturn() {
  return read<LoginReturn>(LOGIN_RETURN_KEY)
}

export function clearLoginReturn() {
  write(LOGIN_RETURN_KEY, null)
}

/** Where to go after logging in (and forget it). */
export function takeLoginReturn() {
  const value = read<LoginReturn>(LOGIN_RETURN_KEY)
  write(LOGIN_RETURN_KEY, null)
  return safePath(value?.path)
}

export function saveChargeContext(context: ChargeContext) {
  write(CHARGE_CONTEXT_KEY, context)
}

export function readChargeContext() {
  return read<ChargeContext>(CHARGE_CONTEXT_KEY)
}

export function readChargeResult(orderId: string) {
  return read<ChargeResult>(CHARGE_RESULT_PREFIX + orderId)
}

export function saveChargeResult(result: ChargeResult) {
  write(CHARGE_RESULT_PREFIX + result.orderId, result)
}
