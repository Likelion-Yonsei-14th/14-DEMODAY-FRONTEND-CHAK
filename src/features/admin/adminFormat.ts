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
