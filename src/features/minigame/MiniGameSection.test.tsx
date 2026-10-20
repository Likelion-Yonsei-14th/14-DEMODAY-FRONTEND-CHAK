import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { MiniGameSection } from './MiniGameSection'

function Location() {
  return <p data-testid="location">{useLocation().pathname}</p>
}

describe('mini game section', () => {
  it('lists the four games under one heading and opens each one', () => {
    const games: Array<[string, string]> = [
      ['나의 수험생 유형은?', '/minigame/study-type'],
      ['오늘의 찍신은 나야!', '/minigame/guess-god'],
      ['수능 운빨 뽑기', '/minigame/grade-draw'],
      ['선생님 몰래 폰 하기', '/minigame/sneaky-phone'],
    ]

    for (const [title, path] of games) {
      const view = render(
        <MemoryRouter initialEntries={['/home']}>
          <Routes>
            <Route path="/home" element={<MiniGameSection />} />
            <Route path="*" element={<Location />} />
          </Routes>
        </MemoryRouter>,
      )
      const section = screen.getByRole('region', { name: '잠깐 쉬어 가기' })
      expect(within(section).getAllByRole('button')).toHaveLength(4)
      fireEvent.click(within(section).getByRole('button', { name: new RegExp(title.replace('?', '\\?')) }))
      expect(screen.getByTestId('location')).toHaveTextContent(path)
      view.unmount()
    }
  })
})
