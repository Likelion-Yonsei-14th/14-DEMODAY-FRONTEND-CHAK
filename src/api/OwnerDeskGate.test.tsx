import { act, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePrototypeStore } from '@/store/prototypeStore'

const loader = vi.hoisted(() => ({ loadOwnerDesk: vi.fn(), loadReactions: vi.fn() }))
vi.mock('@/api/config', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/api/config')>()), isApiEnabled: true }))
vi.mock('@/api/ownerLoader', () => loader)

import { OwnerDeskGate } from './DeskGates'

function setVisibility(state: 'hidden' | 'visible') {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state })
  document.dispatchEvent(new Event('visibilitychange'))
}

const renderGate = () =>
  render(
    <MemoryRouter initialEntries={['/my']}>
      <Routes>
        <Route element={<OwnerDeskGate />}>
          <Route path="/my" element={<p>내 책상</p>} />
        </Route>
        <Route path="/auth/login" element={<p>로그인</p>} />
      </Routes>
    </MemoryRouter>,
  )

describe('OwnerDeskGate', () => {
  beforeEach(() => {
    loader.loadOwnerDesk.mockReset().mockResolvedValue(undefined)
    usePrototypeStore.setState({ authSession: { status: 'authenticated', userId: 1 } as never })
    vi.useFakeTimers({ toFake: ['Date'] })
  })

  afterEach(() => {
    vi.useRealTimers()
    setVisibility('visible')
  })

  it('loads the desk once on entry', async () => {
    renderGate()

    await screen.findByText('내 책상')
    expect(loader.loadOwnerDesk).toHaveBeenCalledTimes(1)
  })

  it('reloads the letters when the page comes back after being hidden for a while', async () => {
    renderGate()
    await screen.findByText('내 책상')

    act(() => setVisibility('hidden'))
    vi.setSystemTime(Date.now() + 60_000)
    act(() => setVisibility('visible'))

    await waitFor(() => expect(loader.loadOwnerDesk).toHaveBeenCalledTimes(2))
    // The desk stays on screen during the reload; no flash back to the loading notice.
    expect(screen.getByText('내 책상')).toBeInTheDocument()
  })

  it('does not reload for a quick switch away and back', async () => {
    renderGate()
    await screen.findByText('내 책상')

    act(() => setVisibility('hidden'))
    vi.setSystemTime(Date.now() + 5_000)
    act(() => setVisibility('visible'))

    expect(loader.loadOwnerDesk).toHaveBeenCalledTimes(1)
  })

  it('keeps the desk when the quiet reload fails', async () => {
    renderGate()
    await screen.findByText('내 책상')
    loader.loadOwnerDesk.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    act(() => setVisibility('hidden'))
    vi.setSystemTime(Date.now() + 60_000)
    act(() => setVisibility('visible'))

    await waitFor(() => expect(loader.loadOwnerDesk).toHaveBeenCalledTimes(2))
    expect(screen.getByText('내 책상')).toBeInTheDocument()
  })

  it('sends a signed-out visitor to login without loading anything', () => {
    usePrototypeStore.setState({ authSession: { status: 'anonymous' } as never })

    renderGate()

    expect(screen.getByText('로그인')).toBeInTheDocument()
    expect(loader.loadOwnerDesk).not.toHaveBeenCalled()
  })
})
