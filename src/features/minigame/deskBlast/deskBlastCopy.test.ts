import { describe, expect, it } from 'vitest'
import { comboPhrase, COMBO_PHRASES, DESK_CLUTTER, DESK_TYPES, deskTypeLine, deskTypeOf } from './deskBlastCopy'

describe('combo phrases', () => {
  it('says nothing for a single clear and the matching phrase from two on', () => {
    expect(comboPhrase(0)).toBeNull()
    expect(comboPhrase(1)).toBeNull()
    expect(comboPhrase(2)).toBe('정리 좀 치는데?')
    expect(comboPhrase(3)).toBe('공부는 언제 함')
    expect(comboPhrase(4)).toBe('공부는 언제 함')
    expect(comboPhrase(5)).toBe('책상만 전교 1등')
    expect(comboPhrase(7)).toBe('책상만 전교 1등')
    expect(comboPhrase(8)).toBe('수험생의 본업')
    expect(comboPhrase(9)).toBe('수험생의 본업')
    expect(comboPhrase(10)).toBe('정리하다 수능 끝남')
    expect(comboPhrase(40)).toBe('정리하다 수능 끝남')
  })

  it('keeps the phrase list ordered, so a new phrase can be dropped in anywhere sensible', () => {
    const starts = COMBO_PHRASES.map((phrase) => phrase.from)

    expect([...starts].sort((a, b) => a - b)).toEqual(starts)
    expect(new Set(starts).size).toBe(starts.length)
  })
})

describe('student types', () => {
  it('maps the score ranges to types at their edges', () => {
    const at = (score: number) => deskTypeOf(score).name

    expect(at(0)).toBe('책상 방치형')
    expect(at(3999)).toBe('책상 방치형')
    expect(at(4000)).toBe('정리하는 척 공부 회피형')
    expect(at(9999)).toBe('정리하는 척 공부 회피형')
    expect(at(10000)).toBe('책상정리 고인물')
    expect(at(19999)).toBe('책상정리 고인물')
    expect(at(20000)).toBe('책상만 전교 1등')
    expect(at(29999)).toBe('책상만 전교 1등')
    expect(at(30000)).toBe('공부보다 정리가 체질')
    expect(at(1_000_000)).toBe('공부보다 정리가 체질')
  })

  it('has types listed from the lowest, starting at zero, each with lines to show', () => {
    expect(DESK_TYPES[0]!.from).toBe(0)
    expect(DESK_TYPES.map((type) => type.from)).toEqual([...DESK_TYPES.map((type) => type.from)].sort((a, b) => a - b))
    for (const type of DESK_TYPES) expect(type.lines.length).toBeGreaterThan(0)
  })

  it('picks the same line for the same score and always one that exists', () => {
    for (const type of DESK_TYPES) {
      for (const seed of [0, 1, 7, 12345, 99999]) {
        const line = deskTypeLine(type, seed)

        expect(type.lines).toContain(line)
        expect(deskTypeLine(type, seed)).toBe(line)
      }
    }
  })
})

describe('desk clutter', () => {
  it('clears one item at a time as the score rises, with no two items going at once', () => {
    const marks = DESK_CLUTTER.map((item) => item.clearAt)

    expect([...marks].sort((a, b) => a - b)).toEqual(marks)
    expect(new Set(marks).size).toBe(marks.length)
    expect(new Set(DESK_CLUTTER.map((item) => item.id)).size).toBe(DESK_CLUTTER.length)
  })

  it('has the first item still there at the start and the last gone before the top type', () => {
    expect(DESK_CLUTTER[0]!.clearAt).toBeGreaterThan(0)
    expect(DESK_CLUTTER[DESK_CLUTTER.length - 1]!.clearAt).toBeLessThanOrEqual(DESK_TYPES[DESK_TYPES.length - 1]!.from)
  })
})
