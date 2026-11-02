import { describe, expect, it } from 'vitest'
import { formatPlayTime, recordText } from './deskBlastFormat'
import { wrapLines } from './deskBlastShareImage'

describe('play time', () => {
  it('reads as seconds under a minute and minutes plus seconds after', () => {
    expect(formatPlayTime(0)).toBe('0초')
    expect(formatPlayTime(499)).toBe('0초')
    expect(formatPlayTime(500)).toBe('1초')
    expect(formatPlayTime(59_400)).toBe('59초')
    expect(formatPlayTime(60_000)).toBe('1분 0초')
    expect(formatPlayTime(185_000)).toBe('3분 5초')
  })

  it('never shows a negative time', () => {
    expect(formatPlayTime(-4000)).toBe('0초')
  })
})

describe('result compared with the best record', () => {
  it('welcomes a first record, then says how far above, equal to or below the best', () => {
    expect(recordText(1200, 0)).toBe('첫 기록이에요')
    expect(recordText(3200, 3000)).toBe('기존 최고 기록보다 200점 높아요')
    expect(recordText(3000, 3000)).toBe('최고 기록과 같아요')
    expect(recordText(2400, 3000)).toBe('최고 기록까지 600점 남았어요')
    expect(recordText(14000, 1000)).toBe('기존 최고 기록보다 13,000점 높아요')
  })
})

describe('wrapping text for the share card', () => {
  const measure = (text: string) => Array.from(text).length * 10

  it('keeps a short line whole', () => {
    expect(wrapLines(measure, '책상만 전교 1등', 400)).toEqual(['책상만 전교 1등'])
  })

  it('breaks at spaces when the line is too long', () => {
    const lines = wrapLines(measure, '공부 10분 전에 책상 정리 2시간 하는 타입', 150)

    expect(lines.length).toBeGreaterThan(1)
    for (const line of lines) expect(measure(line)).toBeLessThanOrEqual(150)
    expect(lines.join(' ')).toBe('공부 10분 전에 책상 정리 2시간 하는 타입')
  })

  it('breaks inside a word that cannot fit on a line by itself', () => {
    const lines = wrapLines(measure, '정리하다수능끝남진짜로', 50)

    expect(lines.join('')).toBe('정리하다수능끝남진짜로')
    for (const line of lines) expect(measure(line)).toBeLessThanOrEqual(50)
  })

  it('returns nothing for empty text', () => {
    expect(wrapLines(measure, '', 100)).toEqual([])
    expect(wrapLines(measure, '   ', 100)).toEqual([])
  })
})
