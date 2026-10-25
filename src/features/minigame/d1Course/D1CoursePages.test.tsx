import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { saveD1CourseResponse } from '@/api/d1Course'
import { NotificationProvider } from '@/design-system/overlays'
import { D1CourseIntroPage, D1CoursePlayPage, D1CourseResultPage } from './D1CoursePages'

vi.mock('@/api/d1Course', () => ({ saveD1CourseResponse: vi.fn() }))

const saved = vi.mocked(saveD1CourseResponse)

function renderAt(path: string) {
  return render(
    <NotificationProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/" element={<p>서비스 홈</p>} />
          <Route path="/minigame/d1-course" element={<D1CourseIntroPage />} />
          <Route path="/minigame/d1-course/play" element={<D1CoursePlayPage />} />
          <Route path="/minigame/d1-course/result/:code" element={<D1CourseResultPage />} />
        </Routes>
      </MemoryRouter>
    </NotificationProvider>,
  )
}

const pick = (group: string, option: string) =>
  fireEvent.click(within(screen.getByRole('radiogroup', { name: group })).getByRole('radio', { name: option }))

const next = () => fireEvent.click(screen.getByRole('button', { name: /^다음$|^코스 완성하기$/ }))

function playToResult(nickname = '') {
  renderAt('/minigame/d1-course')
  if (nickname) fireEvent.change(screen.getByLabelText(/^닉네임/), { target: { value: nickname } })
  fireEvent.click(screen.getByRole('button', { name: '코스 짜러 가기' }))

  pick('출발 시·도', '서울')
  pick('서울 출발 지역', '마포구')
  next()
  pick('놀러 갈 곳', '홍대')
  next()
  const activities = screen.getByRole('group', { name: '하고 싶은 것' })
  for (const name of ['염색', '사진관', '방탈출']) {
    fireEvent.click(within(activities).getByRole('button', { name }))
  }
  next()
  pick('같이 갈 사람', '2~3명')
  pick('예산', '3~10만 원')
  next()
}

afterEach(() => {
  cleanup()
  saved.mockClear()
})

