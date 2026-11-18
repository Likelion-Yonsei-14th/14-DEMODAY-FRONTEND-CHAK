import { apiFetch } from '@/api/client'
import type { Discount, DiscountCategory } from '@/features/discounts/discountData'

/** 서버가 주는 할인 한 건. 날짜는 한국 날짜("YYYY-MM-DD"), 없는 값은 null. */
export type ApiDiscount = {
  id: number
  brand: string
  category: string
  benefit: string
  start: string | null
  end: string | null
  conditions: string | null
  area: string
  place: string | null
  sourceUrl: string
  sourceDate: string | null
  highlight: string | null
  bring: string[]
  howTo: string | null
  companions: string | null
  branches: string | null
  image: string | null
  imageSource: string | null
  visible: boolean
  updatedByName: string | null
  updatedAt: string
}

export type DiscountInput = Omit<ApiDiscount, 'id' | 'updatedByName' | 'updatedAt'>

/** 서버 모양을 화면이 쓰는 모양으로. 빈 값은 화면 규칙대로 빈 글자나 없음으로 바꾼다. */
export function toDiscount(d: ApiDiscount): Discount {
  return {
    id: d.id,
    visible: d.visible,
    brand: d.brand,
    category: d.category as DiscountCategory,
    benefit: d.benefit,
    start: d.start,
    end: d.end,
    conditions: d.conditions ?? '',
    area: d.area,
    place: d.place ?? '',
    sourceUrl: d.sourceUrl,
    sourceDate: d.sourceDate ?? '',
    highlight: d.highlight ?? undefined,
    bring: d.bring.length > 0 ? d.bring : undefined,
    howTo: d.howTo ?? undefined,
    companions: d.companions ?? undefined,
    branches: d.branches ?? undefined,
    image: d.image ?? undefined,
    imageSource: d.imageSource ?? undefined,
  }
}

const KST_DATE = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' })

/** 사용자 화면용: 켜 둔 혜택과, 마지막으로 고친 날(한국 날짜). */
export async function fetchDiscounts(): Promise<{ updated: string | null; items: Discount[] }> {
  const data = await apiFetch<{ updatedAt: string | null; items: ApiDiscount[] }>('/api/public/discounts', {
    auth: false,
  })
  return {
    updated: data.updatedAt ? KST_DATE.format(new Date(data.updatedAt)) : null,
    items: data.items.map(toDiscount),
  }
}

const ADMIN_PATH = '/api/admin/discounts'

export const fetchAdminDiscounts = () => apiFetch<ApiDiscount[]>(ADMIN_PATH)

export const createAdminDiscount = (input: DiscountInput) =>
  apiFetch<ApiDiscount>(ADMIN_PATH, { method: 'POST', body: input })

export const updateAdminDiscount = (id: number, input: DiscountInput) =>
  apiFetch<ApiDiscount>(`${ADMIN_PATH}/${id}`, { method: 'PUT', body: input })

export const deleteAdminDiscount = (id: number) => apiFetch<void>(`${ADMIN_PATH}/${id}`, { method: 'DELETE' })
