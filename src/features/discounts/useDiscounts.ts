import { useEffect, useState } from 'react'
import { isApiEnabled } from '@/api/config'
import { fetchDiscounts } from '@/api/discounts'
import { DISCOUNTS, DISCOUNTS_UPDATED, type Discount } from './discountData'

type Loaded = { updated: string; items: readonly Discount[] }

const BUNDLED: Loaded = { updated: DISCOUNTS_UPDATED, items: DISCOUNTS }

/**
 * 혜택 목록. 운영자가 어드민에서 고친 서버 목록을 받는다.
 * 서버 없이 띄운 개발 화면이나, 목록을 받지 못했을 때는 앱에 묶인 목록을 쓴다.
 */
export function useDiscounts(): Loaded | null {
  const [loaded, setLoaded] = useState<Loaded | null>(isApiEnabled ? null : BUNDLED)
  useEffect(() => {
    if (!isApiEnabled) return
    let cancelled = false
    fetchDiscounts()
      .then(({ updated, items }) => {
        if (!cancelled) setLoaded({ updated: updated ?? DISCOUNTS_UPDATED, items })
      })
      .catch(() => {
        if (!cancelled) setLoaded(BUNDLED)
      })
    return () => {
      cancelled = true
    }
  }, [])
  return loaded
}
