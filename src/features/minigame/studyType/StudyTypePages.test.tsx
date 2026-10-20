import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { NotificationProvider } from '@/design-system/overlays'
import {
  StudyTypeIntroPage,
  StudyTypeResultPage,
  StudyTypeTestPage,
} from './StudyTypePages'
import { STUDY_TYPE_QUESTIONS } from './studyTypeQuestions'
import { loadSession } from './studyTypeLogic'

const location = { pathname: '' }

function LocationProbe() {
  location.pathname = useLocation().pathname
  return null
}

function renderAt(path: string) {
  const view = render(
    <NotificationProvider>
      <MemoryRouter initialEntries={[path]}>
        <LocationProbe />
        <Routes>
          <Route path="/" element={<p>서비스 홈</p>} />
          <Route path="/minigame/study-type" element={<StudyTypeIntroPage />} />
          <Route path="/minigame/study-type/test" element={<StudyTypeTestPage />} />
          <Route
            path="/minigame/study-type/result/:slug"
            element={<StudyTypeResultPage />}
          />
        </Routes>
      </MemoryRouter>
    </NotificationProvider>,
  )
  return { router: { state: { location } }, ...view }
}

const questionByText = new Map(STUDY_TYPE_QUESTIONS.map((q) => [q.question, q]))

const currentQuestion = () =>
  questionByText.get(screen.getByRole('heading', { level: 2 }).textContent ?? '')!

/** Picks an option on the current screen and, unless it is the last question, waits for the next one. */
async function answerCurrent(pickTrait: (dimensionTraits: string[]) => string) {
  const question = currentQuestion()
  const trait = pickTrait(question.options.map((o) => o.trait))
  const label = question.options.find((o) => o.trait === trait)!.label
  fireEvent.click(screen.getByRole('button', { name: label }))
  if (loadSession()?.questionOrder.at(-1) !== question.id) {
    await waitFor(() => expect(currentQuestion().id).not.toBe(question.id))
  }
  return question
}

async function answerAll(pickTrait: (traits: string[]) => string) {
  await screen.findByRole('heading', { level: 2 })
  for (let index = 1; index <= 21; index += 1) {
    await answerCurrent(pickTrait)
  }
}

const preferFirst = (traits: string[]) =>
  traits.find((t) => 'PSA'.includes(t))!

beforeEach(() => window.localStorage.clear())
afterEach(() => window.localStorage.clear())

describe('study type mini game', () => {
  it('runs from the intro to a result with answer shares', async () => {
    const { router } = renderAt('/minigame/study-type')
    expect(document.body).not.toHaveTextContent(/21|문항|소요/)
    fireEvent.click(screen.getByRole('button', { name: '테스트 시작' }))

    await answerAll(preferFirst)
    expect(router.state.location.pathname).toBe('/minigame/study-type/test')

    fireEvent.click(await screen.findByRole('button', { name: '결과 확인하기' }))

    expect(await screen.findByRole('heading', { name: '완벽주의 플래너' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/minigame/study-type/result/perfect-planner')
    expect(screen.getByText('계획형 100%')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '결과 공유하기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '이미지 저장하기' })).toBeInTheDocument()
    // Type codes are internal only.
    expect(document.body).not.toHaveTextContent(/\b(PSA|PSN|PFA|PFN|LSA|LSN|LFA|LFN)\b/)
  }, 20_000)

  it('shows the current question number and how many are left', async () => {
    renderAt('/minigame/study-type/test')
    await screen.findByRole('heading', { level: 2 })
    const progress = () => document.querySelector('.study-type-progress p')!
    expect(progress()).toHaveTextContent('1 / 21번째 문항')
    expect(progress()).toHaveTextContent('21문항 남았어요')
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')

    await answerCurrent(preferFirst)
    expect(progress()).toHaveTextContent('2 / 21번째 문항')
    expect(progress()).toHaveTextContent('20문항 남았어요')
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1')
  })

  it('resumes after a refresh and lets an earlier answer be changed', async () => {
    const first = renderAt('/minigame/study-type/test')
    await screen.findByRole('heading', { level: 2 })
    const firstQuestion = await answerCurrent(preferFirst)
    await answerCurrent(preferFirst)
    const third = currentQuestion()
    first.unmount()

    renderAt('/minigame/study-type/test')
    expect(currentQuestion().id).toBe(third.id)

    fireEvent.click(screen.getByRole('button', { name: '이전 질문' }))
    fireEvent.click(screen.getByRole('button', { name: '이전 질문' }))
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(firstQuestion.question)

    const other = firstQuestion.options.find((o) => !'PSA'.includes(o.trait))!
    fireEvent.click(screen.getByRole('button', { name: other.label }))
    await waitFor(() => expect(currentQuestion().id).not.toBe(firstQuestion.id))

    const saved = loadSession()!
    expect(saved.answers[firstQuestion.id]).toBe(other.trait)
    expect(Object.keys(saved.answers)).toHaveLength(2)
  })

  it('offers to continue an unfinished test from the intro', async () => {
    const test = renderAt('/minigame/study-type/test')
    await screen.findByRole('heading', { level: 2 })
    await answerCurrent(preferFirst)
    test.unmount()

    renderAt('/minigame/study-type')
    expect(screen.getByRole('button', { name: '이어서 하기' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '처음부터 다시 하기' }))
    expect(loadSession()?.answers).toEqual({})
  })

  it('shows a shared result without answer shares and invites a new test', () => {
    const { router } = renderAt('/minigame/study-type/result/cafe-first')
    expect(screen.getByRole('heading', { name: '일단 카공부터형' })).toBeInTheDocument()
    expect(screen.queryByText('나의 공부 성향')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '결과 공유하기' })).not.toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: '나도 테스트하기' })[0]!)
    expect(router.state.location.pathname).toBe('/minigame/study-type')
  })

  it('sends an unknown address, including a raw type code, back to the intro', async () => {
    const { router } = renderAt('/minigame/study-type/result/PSA')
    await screen.findByRole('button', { name: '테스트 시작' })
    expect(router.state.location.pathname).toBe('/minigame/study-type')
  })
})
