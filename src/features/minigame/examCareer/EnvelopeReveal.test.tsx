import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EnvelopeReveal } from './EnvelopeReveal'

const reveal = (onDone = vi.fn(), onStop = vi.fn()) =>
  render(
    <EnvelopeReveal title="결과는?" tone="up" label="잘 풀렸어요" text="공부 습관이 잡혔어요." onDone={onDone} onStop={onStop} />,
  )

afterEach(() => vi.useRealTimers())

describe('envelope reveal', () => {
  it('keeps the result sealed until the player opens it', () => {
    vi.useFakeTimers()
    const { onDone, onStop } = { onDone: vi.fn(), onStop: vi.fn() }
    reveal(onDone, onStop)

    expect(screen.queryByText('잘 풀렸어요')).not.toBeInTheDocument()
    expect(screen.queryByText('공부 습관이 잡혔어요.')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '확인' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '봉투 열기' }))
    // It shakes first; the letter is not out yet.
    expect(screen.queryByText('잘 풀렸어요')).not.toBeInTheDocument()
    expect(onStop).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(700)
    })
    expect(screen.getByText('잘 풀렸어요')).toBeInTheDocument()
    expect(screen.getByText('공부 습관이 잡혔어요.')).toBeInTheDocument()
    expect(onStop).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('can be skipped open at once, and reports the stop only once', () => {
    const onStop = vi.fn()
    reveal(vi.fn(), onStop)
    fireEvent.click(screen.getByRole('button', { name: '건너뛰기' }))
    expect(screen.getByText('잘 풀렸어요')).toBeInTheDocument()
    expect(onStop).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: '열린 봉투' }))
    expect(onStop).toHaveBeenCalledTimes(1)
  })
})
