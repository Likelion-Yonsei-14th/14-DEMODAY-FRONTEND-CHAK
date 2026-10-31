import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationProvider } from '@/design-system/overlays'
import { usePrototypeStore } from '@/store/prototypeStore'
import type { Message } from '@/types'

const loader = vi.hoisted(() => ({ loadOwnerDesk: vi.fn() }))
vi.mock('@/api/config', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/api/config')>()), isApiEnabled: true }))
vi.mock('@/api/ownerLoader', () => loader)

import { MessageViewerPage } from './MessageViewerPage'

const OPENED_AT = new Date(Date.now() - 60_000).toISOString()

// What the backend sends for a letter that was still locked: no contents.
const lockedCopy = {
  id: '7',
  backgroundAssetId: '',
  textElements: [],
  wordArtElements: [],
  stickerElements: [],
  photoElements: [],
  pages: [],
  visibility: 'private',
  senderName: '민준',
  kind: 'card',
  recipientDeskId: '1',
  createdAt: new Date(Date.now() - 3_600_000).toISOString(),
  unlockAt: OPENED_AT,
  status: 'sent',
} as unknown as Message

function renderViewer() {
  return render(
    <NotificationProvider>
      <MemoryRouter initialEntries={['/prototype/my/message/7']}>
        <Routes>
          <Route path="/prototype/my/message/:messageId" element={<MessageViewerPage />} />
        </Routes>
      </MemoryRouter>
    </NotificationProvider>,
  )
}

describe('a letter that opened after the list was loaded', () => {
  beforeEach(() => {
    Element.prototype.scrollTo = vi.fn()
    loader.loadOwnerDesk.mockReset()
    usePrototypeStore.setState({ messages: [lockedCopy] })
  })

  it('reloads the letters and shows the contents instead of an empty card', async () => {
    loader.loadOwnerDesk.mockImplementation(async () => {
      usePrototypeStore.setState({
        messages: [
          {
            ...lockedCopy,
            pages: [
              {
                id: 'p1',
                backgroundAssetId: '',
                textElements: [{ id: 't', text: '시험 잘 봐', x: 0.5, y: 0.5 }],
                wordArtElements: [],
                stickerElements: [],
                photoElements: [],
              },
            ],
          } as unknown as Message,
        ],
      })
    })

    renderViewer()

    await screen.findByText('민준의 응원')
    expect(screen.queryByText(/불러오지 못했어요/)).toBeNull()
    expect(loader.loadOwnerDesk).toHaveBeenCalledTimes(1)
  })

  it('says so, once, when the letter still has no contents after reloading', async () => {
    loader.loadOwnerDesk.mockResolvedValue(undefined)

    renderViewer()

    await screen.findByText('응원 내용을 불러오지 못했어요. 새로고침해 주세요.')
    expect(loader.loadOwnerDesk).toHaveBeenCalledTimes(1)
  })

  it('does not reload when the failure of the reload itself is the only problem, and says so', async () => {
    loader.loadOwnerDesk.mockRejectedValue(new TypeError('Failed to fetch'))

    renderViewer()

    await screen.findByText('응원 내용을 불러오지 못했어요. 새로고침해 주세요.')
    expect(loader.loadOwnerDesk).toHaveBeenCalledTimes(1)
  })

  it('shows the lock notice, and never reloads, for a letter that is still locked', async () => {
    usePrototypeStore.setState({
      messages: [{ ...lockedCopy, unlockAt: new Date(Date.now() + 3_600_000).toISOString() }],
    })

    renderViewer()

    await screen.findByText(/에 열 수 있어요\./)
    expect(loader.loadOwnerDesk).not.toHaveBeenCalled()
  })

  it('does not reload for a letter that already has its contents', async () => {
    usePrototypeStore.setState({
      messages: [
        {
          ...lockedCopy,
          pages: [{ id: 'p1', backgroundAssetId: '', textElements: [], wordArtElements: [], stickerElements: [], photoElements: [] }],
        } as unknown as Message,
      ],
    })

    renderViewer()

    await screen.findByText('민준의 응원')
    expect(loader.loadOwnerDesk).not.toHaveBeenCalled()
  })

  it('opens a sticker without waiting for contents', async () => {
    usePrototypeStore.setState({
      messages: [{ ...lockedCopy, kind: 'sticker', stickerId: 'sticker-heart' } as unknown as Message],
    })

    renderViewer()

    await screen.findByText(/스티커예요\./)
    expect(loader.loadOwnerDesk).not.toHaveBeenCalled()
  })

  it('says the letter cannot be found when the id is not in the list', async () => {
    usePrototypeStore.setState({ messages: [] })

    renderViewer()

    await screen.findByText('이 응원을 찾지 못했어요.')
    expect(loader.loadOwnerDesk).not.toHaveBeenCalled()
  })
})

describe('a friend reading a public letter on a supporter link', () => {
  beforeEach(() => {
    Element.prototype.scrollTo = vi.fn()
    loader.loadOwnerDesk.mockReset()
    usePrototypeStore.setState({ messages: [{ ...lockedCopy, visibility: 'public' }] })
  })

  it('never triggers the owner reload, which would need a login the friend does not have', async () => {
    render(
      <NotificationProvider>
        <MemoryRouter initialEntries={['/desk/0b1e2f3a-1111-4222-8333-444455556666/message/7']}>
          <Routes>
            <Route path="/desk/:supporterToken/message/:messageId" element={<MessageViewerPage />} />
          </Routes>
        </MemoryRouter>
      </NotificationProvider>,
    )

    await screen.findByText('민준의 응원')
    expect(loader.loadOwnerDesk).not.toHaveBeenCalled()
  })
})
