import { describe, expect, it } from 'vitest'
import type { SharedCareer } from './examCareerShare'
import { careerTitleOf } from './examCareerTitle'

const career = ({ grades: list, ...patch }: Omit<Partial<SharedCareer>, 'grades'> & { grades?: number[] }): SharedCareer => {
  const [korean, math, english, inquiry1, inquiry2] = list ?? [3, 3, 3, 3, 3]
  const grades = { korean, math, english, inquiry1, inquiry2 } as SharedCareer['grades']
  return {
    track: 'humanities',
    attempt: 0,
    electives: { korean: 'speech-writing', math: 'probability', inquiry: 'social' },
    enrolled: 'seoul-lower',
    ...patch,
    grades,
    average: Math.round(((korean! + math! + english! + inquiry1! + inquiry2!) / 5) * 10) / 10,
  } as SharedCareer
}

describe('career title', () => {
  it('rewards the rare stories first', () => {
    expect(careerTitleOf(career({ attempt: 4 })).title).toBe('5수의 전설')
    expect(careerTitleOf(career({ enrolled: 'sky', grades: [1, 1, 1, 1, 1] })).title).toBe('현역 SKY 신화')
    expect(careerTitleOf(career({ attempt: 2, enrolled: 'sky' })).title).toBe('역전의 명수')
    expect(careerTitleOf(career({ attempt: 1, enrolled: 'seoul-upper' })).title).toBe('다시 일어선 도전자')
  })

  it('reads the grade sheet and the path taken', () => {
    expect(careerTitleOf(career({ grades: [2, 2, 3, 2, 2] })).title).toBe('현역 에이스')
    expect(careerTitleOf(career({ grades: [1, 6, 5, 4, 4] })).title).toBe('한 과목 장인')
    expect(careerTitleOf(career({ grades: [2, 6, 4, 3, 3] })).title).toBe('극단의 줄타기')
    expect(careerTitleOf(career({ enrolled: null })).title).toBe('자유로운 영혼')
    expect(careerTitleOf(career({ attempt: 1 })).title).toBe('끈기의 재도전러')
    expect(careerTitleOf(career({ grades: [5, 5, 5, 6, 5] })).title).toBe('버티기 달인')
    expect(careerTitleOf(career({})).title).toBe('꾸준한 정석 수험생')
  })
})
