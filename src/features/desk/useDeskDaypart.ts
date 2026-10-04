import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

export type DeskDaypart = 'day' | 'night'

/** Day 06:00–18:59, night 19:00–05:59 in the viewer's local time. */
export function resolveDeskDaypart(now = new Date()): DeskDaypart {
  const hour = now.getHours()
  return hour >= 6 && hour < 19 ? 'day' : 'night'
}

/**
 * Follows the real clock (re-checked every minute). `?scene=day|night`
 * forces one version for demos and previews.
 */
export function useDeskDaypart(): DeskDaypart {
  const { search } = useLocation()
  const forced = new URLSearchParams(search).get('scene')
  const [daypart, setDaypart] = useState<DeskDaypart>(() =>
    resolveDeskDaypart(),
  )

  useEffect(() => {
    const timer = window.setInterval(
      () => setDaypart(resolveDeskDaypart()),
      60_000,
    )
    return () => window.clearInterval(timer)
  }, [])

  return forced === 'day' || forced === 'night' ? forced : daypart
}
