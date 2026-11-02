import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { NotificationProvider } from '@/design-system/overlays'
import { fetchFavoriteDesks } from '@/api/favorites'
import { peekLoginReturn } from '@/features/chaltteok/returnFlow'
import { usePrototypeStore } from '@/store/prototypeStore'
import { FavoriteDeskButton } from './FavoriteDeskButton'
import { FavoriteDesksPage } from './FavoriteDesksPage'

const TOKEN = '11111111-1111-4111-8111-111111111111'

function renderDesk() {
  return render(
    <NotificationProvider>
      <MemoryRouter initialEntries={[`/desk/${TOKEN}`]}>
        <Routes>
          <Route path="/desk/:supporterToken" element={<FavoriteDeskButton supporterToken={TOKEN} displayName="지수" />} />
          <Route path="/auth/login" element={<p>로그인 화면</p>} />
        </Routes>
      </MemoryRouter>
    </NotificationProvider>,
  )
}

function renderList() {
  return render(
    <NotificationProvider>
      <MemoryRouter initialEntries={['/favorite-desks']}>
        <Routes>
          <Route path="/favorite-desks" element={<FavoriteDesksPage />} />
          <Route path="/desk/:supporterToken" element={<p>책상 화면</p>} />
        </Routes>
      </MemoryRouter>
    </NotificationProvider>,
  )
}

const signIn = () =>
  usePrototypeStore.setState({ authSession: { status: 'authenticated', userId: 1 } as never })

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  usePrototypeStore.setState({ authSession: { status: 'anonymous' } })
})

describe('favorite desks', () => {
  it('asks a signed-out supporter to log in instead of leaving the desk', async () => {
    renderDesk()

    fireEvent.click(screen.getByRole('button', { name: '즐겨찾기' }))

    expect(await screen.findByText('로그인하면 지수님의 책상을 즐겨찾기에 추가할 수 있어요.')).toBeInTheDocument()
    expect(screen.queryByText('로그인 화면')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByText('로그인 화면')).toBeInTheDocument()
    expect(peekLoginReturn()?.path).toBe(`/desk/${TOKEN}`)
  })

  it('lets a signed-out supporter keep browsing without logging in', async () => {
    renderDesk()

    fireEvent.click(screen.getByRole('button', { name: '즐겨찾기' }))
    fireEvent.click(await screen.findByRole('button', { name: '로그인 없이 둘러보기' }))

    expect(screen.queryByText('로그인하면 지수님의 책상을 즐겨찾기에 추가할 수 있어요.')).not.toBeInTheDocument()
    expect(screen.queryByText('로그인 화면')).not.toBeInTheDocument()
    expect(peekLoginReturn()).toBeNull()
  })

  it('stars the desk they tried to star once they come back logged in', async () => {
    renderDesk()
    fireEvent.click(screen.getByRole('button', { name: '즐겨찾기' }))
    fireEvent.click(await screen.findByRole('button', { name: '로그인' }))

    signIn()
    renderDesk()

    expect(await screen.findByRole('button', { name: '즐겨찾기에서 빼기' })).toHaveAttribute('aria-pressed', 'true')
    expect(await fetchFavoriteDesks()).toEqual([expect.objectContaining({ supporterToken: TOKEN, displayName: '지수' })])
  })

  it('adds and removes a desk for a signed-in supporter', async () => {
    signIn()
    renderDesk()

    fireEvent.click(await screen.findByRole('button', { name: '즐겨찾기' }))
    expect(await screen.findByRole('button', { name: '즐겨찾기에서 빼기' })).toBeInTheDocument()
    expect(await fetchFavoriteDesks()).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: '즐겨찾기에서 빼기' }))
    expect(await screen.findByRole('button', { name: '즐겨찾기' })).toBeInTheDocument()
    expect(await fetchFavoriteDesks()).toHaveLength(0)
  })

  it('lists starred desks and opens one without its link', async () => {
    signIn()
    renderDesk()
    fireEvent.click(await screen.findByRole('button', { name: '즐겨찾기' }))
    await screen.findByRole('button', { name: '즐겨찾기에서 빼기' })

    renderList()
    fireEvent.click(await screen.findByRole('button', { name: /지수님의 책상/ }))

    expect(await screen.findByText('책상 화면')).toBeInTheDocument()
  })

  it('offers a login on the list page when signed out', () => {
    renderList()

    expect(screen.getByText('로그인하면 친구의 책상을 즐겨찾기에 추가할 수 있어요.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument()
  })
})
