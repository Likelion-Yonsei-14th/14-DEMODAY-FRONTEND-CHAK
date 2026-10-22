import { describe, expect, it } from 'vitest'
import { courseLine, placeText, shuffled } from './d1CourseConfig'
import { startText } from './d1CourseRegions'
import { parseShareCode, shareCodeOf } from './d1CourseShare'

describe('d1 course share code', () => {
  it('round-trips the place and the three activities in order', () => {
    const course = { area: 'hongdae', activities: ['dye', 'photo', 'escape'] } as const
    const code = shareCodeOf({ ...course, activities: [...course.activities] })
    expect(code).toBe('hongdae-dye-photo-escape')
    expect(parseShareCode(code)).toEqual({ area: 'hongdae', activities: ['dye', 'photo', 'escape'] })
  })

  it('rejects unknown places, unknown or repeated activities and the wrong count', () => {
    for (const code of [
      undefined,
      '',
      'busan-dye-photo-escape',
      'hongdae-dye-photo',
      'hongdae-dye-photo-escape-food',
      'hongdae-dye-dye-escape',
      'hongdae-dye-photo-ski',
    ]) {
      expect(parseShareCode(code), String(code)).toBeNull()
    }
  })
})

describe('d1 course config', () => {
  it('reads the course as the result card shows it', () => {
    expect(courseLine(['dye', 'photo', 'escape'])).toBe('염색 → 사진관 → 방탈출')
    expect(placeText('hongdae', '강남구')).toBe('홍대')
    expect(placeText('local', '마포구')).toBe('마포구 우리 동네')
    expect(placeText('local', null)).toBe('우리 동네')
  })

  it('names the start by its district, with the city for 광역시 구', () => {
    expect(startText('seoul', '마포구')).toBe('마포구')
    expect(startText('busan', '중구')).toBe('부산 중구')
    expect(startText('gyeonggi', '수원시')).toBe('수원시')
    expect(startText('gyeongbuk', '울릉군')).toBe('울릉군')
    expect(startText('sejong', null)).toBe('세종')
  })

  it('shuffles a copy and keeps every option', () => {
    const items = [1, 2, 3, 4, 5]
    const result = shuffled(items, () => 0)
    expect(result).not.toEqual(items)
    expect([...result].sort()).toEqual(items)
    expect(items).toEqual([1, 2, 3, 4, 5])
  })
})
