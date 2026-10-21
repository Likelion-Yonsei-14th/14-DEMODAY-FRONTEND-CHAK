/**
 * Seeded randomness. A key such as `${seed}:growth:g3-06p:math` is hashed
 * (FNV-1a) into the starting state of an xorshift32 stream, so every draw is
 * reproducible and each kind of draw has its own independent stream.
 */

export function hashKey(key: string) {
  let hash = 2166136261
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0 || 1
}

export type RandomStream = {
  /** Uniform in [0, 1). */
  next: () => number
  /** Uniform in [min, max). */
  between: (min: number, max: number) => number
  /** Integer in [min, max], both ends included. */
  int: (min: number, max: number) => number
  /** Roughly normal with mean 0 and standard deviation 1 (sum of uniforms). */
  normal: () => number
  /** True with the given probability. */
  chance: (probability: number) => boolean
  weighted: <T>(items: readonly T[], weight: (item: T) => number) => T
}

export function streamFor(key: string): RandomStream {
  let state = hashKey(key)
  const next = () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    state >>>= 0
    if (state === 0) state = 1
    return state / 4294967296
  }

  return {
    next,
    between: (min, max) => min + next() * (max - min),
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    normal: () => {
      // Irwin-Hall with 4 terms: mean 2, variance 1/3 → rescaled to N(0, 1)-ish.
      const sum = next() + next() + next() + next()
      return (sum - 2) * Math.sqrt(3)
    },
    chance: (probability) => next() < Math.max(0, Math.min(1, probability)),
    weighted: (items, weight) => {
      const total = items.reduce((sum, item) => sum + Math.max(0, weight(item)), 0)
      let roll = next() * total
      for (const item of items) {
        roll -= Math.max(0, weight(item))
        if (roll < 0) return item
      }
      return items[items.length - 1]!
    },
  }
}

/** A fresh career seed. The only place the simulator touches Math.random. */
export function createCareerSeed() {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `career-${Date.now().toString(36)}-${random}`
}
