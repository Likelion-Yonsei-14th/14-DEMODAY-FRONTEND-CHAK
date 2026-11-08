import type { ReadMode } from '@/types'
import {
  clampCapsuleUnlockAt,
  getDefaultCapsuleUnlockAt,
} from '@/features/csat/csatSchedule'

export const DEFAULT_CAPSULE_UNLOCK_AT = getDefaultCapsuleUnlockAt()

export function splitDateTime(value: string) {
  const fallbackDate = DEFAULT_CAPSULE_UNLOCK_AT.slice(0, 10)
  const fallbackTime = DEFAULT_CAPSULE_UNLOCK_AT.slice(11, 16)
  const [date, time] = value.split('T')

  return {
    date: date || fallbackDate,
    time: (time || fallbackTime).slice(0, 5),
  }
}

export function joinDateTime(date: string, time: string) {
  const fallbackDate = DEFAULT_CAPSULE_UNLOCK_AT.slice(0, 10)
  const fallbackTime = DEFAULT_CAPSULE_UNLOCK_AT.slice(11, 16)

  // Every capsule date set in the app passes here: only after the exam
  return clampCapsuleUnlockAt(`${date || fallbackDate}T${time || fallbackTime}`)
}

export const CAPSULE_EXAM_DAY_MESSAGE =
  '수능 당일은 시험이 끝난 오후 6시부터 열 수 있어요.'
export const CAPSULE_BEFORE_EXAM_MESSAGE =
  '응원은 수능이 끝난 뒤에 열 수 있어요.'

/**
 * For the capsule date/time pickers: same as joinDateTime, but when the
 * picked moment falls before the exam is over and gets moved, tells the
 * owner why their choice changed.
 */
export function pickCapsuleUnlockAt(
  date: string,
  time: string,
  notify: (message: string) => void,
) {
  const unlockAt = joinDateTime(date, time)
  if (date && time && unlockAt !== `${date}T${time.slice(0, 5)}`) {
    notify(
      unlockAt.startsWith(date)
        ? CAPSULE_EXAM_DAY_MESSAGE
        : CAPSULE_BEFORE_EXAM_MESSAGE,
    )
  }
  return unlockAt
}

export function formatReadMode(mode: ReadMode) {
  if (mode.type === 'daily') {
    return `매일 ${formatTime(mode.unlockTime)}`
  }

  const [datePart, timePart] = mode.unlockAt.split('T')
  const date = new Date(`${datePart}T00:00:00`)
  const formattedDate = new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
  }).format(date)

  return `${formattedDate} ${formatTime(timePart ?? '20:00')}`
}

export function formatTime(value: string) {
  const [hourString = '0', minute = '00'] = value.split(':')
  const hour = Number(hourString)
  const period = hour < 12 ? '오전' : '오후'
  const displayHour = hour % 12 || 12
  return `${period} ${displayHour}:${minute}`
}
