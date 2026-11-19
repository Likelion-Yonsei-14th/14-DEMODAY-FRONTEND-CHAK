import type { PreviewBanner } from '@/features/ads/adPreview'
import type { Discount, DiscountCategory } from './discountData'
import type { SponsoredMeta } from './sponsored'

/** 미리보기 전용 카드 id. 실제 혜택 id(양수)와 겹치지 않는다. */
export const PREVIEW_PARTNER_ID = -1

/**
 * 운영자 광고 관리의 "수험표 할인 모음" 미리보기. 실제 화면처럼 등록 중인 광고를 제휴 카드로 목록 맨 위에 둔다.
 * 같은 배너 이미지를 쓰는 제휴 혜택이 이미 있으면 그 카드를 맨 위로 올리고,
 * 없으면 배너만 끼운 자리표시 카드를 넣는다(혜택 문구는 혜택함 관리에서 넣는다).
 * 돌려주는 previewId는 화면 찍기·스크롤 기준이 되는 카드 id.
 */
export function withPreviewPartner(
  items: readonly Discount[],
  meta: ReadonlyMap<number, SponsoredMeta>,
  ad: PreviewBanner | null,
): { items: Discount[]; meta: Map<number, SponsoredMeta>; previewId: number | null } {
  const nextMeta = new Map(meta)
  if (!ad?.creativeUrl) return { items: [...items], meta: nextMeta, previewId: null }
  const same = items.find((d) => d.sponsored && d.id !== undefined && d.image === ad.creativeUrl)
  if (same) {
    nextMeta.set(same.id!, nextMeta.get(same.id!) ?? { distanceKm: null })
    return { items: [same, ...items.filter((d) => d !== same)], meta: nextMeta, previewId: same.id! }
  }
  const card: Discount = {
    id: PREVIEW_PARTNER_ID,
    brand: ad.title || '광고 이름',
    category: '광고 미리보기' as DiscountCategory,
    benefit: '혜택 문구는 어드민 > 혜택함 관리에서 제휴 혜택으로 올리면 여기에 보여요',
    start: null,
    end: null,
    conditions: '',
    area: '전국',
    place: '',
    sourceUrl: ad.destinationUrl,
    sourceDate: '',
    image: ad.creativeUrl,
    sponsored: true,
  }
  nextMeta.set(PREVIEW_PARTNER_ID, { distanceKm: null })
  return { items: [card, ...items], meta: nextMeta, previewId: PREVIEW_PARTNER_ID }
}
