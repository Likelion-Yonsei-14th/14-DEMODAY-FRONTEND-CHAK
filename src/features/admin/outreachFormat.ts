import type { OutreachChannel, OutreachStatus } from '@/api/adminOutreach'

export const CHANNEL_LABEL: Record<OutreachChannel, string> = {
  INSTAGRAM: '인스타 DM',
  PHONE: '전화',
  EMAIL: '이메일',
  NAVER_TALK: '네이버 톡톡',
  WEBSITE: '사이트 문의 폼',
  LINKEDIN: '링크드인',
  KAKAO: '카카오 채널',
  VISIT: '방문',
  OTHER: '기타',
}

export const STATUS_LABEL: Record<OutreachStatus, string> = {
  TODO: '연락 전',
  CONTACTED: '연락함',
  REPLIED: '답장 옴',
  NEGOTIATING: '협의 중',
  AGREED: '합의',
  PAID: '입금 완료',
  REJECTED: '거절',
  NO_RESPONSE: '무응답',
}

/** 연락처를 바로 누를 수 있는 링크로 바꾼다. 형식을 모르면 글자 그대로 보여 준다. */
export function contactHref(channel: OutreachChannel, contact: string): string | null {
  const value = contact.trim()
  if (/^https?:\/\//i.test(value)) return value
  if (channel === 'INSTAGRAM') return `https://instagram.com/${value.replace(/^@/, '')}`
  if (channel === 'EMAIL' && value.includes('@')) return `mailto:${value}`
  if (channel === 'PHONE' && /^[\d\s()+-]+$/.test(value)) return `tel:${value.replace(/[^\d+]/g, '')}`
  return null
}

/** 금액을 "79,000원"처럼 쓴다. 비어 있으면 null. */
export const won = (value: number | null | undefined) => (value == null ? null : `${value.toLocaleString('ko-KR')}원`)

/** 연락처나 메모에 적힌 첫 전화번호. 전화할 때 바로 누를 수 있게 꺼낸다. */
export function phoneOf(...texts: (string | null | undefined)[]): string | null {
  for (const text of texts) {
    const found = text?.match(/0\d{1,2}-?\d{3,4}-?\d{4}/)
    if (found) return found[0]
  }
  return null
}

/** 메모는 " / "로 이어 붙여 쌓인다. 가장 최근 n개만 보여 준다. */
export function recentNotes(note: string | null, count = 2): string[] {
  if (!note) return []
  return note.split(/\s\/\s/).map((part) => part.trim()).filter(Boolean).slice(-count)
}
