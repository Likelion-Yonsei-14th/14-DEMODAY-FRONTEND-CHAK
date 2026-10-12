import {
  clearReaction,
  closeDesk,
  deleteSentMessage,
  openDesk,
  reportMessage,
  sendReply,
  setReaction,
  unlockWithAd,
} from '@/api/community'
import { isApiEnabled } from '@/api/config'
import { replyFromApi } from '@/api/mappers'
import { notifyApiError } from '@/api/notify'
import type { ApiReaction, ApiUnlockCategory } from '@/api/types'
import type { MessageReaction, MessageReply } from '@/types'

/** Backend message ids are numbers; seeded demo ids are not and never reach the server. */
export function toApiId(id: string): number | null {
  return /^\d+$/.test(id) ? Number(id) : null
}

const reactionToApi: Record<MessageReaction, ApiReaction> = {
  heart: 'HEART',
  teary: 'TEARY',
  clap: 'CLAP',
}

export const reactionFromApi = (value: ApiReaction): MessageReaction =>
  value.toLowerCase() as MessageReaction

const fail = (message: string) => () => notifyApiError(message)

export function syncReaction(messageId: string, reaction: MessageReaction | undefined) {
  const id = toApiId(messageId)
  if (!isApiEnabled || id === null) return
  const request = reaction ? setReaction(id, reactionToApi[reaction]) : clearReaction(id)
  request.catch(fail('반응을 저장하지 못했어요.'))
}

export function syncReport(messageId: string) {
  const id = toApiId(messageId)
  if (!isApiEnabled || id === null) return
  reportMessage(id).catch(fail('신고를 접수하지 못했어요. 잠시 후 다시 시도해주세요.'))
}

export function syncRoomClosed(closed: boolean) {
  if (!isApiEnabled) return
  const request = closed ? closeDesk() : openDesk()
  request.catch(fail('접수 상태를 바꾸지 못했어요. 잠시 후 다시 시도해주세요.'))
}

/** Sends the owner's reply; resolves with the server's copy or null when it was not sent. */
export async function syncReply(
  reply: Omit<MessageReply, 'id' | 'createdAt'>,
): Promise<MessageReply | null> {
  const targets = reply.targetMessageIds.map(toApiId)
  if (!isApiEnabled || targets.some((id) => id === null)) return null
  try {
    const saved = await sendReply({
      scope: reply.scope === 'daily' ? 'DAILY' : 'SINGLE',
      sourceMessageId: toApiId(reply.sourceMessageId) ?? undefined,
      targetMessageIds: targets as number[],
      text: reply.text,
    })
    return replyFromApi(saved)
  } catch {
    notifyApiError('답장을 보내지 못했어요. 잠시 후 다시 시도해주세요.')
    return null
  }
}

export function syncOwnDelete(messageId: string) {
  const id = toApiId(messageId)
  if (!isApiEnabled || id === null) return
  deleteSentMessage(id).catch(fail('편지를 삭제하지 못했어요. 새로고침 후 다시 확인해주세요.'))
}

export function syncUnlock(category: ApiUnlockCategory, assetId: string, adSessionId?: string) {
  if (!isApiEnabled) return
  unlockWithAd(category, assetId, adSessionId).catch(fail('해제 내용을 저장하지 못했어요.'))
}
