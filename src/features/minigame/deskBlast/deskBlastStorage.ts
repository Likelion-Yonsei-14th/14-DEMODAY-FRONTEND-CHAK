const BEST_KEY = 'chak:desk-blast:best'
const BEST_VERSION = 1
const HINT_KEY = 'chak:desk-blast:hint-seen'

export function loadBestScore(): number {
  try {
    const raw = window.localStorage.getItem(BEST_KEY)
    if (!raw) return 0
    const value = JSON.parse(raw) as { version?: unknown; best?: unknown }
    if (value?.version !== BEST_VERSION) return 0
    const best = value.best
    return typeof best === 'number' && Number.isInteger(best) && best >= 0 ? best : 0
  } catch {
    return 0
  }
}

/** Saves `score` when it beats the stored best; returns whether it did. */
export function saveBestScore(score: number): boolean {
  if (!Number.isInteger(score) || score <= loadBestScore()) return false
  try {
    window.localStorage.setItem(BEST_KEY, JSON.stringify({ version: BEST_VERSION, best: score }))
  } catch {
    // Storage unavailable: the record just isn't kept.
  }
  return true
}

export function hasSeenHint(): boolean {
  try {
    return window.localStorage.getItem(HINT_KEY) === '1'
  } catch {
    return false
  }
}

export function markHintSeen() {
  try {
    window.localStorage.setItem(HINT_KEY, '1')
  } catch {
    // Seen again next time; harmless.
  }
}
