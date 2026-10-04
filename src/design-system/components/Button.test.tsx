import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('disables interaction while loading', () => {
    render(<Button loading>저장하기</Button>)

    const button = screen.getByRole('button', { name: '저장하기' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
  })

  it('respects the disabled prop', () => {
    render(<Button disabled>다음</Button>)
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled()
  })
})
