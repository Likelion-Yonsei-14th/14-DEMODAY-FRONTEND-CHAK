import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationProvider } from '@/design-system/overlays'
import {
  GuessGodIntroPage,
  GuessGodPlayPage,
  GuessGodResultPage,
} from './GuessGodPages'
import { clearGame, loadGame, QUESTION_COUNT } from './guessGodLogic'

const location = { pathname: '' }

function LocationProbe() {
  location.pathname = useLocation().pathname
  return null
}

function renderAt(path: string) {
  return render(
    <NotificationProvider>
      <MemoryRouter initialEntries={[path]}>
        <LocationProbe />
        <Routes>
          <Route path="/" element={<p>서비스 홈</p>} />
          <Route path="/minigame/guess-god" element={<GuessGodIntroPage />} />
          <Route path="/minigame/guess-god/play" element={<GuessGodPlayPage />} />
          <Route path="/minigame/guess-god/result/:score" element={<GuessGodResultPage />} />
        </Routes>
      </MemoryRouter>
    </NotificationProvider>,
  )
}

function bubble(question: number, choice: number) {
  const row = screen.getByRole('group', { name: `${question}번 문항` })
  return within(row).getByRole('radio', { name: `${choice}번` })
}

/** Marks every question with the answer from the saved key, so the score is known. */
function markAll(pick: (answer: number, index: number) => number) {
  const key = loadGame()!.answerKey
  key.forEach((answer, index) => fireEvent.click(bubble(index + 1, pick(answer, index))))
}

const submitButton = () => screen.getByRole('button', { name: 'OMR 제출하기' })

beforeEach(() => {
  clearGame()
  window.localStorage.clear()
})
afterEach(() => {
  vi.useRealTimers()
  window.localStorage.clear()
})

