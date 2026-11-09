import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationProvider } from '@/design-system/overlays'
import { peekLoginReturn, clearLoginReturn } from '@/features/chaltteok/returnFlow'
import { usePrototypeStore } from '@/store/prototypeStore'

const api = vi.hoisted(() => ({ createFriendDesk: vi.fn(), createMyDesk: vi.fn() }))
vi.mock('@/api/desks', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/api/desks')>()), ...api }))
vi.mock('@/api/config', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/api/config')>()), isApiEnabled: true }))

import { DeskCreateCompletePage, DeskCreateReadModePage } from './DeskCreationPages'
import { OwnerDeskGate } from '@/api/DeskGates'

function renderAt(path: string) {
  return render(
    <NotificationProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/create/read-mode" element={<DeskCreateReadModePage />} />
          <Route path="/create/complete" element={<DeskCreateCompletePage />} />
          <Route path="/auth/login" element={<p>로그인 화면</p>} />
          <Route element={<OwnerDeskGate />}>
            <Route path="/my/desk" element={<p>내 책상 화면</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </NotificationProvider>,
  )
}

describe('a guest making a desk', () => {
  beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset())
    clearLoginReturn()
    usePrototypeStore.setState({ authSession: { status: 'anonymous' }, guestDeskPending: false })
    usePrototypeStore.getState().setDeskCreationDraft({ createdFor: 'self' })
  })

  it('finishes the desk without logging in, and is told it is not saved yet', () => {
    renderAt('/create/read-mode')
    fireEvent.click(screen.getByRole('button', { name: '책상 만들기' }))

    expect(screen.getByText(/만들어졌어요/)).toBeInTheDocument()
    expect(screen.getByText('로그인하면 책상을 저장하고 공유할 수 있어요')).toBeInTheDocument()
    expect(screen.getByText('로그인 하지 않으면 책상이 사라져요')).toBeInTheDocument()
    expect(api.createMyDesk).not.toHaveBeenCalled()
  })

  it('can open the desk it just made without logging in', () => {
    renderAt('/create/read-mode')
    fireEvent.click(screen.getByRole('button', { name: '책상 만들기' }))
    fireEvent.click(screen.getByRole('button', { name: '내 책상 보기' }))

    expect(screen.getByText('내 책상 화면')).toBeInTheDocument()
  })

  it('is asked to log in when sharing, since the link needs a saved desk', () => {
    renderAt('/create/read-mode')
    fireEvent.click(screen.getByRole('button', { name: '책상 만들기' }))
    fireEvent.click(screen.getByRole('button', { name: '친구에게 응원 부탁하기' }))

    expect(screen.getByText(/응원 링크는 책상을 저장해야 만들어져요/)).toBeInTheDocument()
  })

  it('goes to log in and is brought back to save the same desk', () => {
    renderAt('/create/read-mode')
    fireEvent.click(screen.getByRole('button', { name: '책상 만들기' }))
    fireEvent.click(screen.getByRole('button', { name: '로그인하고 책상 저장하기' }))

    expect(screen.getByText('로그인 화면')).toBeInTheDocument()
    expect(peekLoginReturn()?.path).toBe('/create/read-mode?save=1')
  })

  it('saves the desk straight away once back from logging in', async () => {
    api.createMyDesk.mockResolvedValue({ id: 3, supporterToken: 'tok', publicFeedEnabled: true, roomClosed: false })
    usePrototypeStore.setState({
      guestDeskPending: true,
      authSession: { status: 'authenticated', email: 'a@b.com', provider: 'kakao', userId: 1 },
    })
    renderAt('/create/read-mode?save=1')

    expect(await screen.findByText(/만들어졌어요/)).toBeInTheDocument()
    expect(api.createMyDesk).toHaveBeenCalledTimes(1)
    expect(usePrototypeStore.getState().guestDeskPending).toBe(false)
    expect(screen.queryByText('로그인하면 책상을 저장하고 공유할 수 있어요')).not.toBeInTheDocument()
  })

  it('still sends a guest with no desk made here to log in', () => {
    renderAt('/my/desk')
    expect(screen.getByText('로그인 화면')).toBeInTheDocument()
  })
})
