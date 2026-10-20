import type { NavigateFunction } from 'react-router-dom'
import { setLoginReturn } from '@/features/chaltteok/returnFlow'

/** Opens the login page, which sends the player back to `path` afterwards. */
export function goToLogin(navigate: NavigateFunction, path: string) {
  setLoginReturn({ path, notice: '로그인하면 몰폰 점수가 랭킹에 올라가요.' })
  navigate('/auth/login')
}
