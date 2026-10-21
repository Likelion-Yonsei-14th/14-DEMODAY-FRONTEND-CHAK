import { apiFetch } from '@/api/client'
import type { SliceResponse } from '@/api/types'

export type AdminUserSummary = {
  id: number
  provider: 'KAKAO' | 'GOOGLE'
  displayName: string
  email: string | null
  profileImageUrl: string | null
  admin: boolean
  createdAt: string
  lastLoginAt: string | null
  deletedAt: string | null
}

export type AdminAuditEntry = {
  action: string
  adminUserId: number
  detail: string | null
  createdAt: string
}

export type AdminUserDetail = {
  user: AdminUserSummary
  deskId: number | null
  deskClosed: boolean
  receivedMessages: number
  sentMessages: number
  chaltteokBalance: number
  history: AdminAuditEntry[]
}

export type AdminUserState = 'ACTIVE' | 'DELETED' | 'ALL'

export type AdminDailyStat = {
  date: string
  visitors: number
  memberVisitors: number
  guestVisitors: number
  pageViews: number
  signups: number
  desksCreated: number
  messagesCreated: number
  chargeAmount: number
}

export type AdminDailyStats = {
  from: string
  to: string
  totalUsers: number
  totalDesks: number
  totalMessages: number
  days: AdminDailyStat[]
}

export type AdminRegionStat = {
  country: string | null
  region: string | null
  regionName: string
  visitors: number
  pageViews: number
}

export type AdminRegionStats = {
  from: string
  to: string
  items: AdminRegionStat[]
  unknownPageViews: number
}

export type AdminReport = {
  id: number
  messageId: number
  reason: string | null
  status: string
  messageAuthorDisplayName: string
  messageVisibility: string
  messageStatus: string
  createdAt: string
  resolvedAt: string | null
}

export type ReportAction = 'DISMISS' | 'REMOVE_MESSAGE'

export const fetchAdminUsers = (query: string, state: AdminUserState, page: number) =>
  apiFetch<SliceResponse<AdminUserSummary>>('/api/admin/users', {
    query: { query: query || undefined, state, page, size: 20 },
  })

export const fetchAdminUser = (userId: number) =>
  apiFetch<AdminUserDetail>(`/api/admin/users/${userId}`)

export const withdrawAdminUser = (userId: number, confirmForfeitBalance: boolean) =>
  apiFetch<AdminUserDetail>(`/api/admin/users/${userId}/withdraw`, {
    method: 'POST',
    body: { confirmForfeitBalance },
  })

export const fetchDailyStats = (from: string, to: string) =>
  apiFetch<AdminDailyStats>('/api/admin/stats/daily', { query: { from, to } })

export const fetchRegionStats = (from: string, to: string) =>
  apiFetch<AdminRegionStats>('/api/admin/stats/regions', { query: { from, to } })

export const fetchAdminReports = (status: string | undefined, page: number) =>
  apiFetch<SliceResponse<AdminReport>>('/api/admin/reports', {
    query: { status, page, size: 20 },
  })

export const actOnReport = (reportId: number, action: ReportAction) =>
  apiFetch<AdminReport>(`/api/admin/reports/${reportId}`, { method: 'PATCH', body: { action } })

export type AdminInvite = {
  id: number
  email: string
  createdAt: string
  consumedAt: string | null
  bootstrap: boolean
}

export type AdminAccess = {
  admins: AdminUserSummary[]
  invites: AdminInvite[]
}

export const fetchAdminAccess = () => apiFetch<AdminAccess>('/api/admin/admins')

export const grantAdmin = (email: string) =>
  apiFetch<AdminAccess>('/api/admin/admins', { method: 'POST', body: { email } })

export const revokeAdmin = (userId: number) =>
  apiFetch<AdminAccess>(`/api/admin/admins/users/${userId}`, { method: 'DELETE' })

export const cancelAdminInvite = (inviteId: number) =>
  apiFetch<AdminAccess>(`/api/admin/admins/invites/${inviteId}`, { method: 'DELETE' })
