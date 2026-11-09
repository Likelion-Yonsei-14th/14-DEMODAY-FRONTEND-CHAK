import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { usePrototypeStore } from '@/store/prototypeStore'
import { WelcomePage } from './WelcomePage'

function renderWelcome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/home" element={<p>홈 화면</p>} />
        <Route path="/create" element={<p>책상 만들기 첫 단계</p>} />
        <Route path="/start" element={<p>시작 화면</p>} />
        <Route path="/minigame/study-type" element={<p>유형 테스트 소개</p>} />
        <Route path="/minigame/guess-god" element={<p>찍신 소개</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('first screen', () => {
  beforeEach(() => {
    usePrototypeStore.setState({ authSession: { status: 'anonymous' }, lastLogin: null })
  })

  it('lets someone who is not signed in open a mini game, and says the ranking needs a login', () => {
    renderWelcome()

    expect(screen.getByText(/로그인 없이 바로 할 수 있어요/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /오늘의 찍신은 나야/ }))

    expect(screen.getByText('찍신 소개')).toBeInTheDocument()
  })

  it('offers every mini game without signing in', () => {
    renderWelcome()

    for (const title of ['나의 수험생 유형은?', '오늘의 찍신은 나야!', '수험생 커리어 시뮬레이터', '수능 끝 D+1 코스 짜기', '선생님 몰래 폰 하기']) {
      expect(screen.getByRole('button', { name: new RegExp(title.replace(/[?+!]/g, '\\$&')) })).toBeInTheDocument()
    }
  })

  it('leads a first-timer with no login history to making a desk', () => {
    renderWelcome()

    fireEvent.click(screen.getByRole('button', { name: '응원 책상 만들기' }))

    expect(screen.getByText('책상 만들기 첫 단계')).toBeInTheDocument()
  })

  it('only offers browsing without login to someone who has logged in here before', () => {
    renderWelcome()
    expect(screen.queryByRole('button', { name: '로그인 없이 둘러보기' })).not.toBeInTheDocument()
  })

  it('still lets a signed-out returning visitor browse without logging in', () => {
    usePrototypeStore.setState({ lastLogin: { provider: 'google', email: 'a@b.com' } })
    renderWelcome()

    fireEvent.click(screen.getByRole('button', { name: '로그인 없이 둘러보기' }))
    expect(screen.getByText('시작 화면')).toBeInTheDocument()
  })

  it('sends a signed-in member straight home instead', () => {
    usePrototypeStore.setState({
      authSession: { status: 'authenticated', email: 'a@b.com', provider: 'kakao', userId: 1 },
    })
    renderWelcome()

    expect(screen.getByText('홈 화면')).toBeInTheDocument()
  })
})
