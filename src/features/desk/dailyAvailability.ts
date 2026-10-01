import type { ReadMode } from '@/types'
import { formatTime } from './readModeUtils'

export type MessageAvailability = {
  available: boolean
  unlockAt: Date | null
}

export function resolveReadModeNow(
  mode: ReadMode,
  search: string,
  baseNow = new Date(),
) {
  if (mode.type !== 'daily') return baseNow

  const preview = new URLSearchParams(search).get('daily')
  if (preview !== 'before' && preview !== 'after') return baseNow

  const cutoff = dateAtTime(baseNow, mode.unlockTime)
  const offset = preview === 'before' ? -60_000 : 60_000

  return new Date(cutoff.getTime() + offset)
}

export function getMessageAvailability(
  mode: ReadMode,
  createdAt: string,
  now = new Date(),
): MessageAvailability {
  if (mode.type !== 'daily') {
    return {
      available: true,
      unlockAt: null,
    }
  }

  const unlockAt = getDailyUnlockAt(createdAt, mode.unlockTime)

  return {
    available: now.getTime() >= unlockAt.getTime(),
    unlockAt,
  }
}

export function getDailyUnlockAt(
  createdAt: string,
  unlockTime: string,
) {
  const created = new Date(createdAt)
  const sameDayCutoff = dateAtTime(created, unlockTime)

  if (created.getTime() <= sameDayCutoff.getTime()) {
    return sameDayCutoff
  }

  const nextDayCutoff = new Date(sameDayCutoff)
  nextDayCutoff.setDate(nextDayCutoff.getDate() + 1)
  return nextDayCutoff
}

export function formatUnlockAt(
  unlockAt: Date,
  now = new Date(),
) {
  if (isSameCalendarDate(unlockAt, now)) {
    return `오늘 ${formatTime(toTimeValue(unlockAt))}`
  }

  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (isSameCalendarDate(unlockAt, tomorrow)) {
    return `내일 ${formatTime(toTimeValue(unlockAt))}`
  }

  const date = new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
  }).format(unlockAt)

  return `${date} ${formatTime(toTimeValue(unlockAt))}`
}

function dateAtTime(base: Date, time: string) {
  const [hourString = '0', minuteString = '0'] = time.split(':')
  const result = new Date(base)
  result.setHours(
    Number(hourString),
    Number(minuteString),
    0,
    0,
  )
  return result
}

function toTimeValue(date: Date) {
  return [
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
  ].join(':')
}

function isSameCalendarDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}
