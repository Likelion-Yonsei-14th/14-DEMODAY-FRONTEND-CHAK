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
