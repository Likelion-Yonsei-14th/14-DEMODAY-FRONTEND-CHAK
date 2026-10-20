import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sneakyPhoneRankingApi } from '@/api/sneakyPhoneRanking'
import { NotificationProvider } from '@/design-system/overlays'
import { usePrototypeStore } from '@/store/prototypeStore'
import { SneakyPhoneRankingPage } from './SneakyPhoneRankingPage'

function renderRanking() {
  return render(
    <NotificationProvider>
      <MemoryRouter initialEntries={['/minigame/sneaky-phone/ranking']}>
        <Routes>
          <Route path="/minigame/sneaky-phone/ranking" element={<SneakyPhoneRankingPage />} />
          <Route path="/minigame/sneaky-phone/play" element={<p>게임 화면</p>} />
          <Route path="/auth/login" element={<p>로그인 화면</p>} />
        </Routes>
      </MemoryRouter>
    </NotificationProvider>,
  )
}

/** Lets the mock's short delay pass. */
const settle = () =>
  act(async () => {
    await vi.runAllTimersAsync()
  })

function signInAs(displayName: string) {
  usePrototypeStore.setState((state) => ({
    authSession: { status: 'authenticated', email: 'jisu@example.com', provider: 'password' },
    currentUser: { ...state.currentUser, displayName },
  }))
}

beforeEach(() => {
  vi.useFakeTimers()
  localStorage.clear()
  sessionStorage.clear()
  usePrototypeStore.setState({ authSession: { status: 'anonymous' } })
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('sneaky phone ranking page', () => {
  it('lists the top players and asks signed-out players to log in', async () => {
    renderRanking()
    expect(screen.getByText('랭킹을 불러오고 있어요...')).toBeInTheDocument()
    await settle()

    const rows = within(screen.getByRole('list', { name: '몰폰 랭킹' })).getAllByRole('listitem')
    expect(rows).toHaveLength(10)
    expect(rows[0]).toHaveTextContent('1위야자탈출러4,820점')
    expect(screen.getByText(/10명 참여/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '로그인하기' }))
    expect(screen.getByText('로그인 화면')).toBeInTheDocument()
    expect(sessionStorage.getItem('chak:login-return')).toContain('/minigame/sneaky-phone/ranking')
  })

  it('highlights my row and shows my rank at the bottom', async () => {
    signInAs('지수')
    const submitted = sneakyPhoneRankingApi.submitScore(4000)
    await vi.runAllTimersAsync()
    await submitted

    renderRanking()
    await settle()
    const mine = screen.getByText('지수').closest('li')!
    expect(mine).toHaveClass('is-me')
    expect(mine).toHaveTextContent('3위')
    expect(screen.getByText(/내 순위/)).toHaveTextContent(/내 순위 3위.*최고 4,000점/)
    fireEvent.click(screen.getByRole('button', { name: '기록 갱신하러 가기' }))
    expect(screen.getByText('게임 화면')).toBeInTheDocument()
  })

  it('invites a signed-in player without a record to play', async () => {
    signInAs('지수')
    renderRanking()
    await settle()
    expect(screen.getByText('아직 내 기록이 없어요')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '게임하고 랭킹에 올라가기' })).toBeInTheDocument()
  })

  it('offers a retry when the board fails to load', async () => {
    const getRanking = vi
      .spyOn(sneakyPhoneRankingApi, 'getRanking')
      .mockRejectedValueOnce(new Error('offline'))
    renderRanking()
    await settle()
    expect(screen.getByRole('alert')).toHaveTextContent('랭킹을 불러오지 못했어요.')

    getRanking.mockRestore()
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }))
    await settle()
    expect(screen.getByRole('list', { name: '몰폰 랭킹' })).toBeInTheDocument()
  })
})
