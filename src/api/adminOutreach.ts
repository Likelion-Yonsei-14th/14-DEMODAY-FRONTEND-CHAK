import { apiFetch } from '@/api/client'

export type OutreachChannel =
  | 'INSTAGRAM'
  | 'PHONE'
  | 'EMAIL'
  | 'NAVER_TALK'
  | 'WEBSITE'
  | 'LINKEDIN'
  | 'KAKAO'
  | 'VISIT'
  | 'OTHER'

export type OutreachStatus =
  | 'TODO'
  | 'CONTACTED'
  | 'REPLIED'
  | 'NEGOTIATING'
  | 'AGREED'
  | 'PAID'
  | 'REJECTED'
  | 'NO_RESPONSE'

export type OutreachKind = 'STORE' | 'BRAND'

export type OutreachInput = {
  kind: OutreachKind
  storeName: string
  category: string | null
  region: string | null
  channel: OutreachChannel
  contact: string | null
  assignee: string | null
  status: OutreachStatus
  note: string | null
  lastContactedOn: string | null
  /** 매장에 제시한 광고비(원) */
  offerPrice: number | null
  /** 제안서에 적은 매장의 예상 수익(원) */
  expectedProfit: number | null
  /** 계산에 쓴 1회 방문 객단가(원) */
  unitPrice: number | null
  /** 매장에 보낸 제안서 링크 */
  proposalUrl: string | null
}

export type Outreach = OutreachInput & {
  id: number
  updatedByName: string | null
  createdAt: string
  updatedAt: string
}

const PATH = '/api/admin/store-outreach'

export const fetchOutreach = () => apiFetch<Outreach[]>(PATH)

export const createOutreach = (input: OutreachInput) =>
  apiFetch<Outreach>(PATH, { method: 'POST', body: input })

export const updateOutreach = (id: number, input: OutreachInput) =>
  apiFetch<Outreach>(`${PATH}/${id}`, { method: 'PUT', body: input })

export const deleteOutreach = (id: number) => apiFetch<void>(`${PATH}/${id}`, { method: 'DELETE' })
