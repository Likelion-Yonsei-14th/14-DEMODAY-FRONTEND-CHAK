import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/client'
import { NotificationProvider } from '@/design-system/overlays'
import { usePrototypeStore } from '@/store/prototypeStore'

const api = vi.hoisted(() => ({ fetchMyDesk: vi.fn() }))
vi.mock('@/api/desks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/desks')>()),
  ...api,
}))
vi.mock('@/api/config', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/config')>()),
  isApiEnabled: true,
}))
vi.mock('@/features/minigame/MiniGameSection', () => ({ MiniGameSection: () => null }))

import { HomePage } from './HomePage'

function renderHome() {
  return render(
    <NotificationProvider>
      <MemoryRouter initialEntries={['/home']}>
        <Routes>
          <Route path="/home" element={<HomePage />} />
          <Route path="/prototype/create" element={<p>책상 만들기 화면</p>} />
          <Route path="/prototype/my/desk" element={<p>내 책상 화면</p>} />
        </Routes>
      </MemoryRouter>
    </NotificationProvider>,
  )
}

describe('home desk door', () => {
  beforeEach(() => {
    api.fetchMyDesk.mockReset()
    usePrototypeStore.setState({
      authSession: { status: 'authenticated', email: 'a@b.com', provider: 'kakao', userId: 7 },
    })
  })

  it('offers to make a desk when the account has none, and starts it in one tap', async () => {
    api.fetchMyDesk.mockRejectedValue(new ApiError(404, { code: 'DESK_NOT_FOUND' }))
    renderHome()

    fireEvent.click(await screen.findByRole('button', { name: /내 책상 만들기/ }))

    expect(screen.getByText('책상 만들기 화면')).toBeInTheDocument()
  })

  it('keeps the desk door for an account that has a desk', async () => {
    api.fetchMyDesk.mockResolvedValue({ id: 1 })
    renderHome()

    fireEvent.click(await screen.findByRole('button', { name: /내 책상 가기/ }))

    expect(screen.getByText('내 책상 화면')).toBeInTheDocument()
  })
})

describe('home desk door while the server has not answered', () => {
  beforeEach(() => {
    api.fetchMyDesk.mockReset()
    usePrototypeStore.setState({
      authSession: { status: 'authenticated', email: 'a@b.com', provider: 'kakao', userId: 7 },
    })
  })

  it('does not show a desk door before knowing whether the account has a desk', () => {
    api.fetchMyDesk.mockReturnValue(new Promise(() => {}))
    renderHome()

    expect(screen.queryByRole('button', { name: /내 책상 가기/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /내 책상 만들기/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /내 책상 확인하는 중/ })).toBeDisabled()
  })

  it('offers a retry, not a desk, when the check fails, and recovers on retry', async () => {
    api.fetchMyDesk.mockRejectedValueOnce(new ApiError(500, { code: 'INTERNAL_ERROR' }))
    renderHome()

    const retry = await screen.findByRole('button', { name: /다시 시도/ })
    expect(screen.queryByRole('button', { name: /내 책상 가기/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /내 책상 만들기/ })).not.toBeInTheDocument()

    api.fetchMyDesk.mockResolvedValue({ id: 1 })
    fireEvent.click(retry)

    expect(await screen.findByRole('button', { name: /내 책상 가기/ })).toBeInTheDocument()
  })
})
