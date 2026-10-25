import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { usePrototypeStore } from '@/store/prototypeStore'
import { CharmPickPage } from './CharmPickPage'

const LOGIN_NOTE = /아크릴 3D는 로그인한 뒤 찰떡으로 구매해요/

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/desk/demo-token/charm']}>
      <Routes>
        <Route path="/desk/:supporterToken/charm" element={<CharmPickPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('charm pick page', () => {
  it('tells a guest before choosing that the paid material needs a login', () => {
    usePrototypeStore.setState({ authSession: { status: 'anonymous' } })
    renderPage()

    expect(screen.getByText(LOGIN_NOTE)).toBeInTheDocument()
  })

  it('hides the login note once signed in', () => {
    usePrototypeStore.setState({
      authSession: { status: 'authenticated', email: 'a@b.com', provider: 'google', userId: 5 },
    })
    renderPage()

    expect(screen.queryByText(LOGIN_NOTE)).toBeNull()
  })

  it('names each charm button by its visible phrase', () => {
    usePrototypeStore.setState({ authSession: { status: 'anonymous' } })
    renderPage()

    expect(screen.getByRole('button', { name: '철썩 합격' })).toBeInTheDocument()
  })
})
