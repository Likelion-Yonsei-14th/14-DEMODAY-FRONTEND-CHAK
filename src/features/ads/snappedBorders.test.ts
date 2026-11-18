import { afterEach, describe, expect, it } from 'vitest'
import { compensateSnappedBorders, snapGrowth } from './snappedBorders'

describe('snapGrowth', () => {
  it('only counts borders thinner than one pixel', () => {
    expect(snapGrowth('0.666667px')).toBeCloseTo(0.333333, 6)
    expect(snapGrowth('1px')).toBe(0)
    expect(snapGrowth('2px')).toBe(0)
    expect(snapGrowth('0px')).toBe(0)
    expect(snapGrowth('')).toBe(0)
  })
})

describe('compensateSnappedBorders', () => {
  let restore = () => {}
  afterEach(() => {
    restore()
    document.body.innerHTML = ''
  })

  const chip = (style: string) => {
    const el = document.createElement('button')
    el.setAttribute('style', style)
    el.textContent = '서울'
    document.body.appendChild(el)
    return el
  }

  it('widens border-box boxes by what the thin borders will round up to', () => {
    const el = chip('box-sizing: border-box; width: 46.0833px; height: 29.3333px; border: 0.666667px solid')
    restore = compensateSnappedBorders(window)
    const style = window.getComputedStyle(el)
    expect(parseFloat(style.getPropertyValue('width'))).toBeCloseTo(46.75, 3)
    expect(parseFloat(style.getPropertyValue('inline-size') || '46.75px')).toBeCloseTo(46.75, 3)
    expect(parseFloat(style.getPropertyValue('height'))).toBeCloseTo(30, 3)
    // 다른 값과 메서드는 그대로.
    expect(style.getPropertyValue('border-left-width')).toBe('0.666667px')
    expect(style.getPropertyPriority('width')).toBe('')
  })

  it('leaves whole-pixel borders and content-box boxes alone', () => {
    const whole = chip('box-sizing: border-box; width: 46px; border: 1px solid')
    const content = chip('box-sizing: content-box; width: 20px; border: 0.5px solid')
    restore = compensateSnappedBorders(window)
    expect(window.getComputedStyle(whole).getPropertyValue('width')).toBe('46px')
    expect(window.getComputedStyle(content).getPropertyValue('width')).toBe('20px')
  })

  it('puts the original getComputedStyle back', () => {
    const original = window.getComputedStyle
    restore = compensateSnappedBorders(window)
    expect(window.getComputedStyle).not.toBe(original)
    restore()
    expect(window.getComputedStyle).toBe(original)
  })
})
