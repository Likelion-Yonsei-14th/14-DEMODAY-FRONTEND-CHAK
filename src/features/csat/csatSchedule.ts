export const CSAT_SCHEDULE = {
  academicYear: 2027,
  examDate: {
    year: 2026,
    month: 11,
    day: 19,
  },
} as const

const DEFAULT_CAPSULE_TIME = '20:00'

export function getCsatExamDate() {
  const { year, month, day } = CSAT_SCHEDULE.examDate
  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

export function getCsatDdayLabel(now = new Date()) {
  const examDate = getCsatExamDate()
  const diff = calendarDayDiff(now, examDate)

  if (diff > 0) return `수능까지 D-${diff}`
  if (diff === 0) return '오늘이 수능이에요'
  return '수능이 끝났어요'
}

export function getDefaultCapsuleUnlockAt() {
  const date = getCsatExamDate()
  date.setDate(date.getDate() - 1)

  return `${formatDateInput(date)}T${DEFAULT_CAPSULE_TIME}`
}

export function getCsatDateLabel() {
  const date = getCsatExamDate()

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date)
}

function calendarDayDiff(from: Date, to: Date) {
  const fromDay = Date.UTC(
    from.getFullYear(),
    from.getMonth(),
    from.getDate(),
  )
  const toDay = Date.UTC(
    to.getFullYear(),
    to.getMonth(),
    to.getDate(),
  )

  return Math.round((toDay - fromDay) / 86_400_000)
}

function formatDateInput(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}