describe('guess god mini game', () => {
  it('runs from the intro through the OMR sheet to a graded result', () => {
    vi.useFakeTimers()
    renderAt('/minigame/guess-god')
    expect(screen.getByRole('heading', { name: '오늘의 찍신은 나야!' })).toBeInTheDocument()
    expect(screen.getByText('10문항')).toBeInTheDocument()
    expect(screen.queryByText(/약 1분/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '게임 시작' }))

    expect(location.pathname).toBe('/minigame/guess-god/play')
    expect(screen.getByText(/마킹 완료/)).toHaveTextContent('0 / 10 마킹 완료')
    expect(submitButton()).toBeDisabled()

    // 7 right: questions 1-7 copy the key, 8-10 pick something else.
    markAll((answer, index) => (index < 7 ? answer : (answer % 5) + 1))
    expect(screen.getByText(/마킹 완료/)).toHaveTextContent('10 / 10 마킹 완료')
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '10')

    fireEvent.click(submitButton())
    act(() => {
      vi.runAllTimers()
    })

    expect(location.pathname).toBe('/minigame/guess-god/result/7')
    expect(screen.getByRole('heading', { name: '수능 찍기 장인' })).toBeInTheDocument()
    expect(screen.getByText('10문제 중 7문제 정답!')).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'OMR 채점 결과' })).toBeInTheDocument()
    expect(screen.getAllByText('정답', { selector: 'td span' })).toHaveLength(7)
    expect(screen.getAllByText('오답', { selector: 'td span' })).toHaveLength(3)
    expect(screen.getByText(/평균보다 높은 결과/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '한 줄로 찍기 vs 번호 나눠 찍기' })).toBeInTheDocument()
    const strategy = screen.getByRole('table', { name: '찍기 방식별 확률' })
    expect(within(strategy).getByRole('columnheader', { name: '4문항 이상 맞힐 확률' })).toBeInTheDocument()
    expect(within(strategy).getByRole('row', { name: /한 줄로 찍기.*2문항.*약 9\.7%/ })).toBeInTheDocument()
    expect(within(strategy).getByRole('row', { name: /번호 나눠 찍기.*2문항.*약 12\.3%/ })).toBeInTheDocument()
    expect(screen.getByText(/약 2\.6%p 높았어요/)).toBeInTheDocument()
    expect(screen.getByText(/2022~2026학년도 수능 국어·영어 정답표를 기준으로/)).toBeInTheDocument()
    // The game's own odds stay the fully random ones.
    expect(screen.getByText('약 1,157분의 1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '결과 공유하기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '이미지 저장하기' })).toBeInTheDocument()
  })

  it('says how many are left and keeps the button off until all are marked', () => {
    renderAt('/minigame/guess-god/play')
    fireEvent.click(bubble(1, 3))
    fireEvent.click(bubble(1, 5))
    expect(bubble(1, 5)).toBeChecked()
    expect(bubble(1, 3)).not.toBeChecked()
    expect(screen.getByText('아직 9문항이 남았어요')).toBeInTheDocument()
    expect(submitButton()).toBeDisabled()
  })

  it('submits once even when the button is pressed repeatedly, then locks the sheet', () => {
    vi.useFakeTimers()
    renderAt('/minigame/guess-god/play')
    const key = [...loadGame()!.answerKey]
    markAll((answer) => answer)

    fireEvent.click(submitButton())
    fireEvent.click(submitButton())
    fireEvent.click(submitButton())
    expect(bubble(1, 1)).toBeDisabled()

    const saved = loadGame()!
    expect(saved.gameStatus).toBe('submitted')
    expect(saved.answerKey).toEqual(key)
    expect(saved.score).toBe(QUESTION_COUNT)

    act(() => {
      vi.runAllTimers()
    })
    expect(location.pathname).toBe('/minigame/guess-god/result/10')
    expect(screen.getByRole('heading', { name: '전설의 찍신' })).toBeInTheDocument()
  })

  it('restores marks after a refresh and keeps the same answer key', () => {
    const first = renderAt('/minigame/guess-god/play')
    const key = [...loadGame()!.answerKey]
    fireEvent.click(bubble(2, 4))
    fireEvent.click(bubble(6, 1))
    first.unmount()

    renderAt('/minigame/guess-god/play')
    expect(bubble(2, 4)).toBeChecked()
    expect(bubble(6, 1)).toBeChecked()
    expect(screen.getByText(/마킹 완료/)).toHaveTextContent('2 / 10 마킹 완료')
    expect(loadGame()!.answerKey).toEqual(key)
  })

  it('offers to continue from the intro, and a restart draws a new key', () => {
    const play = renderAt('/minigame/guess-god/play')
    const firstId = loadGame()!.gameId
    fireEvent.click(bubble(1, 2))
    play.unmount()

    renderAt('/minigame/guess-god')
    expect(screen.getByRole('button', { name: '이어서 찍기' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '새 정답표로 다시 하기' }))
    const restarted = loadGame()!
    expect(restarted.gameId).not.toBe(firstId)
    expect(restarted.userAnswers.every((mark) => mark === null)).toBe(true)
  })

  it('shows the same result after a refresh, and the play page sends back to it', () => {
    vi.useFakeTimers()
    const play = renderAt('/minigame/guess-god/play')
    markAll(() => 1)
    fireEvent.click(submitButton())
    act(() => {
      vi.runAllTimers()
    })
    const score = loadGame()!.score!
    play.unmount()

    renderAt(`/minigame/guess-god/result/${score}`)
    expect(screen.getByRole('table', { name: 'OMR 채점 결과' })).toBeInTheDocument()
    expect(screen.getByText(`10문제 중 ${score}문제 정답!`)).toBeInTheDocument()
    cleanup()

    renderAt('/minigame/guess-god/play')
    expect(location.pathname).toBe(`/minigame/guess-god/result/${score}`)
  })

  it('starts a new key when retrying from the result', () => {
    vi.useFakeTimers()
    renderAt('/minigame/guess-god/play')
    const firstId = loadGame()!.gameId
    markAll((answer) => answer)
    fireEvent.click(submitButton())
    act(() => {
      vi.runAllTimers()
    })

    fireEvent.click(screen.getByRole('button', { name: '다시 도전하기' }))
    expect(location.pathname).toBe('/minigame/guess-god/play')
    const next = loadGame()!
    expect(next.gameId).not.toBe(firstId)
    expect(next.gameStatus).toBe('playing')
    expect(screen.getByText(/마킹 완료/)).toHaveTextContent('0 / 10 마킹 완료')
  })

  it('shows a shared result without the sheet and invites a new game', () => {
    renderAt('/minigame/guess-god/result/3')
    expect(screen.getByRole('heading', { name: '찍기 유망주' })).toBeInTheDocument()
    expect(screen.getByText('친구의 찍기 결과')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '결과 공유하기' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '나도 도전하기' }))
    expect(location.pathname).toBe('/minigame/guess-god')
  })

  it('sends an invalid result address back to the intro', () => {
    renderAt('/minigame/guess-god/result/11')
    expect(location.pathname).toBe('/minigame/guess-god')
    expect(screen.getByRole('button', { name: '게임 시작' })).toBeInTheDocument()
  })
})
