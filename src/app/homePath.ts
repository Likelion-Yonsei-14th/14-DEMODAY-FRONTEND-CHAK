import { usePrototypeStore } from '@/store/prototypeStore'

/**
 * Where a "go home" button should land: the two-door /home once signed in,
 * the welcome screen (/) before that. /start is the "make a desk or class"
 * landing, not home.
 */
export function useHomePath() {
  return usePrototypeStore((state) =>
    state.authSession.status === 'authenticated' ? '/home' : '/',
  )
}
