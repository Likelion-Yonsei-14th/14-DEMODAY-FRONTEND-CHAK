import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationProvider } from '@/design-system/overlays'

const push = vi.hoisted(() => ({
  pushSupport: vi.fn(),
  isPushSubscribed: vi.fn(),
  enablePush: vi.fn(),
  disablePush: vi.fn(),
  notificationPermission: vi.fn(),
}))
vi.mock('@/api/config', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/api/config')>()), isApiEnabled: true }))
vi.mock('@/lib/push', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/push')>()), ...push }))

import { PushError } from '@/lib/push'
import { ReplyPushPrompt } from './ReplyPushPrompt'
import { SupporterSettingsPage } from './SupporterSettingsPage'

beforeEach(() => {
  Object.values(push).forEach((fn) => fn.mockReset())
  push.pushSupport.mockReturnValue('supported')
  push.isPushSubscribed.mockResolvedValue(false)
  push.notificationPermission.mockReturnValue('default')
})

function settings() {
  return render(
    <NotificationProvider>
      <MemoryRouter initialEntries={['/desk/tok/settings']}>
        <Routes>
          <Route path="/desk/:supporterToken/settings" element={<SupporterSettingsPage />} />
        </Routes>
      </MemoryRouter>
    </NotificationProvider>,
  )
}

describe('reply notification prompt after leaving a message', () => {
  it('asks, turns notifications on, and then says it will tell them', async () => {
    push.enablePush.mockResolvedValue(undefined)
    render(<ReplyPushPrompt />)

    fireEvent.click(await screen.findByRole('button', { name: '답장 알림 받기' }))

    expect(await screen.findByText('답장이 오면 알려 드릴게요.')).toBeInTheDocument()
    expect(push.enablePush).toHaveBeenCalledTimes(1)
  })

  it('shows why it failed and stays available', async () => {
    push.enablePush.mockRejectedValue(new PushError('identity-required'))
    render(<ReplyPushPrompt />)

    fireEvent.click(await screen.findByRole('button', { name: '답장 알림 받기' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('응원을 하나 남긴 뒤에')
    expect(screen.getByRole('button', { name: '답장 알림 받기' })).toBeInTheDocument()
  })

  it('stays out of the way where notifications cannot work or were refused', () => {
    for (const support of ['needs-install', 'in-app', 'unsupported']) {
      push.pushSupport.mockReturnValue(support)
      const view = render(<ReplyPushPrompt />)
      expect(view.container).toBeEmptyDOMElement()
      view.unmount()
    }
    push.pushSupport.mockReturnValue('supported')
    push.notificationPermission.mockReturnValue('denied')
    const denied = render(<ReplyPushPrompt />)
    expect(denied.container).toBeEmptyDOMElement()
  })
})

describe('reply notification switch in the supporter settings', () => {
  const toggle = () => screen.getByRole('checkbox', { name: /답장 알림 받기/ })

  it('turns notifications on and off for real', async () => {
    push.enablePush.mockResolvedValue(undefined)
    push.disablePush.mockResolvedValue(undefined)
    settings()

    fireEvent.click(toggle())
    await waitFor(() => expect(toggle()).toBeChecked())
    expect(push.enablePush).toHaveBeenCalled()

    fireEvent.click(toggle())
    await waitFor(() => expect(toggle()).not.toBeChecked())
    expect(push.disablePush).toHaveBeenCalled()
  })

  it('shows the current state when already subscribed', async () => {
    push.isPushSubscribed.mockResolvedValue(true)
    settings()
    await waitFor(() => expect(toggle()).toBeChecked())
  })

  it('explains iPhones and in-app browsers instead of pretending the switch works', () => {
    push.pushSupport.mockReturnValue('needs-install')
    settings()
    expect(toggle()).toBeDisabled()
    expect(screen.getByText(/홈 화면에 추가/)).toBeInTheDocument()
  })

  it('keeps the switch off and says what went wrong when permission is refused', async () => {
    push.enablePush.mockRejectedValue(new PushError('denied'))
    settings()

    fireEvent.click(toggle())

    expect(await screen.findByText(/알림이 허용되지 않았어요/)).toBeInTheDocument()
    expect(toggle()).not.toBeChecked()
  })
})
