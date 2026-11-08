import { describe, expect, it, vi } from 'vitest'
import { getCapsuleMinDate } from '@/features/csat/csatSchedule'
import {
  CAPSULE_BEFORE_EXAM_MESSAGE,
  CAPSULE_EXAM_DAY_MESSAGE,
  pickCapsuleUnlockAt,
} from './readModeUtils'

const examDay = getCapsuleMinDate()

describe('pickCapsuleUnlockAt', () => {
  it('moves an exam-day time before 6 PM to 6 PM and says why', () => {
    const notify = vi.fn()
    expect(pickCapsuleUnlockAt(examDay, '15:00', notify)).toBe(`${examDay}T18:00`)
    expect(notify).toHaveBeenCalledWith(CAPSULE_EXAM_DAY_MESSAGE)
  })

  it('moves a date before the exam to exam night and says why', () => {
    const notify = vi.fn()
    expect(pickCapsuleUnlockAt('2020-01-01', '21:00', notify)).toBe(`${examDay}T20:00`)
    expect(notify).toHaveBeenCalledWith(CAPSULE_BEFORE_EXAM_MESSAGE)
  })

  it('keeps an allowed choice without a notice', () => {
    const notify = vi.fn()
    expect(pickCapsuleUnlockAt(examDay, '18:00', notify)).toBe(`${examDay}T18:00`)
    expect(pickCapsuleUnlockAt('2099-01-01', '03:00', notify)).toBe('2099-01-01T03:00')
    expect(notify).not.toHaveBeenCalled()
  })

  it('stays quiet when a picker is cleared', () => {
    const notify = vi.fn()
    pickCapsuleUnlockAt(examDay, '', notify)
    pickCapsuleUnlockAt('', '09:00', notify)
    expect(notify).not.toHaveBeenCalled()
  })
})
