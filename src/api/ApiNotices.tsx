import { useEffect } from 'react'
import { useFeedback } from '@/design-system/overlays'
import { subscribeApiNotices } from '@/api/notify'

export function ApiNotices() {
  const { showToast } = useFeedback()
  useEffect(() => subscribeApiNotices(showToast), [showToast])
  return null
}
