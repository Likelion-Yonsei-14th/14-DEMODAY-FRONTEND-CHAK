import type { ReadMode } from '@/types'
import { getDefaultCapsuleUnlockAt } from '@/features/csat/csatSchedule'

export const DEFAULT_CAPSULE_UNLOCK_AT = getDefaultCapsuleUnlockAt()

export function splitDateTime(value: string) {
  const [fallbackDate, fallbackTime] =
    DEFAULT_CAPSULE_UNLOCK_AT.split('T')
  const [date = fallbackDate, time = fallbackTime] = value.split('T')
  return {
    date,
    time: time.slice(0, 5),
  }
}

export function joinDateTime(date: string, time: string) {
  const [fallbackDate, fallbackTime] =
    DEFAULT_CAPSULE_UNLOCK_AT.split('T')

  return `${date || fallbackDate}T${time || fallbackTime}`
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
