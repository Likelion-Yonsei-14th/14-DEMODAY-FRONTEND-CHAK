import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NotificationProvider } from '@/design-system/overlays'
import { DEFAULT_ELECTIVES } from './examCareerConfig'
import { ExamCareerIntroPage, ExamCareerPlayPage, ExamCareerResultPage } from './ExamCareerPages'
import {
  acknowledgeNotice,
  chooseElectives,
  chooseEventOption,
  clearCareer,
  createCareer,
  loadCareer,
  nextExam,
  pendingEventOf,
  runExam,
  saveCareer,
  type CareerState,
} from './examCareerEngine'

function renderAt(path: string) {
  return render(
    <NotificationProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/" element={<p>서비스 홈</p>} />
          <Route path="/minigame/exam-career" element={<ExamCareerIntroPage />} />
          <Route path="/minigame/exam-career/play" element={<ExamCareerPlayPage />} />
          <Route path="/minigame/exam-career/result/:code" element={<ExamCareerResultPage />} />
        </Routes>
      </MemoryRouter>
    </NotificationProvider>,
  )
}

/** Plays a saved career with the engine until the check passes. */
function playEngineUntil(seed: string, done: (state: CareerState) => boolean) {
  let state = createCareer(seed, 'humanities')
  while (!done(state)) {
    state =
      state.status === 'choosing'
        ? chooseElectives(state, state.electives ?? DEFAULT_ELECTIVES.humanities)
        : state.status === 'event'
          ? chooseEventOption(state, pendingEventOf(state)!.options[0]!.id)
          : state.status === 'notice'
            ? acknowledgeNotice(state)
            : runExam(state)
  }
  return state
}

/** A saved career that has just finished its 현역 CSAT. */
function saveAtFirstCsat(seed = 'page-csat') {
  const state = playEngineUntil(seed, (current) => current.status === 'decision')
  saveCareer({ state })
  return state
}

function startCareer(track: '문과' | '이과') {
  renderAt('/minigame/exam-career')
  fireEvent.change(screen.getByLabelText('이름'), { target: { value: '지수' } })
  fireEvent.click(screen.getByRole('radio', { name: track }))
  fireEvent.click(screen.getByRole('button', { name: '커리어 시작' }))
}

/** Picks the first option if a choice event popup is open, and reads an outcome shown at once. */
function answerEvent() {
  const group = screen.queryByRole('group', { name: '이벤트 선택지' })
  if (group) fireEvent.click(within(group).getAllByRole('button')[0]!)
  const confirm = screen.queryByRole('button', { name: '확인' })
  if (confirm) fireEvent.click(confirm)
  return Boolean(group || confirm)
}

const PROCEED = /^다음 시험|넘어가기$|^선택과목 최종 확정하기$|^수능 보러 가기$/

/** Keeps answering events and pressing the main button until the check passes. */
function playUntil(done: () => boolean) {
  for (let count = 0; count < 40 && !done(); count += 1) {
    if (!answerEvent()) fireEvent.click(screen.getByRole('button', { name: PROCEED }))
  }
}

/** Lets the waiting screen run its course, one line at a time. */
function finishSuspense() {
  for (let count = 0; count < 5; count += 1) {
    act(() => {
      vi.advanceTimersByTime(1000)
    })
  }
}

afterEach(() => {
  vi.useRealTimers()
  clearCareer()
  window.localStorage.clear()
})

