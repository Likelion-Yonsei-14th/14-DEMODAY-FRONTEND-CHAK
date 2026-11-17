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

export type OutreachInput = {
  storeName: string
  category: string | null
  region: string | null
  channel: OutreachChannel
  contact: string | null
  assignee: string | null
  status: OutreachStatus
  note: string | null
  lastContactedOn: string | null
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
