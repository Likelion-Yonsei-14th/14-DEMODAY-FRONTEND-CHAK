import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({ fetchPublicDesk: vi.fn(), fetchPublicMessages: vi.fn() }))
vi.mock('@/api/config', () => ({ isApiEnabled: true }))
vi.mock('@/api/desks', () => api)
vi.mock('@/api/community', () => ({ fetchRepliesToMe: vi.fn().mockResolvedValue([]) }))
vi.mock('@/api/ownerLoader', () => ({ loadOwnerDesk: vi.fn(), loadReactions: vi.fn().mockResolvedValue({}) }))

import { cleanDeskToken } from './deskToken'
import { SupporterDeskGate } from './DeskGates'

const TOKEN = '0b1e2f3a-1111-4222-8333-444455556666'

describe('cleanDeskToken', () => {
  it('keeps a clean token and drops what sharing tools tack on the end', () => {
    expect(cleanDeskToken(TOKEN)).toBe(TOKEN)
    expect(cleanDeskToken(`${TOKEN}\\`)).toBe(TOKEN)
    expect(cleanDeskToken(`${TOKEN})`)).toBe(TOKEN)
    expect(cleanDeskToken(`${TOKEN}.`)).toBe(TOKEN)
    expect(cleanDeskToken(TOKEN.toUpperCase())).toBe(TOKEN.toUpperCase())
  })

  it('refuses anything that does not start with a token', () => {
    expect(cleanDeskToken('')).toBeNull()
    expect(cleanDeskToken('jisu')).toBeNull()
    expect(cleanDeskToken(`x${TOKEN}`)).toBeNull()
  })
})

function Where() {
  const location = useLocation()
  return <p data-testid="where">{location.pathname + location.search}</p>
}

describe('SupporterDeskGate', () => {
  beforeEach(() => {
    api.fetchPublicDesk.mockReset()
    api.fetchPublicMessages.mockReset()
    api.fetchPublicDesk.mockResolvedValue({
      id: 1, supporterToken: TOKEN, ownerName: '지수', publicFeedEnabled: true, roomClosed: false,
    })
    api.fetchPublicMessages.mockResolvedValue([])
  })

  const renderAt = (path: string) =>
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/desk/:supporterToken" element={<SupporterDeskGate />}>
            <Route index element={<Where />} />
            <Route path="compose" element={<Where />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

  it('sends a link with a trailing backslash to the clean address and asks the server only for the clean token', async () => {
    renderAt(`/desk/${TOKEN}%5C`)

    expect(await screen.findByTestId('where')).toHaveTextContent(`/desk/${TOKEN}`)
    expect(screen.getByTestId('where')).not.toHaveTextContent('%5C')
    await waitFor(() => expect(api.fetchPublicDesk).toHaveBeenCalled())
    expect(api.fetchPublicDesk.mock.calls.every(([token]) => token === TOKEN)).toBe(true)
  })

  it('keeps the rest of the path and the query when it cleans the token', async () => {
    renderAt(`/desk/${TOKEN}%5C/compose?from=share`)

    expect(await screen.findByTestId('where')).toHaveTextContent(`/desk/${TOKEN}/compose?from=share`)
  })

  it('says the link does not exist without calling the server when there is no token at all', () => {
    renderAt('/desk/nonsense')

    expect(screen.getByText('존재하지 않는 응원 링크예요.')).toBeInTheDocument()
    expect(api.fetchPublicDesk).not.toHaveBeenCalled()
  })
})
