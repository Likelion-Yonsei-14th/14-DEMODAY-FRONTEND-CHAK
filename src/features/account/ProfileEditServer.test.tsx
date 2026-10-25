import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/client'
import { NotificationProvider } from '@/design-system/overlays'
import { mockCurrentUser } from '@/prototype/mock/initialState'
import { usePrototypeStore } from '@/store/prototypeStore'

const profile = vi.hoisted(() => ({ changeDisplayName: vi.fn(), uploadAvatar: vi.fn(), deleteAvatar: vi.fn() }))
const photo = vi.hoisted(() => ({ makeProfilePhoto: vi.fn() }))
vi.mock('@/api/config', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/config')>()),
  isApiEnabled: true,
}))
vi.mock('@/api/profile', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/profile')>()),
  ...profile,
}))
vi.mock('./profilePhoto', () => photo)

import { ProfileEditPage } from './ProfileEditPage'

const PHOTO = 'data:image/jpeg;base64,AAAA'
const user = (extra: Record<string, unknown> = {}) => ({
  id: 7, displayName: '지수', email: 'a@b.com', profileImageUrl: null, avatarUrl: null, admin: false, provider: 'GOOGLE', ...extra,
})

function renderPage() {
  return render(
    <NotificationProvider>
      <MemoryRouter initialEntries={['/account/profile']}>
        <Routes>
          <Route path="/account/profile" element={<ProfileEditPage />} />
          <Route path="/account" element={<p>내 계정 화면</p>} />
        </Routes>
      </MemoryRouter>
    </NotificationProvider>,
  )
}

const saveButton = () => screen.getByRole('button', { name: '저장하기' })
const nameField = () => screen.getByLabelText(/^이름/)
const type = (value: string) => fireEvent.change(nameField(), { target: { value } })

beforeEach(() => {
  Object.values(profile).forEach((fn) => fn.mockReset())
  photo.makeProfilePhoto.mockReset()
  act(() => {
    usePrototypeStore.setState({ currentUser: { ...mockCurrentUser } })
    usePrototypeStore.getState().signIn('jisu@gmail.com', 'google')
  })
})

afterEach(() => act(() => usePrototypeStore.getState().signOut()))

describe('profile edit with a backend', () => {
  it('saves a new name to the server and shows the server’s answer', async () => {
    profile.changeDisplayName.mockResolvedValue(user({ displayName: '새 이름' }))
    renderPage()
    type('  새 이름 ')
    fireEvent.click(saveButton())

    expect(await screen.findByText('내 계정 화면')).toBeInTheDocument()
    expect(profile.changeDisplayName).toHaveBeenCalledWith('새 이름')
    expect(profile.uploadAvatar).not.toHaveBeenCalled()
    expect(usePrototypeStore.getState().currentUser.displayName).toBe('새 이름')
  })

  it('uploads a new photo and uses the address the server gives back', async () => {
    photo.makeProfilePhoto.mockResolvedValue(PHOTO)
    profile.uploadAvatar.mockResolvedValue(user({ avatarUrl: '/api/public/avatars/key-1' }))
    renderPage()
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!
    fireEvent.change(input, { target: { files: [new File(['x'], 'me.png', { type: 'image/png' })] } })
    await waitFor(() => expect(saveButton()).toBeEnabled())
    fireEvent.click(saveButton())

    await screen.findByText('내 계정 화면')
    expect(profile.uploadAvatar).toHaveBeenCalledWith(PHOTO)
    expect(profile.changeDisplayName).not.toHaveBeenCalled()
    expect(usePrototypeStore.getState().currentUser.profileImageUrl).toContain('/api/public/avatars/key-1')
  })

  it('removes the photo on the server when it is cleared', async () => {
    act(() => usePrototypeStore.getState().applyServerProfile({ displayName: '지수', avatarUrl: '/api/public/avatars/old' }))
    profile.deleteAvatar.mockResolvedValue(user())
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '사진 지우기' }))
    fireEvent.click(saveButton())

    await screen.findByText('내 계정 화면')
    expect(profile.deleteAvatar).toHaveBeenCalled()
    expect(usePrototypeStore.getState().currentUser.profileImageUrl).toBeUndefined()
  })

  it('says a word is not allowed on the name field and keeps the page open', async () => {
    profile.changeDisplayName.mockRejectedValue(new ApiError(400, { code: 'NICKNAME_NOT_ALLOWED', message: 'x' }))
    renderPage()
    type('못쓰는말')
    fireEvent.click(saveButton())

    expect(await screen.findByText('쓸 수 없는 표현이 들어 있어요. 다른 이름을 입력해 주세요.')).toBeInTheDocument()
    expect(screen.queryByText('내 계정 화면')).not.toBeInTheDocument()
    expect(usePrototypeStore.getState().currentUser.displayName).toBe('지수')   // 저장되지 않았으니 그대로

    type('다른이름')
    expect(screen.queryByText(/쓸 수 없는 표현/)).not.toBeInTheDocument()
  })

  it('checks the name format before asking the server', () => {
    renderPage()
    type('<b>x</b>')
    expect(screen.getByText('한글, 영문, 숫자, 공백, . _ - ( )만 쓸 수 있어요.')).toBeInTheDocument()
    expect(saveButton()).toBeDisabled()
    expect(profile.changeDisplayName).not.toHaveBeenCalled()
  })

  it('keeps a saved name when only the photo fails, and explains the photo problem', async () => {
    photo.makeProfilePhoto.mockResolvedValue(PHOTO)
    profile.changeDisplayName.mockResolvedValue(user({ displayName: '바뀐 이름' }))
    profile.uploadAvatar.mockRejectedValue(new ApiError(400, { code: 'INVALID_AVATAR', message: 'x' }))
    renderPage()
    type('바뀐 이름')
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!
    fireEvent.change(input, { target: { files: [new File(['x'], 'me.png', { type: 'image/png' })] } })
    await waitFor(() => expect(saveButton()).toBeEnabled())
    fireEvent.click(saveButton())

    expect(await screen.findByText('사진을 올리지 못했어요. 다른 사진으로 다시 시도해 주세요.')).toBeInTheDocument()
    expect(usePrototypeStore.getState().currentUser.displayName).toBe('바뀐 이름')
  })

  it('tells the player to wait on a rate limit or log in again when the login expired', async () => {
    profile.changeDisplayName.mockRejectedValueOnce(new ApiError(429, { code: 'TOO_MANY_EVENTS', message: 'x' }))
    renderPage()
    type('이름 하나')
    fireEvent.click(saveButton())
    expect(await screen.findByText('너무 자주 바꿨어요. 잠시 뒤에 다시 시도해 주세요.')).toBeInTheDocument()

    profile.changeDisplayName.mockRejectedValueOnce(new ApiError(401, { code: 'UNAUTHORIZED', message: 'x' }))
    fireEvent.click(saveButton())
    expect(await screen.findByText('로그인이 만료됐어요. 다시 로그인한 뒤 시도해 주세요.')).toBeInTheDocument()
  })
})
