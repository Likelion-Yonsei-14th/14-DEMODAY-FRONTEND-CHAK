import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { gateRoutes } from '@/app/router'
import { ComingSoonDialog, ComingSoonPage } from './ComingSoon'

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>
}

describe('coming soon notices', () => {
  it('shows the dialog and closes with 확인', () => {
    const onClose = vi.fn()
    render(<ComingSoonDialog open onClose={onClose} title="결제는 아직 개발 중이에요" description="곧 열려요" />)
    expect(screen.getByRole('dialog', { name: '결제는 아직 개발 중이에요' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('renders nothing while closed', () => {
    render(<ComingSoonDialog open={false} onClose={() => undefined} title="x" />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('has a page that sends people back to the start', () => {
    render(
      <MemoryRouter initialEntries={['/prototype/classroom/abc/join']}>
        <Routes>
          <Route path="/prototype/classroom/:id/join" element={<ComingSoonPage title="우리 반" />} />
          <Route path="/" element={<Where />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: '우리 반은 아직 개발 중이에요' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '처음으로 돌아가기' }))
    expect(screen.getByTestId('where')).toHaveTextContent('/')
  })
})

describe('production route gating', () => {
  const routes = [
    { path: '/prototype/classroom', element: <p>교실 목록</p> },
    { path: '/prototype/classroom/:classroomId/join', element: <p>가입</p> },
    { path: '/prototype/wrapped/intro', element: <p>wrapped</p> },
    { path: '/prototype/offers/:offerId', element: <p>offer</p> },
    { path: '/prototype', element: <p>목차</p> },
    { path: '/prototype/composer', element: <p>placeholder</p> },
    { path: '/system', element: <p>디자인</p> },
    { path: '/prototype/my/desk', element: <p>내 책상</p> },
    { path: '/prototype/create', element: <p>책상 만들기</p> },
    { path: '/home', element: <p>홈</p> },
  ]

  function open(path: string, production: boolean) {
    const gated = gateRoutes(routes, production)
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          {gated.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
          <Route path="/" element={<p>처음 화면</p>} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('shows a coming soon screen for classroom, wrapped and offers in production', () => {
    for (const path of ['/prototype/classroom', '/prototype/classroom/c1/join', '/prototype/wrapped/intro', '/prototype/offers/o1']) {
      open(path, true)
      expect(screen.getByRole('heading', { name: /^(우리 반|응원 결산|혜택)은 아직 개발 중이에요$/ })).toBeInTheDocument()
      document.body.innerHTML = ''
    }
  })

  it('sends internal pages back to the start in production', () => {
    for (const path of ['/prototype', '/prototype/composer', '/system']) {
      open(path, true)
      expect(screen.getByText('처음 화면')).toBeInTheDocument()
      document.body.innerHTML = ''
    }
  })

  it('leaves the real pages alone, and everything open outside production', () => {
    open('/prototype/my/desk', true)
    expect(screen.getByText('내 책상')).toBeInTheDocument()
    document.body.innerHTML = ''
    open('/prototype/create', true)
    expect(screen.getByText('책상 만들기')).toBeInTheDocument()
    document.body.innerHTML = ''
    open('/prototype/classroom', false)
    expect(screen.getByText('교실 목록')).toBeInTheDocument()
  })
})
