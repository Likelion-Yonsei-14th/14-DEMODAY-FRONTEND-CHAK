import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationProvider } from '@/design-system/overlays'
import { mockCurrentUser } from '@/prototype/mock/initialState'
import { usePrototypeStore } from '@/store/prototypeStore'

const photo = vi.hoisted(() => ({ makeProfilePhoto: vi.fn() }))
vi.mock('./profilePhoto', () => photo)

import { AccountPage } from './AccountPages'
import { ProfileEditPage } from './ProfileEditPage'

const PHOTO = 'data:image/jpeg;base64,AAAA'

function renderAt(path: string) {
  return render(
    <NotificationProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/account" element={<AccountPage />} />
          <Route path="/account/profile" element={<ProfileEditPage />} />
          <Route path="/auth/login" element={<p>로그인 화면</p>} />
        </Routes>
      </MemoryRouter>
    </NotificationProvider>,
  )
}

const saveButton = () => screen.getByRole('button', { name: '저장하기' })
const nameField = () => screen.getByLabelText(/^이름/)

function pickFile() {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]')!
  fireEvent.change(input, { target: { files: [new File(['x'], 'me.png', { type: 'image/png' })] } })
}

describe('profile edit', () => {
  beforeEach(() => {
    photo.makeProfilePhoto.mockReset()
    act(() => {
      usePrototypeStore.setState({ currentUser: { ...mockCurrentUser } })
      usePrototypeStore.getState().signIn('jisu@gmail.com', 'google')
    })
  })

  afterEach(() => {
    act(() => usePrototypeStore.getState().signOut())
  })

  it('opens from the profile card in 내 계정', () => {
    renderAt('/account')

    fireEvent.click(screen.getByRole('button', { name: /프로필 수정/ }))

    expect(screen.getByRole('heading', { name: '프로필 수정' })).toBeInTheDocument()
    expect(nameField()).toHaveValue('지수')
  })

  it('saves a new name and goes back to 내 계정', async () => {
    renderAt('/account/profile')
    expect(saveButton()).toBeDisabled()

    fireEvent.change(nameField(), { target: { value: '  지수짱 ' } })
    fireEvent.click(saveButton())

    expect(usePrototypeStore.getState().currentUser.displayName).toBe('지수짱')
    expect(await screen.findByRole('button', { name: /지수짱.*프로필 수정/ })).toBeInTheDocument()
  })

  it('does not save an empty name', () => {
    renderAt('/account/profile')

    fireEvent.change(nameField(), { target: { value: '   ' } })

    expect(screen.getByText('이름을 적어 주세요.')).toBeInTheDocument()
    expect(saveButton()).toBeDisabled()
  })

  it('saves a picked photo, and can remove it again', async () => {
    photo.makeProfilePhoto.mockResolvedValue(PHOTO)
    renderAt('/account/profile')

    pickFile()
    await screen.findByRole('button', { name: '사진 지우기' })
    fireEvent.click(saveButton())

    expect(usePrototypeStore.getState().currentUser.profileImageUrl).toBe(PHOTO)

    fireEvent.click(await screen.findByRole('button', { name: /프로필 수정/ }))
    fireEvent.click(screen.getByRole('button', { name: '사진 지우기' }))
    fireEvent.click(saveButton())

    expect(usePrototypeStore.getState().currentUser.profileImageUrl).toBeUndefined()
  })

  it('says why a photo could not be used', async () => {
    photo.makeProfilePhoto.mockRejectedValue(new Error('이미지 파일만 고를 수 있어요.'))
    renderAt('/account/profile')

    pickFile()

    expect(await screen.findByRole('alert')).toHaveTextContent('이미지 파일만 고를 수 있어요.')
    expect(saveButton()).toBeDisabled()
  })

  it('needs a login', () => {
    act(() => usePrototypeStore.getState().signOut())
    renderAt('/account/profile')

    expect(screen.getByText('로그인 화면')).toBeInTheDocument()
  })
})

describe('profile across server logins', () => {
  const server = (id: number, displayName: string) => ({ id, displayName, email: `${id}@x.com`, provider: 'KAKAO' as const })

  beforeEach(() => {
    act(() => usePrototypeStore.setState({ currentUser: { ...mockCurrentUser }, lastLogin: null }))
  })

  it('keeps this device’s edits when the same account signs in again', () => {
    const store = usePrototypeStore.getState()
    act(() => {
      store.signInWithServer(server(7, '카카오이름'))
      store.updateProfile({ displayName: '고친이름', profileImageUrl: PHOTO })
      store.signOut()
      store.signInWithServer(server(7, '카카오이름'))
    })

    expect(usePrototypeStore.getState().currentUser).toMatchObject({ displayName: '고친이름', profileImageUrl: PHOTO })
  })

  it('does not show one account’s photo to another account on the same device', () => {
    const store = usePrototypeStore.getState()
    act(() => {
      store.signInWithServer(server(7, '카카오이름'))
      store.updateProfile({ displayName: '고친이름', profileImageUrl: PHOTO })
      store.signOut()
      store.signInWithServer(server(8, '다른사람'))
    })

    expect(usePrototypeStore.getState().currentUser.displayName).toBe('다른사람')
    expect(usePrototypeStore.getState().currentUser.profileImageUrl).toBeUndefined()
  })
})
