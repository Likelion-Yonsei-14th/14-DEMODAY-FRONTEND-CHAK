import { fireEvent, render, screen } from '@testing-library/react'
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
        { id: 7, brand: '하우스틸츠', category: '운동·건강', benefit: '필라테스 1회 체험', area: '서울', endDate: '2026-12-31', sponsored: true, imageUrl: null },
      ],
      sources: [{ title: '평가원 보도자료', url: 'https://www.kice.re.kr/a', hostname: 'www.kice.re.kr' }],
    })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '수능 성적은 언제 나와?' }))

    expect(await screen.findByText('성적은 12월 5일에 나와요 [1]')).toBeInTheDocument()
    expect(askChat).toHaveBeenCalledWith([{ role: 'user', content: '수능 성적은 언제 나와?' }])
    expect(screen.getByText('하우스틸츠')).toBeInTheDocument()
    expect(screen.getByText('제휴')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /평가원 보도자료/ })).toHaveAttribute('href', 'https://www.kice.re.kr/a')
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
