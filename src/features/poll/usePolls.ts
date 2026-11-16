import { useCallback, useEffect, useState } from 'react'
import { isApiEnabled } from '@/api/config'
import { fetchPolls, type Poll } from '@/api/polls'

/** 수능 여론 목록. 한 질문의 결과가 바뀌면(투표) 그 질문만 바꿔 끼운다. */
export function usePolls() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>(isApiEnabled ? 'loading' : 'failed')

  const load = useCallback(() => {
    if (!isApiEnabled) return () => undefined
    let cancelled = false
    setState('loading')
    fetchPolls()
      .then((list) => {
        if (cancelled) return
        setPolls(list.polls)
        setState('ready')
      })
      .catch(() => {
        if (!cancelled) setState('failed')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => load(), [load])

  const replace = useCallback((next: Poll) => {
    setPolls((current) => current.map((poll) => (poll.id === next.id ? next : poll)))
  }, [])

  return { polls, state, replace, reload: load }
}
