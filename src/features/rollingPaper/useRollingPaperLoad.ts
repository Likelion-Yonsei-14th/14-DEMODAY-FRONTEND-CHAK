import { useEffect, useState } from 'react'
import { ApiError } from '@/api/client'
import { isApiEnabled } from '@/api/config'
import { loadRollingPaper, loadRollingPaperClass } from './rollingPaperActions'

export type RollingPaperLoadStatus = 'loading' | 'ready' | 'missing' | 'error'

/**
 * With a backend, fetches the class (and optionally one paper) for this page.
 * Without one, the store already holds everything and this is ready at once.
 */
export function useRollingPaperLoad(code: string | undefined, paperLockerId?: string) {
  const [result, setResult] = useState<{ key: string; status: RollingPaperLoadStatus } | null>(null)
  const [attempt, setAttempt] = useState(0)
  const key = `${code ?? ''}/${paperLockerId ?? ''}/${attempt}`

  useEffect(() => {
    if (!isApiEnabled || !code) return
    let cancelled = false
    const load = async () => {
      await loadRollingPaperClass(code)
      if (paperLockerId) await loadRollingPaper(code, paperLockerId)
    }
    load().then(
      () => {
        if (!cancelled) setResult({ key, status: 'ready' })
      },
      (error: unknown) => {
        if (cancelled) return
        const missing =
          error instanceof ApiError &&
          (error.code === 'ROLLING_PAPER_NOT_FOUND' ||
            error.code === 'ROLLING_PAPER_MEMBER_NOT_FOUND')
        setResult({ key, status: missing ? 'missing' : 'error' })
      },
    )
    return () => {
      cancelled = true
    }
  }, [code, paperLockerId, key])

  const status: RollingPaperLoadStatus = !isApiEnabled
    ? 'ready'
    : result?.key === key
      ? result.status
      : 'loading'

  return { status, retry: () => setAttempt((count) => count + 1) }
}
