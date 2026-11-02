import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationProvider } from '@/design-system/overlays'
import type { ApiReply, ApiSentMessage } from '@/api/types'

const api = vi.hoisted(() => ({
  fetchSentMessages: vi.fn(),
  fetchRepliesToMe: vi.fn(),
}))
vi.mock('@/api/config', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/api/config')>()), isApiEnabled: true }))
vi.mock('@/api/community', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/api/community')>()), ...api }))

import { MyLettersPage } from './MyLettersPage'

const letter = (id: number, deskName: string | null, supporterToken: string | null, text: string): ApiSentMessage =>
  ({
    messageId: id,
    deskName,
    supporterToken,
    kind: 'CARD',
    visibility: 'PUBLIC',
    status: 'READ',
    deletable: false,
    schemaVersion: 1,
    card: { pages: [{ textElements: [{ text }] }] },
    object: null,
    unlockAt: null,
    readAt: null,
    createdAt: '2026-11-01T09:00:00Z',
  }) as unknown as ApiSentMessage

const reply = (id: number, targets: number[], ownerName: string, text: string): ApiReply => ({
  id,
  scope: 'SINGLE',
  sourceMessageId: targets[0] ?? null,
  targetMessageIds: targets,
  targetSenderNames: ['나'],
  ownerName,
  text,
  createdAt: '2026-11-02T09:00:00Z',
})

beforeEach(() => {
  api.fetchSentMessages.mockReset()
  api.fetchRepliesToMe.mockReset()
  window.localStorage.clear()
})

function renderPage() {
  return render(
    <NotificationProvider>
      <MemoryRouter initialEntries={['/letters']}>
        <Routes>
          <Route path="/letters" element={<MyLettersPage />} />
          <Route path="/desk/:supporterToken" element={<p>책상 화면</p>} />
        </Routes>
      </MemoryRouter>
    </NotificationProvider>,
  )
}

describe('my letters page', () => {
  it('shows letters from every desk with the reply under the letter it answers', async () => {
    api.fetchSentMessages.mockResolvedValue({
      content: [letter(1, '지수', 'jisu-token', '수능 화이팅'), letter(2, '민호', 'minho-token', '밥 잘 챙겨 먹어')],
      hasNext: false,
    })
    api.fetchRepliesToMe.mockResolvedValue([reply(10, [1], '지수', '고마워!')])
    renderPage()

    expect(await screen.findByText('지수님의 책상')).toBeInTheDocument()
    expect(screen.getByText('민호님의 책상')).toBeInTheDocument()
    expect(await screen.findByText('고마워!')).toBeInTheDocument()
    const replied = screen.getByText('지수님의 책상').closest('article')!
    expect(replied).toHaveTextContent('답장')
    expect(within(replied).getByLabelText('새 답장')).toBeInTheDocument()
    expect(replied).toHaveTextContent('지수님의 답장')
    expect(screen.getByText('민호님의 책상').closest('article')).not.toHaveTextContent('답장')
  })

  it('marks a reply as new only until the page has shown it once', async () => {
    api.fetchSentMessages.mockResolvedValue({ content: [letter(1, '지수', 'jisu-token', '화이팅')], hasNext: false })
    api.fetchRepliesToMe.mockResolvedValue([reply(10, [1], '지수', '고마워!')])
    const first = renderPage()
    expect(await screen.findByLabelText('새 답장')).toBeInTheDocument()
    first.unmount()

    renderPage()
    expect(await screen.findByText('고마워!')).toBeInTheDocument()
    expect(screen.queryByLabelText('새 답장')).not.toBeInTheDocument()
  })

  it('opens the desk the letter was left on without typing its link', async () => {
    api.fetchSentMessages.mockResolvedValue({ content: [letter(1, '지수', 'jisu-token', '화이팅')], hasNext: false })
    api.fetchRepliesToMe.mockResolvedValue([])
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: '책상 가기' }))

    expect(await screen.findByText('책상 화면')).toBeInTheDocument()
  })

  it('offers no desk link for a desk that is gone', async () => {
    api.fetchSentMessages.mockResolvedValue({ content: [letter(1, null, null, '화이팅')], hasNext: false })
    api.fetchRepliesToMe.mockResolvedValue([])
    renderPage()

    expect(await screen.findByText('사라진 책상')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '책상 가기' })).not.toBeInTheDocument()
  })
})
