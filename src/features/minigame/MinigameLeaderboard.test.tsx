import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Leaderboard } from '@/api/minigames'
import { usePrototypeStore } from '@/store/prototypeStore'
import { MinigameLeaderboard } from './MinigameLeaderboard'

vi.mock('@/api/minigames', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/minigames')>()),
  fetchMinigameNickname: () => Promise.resolve({ nickname: null, defaultNickname: '홍**' }),
}))

const board = (extra: Partial<Leaderboard> = {}): Leaderboard => ({
  period: 'daily',
  entries: [
    { rank: 1, nickname: '찍신왕', score: 9, me: false },
    { rank: 2, nickname: '홍**', score: 7, me: true },
  ],
  me: { rank: 2, score: 7 },
  ...extra,
})

function renderBoard(load: (period: 'daily' | 'overall') => Promise<Leaderboard>) {
  return render(
    <MemoryRouter>
      <MinigameLeaderboard title="찍신 랭킹" load={load} highlightScore={7} />
    </MemoryRouter>,
  )
}

const signIn = (signedIn: boolean) =>
  usePrototypeStore.setState((state) => ({
    authSession: { ...state.authSession, status: signedIn ? 'authenticated' : 'guest' } as typeof state.authSession,
  }))

beforeEach(() => signIn(false))

describe('minigame leaderboard', () => {
  it('lists the ranking, marks my row, and asks guests to log in', async () => {
    const load = vi.fn().mockResolvedValue(board())
    renderBoard(load)

    expect(await screen.findByText('찍신왕')).toBeInTheDocument()
    expect(screen.getByText(/\(나\)/)).toBeInTheDocument()
    expect(screen.getByText('9점')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '로그인하기' })).toBeInTheDocument()
    expect(load).toHaveBeenCalledWith('daily')
  })

  it('switches to the overall ranking', async () => {
    const load = vi.fn().mockResolvedValue(board())
    renderBoard(load)
    await screen.findByText('찍신왕')

    fireEvent.click(screen.getByRole('tab', { name: '전체' }))
    await waitFor(() => expect(load).toHaveBeenCalledWith('overall'))
  })

  it('shows my rank below the list when I am outside the top entries', async () => {
    renderBoard(
      vi.fn().mockResolvedValue(
        board({ entries: [{ rank: 1, nickname: '찍신왕', score: 9, me: false }], me: { rank: 41, score: 3 } }),
      ),
    )
    expect(await screen.findByText('41위')).toBeInTheDocument()
  })

  it('says so when nobody has a score yet', async () => {
    renderBoard(vi.fn().mockResolvedValue(board({ entries: [], me: null })))
    expect(await screen.findByText(/첫 번째 주인공/)).toBeInTheDocument()
  })

  it('offers a retry when the ranking cannot be loaded', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(board())
    renderBoard(load)

    fireEvent.click(await screen.findByRole('button', { name: '다시 불러오기' }))
    expect(await screen.findByText('찍신왕')).toBeInTheDocument()
  })

  it('lets a signed-in member change the ranking nickname instead of logging in', async () => {
    signIn(true)
    renderBoard(vi.fn().mockResolvedValue(board()))
    await screen.findByText('찍신왕')

    expect(screen.queryByRole('button', { name: '로그인하기' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '랭킹 닉네임 바꾸기' }))
    expect(await screen.findByRole('button', { name: '저장하기' })).toBeInTheDocument()
  })

  it('draws the score distribution when the server sends one', async () => {
    renderBoard(vi.fn().mockResolvedValue(board({ distribution: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], totalRounds: 66 })))
    expect(await screen.findByRole('img', { name: /점수별 분포: 0점 1명/ })).toBeInTheDocument()
    expect(screen.getByText('전체 66판')).toBeInTheDocument()
  })
})
