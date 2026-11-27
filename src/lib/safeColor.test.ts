import { describe, expect, it } from 'vitest'
import { safeHexColor } from './safeColor'

describe('safeHexColor', () => {
  it.each(['#fff', '#FFFA', '#D8644A', '#d8644a80'])('keeps %s', (value) => {
    expect(safeHexColor(value)).toBe(value)
  })

  it.each([
    'url(https://attacker.example/p)',
    'red',
    '#12',
    '#12345',
    '#D8644A; background:url(x)',
    'var(--x)',
    '',
    null,
    undefined,
    42,
  ])('drops %s', (value) => {
    expect(safeHexColor(value)).toBeUndefined()
  })
})
