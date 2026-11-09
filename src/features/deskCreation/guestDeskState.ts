import { useNavigate } from 'react-router-dom'
import { setLoginReturn } from '@/features/chaltteok/returnFlow'
import { usePrototypeStore } from '@/store/prototypeStore'

/** Query flag on the last creation step: save the kept draft as soon as the page opens signed in. */
export const SAVE_AFTER_LOGIN = 'save'

/** True while the visitor is looking at a desk they made as a guest. */
export function useIsGuestDesk() {
  return usePrototypeStore(
    (state) =>
      state.guestDeskPending && state.authSession.status !== 'authenticated',
  )
}

/** Log in, then come back and save the desk with the settings already chosen. */
export function useLoginToSaveGuestDesk() {
  const navigate = useNavigate()
  return () => {
    setLoginReturn({
      path: `/create/read-mode?${SAVE_AFTER_LOGIN}=1`,
      notice: '로그인하면 만든 책상을 저장하고 링크로 공유할 수 있어요.',
    })
    navigate('/auth/login')
  }
}
