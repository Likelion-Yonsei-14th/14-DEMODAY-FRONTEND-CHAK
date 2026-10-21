import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationProvider } from '@/design-system'
import { usePrototypeStore } from '@/store/prototypeStore'

const config = vi.hoisted(() => ({ api: true }))
vi.mock('@/api/config', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/config')>()),
  get isApiEnabled() {
    return config.api
  },
}))

import { DeskCreateWhoPage } from './DeskCreationPages'

function renderPage() {
  return render(
    <NotificationProvider>
      <MemoryRouter>
        <DeskCreateWhoPage />
      </MemoryRouter>
    </NotificationProvider>,
  )
}

describe('desk creation: who is it for', () => {
  beforeEach(() => {
    usePrototypeStore.getState().setDeskCreationDraft({ createdFor: undefined })
  })

  it('shows the friend desk as coming soon when a backend is connected', () => {
    config.api = true
    renderPage()
    const friend = screen.getByRole('button', { name: /친구나 지인을 위한 책상/ })
    expect(friend).toBeDisabled()
    expect(friend).toHaveTextContent('아직 준비 중')
  })

  it('ignores a friend-desk choice left over from before, so Next stays off', () => {
    config.api = true
    usePrototypeStore.getState().setDeskCreationDraft({ createdFor: 'other' })
    renderPage()
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled()
  })

  it('keeps the option in the offline prototype', () => {
    config.api = false
    renderPage()
    expect(screen.getByRole('button', { name: /친구나 지인을 위한 책상/ })).toBeEnabled()
  })
})
