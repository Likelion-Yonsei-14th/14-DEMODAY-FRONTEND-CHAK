import type { ReactElement } from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { PrivacyPolicyPage, TermsOfServicePage } from './LegalPages'
import { LEGAL_CONTACT_EMAIL } from './legalInfo'

function renderPage(page: ReactElement) {
  return render(<MemoryRouter>{page}</MemoryRouter>)
}

describe('legal pages', () => {
  it('shows the privacy policy with the team contact and what is collected', () => {
    renderPage(<PrivacyPolicyPage />)

    expect(screen.getByRole('heading', { name: '개인정보처리방침' })).toBeTruthy()
    expect(screen.getByText(/카카오 회원번호/)).toBeTruthy()
    expect(screen.getByText('Amazon Web Services, Inc.')).toBeTruthy()
    const mail = screen.getByRole('link', { name: LEGAL_CONTACT_EMAIL })
    expect(mail.getAttribute('href')).toBe(`mailto:${LEGAL_CONTACT_EMAIL}`)
  })

  it('shows the terms of service and links to the privacy policy', () => {
    renderPage(<TermsOfServicePage />)

    expect(screen.getByRole('heading', { name: '이용약관' })).toBeTruthy()
    expect(screen.getByText(/찰떡은 현금으로 바꾸거나/)).toBeTruthy()
    expect(screen.getByRole('link', { name: '개인정보처리방침' }).getAttribute('href')).toBe('/privacy')
  })
})
