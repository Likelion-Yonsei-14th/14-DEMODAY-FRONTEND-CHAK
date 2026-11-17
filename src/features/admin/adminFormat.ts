const KST = 'Asia/Seoul'

export const formatDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('ko-KR', { timeZone: KST, year: 'numeric', month: '2-digit', day: '2-digit' })
    : '-'

export const formatDateTime = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('ko-KR', {
        timeZone: KST,
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-'

export const formatNumber = (value: number) => value.toLocaleString('ko-KR')

/** `YYYY-MM-DD` in Korean time, `daysAgo` days before today. */
export function kstDate(daysAgo = 0) {
  const now = new Date(Date.now() - daysAgo * 86_400_000)
  return new Intl.DateTimeFormat('sv-SE', { timeZone: KST }).format(now)
}

export const providerLabel = (provider: 'KAKAO' | 'GOOGLE') => (provider === 'KAKAO' ? '카카오' : '구글')

/** datetime-local 값("2026-11-20T09:00")을 한국 시각으로 읽어 ISO로 바꾼다. */
export function kstInputToIso(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null
  const date = new Date(`${value}:00+09:00`)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

/** ISO 시각을 datetime-local 값("2026-11-20T09:00", 한국 시각)으로 바꾼다. */
export function isoToKstInput(iso: string): string {
  const date = new Date(new Date(iso).getTime() + 9 * 3_600_000)
  return date.toISOString().slice(0, 16)
}
