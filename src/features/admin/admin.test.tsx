import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePrototypeStore } from '@/store/prototypeStore'

const admin = vi.hoisted(() => ({
  fetchAdminUsers: vi.fn(),
  fetchAdminUser: vi.fn(),
  withdrawAdminUser: vi.fn(),
  fetchDailyStats: vi.fn(),
  fetchRegionStats: vi.fn(),
  fetchAdminReports: vi.fn(),
  actOnReport: vi.fn(),
  fetchAdminAccess: vi.fn(),
  grantAdmin: vi.fn(),
  revokeAdmin: vi.fn(),
  cancelAdminInvite: vi.fn(),
}))
const auth = vi.hoisted(() => ({ fetchMe: vi.fn() }))

vi.mock('@/api/admin', () => admin)
vi.mock('@/api/auth', () => auth)

import { AdminLayout } from './AdminLayout'
import { DashboardPage } from './DashboardPage'
import { UsersPage } from './UsersPage'
import { AdminsPage } from './AdminsPage'

const summary = {
  id: 7,
  provider: 'KAKAO' as const,
  displayName: '김철수',
  email: 'kim@x.com',
  profileImageUrl: null,
  admin: false,
  createdAt: '2026-10-01T00:00:00Z',
  lastLoginAt: null,
  deletedAt: null,
}

const detail = (overrides: Record<string, unknown> = {}) => ({
  user: summary,
  deskId: 3,
  deskClosed: false,
  receivedMessages: 4,
  sentMessages: 2,
  chaltteokBalance: 0,
  history: [],
  ...overrides,
})

