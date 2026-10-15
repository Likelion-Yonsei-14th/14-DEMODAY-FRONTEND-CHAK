import { CHARGE_LIMITS, CHARGE_PRESETS } from '@/api/chaltteok'

/** 1원 = 1찰떡. */
export function formatChaltteok(amount: number) {
  return `${amount.toLocaleString()}찰떡`
}

/**
 * The amount to start the charge page on: the smallest preset that covers
 * what's missing, or - past the largest preset - the shortage itself
 * (within CHARGE_LIMITS). With nothing missing, the smallest preset.
 */
export function pickChargeAmount(need: number): number {
  const presets = [...CHARGE_PRESETS].sort((a, b) => a - b)
  if (need <= 0) return presets[0]!
  return (
    presets.find((amount) => amount >= need) ??
    Math.min(Math.max(Math.ceil(need), CHARGE_LIMITS.min), CHARGE_LIMITS.max)
  )
}

export function isChargePreset(amount: number) {
  return (CHARGE_PRESETS as readonly number[]).includes(amount)
}