describe('exam career mini game', () => {
  it('needs a name and a 문과/이과 pick, then starts high school with a choice on the page', () => {
    renderAt('/minigame/exam-career')
    expect(screen.getByRole('heading', { name: '수험생 커리어 시뮬레이터' })).toBeInTheDocument()
    expect(screen.getByLabelText('이름')).not.toHaveAttribute('placeholder')
    expect(screen.getByRole('button', { name: '이름을 먼저 적어 주세요' })).toBeDisabled()
    fireEvent.click(screen.getByRole('radio', { name: '이과' }))
    expect(screen.getByRole('button', { name: '이름을 먼저 적어 주세요' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '   ' } })
    expect(screen.getByRole('button', { name: '이름을 먼저 적어 주세요' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '민준' } })
    // There are no play modes any more.
    expect(screen.queryByRole('radio', { name: /Full|Highlight/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '커리어 시작' }))

    // High school opens with a pick on the page itself, before any exam button.
    const entry = screen.getByRole('region', { name: '고등학교 입학' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^다음 시험/ })).not.toBeInTheDocument()
    fireEvent.click(within(entry).getByRole('button', { name: /전교 1등을 노린다/ }))

    // Then the March exam is offered; the pick's outcome comes out with it.
    expect(screen.queryByRole('region', { name: '고등학교 입학' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '고1 3월 학평을 앞두고 있어요' })).toBeInTheDocument()
    expect(loadCareer()!.state.history).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: '다음 시험 · 고1 3월 학평' }))
    expect(screen.getByRole('heading', { name: '3월 학평' })).toBeInTheDocument()
    expect(screen.getByText('고등학교 입학 · 전교 1등을 노린다')).toBeInTheDocument()
    for (const subject of ['국어', '수학', '영어']) {
      expect(screen.getAllByText(subject).length).toBeGreaterThan(0)
    }
    expect(screen.getByText('통합사회')).toBeInTheDocument()
    expect(screen.getByText('통합과학')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '다음 시험 · 고1 6월 학평' }))
    const style = screen.getByRole('dialog', { name: '고1 공부 스타일' })
    fireEvent.click(within(style).getByRole('button', { name: /학원 종합반 등록/ }))
    expect(screen.getByRole('heading', { name: '6월 학평' })).toBeInTheDocument()
    expect(screen.getByText('고1 공부 스타일 · 학원 종합반 등록')).toBeInTheDocument()
    expect(loadCareer()?.state.pendingRecords).toHaveLength(0)
    expect(loadCareer()?.state.profile.track).toBe('science')
    expect(loadCareer()?.state.profile.name).toBe('민준')
    expect(screen.getByText('민준 · 이과 · 현역')).toBeInTheDocument()
  })

  it('moves on to the next school year with its electives, and confirms them last before the September 모의평가', () => {
    startCareer('문과')
    playUntil(() => screen.queryByRole('heading', { name: '10월 학평' }) !== null)
    expect(loadCareer()!.state.history.at(-1)!.examId).toBe('g1-10')

    fireEvent.click(screen.getByRole('button', { name: '고2로 넘어가기' }))
    // This student's 스터디카페 moment may come right here.
    answerEvent()
    const picker = screen.getByRole('region', { name: '고2가 됐어요. 선택과목을 정해 주세요' })
    // The choice has the page to itself.
    expect(screen.queryByRole('heading', { name: '10월 학평' })).not.toBeInTheDocument()
    // Nothing is picked in advance.
    expect(within(picker).queryAllByRole('radio', { checked: true })).toHaveLength(0)
    expect(within(picker).getByRole('button', { name: '과목을 모두 골라 주세요' })).toBeDisabled()
    fireEvent.click(within(picker).getByRole('radio', { name: '화법과 작문' }))
    fireEvent.click(within(picker).getByRole('radio', { name: '미적분' }))
    expect(within(picker).getByRole('button', { name: '과목을 모두 골라 주세요' })).toBeDisabled()
    fireEvent.click(within(picker).getByRole('radio', { name: '혼합 (사탐+과탐)' }))
    fireEvent.click(within(picker).getByRole('button', { name: '이대로 시작하기' }))

    expect(loadCareer()!.state.electives).toEqual({ korean: 'speech-writing', math: 'calculus', inquiry: 'mixed' })
    // The 고1 October results do not come back: the 고2 March exam is next.
    expect(screen.queryByRole('heading', { name: '10월 학평' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '고2 3월 학평을 앞두고 있어요' })).toBeInTheDocument()
    expect(screen.getByText('선택과목: 화법과 작문 · 미적분 · 혼합 (사탐+과탐)')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '다음 시험 · 고2 3월 학평' }))
    expect(screen.getByText('미적분')).toBeInTheDocument()
    expect(screen.getByText('화법과 작문')).toBeInTheDocument()
    expect(screen.getByText('사회탐구')).toBeInTheDocument()
    expect(screen.getByText('과학탐구')).toBeInTheDocument()

    // 고3 brings another chance to change, starting from the current picks.
    playUntil(() => screen.queryByRole('region', { name: '고3이 됐어요. 선택과목을 바꿀 수 있어요' }) !== null)
    expect(loadCareer()!.state.history.at(-1)!.examId).toBe('g2-10')
    const senior = screen.getByRole('region', { name: '고3이 됐어요. 선택과목을 바꿀 수 있어요' })
    expect(within(senior).getByRole('radio', { name: '미적분' })).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(within(senior).getByRole('radio', { name: '확률과 통계' }))
    expect(within(senior).getByText('수학 과목을 바꿔요.')).toBeInTheDocument()
    fireEvent.click(within(senior).getByRole('button', { name: '이대로 고3 시작하기' }))
    expect(loadCareer()!.state.electives?.math).toBe('probability')

    // After the July mock, the last change comes before moving on to September.
    // After the July mock: the summer event first, then the last electives change, then September.
    playUntil(() => screen.queryByRole('heading', { name: '7월 학평' }) !== null)
    fireEvent.click(screen.getByRole('button', { name: '다음 시험 · 고3 9월 모의평가' }))
    const summer = screen.getByRole('dialog', { name: '고3 여름방학' })
    fireEvent.click(within(summer).getByRole('button', { name: /실전 모의고사 반복/ }))
    const last = screen.getByRole('region', { name: '선택과목을 바꿀 마지막 기회예요' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '7월 학평' })).not.toBeInTheDocument()
    fireEvent.click(within(last).getByRole('button', { name: '최종 확정하기' }))
    expect(screen.getByRole('heading', { name: '고3 9월 모의평가를 앞두고 있어요' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '다음 시험 · 고3 9월 모의평가' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '9월 모의평가' })).toBeInTheDocument()
    expect(screen.getByText('고3 여름방학 · 실전 모의고사 반복')).toBeInTheDocument()
  }, 30_000)

  it('waits a moment before showing the CSAT results', () => {
    vi.useFakeTimers()
    const atEve = playEngineUntil('page-suspense', (current) => nextExam(current)?.id === 'g3-csat' && current.status === 'event')
    // Single, so no breakup gets in the way.
    saveCareer({ state: { ...atEve, flags: [] } })
    renderAt('/minigame/exam-career/play')

    // The D-30 pick pops up over the October results; the CSAT then waits for its own button.
    expect(screen.getByRole('heading', { name: '10월 학평' })).toBeInTheDocument()
    const eve = screen.getByRole('dialog', { name: '수능 D-30' })
    fireEvent.click(within(eve).getAllByRole('button')[0]!)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '10월 학평' })).toBeInTheDocument()
    expect(loadCareer()!.state.history.at(-1)!.examId).toBe('g3-10')
    fireEvent.click(screen.getByRole('button', { name: '수능 보러 가기' }))
    expect(screen.getByRole('status', { name: '수능 채점 중' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '수능' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '대학 지원하기' })).not.toBeInTheDocument()

    finishSuspense()
    expect(screen.queryByRole('status', { name: '수능 채점 중' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '수능' })).toBeInTheDocument()
    expect(screen.getByText(/^수능 D-30 · /)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '대학 지원하기' })).toBeInTheDocument()
  })

  it('keeps the grade chart and the exam history folded until their titles are pressed', () => {
    const state = saveAtFirstCsat()
    renderAt('/minigame/exam-career/play')

    for (const title of ['성적 변화', `전체 시험 기록 (${state.history.length}회)`]) {
      const card = screen.getByText(title).closest('details')!
      expect(card).not.toHaveAttribute('open')
      fireEvent.click(screen.getByText(title))
      expect(card).toHaveAttribute('open')
      fireEvent.click(screen.getByText(title))
      expect(card).not.toHaveAttribute('open')
    }
  })

  it('pops up the 스터디카페 outcome at once, then runs the exam', () => {
    let seed = 0
    while (createCareer(`page-cafe-${seed}`, 'humanities').profile.studyCafeExamId !== 'g1-10') seed += 1
    const before = playEngineUntil(`page-cafe-${seed}`, (current) => current.history.at(-1)?.examId === 'g1-09')
    saveCareer({ state: before })
    renderAt('/minigame/exam-career/play')

    fireEvent.click(screen.getByRole('button', { name: '다음 시험 · 고1 10월 학평' }))
    const cafe = screen.getByRole('dialog', { name: '스터디카페의 운명의 짝' })
    // Only the actions are shown.
    expect(within(cafe).getAllByRole('button').map((button) => button.textContent)).toEqual([
      '용기를 내서 연락처를 물어본다',
      '함께 공부하자고 제안한다',
      '지금은 공부가 먼저다',
    ])
    fireEvent.click(within(cafe).getByRole('button', { name: '함께 공부하자고 제안한다' }))

    const outcome = screen.getByRole('dialog', { name: '스터디카페의 운명의 짝 · 함께 공부하자고 제안한다' })
    expect(loadCareer()!.state.history).toHaveLength(before.history.length)
    expect(screen.queryByRole('button', { name: /^다음 시험/ })).not.toBeInTheDocument()
    fireEvent.click(within(outcome).getByRole('button', { name: '확인' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '10월 학평' })).toBeInTheDocument()
    expect(loadCareer()!.state.history.at(-1)!.examId).toBe('g1-10')
  })

  it('shows a breakup on the page after the D-30 pick, before the CSAT button', () => {
    let atEve: CareerState | null = null
    for (let index = 0; index < 200 && !atEve; index += 1) {
      const candidate = playEngineUntil(
        `page-breakup-${index}`,
        (current) => nextExam(current)?.id === 'g3-csat' && current.status === 'event',
      )
      const dating = { ...candidate, flags: ['dating' as const] }
      if (chooseEventOption(dating, 'timed').status === 'notice') atEve = dating
    }
    saveCareer({ state: atEve! })
    renderAt('/minigame/exam-career/play')

    fireEvent.click(within(screen.getByRole('dialog', { name: '수능 D-30' })).getByRole('button', { name: /실전처럼 시간 재고 풀기/ }))
    const notice = screen.getByRole('region', { name: '수능 30일 전, 이별' })
    expect(screen.queryByRole('button', { name: '수능 보러 가기' })).not.toBeInTheDocument()
    fireEvent.click(within(notice).getByRole('button', { name: '마음 추스르기' }))
    expect(screen.queryByRole('region', { name: '수능 30일 전, 이별' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '수능 보러 가기' })).toBeInTheDocument()
  })

  it('asks how to spend the retake year, then brings the friends at university, then the electives', () => {
    const before = saveAtFirstCsat()
    renderAt('/minigame/exam-career/play')
    expect(screen.getByText('수능이 끝났어요. 어떻게 할까요?')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '재수 도전하기' }))
    const life = screen.getByRole('dialog', { name: '재수 생활' })
    fireEvent.click(within(life).getByRole('button', { name: /재수종합반/ }))
    const friends = screen.getByRole('dialog', { name: '대학 간 친구들의 연락' })
    fireEvent.click(within(friends).getByRole('button', { name: /공부에 집중한다/ }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(loadCareer()!.state.history).toHaveLength(before.history.length)

    const picker = screen.getByRole('region', { name: '새 수능 준비를 시작해요' })
    fireEvent.click(within(picker).getByRole('radio', { name: '기하' }))
    expect(within(picker).getByText('수학 과목을 바꿔요.')).toBeInTheDocument()
    fireEvent.click(within(picker).getByRole('button', { name: '이대로 준비하기' }))

    // Only now does the June mock come up, and it runs straight away.
    expect(screen.getByRole('heading', { name: '재수 6월 모의평가를 앞두고 있어요' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '다음 시험 · 재수 6월 모의평가' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('대학 간 친구들의 연락 · 공부에 집중한다')).toBeInTheDocument()
    expect(screen.getByText('6평 성적표')).toBeInTheDocument()
    const after = loadCareer()!.state
    expect(after.attempt).toBe(1)
    expect(after.history.slice(0, before.history.length)).toEqual(before.history)
    expect(after.history.at(-1)!.examId).toBe('n1-06p')
    expect(after.history.at(-1)!.electives?.math).toBe('geometry')
    expect(screen.getByText('재수 생활 · 재수종합반')).toBeInTheDocument()
  })

  it('applies to universities, waits for the results and ends with a career summary', () => {
    vi.useFakeTimers()
    saveAtFirstCsat('page-summary')
    renderAt('/minigame/exam-career/play')
    fireEvent.click(screen.getByRole('button', { name: '대학 지원하기' }))

    const form = screen.getByRole('region', { name: '정시 원서를 넣어 볼까요?' })
    expect(within(form).queryAllByRole('radio', { checked: true })).toHaveLength(0)
    expect(within(form).getByRole('button', { name: '가·나·다군을 모두 골라 주세요' })).toBeDisabled()
    for (const group of ['가군', '나군', '다군']) {
      const options = within(form).getByRole('radiogroup', { name: `${group} 지원 대학` })
      expect(within(options).getAllByRole('radio').map((radio) => radio.querySelector('strong')!.textContent)).toEqual([
        'SKY',
        '인서울 상위권 대학',
        '인서울 중하위권 대학',
        '지역 거점 국립대',
        '지방 4년제 대학',
        '전문대학',
      ])
      fireEvent.click(within(options).getByRole('radio', { name: /전문대학/ }))
    }
    fireEvent.click(within(form).getByRole('button', { name: '원서 접수하기' }))

    expect(screen.getByRole('status', { name: '합격 발표 중' })).toBeInTheDocument()
    // The CSAT blackboard steps aside while waiting.
    expect(screen.queryByRole('heading', { name: '수능' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: /합격 발표가 났어요!|아쉽게도 모두 불합격이에요/ })).not.toBeInTheDocument()
    finishSuspense()

    const results = screen.getByRole('region', { name: /합격 발표가 났어요!|아쉽게도 모두 불합격이에요/ })
    expect(screen.getByRole('heading', { name: '수능' })).toBeInTheDocument()
    expect(within(results).getAllByRole('listitem')).toHaveLength(3)
    // The CSAT under the results shows its grades only, without its events.
    const csatCard = screen.getByRole('heading', { name: '수능' }).closest('section')!
    expect(csatCard.querySelector('.exam-career-events')).toBeNull()
    const enrollButton = within(results).queryAllByRole('button', { name: /진학하기$/ })[0]
    fireEvent.click(enrollButton ?? within(results).getByRole('button', { name: '진학하지 않고 마무리하기' }))

    expect(screen.getByRole('heading', { name: '수험 생활 끝!' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '진학 결과' })).toBeInTheDocument()
    expect(loadCareer()!.state.status).toBe('finished')
    expect(screen.getByText('수험생 · 현역 · 최종 수능')).toBeInTheDocument()
    // The chart and the major events stay folded until their titles are pressed.
    for (const title of ['전체 성적 변화', /^주요 이벤트 \(\d+\)$/]) {
      const card = screen.getByText(title).closest('details')!
      expect(card).not.toHaveAttribute('open')
      fireEvent.click(screen.getByText(title))
      expect(card).toHaveAttribute('open')
    }
    expect(screen.getByRole('img', { name: /성적 변화 그래프/ })).toBeInTheDocument()

    // The result can be shared as a link and saved as an image.
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', { value: share, configurable: true })
    fireEvent.click(screen.getByRole('button', { name: '결과 공유하기' }))
    expect(share).toHaveBeenCalledTimes(1)
    // The link is the last word of the shared text.
    const sharedUrl = share.mock.calls[0]![0].text.split(' ').at(-1)
    expect(sharedUrl).toMatch(/\/minigame\/exam-career\/result\/h0-[1-9]{5}-\d{3}-[a-z-]+$/)
    expect(sharedUrl).not.toContain('수험생')
    Reflect.deleteProperty(navigator, 'share')
    expect(screen.getByRole('button', { name: '이미지 저장하기' })).toBeInTheDocument()

    // Starting over goes back to setting up a new student.
    fireEvent.click(screen.getByRole('button', { name: '다시 시작하기' }))
    expect(screen.getByRole('heading', { name: '수험생 커리어 시뮬레이터' })).toBeInTheDocument()
    expect(screen.getByLabelText('이름')).toHaveValue('')
    expect(loadCareer()).toBeNull()
  })

  it('shows a shared result with an invitation, and sends a broken link to the intro', () => {
    renderAt('/minigame/exam-career/result/s1-21312-110-seoul-upper')
    expect(screen.getByRole('heading', { name: '친구의 수험 생활 결과' })).toBeInTheDocument()
    expect(screen.getByText('이과 · 재수 · 최종 수능')).toBeInTheDocument()
    expect(screen.getByText('미적분')).toBeInTheDocument()
    expect(screen.getByText('인서울 상위권 대학 자연·공학계열 진학')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '나도 해보기' }))
    expect(screen.getByRole('heading', { name: '수험생 커리어 시뮬레이터' })).toBeInTheDocument()
    cleanup()

    renderAt('/minigame/exam-career/result/s1-21312-110-harvard')
    expect(screen.getByRole('heading', { name: '수험생 커리어 시뮬레이터' })).toBeInTheDocument()
  })

  it('sends a visit without a saved career back to the intro', () => {
    renderAt('/minigame/exam-career/play')
    expect(screen.getByRole('heading', { name: '수험생 커리어 시뮬레이터' })).toBeInTheDocument()
  })
})
