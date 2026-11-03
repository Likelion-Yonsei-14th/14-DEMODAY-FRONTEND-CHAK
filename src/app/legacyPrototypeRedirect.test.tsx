import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { LegacyPrototypeRedirect } from '@/app/router'

function Where() {
  const { pathname, search } = useLocation()
  return <p>{`${pathname}${search}`}</p>
}

function renderAt(entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/prototype/*" element={<LegacyPrototypeRedirect />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('addresses from before the /prototype prefix was dropped', () => {
  it('sends the old own-desk address to the new one', () => {
    renderAt('/prototype/my/desk')
    expect(screen.getByText('/my/desk')).toBeInTheDocument()
  })

  it('keeps the query string', () => {
    renderAt('/prototype/my/desk?scene=night')
    expect(screen.getByText('/my/desk?scene=night')).toBeInTheDocument()
  })
})
