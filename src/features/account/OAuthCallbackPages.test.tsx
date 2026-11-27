import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/client'
import { setLoginReturn } from '@/features/chaltteok/returnFlow'
import { usePrototypeStore } from '@/store/prototypeStore'

const api = vi.hoisted(() => ({ loginWithKakao: vi.fn(), fetchMyDesk: vi.fn() }))
vi.mock('@/api/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/auth')>()),
  loginWithKakao: api.loginWithKakao,
}))
vi.mock('@/api/desks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/desks')>()),
  fetchMyDesk: api.fetchMyDesk,
}))

import { KakaoCallbackPage } from './OAuthCallbackPages'

const tokens = {
  accessToken: 'token',
  user: { id: 7, email: 'new@example.com', displayName: '새내기', provider: 'KAKAO' },
}

function renderCallback(url = '/auth/kakao/callback?code=abc&state=st-1') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/auth/kakao/callback" element={<KakaoCallbackPage />} />
        <Route path="/home" element={<p>홈 화면</p>} />
        <Route path="/start" element={<p>시작 화면</p>} />
        <Route path="/desk/:token/charm" element={<p>부적 화면</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('OAuth callback landing', () => {
  beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset())
    sessionStorage.clear()
    sessionStorage.setItem('chak.kakao.state', 'st-1')
    usePrototypeStore.setState({ authSession: { status: 'anonymous' } })
    api.loginWithKakao.mockResolvedValue(tokens)
  })

  it('sends a member without a desk to start making one', async () => {
    api.fetchMyDesk.mockRejectedValue(new ApiError(404, { code: 'DESK_NOT_FOUND' }))
    renderCallback()

    expect(await screen.findByText('시작 화면')).toBeInTheDocument()
  })

  it('sends a member who has a desk home', async () => {
    api.fetchMyDesk.mockResolvedValue({ id: 1 })
    renderCallback()

    expect(await screen.findByText('홈 화면')).toBeInTheDocument()
  })

  it('goes home when the desk check fails for another reason', async () => {
    api.fetchMyDesk.mockRejectedValue(new Error('offline'))
    renderCallback()

    expect(await screen.findByText('홈 화면')).toBeInTheDocument()
  })

  it('returns to where the login started, without checking the desk', async () => {
    setLoginReturn({ path: '/desk/tok/charm', notice: '로그인하면 찰떡으로 구매할 수 있어요.' })
    renderCallback()

    expect(await screen.findByText('부적 화면')).toBeInTheDocument()
    expect(api.fetchMyDesk).not.toHaveBeenCalled()
  })

  it('refuses a callback when this tab never stored a state (login CSRF)', async () => {
    sessionStorage.clear()
    renderCallback()

    expect(await screen.findByText('로그인 요청을 확인할 수 없어요. 다시 시도해주세요.')).toBeInTheDocument()
    expect(api.loginWithKakao).not.toHaveBeenCalled()
  })

  it('refuses a callback without a state parameter', async () => {
    renderCallback('/auth/kakao/callback?code=abc')

    expect(await screen.findByText('로그인 요청을 확인할 수 없어요. 다시 시도해주세요.')).toBeInTheDocument()
    expect(api.loginWithKakao).not.toHaveBeenCalled()
  })

  it('refuses a callback whose state does not match', async () => {
    renderCallback('/auth/kakao/callback?code=abc&state=other')

    expect(await screen.findByText('로그인 요청을 확인할 수 없어요. 다시 시도해주세요.')).toBeInTheDocument()
    expect(api.loginWithKakao).not.toHaveBeenCalled()
  })

  it('accepts the state from the cookie fallback when sessionStorage was unavailable', async () => {
    sessionStorage.clear()
    document.cookie = 'chak_kakao_state=st-1; Path=/'
    api.fetchMyDesk.mockResolvedValue({ id: 1 })
    renderCallback()

    expect(await screen.findByText('홈 화면')).toBeInTheDocument()
    expect(document.cookie).not.toContain('chak_kakao_state=st-1')
  })
})
