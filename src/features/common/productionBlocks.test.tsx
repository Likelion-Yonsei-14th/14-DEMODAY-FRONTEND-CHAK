import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationProvider } from '@/design-system/overlays'
import { usePrototypeStore } from '@/store/prototypeStore'

vi.mock('@/features/minigame/MiniGameSection', () => ({ MiniGameSection: () => null }))

import { AccountPage } from '@/features/account/AccountPages'
import { ChargePage } from '@/features/chaltteok/ChargePage'
import { PaymentSheet } from '@/features/payment/PaymentSheet'
import { HomePage } from '@/features/start/HomePage'
import { StartPage } from '@/features/start/StartPage'

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>
}

function wrap(path: string, routes: React.ReactNode) {
  return render(
    <NotificationProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>{routes}</Routes>
      </MemoryRouter>
    </NotificationProvider>,
  )
}

beforeEach(() => {
  vi.stubEnv('PROD', true)
  act(() => usePrototypeStore.getState().signIn('jisu@gmail.com', 'google'))
})

afterEach(() => {
  vi.unstubAllEnvs()
  act(() => usePrototypeStore.getState().signOut())
})

describe('payments in a production build without server payments', () => {
  it('says payments are still being built instead of offering a mock charge, from the account page', () => {
    wrap('/account', (
      <>
        <Route path="/account" element={<AccountPage />} />
        <Route path="/chaltteok/charge" element={<p>충전 화면</p>} />
      </>
    ))

    expect(screen.getByText('찰떡 충전과 구매는 아직 개발 중이에요.')).toBeInTheDocument()
    expect(screen.queryByText('보유 찰떡')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '찰떡 충전하기' }))
    expect(screen.getByRole('dialog', { name: '결제는 아직 개발 중이에요' })).toBeInTheDocument()
    expect(screen.queryByText('충전 화면')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows the notice instead of the purchase sheet for any paid item and hands control back when closed', () => {
    const onClose = vi.fn()
    wrap('/x', (
      <Route
        path="/x"
        element={<PaymentSheet open items={[{ label: '아크릴 참', amount: 50, code: 'CHARM_ACRYLIC' }]} onClose={onClose} onConfirm={vi.fn()} />}
      />
    ))

    expect(screen.getByRole('dialog', { name: '결제는 아직 개발 중이에요' })).toBeInTheDocument()
    expect(screen.queryByText(/으로 구매하기|mock/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('does not open the charge page by address: it shows the notice and goes back', () => {
    wrap('/chaltteok/charge?returnTo=%2Faccount', (
      <>
        <Route path="/chaltteok/charge" element={<ChargePage />} />
        <Route path="/account" element={<Where />} />
      </>
    ))

    expect(screen.getByRole('dialog', { name: '결제는 아직 개발 중이에요' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /mock 충전/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(screen.getByTestId('where')).toHaveTextContent('/account')
  })

  it('refuses every 찰떡 call so nothing can be charged or spent locally', async () => {
    vi.resetModules()
    const { chaltteokApi } = await import('@/api/chaltteok')
    await expect(chaltteokApi.createChargeOrder(1000)).rejects.toMatchObject({ code: 'PAYMENT_NOT_CONFIGURED' })
    await expect(chaltteokApi.confirmCharge({ paymentKey: 'mock_x', orderId: 'x', amount: 1000 })).rejects.toMatchObject({ status: 503 })
    await expect(chaltteokApi.getBalance()).rejects.toMatchObject({ code: 'PAYMENT_NOT_CONFIGURED' })
    await expect(chaltteokApi.purchase([{ code: 'GEM' }])).rejects.toMatchObject({ code: 'PAYMENT_NOT_CONFIGURED' })
  })
})

describe('classroom entries in a production build', () => {
  it('home: the class door and the start flow say it is in development', () => {
    wrap('/home', (
      <>
        <Route path="/home" element={<HomePage />} />
        <Route path="/prototype/classroom/:id/map" element={<p>교실</p>} />
        <Route path="/prototype/classroom/create" element={<p>교실 만들기</p>} />
      </>
    ))

    expect(screen.getByRole('button', { name: /새 책상 만들기/ })).toBeInTheDocument()
    expect(screen.queryByText(/새 책상이나 반 만들기/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /우리 반 가기/ }))
    expect(screen.getByRole('dialog', { name: '우리 반은 아직 개발 중이에요' })).toBeInTheDocument()
    expect(screen.queryByText('교실')).not.toBeInTheDocument()
  })

  it('start: "우리끼리 서로 응원할래요" opens the notice instead of the classroom creator', () => {
    wrap('/start', (
      <>
        <Route path="/start" element={<StartPage />} />
        <Route path="/prototype/classroom/create" element={<p>교실 만들기</p>} />
      </>
    ))

    fireEvent.click(screen.getByRole('button', { name: /우리끼리 서로 응원할래요/ }))
    expect(screen.getByRole('dialog', { name: '우리 반은 아직 개발 중이에요' })).toBeInTheDocument()
    expect(screen.queryByText('교실 만들기')).not.toBeInTheDocument()
  })
})

describe('outside production everything stays open for development', () => {
  it('lets the start flow reach the classroom creator', () => {
    vi.unstubAllEnvs()
    wrap('/start', (
      <>
        <Route path="/start" element={<StartPage />} />
        <Route path="/prototype/classroom/create" element={<p>교실 만들기</p>} />
      </>
    ))
    fireEvent.click(screen.getByRole('button', { name: /우리끼리 서로 응원할래요/ }))
    expect(screen.getByText('교실 만들기')).toBeInTheDocument()
  })
})
