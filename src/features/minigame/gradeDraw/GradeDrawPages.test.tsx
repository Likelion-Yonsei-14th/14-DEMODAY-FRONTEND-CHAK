import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationProvider } from '@/design-system/overlays'
import {
  GradeDrawIntroPage,
  GradeDrawMyResultPage,
  GradeDrawPlayPage,
  GradeDrawResultPage,
} from './GradeDrawPages'
import {
  clearGameState,
  countDrawn,
  encodeGrades,
  getGrades,
  restoreGameState,
} from './gradeDrawLogic'

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
          <Route path="/minigame/grade-draw" element={<GradeDrawIntroPage />} />
          <Route path="/minigame/grade-draw/play" element={<GradeDrawPlayPage />} />
          <Route path="/minigame/grade-draw/result" element={<GradeDrawMyResultPage />} />
          <Route path="/minigame/grade-draw/result/:grades" element={<GradeDrawResultPage />} />
        </Routes>
      </MemoryRouter>
    </NotificationProvider>,
  )
}

const subjectRow = (name: string) =>
  screen.getByText(name, { selector: '.grade-draw-subject__name' }).closest('li')!

const drawButton = (name: string) => screen.getByRole('button', { name: `${name} 뽑기` })
const drawRestButton = () => screen.getByRole('button', { name: '남은 과목 한 번에 뽑기' })

/** Long enough for six staggered reveals; the rolling face runs on an interval. */
const finishReveal = () =>
  act(() => {
    vi.advanceTimersByTime(3_000)
  })

beforeEach(() => {
  vi.useFakeTimers()
  clearGameState()
  window.localStorage.clear()
})
afterEach(() => {
  vi.useRealTimers()
  window.localStorage.clear()
})