describe('admin console', () => {
  beforeEach(() => {
    Object.values(admin).forEach((fn) => fn.mockReset())
    auth.fetchMe.mockReset()
    usePrototypeStore.setState({
      authSession: { status: 'authenticated', email: 'a@b.com', provider: 'google', userId: 1 },
    })
  })

  function renderConsole(initial = '/admin') {
    return render(
      <MemoryRouter initialEntries={[initial]}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
  }

  it('keeps non-admin accounts out', async () => {
    auth.fetchMe.mockResolvedValue({ id: 1, displayName: '회원', admin: false })
    renderConsole()
    expect(await screen.findByText('이 계정에는 어드민 권한이 없어요.')).toBeTruthy()
    expect(admin.fetchDailyStats).not.toHaveBeenCalled()
  })

  it('asks signed-out visitors to log in', async () => {
    usePrototypeStore.setState({ authSession: { status: 'anonymous' } })
    renderConsole()
    expect(await screen.findByText('운영자 계정으로 로그인해 주세요.')).toBeTruthy()
    expect(auth.fetchMe).not.toHaveBeenCalled()
  })

  it('shows the dashboard numbers for an admin', async () => {
    auth.fetchMe.mockResolvedValue({ id: 1, displayName: '운영자', admin: true })
    admin.fetchDailyStats.mockResolvedValue({
      from: '2026-10-20',
      to: '2026-10-21',
      totalUsers: 120,
      totalDesks: 80,
      totalMessages: 900,
      days: [
        { date: '2026-10-20', visitors: 10, memberVisitors: 4, guestVisitors: 6, pageViews: 30, signups: 2, desksCreated: 1, messagesCreated: 5, chargeAmount: 1000 },
        { date: '2026-10-21', visitors: 25, memberVisitors: 10, guestVisitors: 15, pageViews: 70, signups: 3, desksCreated: 2, messagesCreated: 8, chargeAmount: 3000 },
      ],
    })
    admin.fetchRegionStats.mockResolvedValue({
      from: '2026-10-20',
      to: '2026-10-21',
      items: [{ country: 'KR', region: '11', regionName: '서울', visitors: 7, pageViews: 40 }],
      unknownPageViews: 3,
    })
    renderConsole()

    expect(await screen.findByText('총 회원')).toBeTruthy()
    expect(screen.getByText('120')).toBeTruthy()
    expect(screen.getByText('4,000원')).toBeTruthy()
    expect(await screen.findByText('서울')).toBeTruthy()
    expect(screen.getByText(/회원 10 · 비회원 15/)).toBeTruthy()
  })

  it('requires typing the name before a member can be withdrawn', async () => {
    auth.fetchMe.mockResolvedValue({ id: 1, displayName: '운영자', admin: true })
    admin.fetchAdminUsers.mockResolvedValue({ content: [summary], page: 0, size: 20, hasNext: false })
    admin.fetchAdminUser.mockResolvedValue(detail())
    admin.withdrawAdminUser.mockResolvedValue(
      detail({ user: { ...summary, displayName: '탈퇴한 사용자', deletedAt: '2026-10-21T00:00:00Z' } }),
    )
    renderConsole('/admin/users')

    fireEvent.click(await screen.findByText('김철수'))
    fireEvent.click(await screen.findByRole('button', { name: '탈퇴 처리' }))

    const confirm = await screen.findByRole('button', { name: '탈퇴 처리하기' })
    expect((confirm as HTMLButtonElement).disabled).toBe(true)
    fireEvent.change(screen.getByLabelText(/이름/), { target: { value: '김철수' } })
    expect((confirm as HTMLButtonElement).disabled).toBe(false)

    fireEvent.click(confirm)
    await waitFor(() => expect(admin.withdrawAdminUser).toHaveBeenCalledWith(7, false))
  })

  it('also needs consent to forfeit remaining 찰떡', async () => {
    auth.fetchMe.mockResolvedValue({ id: 1, displayName: '운영자', admin: true })
    admin.fetchAdminUsers.mockResolvedValue({ content: [summary], page: 0, size: 20, hasNext: false })
    admin.fetchAdminUser.mockResolvedValue(detail({ chaltteokBalance: 500 }))
    admin.withdrawAdminUser.mockResolvedValue(detail({ user: { ...summary, deletedAt: '2026-10-21T00:00:00Z' } }))
    renderConsole('/admin/users')

    fireEvent.click(await screen.findByText('김철수'))
    fireEvent.click(await screen.findByRole('button', { name: '탈퇴 처리' }))
    fireEvent.change(await screen.findByLabelText(/이름/), { target: { value: '김철수' } })
    const confirm = screen.getByRole('button', { name: '탈퇴 처리하기' }) as HTMLButtonElement
    expect(confirm.disabled).toBe(true)

    fireEvent.click(screen.getByLabelText(/사라지는 것에 동의/))
    expect(confirm.disabled).toBe(false)
    fireEvent.click(confirm)
    await waitFor(() => expect(admin.withdrawAdminUser).toHaveBeenCalledWith(7, true))
  })

  it('does not offer withdrawal for operators', async () => {
    auth.fetchMe.mockResolvedValue({ id: 1, displayName: '운영자', admin: true })
    admin.fetchAdminUsers.mockResolvedValue({ content: [{ ...summary, admin: true }], page: 0, size: 20, hasNext: false })
    admin.fetchAdminUser.mockResolvedValue(detail({ user: { ...summary, admin: true } }))
    renderConsole('/admin/users')

    fireEvent.click(await screen.findByText('김철수'))
    await screen.findByLabelText('회원 상세')
    expect(screen.queryByRole('button', { name: '탈퇴 처리' })).toBeNull()
  })

  describe('operator access', () => {
    const access = (overrides: Record<string, unknown> = {}) => ({
      admins: [{ ...summary, id: 1, displayName: '운영자', email: 'mj@x.com', admin: true }],
      invites: [{ id: 5, email: 'wait@x.com', createdAt: '2026-10-01T00:00:00Z', consumedAt: null, bootstrap: false }],
      ...overrides,
    })

    it('lists admins and invites, grants by email and clears the field', async () => {
      admin.fetchAdminAccess.mockResolvedValue(access())
      admin.grantAdmin.mockResolvedValue(access({ invites: [] }))
      render(<AdminsPage />)
      expect(await screen.findByText('wait@x.com')).toBeInTheDocument()

      const input = screen.getByLabelText('구글 계정 이메일')
      fireEvent.change(input, { target: { value: ' new@x.com ' } })
      fireEvent.click(screen.getByRole('button', { name: '권한 부여' }))

      await waitFor(() => expect(admin.grantAdmin).toHaveBeenCalledWith('new@x.com'))
      await waitFor(() => expect(screen.queryByText('wait@x.com')).not.toBeInTheDocument())
      expect(input).toHaveValue('')
    })

    it('revokes an admin only after confirmation and shows server rejections', async () => {
      admin.fetchAdminAccess.mockResolvedValue(access())
      const { ApiError } = await import('@/api/client')
      admin.revokeAdmin.mockRejectedValue(new ApiError(409, { code: 'ADMIN_SELF_REVOKE' }))
      const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
      render(<AdminsPage />)
      await screen.findByText('mj@x.com')

      fireEvent.click(screen.getByRole('button', { name: '권한 해제' }))
      expect(admin.revokeAdmin).not.toHaveBeenCalled()
      fireEvent.click(screen.getByRole('button', { name: '권한 해제' }))

      await waitFor(() => expect(admin.revokeAdmin).toHaveBeenCalledWith(1))
      expect(await screen.findByText('본인의 권한은 해제할 수 없어요.')).toBeInTheDocument()
      confirm.mockRestore()
    })

    it('cancels a pending invite after confirmation', async () => {
      admin.fetchAdminAccess.mockResolvedValue(access())
      admin.cancelAdminInvite.mockResolvedValue(access({ invites: [] }))
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      render(<AdminsPage />)
      await screen.findByText('wait@x.com')
      fireEvent.click(screen.getByRole('button', { name: '초대 취소' }))
      await waitFor(() => expect(admin.cancelAdminInvite).toHaveBeenCalledWith(5))
    })
  })

  describe('reports page', () => {
    it('asks the server for OPEN reports by default (the status name the API uses)', async () => {
      admin.fetchAdminReports.mockResolvedValue({ content: [], hasNext: false, page: 0, size: 20 })
      const { ReportsPage } = await import('./ReportsPage')
      render(<ReportsPage />)
      await waitFor(() => expect(admin.fetchAdminReports).toHaveBeenCalledWith('OPEN', 0))
    })
  })
})
