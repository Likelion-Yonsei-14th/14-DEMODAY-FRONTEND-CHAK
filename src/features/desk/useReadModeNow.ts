import { useEffect, useMemo, useState } from 'react'
import type { ReadMode } from '@/types'
import { resolveReadModeNow } from './dailyAvailability'

const CLOCK_TICK_MS = 15_000

export function useReadModeNow(
  mode: ReadMode,
  search: string,
) {
  const [baseNow, setBaseNow] = useState(() => new Date())

  useEffect(() => {
    setBaseNow(new Date())

    const timer = window.setInterval(
      () => setBaseNow(new Date()),
      CLOCK_TICK_MS,
    )

    return () => window.clearInterval(timer)
  }, [])

  return useMemo(
    () => resolveReadModeNow(mode, search, baseNow),
    [baseNow, mode, search],
  )
}
