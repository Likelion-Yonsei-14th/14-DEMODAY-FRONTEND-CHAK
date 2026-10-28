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
  fetchMinigameStats: vi.fn(),
  fetchAdminReports: vi.fn(),
  actOnReport: vi.fn(),
  fetchAdminAccess: vi.fn(),
  grantAdmin: vi.fn(),
  revokeAdmin: vi.fn(),
  cancelAdminInvite: vi.fn(),
  fetchAdminInquiries: vi.fn(),
  changeAdminInquiryStatus: vi.fn(),
  fetchAdminBenefitSubmissions: vi.fn(),
  fetchAdminBenefitSubmission: vi.fn(),
  changeAdminBenefitStatus: vi.fn(),
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

    // CI가 느릴 때를 위해 여유를 둔다.
    expect(await screen.findByText('총 회원', {}, { timeout: 4000 })).toBeTruthy()
    expect(screen.getByText('120')).toBeTruthy()
    expect(screen.getByText('4,000원')).toBeTruthy()
    expect(await screen.findByText('서울')).toBeTruthy()
    expect(screen.getByText(/회원 10 · 비회원 15/)).toBeTruthy()
  })

  describe('region table', () => {
    const region = (extra: Record<string, unknown>) => ({ from: '2026-10-20', to: '2026-10-21', items: [], unknownPageViews: 0, ...extra })
    const open = async (regions: unknown) => {
      auth.fetchMe.mockResolvedValue({ id: 1, displayName: '운영자', admin: true })
      admin.fetchDailyStats.mockResolvedValue({ from: '', to: '', totalUsers: 0, totalDesks: 0, totalMessages: 0, days: [] })
      admin.fetchRegionStats.mockResolvedValue(regions)
      renderConsole()
      return screen.findByRole('heading', { name: /접속 지역/ }, { timeout: 4000 })
    }

    it('puts unknown location in the same table with each share of all page views', async () => {
      const heading = await open(region({
        items: [
          { country: 'KR', region: '11', regionName: '서울', visitors: 3, pageViews: 45 },
          { country: 'KR', region: '41', regionName: '경기', visitors: 1, pageViews: 15 },
        ],
        unknownPageViews: 940,
      }))
      const panel = heading.closest('section') as HTMLElement
      expect(panel).toHaveTextContent('서울')
      expect(panel).toHaveTextContent('접속자 3 · 4.5%')
      expect(panel).toHaveTextContent('접속자 1 · 1.5%')
      expect(panel).toHaveTextContent('위치 미상')
      expect(panel).toHaveTextContent('94%')
      expect(panel).toHaveTextContent('조회수 기준')
    })

    it('leaves overseas visits out of the table and the shares, and says how many it left out', async () => {
      const heading = await open(region({
        items: [{ country: 'KR', region: '11', regionName: '서울', visitors: 3, pageViews: 45 }],
        unknownPageViews: 5,
        overseasPageViews: 4,
      }))
      const panel = heading.closest('section') as HTMLElement
      expect(panel).toHaveTextContent('접속자 3 · 90%')
      expect(panel).toHaveTextContent('해외 접속 4건은 제외했어요')
      expect(panel).not.toHaveTextContent('CA')
    })

    it('shows only the unknown row while nothing has a location yet', async () => {
      const heading = await open(region({ unknownPageViews: 250 }))
      const panel = heading.closest('section') as HTMLElement
      expect(panel).toHaveTextContent('위치 미상')
      expect(panel).toHaveTextContent('100%')
      expect(panel).toHaveTextContent('아직 위치가 기록된 접속이 없어요')
    })

    it('says so when there is no traffic at all', async () => {
      const heading = await open(region({}))
      expect((heading.closest('section') as HTMLElement)).toHaveTextContent('아직 기록된 접속이 없어요')
    })
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

  describe('consultation inquiries', () => {
    const inquiry = {
      id: 4, company: '착커피', contactName: '김담당', email: 'kim@chakcoffee.com', phone: '010-1111-2222',
      category: null, interest: null, message: '배너만 가능한가요?', status: 'NEW' as const,
      createdAt: '2026-10-25T01:00:00Z', handledAt: null,
    }

    it('lists new requests and marks one as contacted', async () => {
      admin.fetchAdminInquiries.mockResolvedValue({ content: [inquiry], hasNext: false, page: 0, size: 20 })
      admin.changeAdminInquiryStatus.mockResolvedValue({ ...inquiry, status: 'CONTACTED' })
      const { InquiriesPage } = await import('./InquiriesPage')
      render(<InquiriesPage />)

      expect(await screen.findByText('착커피')).toBeInTheDocument()
      expect(screen.getByText('배너만 가능한가요?')).toBeInTheDocument()
      expect(admin.fetchAdminInquiries).toHaveBeenCalledWith('NEW', 0)

      fireEvent.click(screen.getByRole('button', { name: '연락함' }))
      await waitFor(() => expect(admin.changeAdminInquiryStatus).toHaveBeenCalledWith(4, 'CONTACTED'))
    })
  })

  describe('benefit submissions', () => {
    const row = {
      id: 7, brand: '착커피', category: 'CAFE', contactName: '박담당', email: 'park@chakcoffee.com', phone: '010-3333-4444',
      headline: '수험생 전 음료 20% 할인', status: 'NEW' as const, createdAt: '2026-10-30T01:00:00Z', handledAt: null,
    }

    it('lists submissions, shows the answers with labels and marks one as sent', async () => {
      admin.fetchAdminBenefitSubmissions.mockResolvedValue({ content: [row], hasNext: false, page: 0, size: 20 })
      admin.fetchAdminBenefitSubmission.mockResolvedValue({
        summary: row,
        answers: { brand: '착커피', benefits: ['PERCENT', 'FREE_GIFT'], percent: 20, giftItem: '쿠키', scope: 'ALL_STORES', logoFileKey: 'promotion/uploads/x/logo.png' },
        files: [{ field: 'logoFileKey', fileName: 'logo.png', url: 'https://bucket.example/get' }],
      })
      admin.changeAdminBenefitStatus.mockResolvedValue({ ...row, status: 'CONTACTED' })
      const { BenefitSubmissionsPage } = await import('./BenefitSubmissionsPage')
      render(<BenefitSubmissionsPage />)

      expect(await screen.findByText('착커피')).toBeInTheDocument()
      expect(screen.getByText('수험생 전 음료 20% 할인')).toBeInTheDocument()
      expect(admin.fetchAdminBenefitSubmissions).toHaveBeenCalledWith('NEW', 0)

      fireEvent.click(screen.getByRole('button', { name: '자세히 보기' }))
      expect(await screen.findByText('% 할인, 구매 시 무료 증정')).toBeInTheDocument()
      expect(screen.getByText('쿠키')).toBeInTheDocument()
      expect(screen.getByText('전 매장')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'logo.png' })).toHaveAttribute('href', 'https://bucket.example/get')

      fireEvent.click(screen.getByRole('button', { name: '시안 보냄' }))
      await waitFor(() => expect(admin.changeAdminBenefitStatus).toHaveBeenCalledWith(7, 'CONTACTED'))
    })
  })

  describe('minigame stats', () => {
    const days = (members: number, guests: number) =>
      Array.from({ length: 14 }, (_, index) => ({ date: `2026-10-${String(index + 12).padStart(2, '0')}`, members, guests }))
    const stats = {
      games: [
        {
          game: 'GUESS_GOD', startedToday: 120, submittedToday: 96, submittedLast7Days: 540, submittedLast14Days: 980,
          averageScoreLast14Days: 2.1, rankedMembers: 41, bestMemberScore: 9, days: days(3, 7),
        },
        {
          game: 'SNEAKY_PHONE', startedToday: 0, submittedToday: 0, submittedLast7Days: 0, submittedLast14Days: 0,
          averageScoreLast14Days: null, rankedMembers: 0, bestMemberScore: null, days: days(0, 0),
        },
      ],
      studyType: {
        total: 100, members: 20, today: 5, last7Days: 60,
        distribution: [
          { code: 'PSA', count: 30, percent: 30 },
          { code: 'LFN', count: 70, percent: 70 },
        ],
      },
    }

    it('shows participation per game and the study type spread', async () => {
      admin.fetchMinigameStats.mockResolvedValue(stats)
      const { MinigamesPage } = await import('./MinigamesPage')
      render(<MinigamesPage />)

      const guessGod = await screen.findByRole('region', { name: '오늘의 찍신은 나야!' })
      expect(guessGod).toHaveTextContent('오늘 시작120')
      expect(guessGod).toHaveTextContent('오늘 중간에 그만둠24')
      expect(guessGod).toHaveTextContent('랭킹에 오른 회원41')
      expect(guessGod).toHaveTextContent('회원 3 · 비회원 7')

      const phone = screen.getByRole('region', { name: '선생님 몰래 폰 하기' })
      expect(phone).toHaveTextContent('14일 평균 점수-')
      expect(phone).toHaveTextContent('회원 최고 점수-')

      const study = screen.getByRole('region', { name: '나의 수험생 유형은?' })
      expect(study).toHaveTextContent('전체 결과100')
      expect(study).toHaveTextContent('70%')
    })

    it('shows the D+1 course answers as choice shares when the server sends them', async () => {
      admin.fetchMinigameStats.mockResolvedValue({
        ...stats,
        d1Course: {
          total: 200, today: 12, last7Days: 90, shared: 40,
          areas: [{ key: 'hongdae', count: 80 }, { key: 'gangnam', count: 40 }],
          activities: [{ key: 'dye', count: 124 }, { key: 'food', count: 100 }],
          companions: [{ key: 'small', count: 120 }],
          budgets: [{ key: '30kTo100k', count: 110 }],
          regions: [{ key: 'gyeonggi', count: 70 }],
        },
      })
      const { MinigamesPage } = await import('./MinigamesPage')
      render(<MinigamesPage />)

      const d1 = await screen.findByRole('region', { name: '수능 끝 D+1 코스 짜기' })
      expect(d1).toHaveTextContent('전체 응답200')
      expect(d1).toHaveTextContent('공유한 응답40')
      expect(d1).toHaveTextContent('홍대')
      expect(d1).toHaveTextContent('40%')          // 홍대 80/200
      expect(d1).toHaveTextContent('염색')
      expect(d1).toHaveTextContent('62%')          // 염색 124/200
      expect(d1).toHaveTextContent('2~3명')
      expect(d1).toHaveTextContent('3~10만 원')
      expect(d1).toHaveTextContent('경기')
    })

    it('says there are no D+1 answers yet and tolerates an older server without them', async () => {
      admin.fetchMinigameStats.mockResolvedValue({
        ...stats,
        d1Course: { total: 0, today: 0, last7Days: 0, shared: 0, areas: [], activities: [], companions: [], budgets: [], regions: [] },
      })
      const { MinigamesPage } = await import('./MinigamesPage')
      const view = render(<MinigamesPage />)
      expect(await screen.findByText('아직 응답이 없어요.')).toBeInTheDocument()
      view.unmount()

      admin.fetchMinigameStats.mockResolvedValue(stats)
      render(<MinigamesPage />)
      await screen.findByRole('region', { name: '오늘의 찍신은 나야!' })
      expect(screen.queryByRole('region', { name: '수능 끝 D+1 코스 짜기' })).not.toBeInTheDocument()
    })

    it('says so when the stats cannot be loaded', async () => {
      admin.fetchMinigameStats.mockRejectedValue(new Error('down'))
      const { MinigamesPage } = await import('./MinigamesPage')
      render(<MinigamesPage />)
      expect(await screen.findByText('통계를 불러오지 못했어요.')).toBeInTheDocument()
    })

    it('has a menu entry in the console', async () => {
      auth.fetchMe.mockResolvedValue({ id: 1, displayName: '운영자', admin: true })
      admin.fetchDailyStats.mockResolvedValue({ from: '', to: '', totalUsers: 0, totalDesks: 0, totalMessages: 0, days: [] })
      admin.fetchRegionStats.mockResolvedValue({ from: '', to: '', items: [], unknownPageViews: 0 })
      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
            </Route>
          </Routes>
        </MemoryRouter>,
      )
      expect(await screen.findByRole('link', { name: '미니게임' })).toHaveAttribute('href', '/admin/minigames')
    })
  })
})
