import type { AdReport } from '@/api/adminAds'
import type { ApiAdvertisement } from '@/api/types'
import { formatNumber } from '../adminFormat'

export const rate = (clicks: number, impressions: number) =>
  impressions > 0 ? `${((clicks / impressions) * 100).toFixed(1)}%` : '-'

export const md = (date: string) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`

/** 광고주에게 그대로 붙여 보낼 수 있는 한 단락. */
export function reportText(ad: Pick<ApiAdvertisement, 'title'>, report: AdReport): string {
  const { totals, days, regions } = report
  const period = days.length > 0 ? `${md(days[0]!.date)} ~ ${md(days[days.length - 1]!.date)}` : '아직 노출 없음'
  const topRegions = regions
    .filter((r) => r.region !== '알 수 없음')
    .slice(0, 3)
    .map((r) => `${r.region} ${formatNumber(r.reach)}명`)
    .join(', ')
  return [
    `[수능 착] ${ad.title} 광고 결과 (${period})`,
    `· 노출 ${formatNumber(totals.impressions)}회 · 도달 ${formatNumber(totals.reach)}명 · 클릭 ${formatNumber(totals.clicks)}회 (클릭률 ${rate(totals.clicks, totals.impressions)})`,
    topRegions ? `· 많이 본 지역: ${topRegions}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}
