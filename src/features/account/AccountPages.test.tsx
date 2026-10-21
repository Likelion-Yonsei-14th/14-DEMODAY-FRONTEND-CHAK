import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { NotificationProvider } from '@/design-system/overlays'
import { usePrototypeStore } from '@/store/prototypeStore'
import { AccountPage } from './AccountPages'

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
})
