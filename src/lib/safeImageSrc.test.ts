import { describe, expect, it } from 'vitest'
import { isSafeCardPhotoSrc } from './safeImageSrc'

describe('isSafeCardPhotoSrc', () => {
  it.each([
    'data:image/webp;base64,UklGRg==',
    'data:image/png;base64,iVBORw0KGgo=',
    'data:image/jpeg;base64,/9j/4AAQ',
  ])('keeps %s', (src) => {
    expect(isSafeCardPhotoSrc(src)).toBe(true)
  })

  it.each([
    'https://attacker.example/pixel.png?m=1',
    'http://attacker.example/p.png',
    '//attacker.example/p.png',
    'data:image/svg+xml;base64,PHN2Zz4=',
    'data:text/html;base64,PGgxPg==',
    'javascript:alert(1)',
    'blob:https://www.chak.live/abc',
    '',
    null,
    undefined,
  ])('drops %s', (src) => {
    expect(isSafeCardPhotoSrc(src)).toBe(false)
  })
})
