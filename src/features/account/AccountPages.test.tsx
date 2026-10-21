import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { NotificationProvider } from '@/design-system/overlays'
import { usePrototypeStore } from '@/store/prototypeStore'
import { AccountPage, DeleteAccountPage } from './AccountPages'

afterEach(() => {
  act(() => usePrototypeStore.getState().signOut())
})

describe('account page', () => {
  it('lands on the front door after logging out, not on the login screen', async () => {
    act(() => usePrototypeStore.getState().signIn('jisu@gmail.com', 'google'))
    render(
      <NotificationProvider>
        <MemoryRouter initialEntries={['/account']}>
          <Routes>
            <Route path="/account" element={<AccountPage />} />
            <Route path="/" element={<p>첫 화면</p>} />
            <Route path="/auth/login" element={<p>로그인 화면</p>} />
          </Routes>
        </MemoryRouter>
      </NotificationProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: /로그아웃/ }))

    expect(await screen.findByText('첫 화면')).toBeInTheDocument()
    expect(screen.queryByText('로그인 화면')).not.toBeInTheDocument()
    expect(usePrototypeStore.getState().authSession.status).not.toBe('authenticated')
  })
  it('asks for account deletion by email, as the privacy policy says, without signing out', () => {
    act(() => usePrototypeStore.getState().signIn('jisu@gmail.com', 'google'))
    render(
      <NotificationProvider>
        <MemoryRouter initialEntries={['/account/delete']}>
          <Routes>
            <Route path="/account/delete" element={<DeleteAccountPage />} />
            <Route path="/account" element={<p>내 계정</p>} />
          </Routes>
        </MemoryRouter>
      </NotificationProvider>,
    )

    expect(screen.getByRole('heading', { name: /이메일로 요청해 주세요/ })).toBeInTheDocument()
    expect(screen.getByText('chak.live.team@gmail.com')).toBeInTheDocument()
    expect(screen.getByText('Google 로그인 · jisu@gmail.com')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '개인정보처리방침' })).toHaveAttribute('href', '/privacy')
    // Nothing here pretends to delete the account.
    expect(screen.queryByRole('button', { name: '탈퇴하기' })).not.toBeInTheDocument()
    expect(usePrototypeStore.getState().authSession.status).toBe('authenticated')

    fireEvent.click(screen.getAllByRole('button', { name: /내 계정으로 돌아가기/ })[0]!)
    expect(screen.getByText('내 계정')).toBeInTheDocument()
  })
})
