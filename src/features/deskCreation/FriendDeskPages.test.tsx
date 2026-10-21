import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationProvider } from '@/design-system/overlays'

const api = vi.hoisted(() => ({ fetchFriendDesks: vi.fn(), deleteDesk: vi.fn() }))
vi.mock('@/api/desks', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/api/desks')>()), ...api }))
const share = vi.hoisted(() => vi.fn())
vi.mock('@/lib/shareLink', () => ({ shareOrCopyLink: share }))

import { FriendDeskCreatedPage, FriendDesksPage } from './FriendDeskPages'

const desk = (overrides: Record<string, unknown> = {}) => ({
  id: 3,
  displayName: '지수',
  supporterToken: 'sup-1',
  claimToken: 'claim-1',
  readModeType: 'TIME_CAPSULE' as const,
  dailyUnlockTime: null,
  capsuleUnlockAt: '2099-01-01T00:00:00Z',
  roomClosed: false,
  messageCount: 2,
  friendCount: 2,
  createdAt: '2026-10-01T00:00:00Z',
  ...overrides,
})

function renderAt(path: string, state?: unknown) {
  return render(
    <NotificationProvider>
      <MemoryRouter initialEntries={[{ pathname: path, state }]}>
        <Routes>
          <Route path="/friend-desks" element={<FriendDesksPage />} />
          <Route path="/friend-desks/created" element={<FriendDeskCreatedPage />} />
        </Routes>
      </MemoryRouter>
    </NotificationProvider>,
  )
}

describe('friend desk pages', () => {
  beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset())
    share.mockReset()
  })

  it('lists the desks with counts only and the two links to send', async () => {
    api.fetchFriendDesks.mockResolvedValue([desk()])
    renderAt('/friend-desks')
    expect(await screen.findByText('친구 2명이 응원 2개를 남겼어요.')).toBeInTheDocument()
    expect(screen.getByText('응원 내용은 책상 주인만 볼 수 있어요.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '책상 주인에게 보내기' }))
    await waitFor(() => expect(share).toHaveBeenCalled())
    expect(share.mock.calls[0]![0].url).toContain('/claim/claim-1')

    fireEvent.click(screen.getByRole('button', { name: '응원 링크 보내기' }))
    await waitFor(() => expect(share).toHaveBeenCalledTimes(2))
    expect(share.mock.calls[1]![0].url).toContain('/desk/sup-1')
  })

  it('deletes only after confirmation and refreshes the list', async () => {
    api.fetchFriendDesks.mockResolvedValueOnce([desk()]).mockResolvedValueOnce([])
    api.deleteDesk.mockResolvedValue(undefined)
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    renderAt('/friend-desks')
    await screen.findByText(/지수님의 책상/)

    fireEvent.click(screen.getByRole('button', { name: '이 책상 삭제하기' }))
    expect(api.deleteDesk).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '이 책상 삭제하기' }))

    await waitFor(() => expect(api.deleteDesk).toHaveBeenCalledWith(3))
    expect(await screen.findByText('아직 전달하지 않은 친구 책상이 없어요.')).toBeInTheDocument()
    confirm.mockRestore()
  })

  it('shows the links right after creating, without reading cheers', () => {
    renderAt('/friend-desks/created', { desk: desk({ messageCount: 0, friendCount: 0 }) })
    expect(screen.getByText(/만들어졌어요/)).toBeInTheDocument()
    expect(screen.getByText('아직 남긴 응원이 없어요.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '책상 주인에게 보내기' })).toBeInTheDocument()
  })
})