describe('d1 course pages', () => {
  it('says on the start screen that answers are only used as statistics', () => {
    renderAt('/minigame/d1-course')
    expect(screen.getByText('응답은 통계로만 쓰여요.')).toBeInTheDocument()
  })

  it('walks the four questions to the course card and saves one answer without the nickname', () => {
    playToResult('지수')

    expect(screen.getByRole('heading', { name: '지수의 수능 끝 코스' })).toBeInTheDocument()
    expect(screen.getByText('홍대')).toBeInTheDocument()
    const stops = within(screen.getByRole('list')).getAllByRole('listitem').map((item) => item.textContent)
    expect(stops).toEqual(['염색', '사진관', '방탈출'])

    expect(saved).toHaveBeenCalledTimes(1)
    const response = saved.mock.calls[0]![0]
    expect(response).toEqual({
      responseId: expect.any(String),
      startRegion: 'seoul',
      startDistrict: '마포구',
      area: 'hongdae',
      activities: ['dye', 'photo', 'escape'],
      companion: 'small',
      budget: '30kTo100k',
      shared: false,
    })
    expect(JSON.stringify(response)).not.toContain('지수')
  })

  it('marks the same answer as shared once, on the first share', () => {
    playToResult()
    fireEvent.click(screen.getByRole('button', { name: '결과 공유하기' }))
    fireEvent.click(screen.getByRole('button', { name: '결과 공유하기' }))

    expect(saved).toHaveBeenCalledTimes(2)
    const [first, second] = saved.mock.calls.map(([response]) => response)
    expect(second).toEqual({ ...first, shared: true })
  })

  it('caps the activities at three and needs every answer before moving on', () => {
    renderAt('/minigame/d1-course/play')
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled()
    pick('출발 시·도', '세종')
    next()
    pick('놀러 갈 곳', '성수')
    next()

    const activities = screen.getByRole('group', { name: '하고 싶은 것' })
    for (const name of ['노래방', '맛집']) fireEvent.click(within(activities).getByRole('button', { name }))
    expect(screen.getByRole('button', { name: '1개 더 골라 주세요' })).toBeDisabled()
    fireEvent.click(within(activities).getByRole('button', { name: '렌즈' }))
    expect(within(activities).getByRole('button', { name: '옷 쇼핑' })).toBeDisabled()

    fireEvent.click(within(activities).getByRole('button', { name: /노래방/ }))
    expect(within(activities).getByRole('button', { name: '옷 쇼핑' })).toBeEnabled()
    expect(saved).not.toHaveBeenCalled()
  })

  it('asks where in the region, every 구·시·군 in 가나다 order', () => {
    renderAt('/minigame/d1-course/play')
    const regions = within(screen.getByRole('radiogroup', { name: '출발 시·도' })).getAllByRole('radio')
    expect(regions).toHaveLength(17)

    pick('출발 시·도', '서울')
    expect(screen.getByRole('heading', { name: '서울 어디?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '출발 지역을 골라 주세요' })).toBeDisabled()
    const seoul = within(screen.getByRole('radiogroup', { name: '서울 출발 지역' })).getAllByRole('radio')
    expect(seoul).toHaveLength(25)
    expect(seoul[0]).toHaveTextContent('강남구')

    pick('출발 시·도', '경기')
    expect(screen.queryByRole('radiogroup', { name: '서울 출발 지역' })).not.toBeInTheDocument()
    const gyeonggi = within(screen.getByRole('radiogroup', { name: '경기 출발 지역' })).getAllByRole('radio')
    expect(gyeonggi).toHaveLength(31)
    expect(gyeonggi[0]).toHaveTextContent('가평군')
    expect(gyeonggi.at(-1)).toHaveTextContent('화성시')
    pick('경기 출발 지역', '수원시')
    next()

    const areas = within(screen.getByRole('radiogroup', { name: '놀러 갈 곳' })).getAllByRole('radio')
    expect(areas.map((item) => item.textContent)).toEqual(['홍대', '강남', '잠실', '성수', '신촌', '건대', '우리 동네'])
  })

  it('lists companions and budgets in a fixed order', () => {
    renderAt('/minigame/d1-course/play')
    pick('출발 시·도', '세종')
    next()
    pick('놀러 갈 곳', '잠실')
    next()
    const activities = screen.getByRole('group', { name: '하고 싶은 것' })
    for (const name of ['놀이공원', '맛집', '사진관']) fireEvent.click(within(activities).getByRole('button', { name }))
    next()
    const companions = within(screen.getByRole('radiogroup', { name: '같이 갈 사람' })).getAllByRole('radio')
    expect(companions.map((item) => item.textContent)).toEqual(['혼자', '2~3명', '4명+', '가족'])
    const budgets = within(screen.getByRole('radiogroup', { name: '예산' })).getAllByRole('radio')
    expect(budgets.map((item) => item.textContent)).toEqual(['~3만 원', '3~10만 원', '10만 원+'])
  })

  it('puts the start on the card when the place is 우리 동네', () => {
    renderAt('/minigame/d1-course/play')
    pick('출발 시·도', '부산')
    pick('부산 출발 지역', '해운대구')
    next()
    pick('놀러 갈 곳', '우리 동네')
    next()
    const activities = screen.getByRole('group', { name: '하고 싶은 것' })
    for (const name of ['맛집', '노래방', '옷 쇼핑']) fireEvent.click(within(activities).getByRole('button', { name }))
    next()
    pick('같이 갈 사람', '혼자')
    pick('예산', '~3만 원')
    next()

    expect(screen.getByText('부산 해운대구 우리 동네')).toBeInTheDocument()
    expect(saved.mock.calls[0]![0]).toMatchObject({ startRegion: 'busan', startDistrict: '해운대구', area: 'local' })
  })

  it('shows a shared course without saving anything, and sends bad links back to the start', () => {
    renderAt('/minigame/d1-course/result/seongsu-food-karaoke-license')
    expect(screen.getByRole('heading', { name: '친구의 수능 끝 코스' })).toBeInTheDocument()
    expect(screen.getByText('성수')).toBeInTheDocument()
    expect(screen.getByText('운전면허 학원')).toBeInTheDocument()
    expect(saved).not.toHaveBeenCalled()
    cleanup()

    renderAt('/minigame/d1-course/result/nowhere')
    expect(screen.getByRole('button', { name: '코스 짜러 가기' })).toBeInTheDocument()
  })
})
