import { apiFetch } from '@/api/client'

export type ChatTurn = { role: 'user' | 'assistant'; content: string }

export type ChatDiscount = {
  id: number
  brand: string
  category: string | null
  benefit: string | null
  area: string | null
  endDate: string | null
  sponsored: boolean
  imageUrl: string | null
}

export type ChatSource = { title: string; url: string; hostname: string }

export type ChatReply = { answer: string; offTopic: boolean; discounts: ChatDiscount[]; sources: ChatSource[] }

/** 수능 도우미에게 묻는다. 마지막 말이 사용자 질문(500자 이내)이어야 한다. */
export const askChat = (messages: ChatTurn[]) =>
  apiFetch<ChatReply>('/api/public/chat', { method: 'POST', body: { messages }, auth: false })
