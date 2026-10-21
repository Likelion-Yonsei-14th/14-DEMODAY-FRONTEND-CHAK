import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/client'
import { usePrototypeStore } from '@/store/prototypeStore'

const api = vi.hoisted(() => ({ fetchClaimPreview: vi.fn(), claimDesk: vi.fn() }))
vi.mock('@/api/desks', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/api/desks')>()), ...api }))
vi.mock('@/api/config', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/api/config')>()), isApiEnabled: true }))

import { ClaimLinkPage } from './ClaimLinkPage'

const preview = {
  displayName: '지수',
  creatorName: '민준',
  readModeType: 'TIME_CAPSULE' as const,
  dailyUnlockTime: null,
  capsuleUnlockAt: '2099-01-01T00:00:00Z',
  messageCount: 4,
  friendCount: 3,
}

const ownerDesk = {
  id: 9,
  displayName: '지수',
  supporterToken: 'sup-1',
  readModeType: 'TIME_CAPSULE' as const,
  dailyUnlockTime: null,
  capsuleUnlockAt: '2099-01-01T00:00:00Z',
  publicFeedEnabled: true,
  defaultMessageVisibility: 'PRIVATE' as const,
  roomClosed: false,
  pushEnabled: true,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/claim/tok-1']}>
      <Routes>
        <Route path="/claim/:claimToken" element={<ClaimLinkPage />} />
        <Route path="/auth/login" element={<p>로그인 화면</p>} />
        <Route path="/prototype/my/desk" element={<p>내 책상 화면</p>} />
        <Route path="/home" element={<p>홈 화면</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('claim link page', () => {
  beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset())
    sessionStorage.clear()
    usePrototypeStore.setState({ authSession: { status: 'authenticated', email: 'a@b.com', provider: 'google', userId: 5 } })
  })

  it('sends a signed-out visitor to log in and remembers to come back', () => {
    usePrototypeStore.setState({ authSession: { status: 'anonymous' } })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '로그인하고 책상 받기' }))
    expect(screen.getByText('로그인 화면')).toBeInTheDocument()
    expect(sessionStorage.getItem('chak:login-return')).toContain('/claim/tok-1')
    expect(api.fetchClaimPreview).not.toHaveBeenCalled()
  })

  it('shows who made it and only the counts, then asks "are you really them?" before claiming', async () => {
    api.fetchClaimPreview.mockResolvedValue(preview)
    api.claimDesk.mockResolvedValue({ desk: ownerDesk, messageCount: 4, friendCount: 3 })
    renderPage()

    expect(await screen.findByText(/민준님이 지수님을 위해/)).toBeInTheDocument()
    expect(screen.getByText('친구 3명이 응원 4개를 남겼어요.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '내 응원 책상 받기' }))
    expect(screen.getByRole('heading', { name: /지수님\s*본인이 맞나요/ })).toBeInTheDocument()
    expect(api.claimDesk).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: '네, 제가 지수님 본인이에요' }))
    await waitFor(() => expect(api.claimDesk).toHaveBeenCalledWith('tok-1', true))
    expect(await screen.findByText('이제 내 응원 책상이에요.')).toBeInTheDocument()
    expect(usePrototypeStore.getState().currentDesk.claimStatus).toBe('claimed')
  })

  it('"아니에요" leaves without claiming', async () => {
    api.fetchClaimPreview.mockResolvedValue(preview)
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: '내 응원 책상 받기' }))
    fireEvent.click(screen.getByRole('button', { name: '아니에요' }))
    expect(screen.getByText('홈 화면')).toBeInTheDocument()
    expect(api.claimDesk).not.toHaveBeenCalled()
  })

  it('explains a used or missing link', async () => {
    api.fetchClaimPreview.mockRejectedValue(new ApiError(404, { code: 'CLAIM_NOT_AVAILABLE' }))
    renderPage()
    expect(await screen.findByText(/이미 사용했거나/)).toBeInTheDocument()
  })

  it('tells someone who already has a desk that they cannot take another', async () => {
    api.fetchClaimPreview.mockResolvedValue(preview)
    api.claimDesk.mockRejectedValue(new ApiError(409, { code: 'DESK_ALREADY_EXISTS' }))
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: '내 응원 책상 받기' }))
    fireEvent.click(screen.getByRole('button', { name: '네, 제가 지수님 본인이에요' }))
    expect(await screen.findByText(/이미 내 응원 책상이/)).toBeInTheDocument()
    expect(screen.getByText(/한 사람에 하나/)).toBeInTheDocument()
  })
})
