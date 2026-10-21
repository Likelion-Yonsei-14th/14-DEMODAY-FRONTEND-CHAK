import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/client'
import { NotificationProvider } from '@/design-system/overlays'
import { usePrototypeStore } from '@/store/prototypeStore'

const api = vi.hoisted(() => ({ createFriendDesk: vi.fn(), createMyDesk: vi.fn(), deleteDesk: vi.fn() }))
vi.mock('@/api/desks', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/api/desks')>()), ...api }))
vi.mock('@/api/config', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/api/config')>()), isApiEnabled: true }))

import { DeskCreateReadModePage } from './DeskCreationPages'
import { DeskSettingsPage } from '@/features/management/DeskManagementPages'

describe('making a desk for a friend', () => {
  beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset())
    usePrototypeStore.setState({
      authSession: { status: 'authenticated', email: 'a@b.com', provider: 'google', userId: 5 },
    })
    usePrototypeStore.getState().setDeskCreationDraft({ createdFor: 'other', recipientDisplayName: ' 지수 ' })
  })

  function renderCreate() {
    return render(
      <NotificationProvider>
        <MemoryRouter initialEntries={['/prototype/create/read-mode']}>
          <Routes>
            <Route path="/prototype/create/read-mode" element={<DeskCreateReadModePage />} />
            <Route path="/friend-desks/created" element={<p>친구 책상 완료</p>} />
          </Routes>
        </MemoryRouter>
      </NotificationProvider>,
    )
  }

  it('creates the friend desk under the friend\'s name, not as my own desk', async () => {
    api.createFriendDesk.mockResolvedValue({ id: 1 })
    renderCreate()
    fireEvent.click(screen.getByRole('button', { name: '책상 만들기' }))
    expect(await screen.findByText('친구 책상 완료')).toBeInTheDocument()
    expect(api.createFriendDesk).toHaveBeenCalledWith(expect.objectContaining({ displayName: '지수' }))
    expect(api.createMyDesk).not.toHaveBeenCalled()
  })

  it('explains when too many friend desks are waiting', async () => {
    api.createFriendDesk.mockRejectedValue(new ApiError(409, { code: 'TOO_MANY_FRIEND_DESKS' }))
    renderCreate()
    fireEvent.click(screen.getByRole('button', { name: '책상 만들기' }))
    expect(await screen.findByText(/너무 많아요/)).toBeInTheDocument()
  })
})

describe('deleting my own desk', () => {
  beforeEach(() => {
    api.deleteDesk.mockReset()
    usePrototypeStore.setState({
      currentDesk: { ...usePrototypeStore.getState().currentDesk, id: '9', claimStatus: 'claimed' },
    })
  })

  function renderSettings() {
    return render(
      <NotificationProvider>
        <MemoryRouter initialEntries={['/prototype/my/settings']}>
          <Routes>
            <Route path="/prototype/my/settings" element={<DeskSettingsPage />} />
            <Route path="/home" element={<p>홈 화면</p>} />
          </Routes>
        </MemoryRouter>
      </NotificationProvider>,
    )
  }

  it('deletes after confirmation and stops showing the desk as mine', async () => {
    api.deleteDesk.mockResolvedValue(undefined)
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    renderSettings()

    fireEvent.click(screen.getByRole('button', { name: '책상 삭제' }))
    expect(api.deleteDesk).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '책상 삭제' }))

    await waitFor(() => expect(api.deleteDesk).toHaveBeenCalledWith(9))
    expect(await screen.findByText('홈 화면')).toBeInTheDocument()
    expect(usePrototypeStore.getState().currentDesk.claimStatus).toBe('unclaimed')
    confirm.mockRestore()
  })
})
