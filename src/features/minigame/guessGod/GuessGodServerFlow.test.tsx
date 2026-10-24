import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationProvider } from '@/design-system/overlays'
import { GuessGodPlayPage, GuessGodResultPage } from './GuessGodPages'
import { clearGame, loadGame, QUESTION_COUNT } from './guessGodLogic'

const createRound = vi.fn()
const submitRound = vi.fn()

vi.mock('@/api/minigames', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/minigames')>()),
  createGuessGodRound: () => createRound(),
  submitGuessGodRound: (...args: unknown[]) => submitRound(...args),
  fetchGuessGodLeaderboard: () =>
    Promise.resolve({
      period: 'daily',
      entries: [{ rank: 1, nickname: '찍신왕', score: 10, me: false }],
      me: null,
      distribution: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      totalRounds: 1,
    }),
}))

const location = { pathname: '' }

function LocationProbe() {
  location.pathname = useLocation().pathname
  return null
}

function renderPlay() {
  return render(
    <NotificationProvider>
      <MemoryRouter initialEntries={['/minigame/guess-god/play']}>
        <LocationProbe />
        <Routes>
          <Route path="/minigame/guess-god/play" element={<GuessGodPlayPage />} />
          <Route path="/minigame/guess-god/result/:score" element={<GuessGodResultPage />} />
        </Routes>
      </MemoryRouter>
    </NotificationProvider>,
  )
}

const bubble = (question: number, choice: number) =>
  within(screen.getByRole('group', { name: `${question}번 문항` })).getByRole('radio', { name: `${choice}번` })

const settle = () => act(async () => { await Promise.resolve() })

function finishGrading() {
  for (let step = 0; step <= QUESTION_COUNT + 1; step += 1) act(() => { vi.runOnlyPendingTimers() })
}

beforeEach(() => {
  clearGame()
  window.localStorage.clear()
  createRound.mockReset()
  submitRound.mockReset()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  window.localStorage.clear()
})

describe('guess god with the server', () => {
  it('asks for a round when the sheet opens and grades against the server key', async () => {
    vi.useFakeTimers()
    createRound.mockResolvedValue({ roundId: 'round-1', questionCount: 10, choiceCount: 5, expiresAt: '2099-01-01T00:00:00Z' })
    submitRound.mockResolvedValue({
      score: 10,
      questionCount: 10,
      answerKey: Array.from({ length: 10 }, () => 1),
      ranked: true,
      rank: { daily: 1, overall: 1, bestScoreToday: 10, bestScoreOverall: 10 },
      betterThanPercent: 80,
    })
    renderPlay()
    await settle()
    expect(loadGame()?.roundId).toBe('round-1')

    for (let question = 1; question <= QUESTION_COUNT; question += 1) fireEvent.click(bubble(question, 1))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'OMR 제출하기' }))
    })
    await settle()
    finishGrading()

    expect(submitRound).toHaveBeenCalledWith('round-1', Array.from({ length: 10 }, () => 1))
    // The key drawn on this device would almost never be all 1s: this score came from the server.
    expect(location.pathname).toBe('/minigame/guess-god/result/10')
    expect(screen.getByText(/80%보다 높은 점수/)).toBeInTheDocument()
    expect(screen.getByText(/내 최고/)).toHaveTextContent('오늘 1위 · 전체 1위')
    await settle()
    expect(screen.getByText('찍신왕')).toBeInTheDocument()
  })

  it('still grades on this device when the server cannot be reached', async () => {
    vi.useFakeTimers()
    createRound.mockRejectedValue(new Error('offline'))
    renderPlay()
    await settle()
    expect(loadGame()?.roundId).toBeUndefined()

    const key = loadGame()!.answerKey
    key.forEach((answer, index) => fireEvent.click(bubble(index + 1, answer)))
    fireEvent.click(screen.getByRole('button', { name: 'OMR 제출하기' }))
    finishGrading()

    expect(submitRound).not.toHaveBeenCalled()
    expect(location.pathname).toBe('/minigame/guess-god/result/10')
    expect(screen.queryByText(/보다 높은 점수예요/)).not.toBeInTheDocument()
  })

  it('falls back to this device when the server rejects the submission', async () => {
    vi.useFakeTimers()
    createRound.mockResolvedValue({ roundId: 'round-2', questionCount: 10, choiceCount: 5, expiresAt: '2099-01-01T00:00:00Z' })
    submitRound.mockRejectedValue(new Error('expired'))
    renderPlay()
    await settle()

    const key = loadGame()!.answerKey
    key.forEach((answer, index) => fireEvent.click(bubble(index + 1, answer)))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'OMR 제출하기' }))
    })
    await settle()
    finishGrading()

    expect(location.pathname).toBe('/minigame/guess-god/result/10')
  })
})
