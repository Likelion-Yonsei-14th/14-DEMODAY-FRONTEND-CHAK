import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationProvider } from '@/design-system/overlays'
import { SneakyPhoneIntroPage, SneakyPhonePlayPage } from './SneakyPhonePages'

function renderAt(path: string) {
  return render(
    <NotificationProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/" element={<p>서비스 홈</p>} />
          <Route path="/minigame/sneaky-phone" element={<SneakyPhoneIntroPage />} />
          <Route path="/minigame/sneaky-phone/play" element={<SneakyPhonePlayPage />} />
        </Routes>
      </MemoryRouter>
    </NotificationProvider>,
  )
}

const holdButton = () => screen.getByRole('button', { name: '몰래 폰 하기' })

/** Moves the fake clock (and the animation-frame loop with it). */
const wait = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms)
  })

beforeEach(() => {
  // random() = 0: board 0–2.4s, tell 2.4–2.8s, watching 2.8–3.8s.
  vi.spyOn(Math, 'random').mockReturnValue(0)
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
  window.localStorage.clear()
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  window.localStorage.clear()
})

describe('sneaky phone mini game', () => {
  it('explains the controls and shows the stored best on the intro', () => {
    window.localStorage.setItem('sneaky-phone-best', JSON.stringify({ version: 1, best: 1234 }))
    renderAt('/minigame/sneaky-phone')
    expect(screen.getByRole('heading', { name: '선생님 몰래 폰 하기' })).toBeInTheDocument()
    expect(screen.getByText('선생님이 칠판을 볼 때만 몰래 폰을 사용하세요!')).toBeInTheDocument()
    expect(screen.getByText('누르고 있으면 폰 사용, 손을 떼면 숨기기')).toBeInTheDocument()
    expect(screen.getByText('1,234점')).toBeInTheDocument()
    expect(document.body).not.toHaveTextContent(/×|배율/)
  })

  it('uses the phone only while the button is held', () => {
    renderAt('/minigame/sneaky-phone/play')
    expect(screen.getByText('폰 숨김')).toBeInTheDocument()
    expect(document.body).not.toHaveTextContent(/×|배율/)

    fireEvent.pointerDown(holdButton())
    expect(screen.getByText('폰 사용 중')).toBeInTheDocument()
    expect(holdButton()).toHaveAttribute('aria-pressed', 'true')
    wait(1_000)
    expect(document.body).not.toHaveTextContent(/×|배율/)
    // Letting go settles the score at the exact release time.
    fireEvent.pointerUp(holdButton())
    expect(screen.getByText('폰 숨김')).toBeInTheDocument()
    expect(screen.getByText('점수').nextSibling).toHaveTextContent('100')
    wait(500)
    expect(screen.getByText('점수').nextSibling).toHaveTextContent('100')
  })

  // 3 & 4. Sliding off the button or a cancelled touch both hide the phone.
  it('hides the phone when the pointer leaves or the touch is cancelled', () => {
    renderAt('/minigame/sneaky-phone/play')
    fireEvent.pointerDown(holdButton())
    fireEvent.pointerLeave(holdButton())
    expect(screen.getByText('폰 숨김')).toBeInTheDocument()

    fireEvent.pointerDown(holdButton())
    fireEvent.pointerCancel(holdButton())
    expect(screen.getByText('폰 숨김')).toBeInTheDocument()
  })

  // 5. Switching tabs or windows hides the phone.
  it('hides the phone when the window loses focus or the tab is hidden', () => {
    renderAt('/minigame/sneaky-phone/play')
    fireEvent.pointerDown(holdButton())
    act(() => {
      window.dispatchEvent(new Event('blur'))
    })
    expect(screen.getByText('폰 숨김')).toBeInTheDocument()

    fireEvent.pointerDown(holdButton())
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    visibility.mockRestore()
    expect(screen.getByText('폰 숨김')).toBeInTheDocument()
  })

  it('also works by holding the space bar', () => {
    renderAt('/minigame/sneaky-phone/play')
    fireEvent.keyDown(window, { code: 'Space', key: ' ' })
    expect(screen.getByText('폰 사용 중')).toBeInTheDocument()
    fireEvent.keyUp(window, { code: 'Space', key: ' ' })
    expect(screen.getByText('폰 숨김')).toBeInTheDocument()
  })

  it('ends with "들켰다" when the phone is out as the teacher turns, keeping the points', () => {
    renderAt('/minigame/sneaky-phone/play')
    fireEvent.pointerDown(holdButton())
    wait(3_000)

    expect(screen.getByRole('heading', { name: '선생님께 들켰다!' })).toBeInTheDocument()
    // Caught at 2.8s: 100 + 150 + 0.8 × 200.
    expect(screen.getByText('410', { selector: '.sneaky-result__score strong' })).toBeInTheDocument()
    expect(screen.getByText('휴대폰 총 사용 시간').nextSibling).toHaveTextContent('2.8초')
    expect(screen.getByText('버틴 시간').nextSibling).toHaveTextContent('2.8초')
    expect(screen.getByText('최고 점수 갱신!')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '몰래 폰 하기' })).not.toBeInTheDocument()

    // Nothing keeps running after the end.
    wait(5_000)
    expect(screen.getByText('410', { selector: '.sneaky-result__score strong' })).toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem('sneaky-phone-best')!).best).toBe(410)
  })

  it('pays the survival bonus after 30 seconds of good timing', () => {
    renderAt('/minigame/sneaky-phone/play')
    fireEvent.pointerDown(holdButton())
    wait(1_000)
    fireEvent.pointerUp(holdButton())
    wait(30_000)

    expect(screen.getByRole('heading', { name: '몰폰 성공!' })).toBeInTheDocument()
    expect(screen.getByText('기본 획득 점수').nextSibling).toHaveTextContent('100점')
    expect(screen.getByText('생존 보너스').nextSibling).toHaveTextContent('+500점')
    expect(screen.getByText('600', { selector: '.sneaky-result__score strong' })).toBeInTheDocument()
  })

  // 6. Retrying right away starts a clean round with no leftover state.
  it('starts a clean round on retry', () => {
    renderAt('/minigame/sneaky-phone/play')
    fireEvent.pointerDown(holdButton())
    wait(3_000)
    fireEvent.click(screen.getByRole('button', { name: '다시 도전하기' }))

    expect(screen.getByText('폰 숨김')).toBeInTheDocument()
    expect(screen.getByText('남은 시간').nextSibling).toHaveTextContent('30초')
    expect(screen.getByText('점수').nextSibling).toHaveTextContent('0')
    expect(screen.getByText('최고').nextSibling).toHaveTextContent('410')
    wait(1_000)
    expect(screen.getByText('점수').nextSibling).toHaveTextContent('0')
  })
})
