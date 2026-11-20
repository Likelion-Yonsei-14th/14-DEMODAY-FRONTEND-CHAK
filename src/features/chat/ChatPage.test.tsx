import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/client'
import * as chatApi from '@/api/chat'
import { ChatPage } from './ChatPage'

vi.mock('@/api/chat', () => ({ askChat: vi.fn() }))
const askChat = vi.mocked(chatApi.askChat)

const renderPage = () =>
  render(
    <MemoryRouter>
      <ChatPage />
    </MemoryRouter>,
  )

describe('수능 도우미', () => {
  beforeEach(() => askChat.mockReset())

  it('answers with our discounts first and official sources', async () => {
    askChat.mockResolvedValue({
      answer: '성적은 12월 5일에 나와요 [1]',
      offTopic: false,
      discounts: [
        { id: 7, brand: '하우스틸츠', category: '운동·건강', benefit: '필라테스 1회 체험', area: '서울', endDate: '2026-12-31', sponsored: true, imageUrl: '/api/public/ads/creatives/4' },
        { id: 8, brand: 'CGV', category: '영화·공연', benefit: '관람 7,000원', area: '전국', endDate: null, sponsored: false, imageUrl: null },
      ],
      sources: [{ title: '평가원 보도자료', url: 'https://www.kice.re.kr/a', hostname: 'www.kice.re.kr' }],
    })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '수능 성적은 언제 나와?' }))

    expect(await screen.findByText('성적은 12월 5일에 나와요 [1]')).toBeInTheDocument()
    expect(askChat).toHaveBeenCalledWith([{ role: 'user', content: '수능 성적은 언제 나와?' }])
    expect(screen.getByRole('img', { name: /하우스틸츠/ })).toHaveAttribute('src', '/api/public/ads/creatives/4')
    expect(screen.getByText('CGV')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /평가원 보도자료/ })).toHaveAttribute('href', 'https://www.kice.re.kr/a')
  })

  it('shows every discount image the discounts page has, not only one sponsored banner', async () => {
    const reply = {
      answer: '혜택이에요',
      offTopic: false,
      discounts: [
        { id: 1, brand: '하우스틸츠', category: null, benefit: '체험', area: null, endDate: null, sponsored: true, imageUrl: '/ads/1' },
        { id: 2, brand: '스터디카페', category: null, benefit: '1시간 무료', area: null, endDate: null, sponsored: true, imageUrl: '/ads/2' },
        { id: 3, brand: 'CGV', category: null, benefit: '관람 7,000원', area: null, endDate: null, sponsored: false, imageUrl: 'https://img.example/cgv.jpg' },
        { id: 4, brand: '롯데월드', category: null, benefit: '자유이용권 할인', area: null, endDate: null, sponsored: false, imageUrl: null },
      ],
      sources: [],
    }
    askChat.mockResolvedValue(reply)
    const { container } = renderPage()
    fireEvent.click(screen.getByRole('button', { name: '수험표로 받을 수 있는 혜택 알려줘' }))
    await screen.findByText('혜택이에요')

    expect(screen.getByRole('img', { name: /하우스틸츠/ })).toHaveAttribute('src', '/ads/1')
    expect(screen.getByRole('img', { name: /스터디카페/ })).toHaveAttribute('src', '/ads/2')
    expect(container.querySelector('img[src="https://img.example/cgv.jpg"]')).not.toBeNull()
    expect(screen.getByText('CGV')).toBeInTheDocument()
    expect(screen.getByText('롯데월드')).toBeInTheDocument()

    // 같은 혜택이 다음 답에 또 나오면 배너는 다시 띄우지 않고 글로만 보인다.
    fireEvent.change(screen.getByRole('textbox', { name: '질문' }), { target: { value: '또 알려줘' } })
    fireEvent.click(screen.getByRole('button', { name: '보내기' }))
    await waitFor(() => expect(screen.getAllByText('혜택이에요')).toHaveLength(2))
    expect(screen.getAllByRole('img', { name: /하우스틸츠/ })).toHaveLength(1)
    expect(screen.getAllByText('하우스틸츠')).toHaveLength(1)
    expect(container.querySelectorAll('img[src="https://img.example/cgv.jpg"]')).toHaveLength(1)
  })

  it('sends the conversation and explains when too many questions were asked', async () => {
    askChat.mockResolvedValueOnce({ answer: '안녕하세요!', offTopic: false, discounts: [], sources: [] })
    askChat.mockRejectedValueOnce(new ApiError(429, { code: 'TOO_MANY_CHATS' }))
    renderPage()
    const box = screen.getByRole('textbox', { name: '질문' })
    fireEvent.change(box, { target: { value: '안녕' } })
    fireEvent.click(screen.getByRole('button', { name: '보내기' }))
    await screen.findByText('안녕하세요!')

    fireEvent.change(box, { target: { value: '정시 일정은?' } })
    fireEvent.keyDown(box, { key: 'Enter' })
    expect(await screen.findByText(/질문이 너무 많아요/)).toBeInTheDocument()
    expect(askChat).toHaveBeenLastCalledWith([
      { role: 'user', content: '안녕' },
      { role: 'assistant', content: '안녕하세요!' },
      { role: 'user', content: '정시 일정은?' },
    ])
  })
})