describe('grade draw mini game', () => {
  it('runs from the intro through drawing to the report card', () => {
    renderAt('/minigame/grade-draw')
    expect(screen.getByRole('heading', { name: '수능 운빨 뽑기' })).toBeInTheDocument()
    expect(screen.getByText('총 6과목')).toBeInTheDocument()
    expect(screen.getByText(/오락용 미니게임입니다/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '게임 시작' }))

    expect(location.pathname).toBe('/minigame/grade-draw/play')
    expect(screen.getByText(/과목 완료/)).toHaveTextContent('0 / 6 과목 완료')
    expect(within(subjectRow('국어')).getByText('?등급')).toBeInTheDocument()

    fireEvent.click(drawButton('국어'))
    finishReveal()
    const korean = restoreGameState()!.subjects[0]!.grade!
    expect(within(subjectRow('국어')).getByText(`${korean}등급`)).toBeInTheDocument()
    expect(within(subjectRow('국어')).getByText('확정')).toBeInTheDocument()

    fireEvent.click(drawRestButton())
    finishReveal()
    expect(screen.getByText(/과목 완료/)).toHaveTextContent('6 / 6 과목 완료')

    const grades = getGrades(restoreGameState()!)
    expect(grades[0]).toBe(korean)
    fireEvent.click(screen.getByRole('button', { name: '가상 성적표 보기' }))

    expect(location.pathname).toBe(`/minigame/grade-draw/result/${encodeGrades(grades)}`)
    expect(screen.getByRole('heading', { name: '가상 수능 성적표' })).toBeInTheDocument()
    expect(screen.getByText('특별 칭호')).toBeInTheDocument()
    expect(screen.getByText('가상 평균 등급')).toBeInTheDocument()
    expect(screen.getByText(/오락용 미니게임입니다/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '결과 공유하기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '이미지 저장하기' })).toBeInTheDocument()
  })

  it('saves a grade the moment it is drawn and locks every button while it rolls', () => {
    renderAt('/minigame/grade-draw/play')
    fireEvent.click(drawButton('수학'))

    const saved = restoreGameState()!
    expect(saved.subjects[1]!.isDrawn).toBe(true)
    const math = saved.subjects[1]!.grade

    // Mid-animation: more presses do nothing.
    expect(drawButton('국어')).toBeDisabled()
    expect(drawRestButton()).toBeDisabled()
    fireEvent.click(drawButton('국어'))
    fireEvent.click(drawRestButton())
    expect(countDrawn(restoreGameState()!)).toBe(1)

    finishReveal()
    expect(restoreGameState()!.subjects[1]!.grade).toBe(math)
    expect(screen.queryByRole('button', { name: '수학 뽑기' })).not.toBeInTheDocument()
    expect(drawButton('국어')).toBeEnabled()
  })

  it('draws a subject once even when pressed repeatedly in a row', () => {
    renderAt('/minigame/grade-draw/play')
    const button = drawButton('영어')
    fireEvent.click(button)
    fireEvent.click(button)
    fireEvent.click(button)
    const first = restoreGameState()!.subjects[2]!.grade
    finishReveal()
    expect(countDrawn(restoreGameState()!)).toBe(1)
    expect(restoreGameState()!.subjects[2]!.grade).toBe(first)
  })

  it('keeps drawn grades after a refresh, even one cut off mid-animation', () => {
    const first = renderAt('/minigame/grade-draw/play')
    fireEvent.click(drawButton('한국사'))
    const history = restoreGameState()!.subjects[3]!.grade!
    first.unmount()

    renderAt('/minigame/grade-draw/play')
    expect(within(subjectRow('한국사')).getByText(`${history}등급`)).toBeInTheDocument()
    expect(screen.getByText(/과목 완료/)).toHaveTextContent('1 / 6 과목 완료')
  })

  it('sends an unfinished game from the result address back to drawing', () => {
    renderAt('/minigame/grade-draw/play')
    fireEvent.click(drawButton('국어'))
    finishReveal()
    screen.getByText(/과목 완료/)

    renderAt('/minigame/grade-draw/result')
    expect(location.pathname).toBe('/minigame/grade-draw/play')
    expect(screen.getByText('6과목을 모두 뽑아야 성적표를 볼 수 있어요.')).toBeInTheDocument()
  })

  it('shows the same report card after a refresh and resets on retry', () => {
    const play = renderAt('/minigame/grade-draw/play')
    fireEvent.click(drawRestButton())
    finishReveal()
    const done = restoreGameState()!
    const code = encodeGrades(getGrades(done))
    play.unmount()

    const result = renderAt(`/minigame/grade-draw/result/${code}`)
    expect(screen.getByText('수능 운빨 뽑기 · 나의 운빨 성적표')).toBeInTheDocument()
    expect(screen.getByText(done.resultTitle!.title, { selector: 'h2' })).toBeInTheDocument()
    result.unmount()

    renderAt('/minigame/grade-draw/result')
    expect(location.pathname).toBe(`/minigame/grade-draw/result/${code}`)

    fireEvent.click(screen.getByRole('button', { name: '다시 뽑기' }))
    expect(location.pathname).toBe('/minigame/grade-draw/play')
    const fresh = restoreGameState()!
    expect(fresh.gameId).not.toBe(done.gameId)
    expect(countDrawn(fresh)).toBe(0)
  })

  it('shows a shared report card without touching the viewer’s own game', () => {
    const play = renderAt('/minigame/grade-draw/play')
    fireEvent.click(drawButton('국어'))
    finishReveal()
    const before = JSON.stringify(restoreGameState())
    play.unmount()

    renderAt('/minigame/grade-draw/result/111111')
    expect(screen.getByText('수능 운빨 뽑기 · 친구의 운빨 성적표')).toBeInTheDocument()
    expect(screen.getByText('수능의 신', { selector: 'h2' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '결과 공유하기' })).not.toBeInTheDocument()
    expect(JSON.stringify(restoreGameState())).toBe(before)

    fireEvent.click(screen.getByRole('button', { name: '나도 뽑아 보기' }))
    expect(location.pathname).toBe('/minigame/grade-draw')
  })

  it('sends a malformed shared link back to the intro', () => {
    renderAt('/minigame/grade-draw/result/1230a9')
    expect(location.pathname).toBe('/minigame/grade-draw')
    expect(screen.getByRole('button', { name: '게임 시작' })).toBeInTheDocument()
  })
})
