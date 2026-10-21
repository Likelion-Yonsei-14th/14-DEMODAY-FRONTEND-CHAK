import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { NotificationProvider } from '@/design-system/overlays'
import { usePrototypeStore } from '@/store/prototypeStore'
import { DeskSettingsPage } from './DeskManagementPages'

const setClosed = (roomClosed: boolean) =>
  act(() => usePrototypeStore.getState().updateOwnerSettings({ roomClosed }))

afterEach(() => setClosed(false))

function renderSettings() {
  render(
    <NotificationProvider>
      <MemoryRouter initialEntries={['/prototype/my/settings']}>
        <DeskSettingsPage />
      </MemoryRouter>
    </NotificationProvider>,
  )
}

describe('desk settings: reopening', () => {
  it('offers to close while the desk is open', () => {
    setClosed(false)
    renderSettings()
    expect(screen.getByRole('button', { name: '응원 받기 종료' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '응원 다시 받기' })).not.toBeInTheDocument()
  })

  it('reopens a closed desk from settings', () => {
    setClosed(true)
    renderSettings()
    expect(screen.getByText('응원 받기가 종료된 상태예요.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '응원 받기 종료' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '응원 다시 받기' }))

    expect(usePrototypeStore.getState().ownerSettings.roomClosed).toBe(false)
    expect(screen.getByText('다시 응원을 받을 수 있어요.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '응원 받기 종료' })).toBeInTheDocument()
  })
})
