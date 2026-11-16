import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { Poll } from '@/api/polls'
import { headline, leaderIndex, opensLabel, percentages, sortForDisplay } from './pollResults'

const api = vi.hoisted(() => ({ fetchPolls: vi.fn(), votePoll: vi.fn() }))
vi.mock('@/api/polls', () => api)
vi.mock('@/api/config', () => ({ isApiEnabled: true }))

import { PollCard } from './PollCard'
import { TodayPollCard } from './TodayPollCard'
import { kstInputToIso } from '../admin/adminFormat'

const base: Poll = {
  id: 1,
  slug: '2026-exam-korean',
  tag: '수능 당일',
  question: '국어, 체감 난이도는?',
  opensAt: '2026-11-19T07:40:00Z',
  closesAt: null,
  status: 'open',
  options: [
    { id: 11, label: '불수능' },
    { id: 12, label: '평이했어' },
    { id: 13, label: '물수능' },
  ],
  myOptionId: null,
  myRegion: null,
  results: null,
}

const voted: Poll = {
  ...base,
  myOptionId: 11,
  myRegion: '서울',
  results: {
    total: 120,
    counts: [80, 30, 10],
    regions: [
      { region: '경기', total: 50, counts: [40, 5, 5] },
      { region: '서울', total: 30, counts: [10, 15, 5] },
    ],
  },
}

describe('poll results math', () => {
  it('rounds to whole percentages that add up to 100', () => {
    expect(percentages([1, 1, 1])).toEqual([34, 33, 33])
    expect(percentages([2, 1])).toEqual([67, 33])
    expect(percentages([0, 0])).toEqual([0, 0])
    expect(percentages([80, 30, 10]).reduce((a, b) => a + b, 0)).toBe(100)
  })

  it('names the leading answer and hides small counts', () => {
    expect(leaderIndex([3, 5, 5])).toBe(1)
    expect(leaderIndex([0, 0])).toBe(-1)
    expect(headline(voted, voted.results!)).toBe('불수능 67% · 120명 참여')
    expect(headline(voted, { total: 5, counts: [5, 0, 0], regions: [] })).toBe('불수능 100% · 아직 모으는 중')
  })

  it('shows open questions first, then the next to open, then closed ones', () => {
    const polls: Poll[] = [
      { ...base, id: 1, status: 'closed' },
      { ...base, id: 2, status: 'upcoming', opensAt: '2026-11-20T00:00:00Z' },
      { ...base, id: 3, status: 'open' },
      { ...base, id: 4, status: 'upcoming', opensAt: '2026-11-19T07:40:00Z' },
    ]
    expect(sortForDisplay(polls).map((p) => p.id)).toEqual([3, 4, 2, 1])
  })

  it('says when a question opens in Korean time', () => {
    expect(opensLabel('2026-11-19T07:40:00Z')).toBe('11월 19일 오후 4:40에 열려요')
    expect(kstInputToIso('2026-11-19T16:40')).toBe('2026-11-19T07:40:00.000Z')
    expect(kstInputToIso('nope')).toBeNull()
  })
})

describe('poll card', () => {
  it('hides the results until an answer is picked, then shows them nationally and by region', async () => {
    api.votePoll.mockResolvedValue(voted)
    let current = base
    const view = render(<PollCard poll={current} onChange={(next) => (current = next)} />)
    expect(screen.queryByText('67%')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '불수능' }))
    await waitFor(() => expect(api.votePoll).toHaveBeenCalledWith(1, 11))
    view.rerender(<PollCard poll={current} onChange={() => undefined} />)

    expect(screen.getByText('67%')).toBeInTheDocument()
    expect(screen.getByText('120명 참여')).toBeInTheDocument()
    expect(screen.getByLabelText('내 선택')).toBeInTheDocument()
    // 내 지역이 먼저 나온다
    const scopes = screen.getAllByRole('button', { pressed: false }).map((b) => b.textContent)
    expect(scopes[0]).toBe('서울 (내 지역)')
    fireEvent.click(screen.getByRole('button', { name: '서울 (내 지역)' }))
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('서울 30명 참여')).toBeInTheDocument()
  })

  it('cannot be answered before it opens and says when it opens', () => {
    render(<PollCard poll={{ ...base, status: 'upcoming' }} onChange={() => undefined} />)
    expect(screen.getByRole('button', { name: '불수능' })).toBeDisabled()
    expect(screen.getByText(/11월 19일 오후 4:40에 열려요/)).toBeInTheDocument()
  })

  it('tells the visitor when the vote did not go through', async () => {
    api.votePoll.mockRejectedValue(new Error('offline'))
    render(<PollCard poll={base} onChange={() => undefined} />)
    fireEvent.click(screen.getByRole('button', { name: '물수능' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('투표하지 못했어요')
  })
})

describe('today poll card', () => {
  it('puts the first unanswered open question on the first screen', async () => {
    api.fetchPolls.mockResolvedValue({
      now: '2026-11-19T08:00:00Z',
      polls: [voted, { ...base, id: 2, question: '수학, 체감 난이도는?' }, { ...base, id: 3, question: '영어, 체감 난이도는?' }],
    })
    render(
      <MemoryRouter>
        <TodayPollCard />
      </MemoryRouter>,
    )
    expect(await screen.findByText('수학, 체감 난이도는?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /질문 1개 더/ })).toBeInTheDocument()
  })

  it('keeps the answered question on screen with its results and moves on only when asked', async () => {
    const second = { ...base, id: 2, question: '수학, 체감 난이도는?' }
    api.fetchPolls.mockResolvedValue({ now: '2026-11-19T08:00:00Z', polls: [base, second] })
    api.votePoll.mockResolvedValue(voted)
    render(
      <MemoryRouter>
        <TodayPollCard />
      </MemoryRouter>,
    )
    fireEvent.click(await screen.findByRole('button', { name: '불수능' }))
    expect(await screen.findByText('67%')).toBeInTheDocument()
    expect(screen.getByText('국어, 체감 난이도는?')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /다음 질문: 수학, 체감 난이도는\?/ }))
    expect(screen.getByText('수학, 체감 난이도는?')).toBeInTheDocument()
  })

  it('draws nothing when the questions cannot be loaded', async () => {
    api.fetchPolls.mockRejectedValue(new Error('offline'))
    const { container } = render(
      <MemoryRouter>
        <TodayPollCard />
      </MemoryRouter>,
    )
    await waitFor(() => expect(api.fetchPolls).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })
})
