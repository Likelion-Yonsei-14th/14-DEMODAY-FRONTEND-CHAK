import type { ReactNode } from 'react'
import { ComingSoonPage } from '@/features/common/ComingSoon'
import { isRollingPaperAvailable } from '@/lib/featureFlags'

/**
 * Rolling paper pages in production: open once VITE_ROLLING_PAPER=on, or in a
 * browser that turned on test mode (chak.live/prototype or a ?prototype=1 link).
 * Checked on every visit, so test mode needs no new build.
 */
export function RollingPaperGate({ children }: { children: ReactNode }) {
  if (isRollingPaperAvailable()) return <>{children}</>
  return (
    <ComingSoonPage
      title="연말 롤링페이퍼"
      description="곧 열릴 예정이에요. 지금은 응원 책상을 이용해 주세요."
    />
  )
}
