import { fetchMyReactions, fetchOwnerReplies, fetchSupporters } from '@/api/community'
import { reactionFromApi } from '@/api/communitySync'
import { fetchMyDesk, fetchOwnerMessages } from '@/api/desks'
import { deskFromApi, ownerMessagesFromApi, replyFromApi } from '@/api/mappers'
import { usePrototypeStore } from '@/store/prototypeStore'
import type { MessageReaction } from '@/types'

/** Reactions the viewer already left, keyed by message id. Failure just means none are shown. */
export async function loadReactions(messageIds: string[]) {
  try {
    const found = await fetchMyReactions(messageIds.map(Number))
    const reactions: Partial<Record<string, MessageReaction>> = {}
    for (const [id, type] of Object.entries(found)) reactions[id] = reactionFromApi(type)
    return reactions
  } catch {
    return {}
  }
}

/**
 * Loads the signed-in owner's desk, letters, replies, reactions and hidden
 * supporters into the store. Also used to refresh after hiding a supporter.
 */
export async function loadOwnerDesk(isCancelled: () => boolean = () => false) {
  const desk = await fetchMyDesk()
  const items = await fetchOwnerMessages()
  if (isCancelled()) return
  const store = usePrototypeStore.getState()
  const mapped = ownerMessagesFromApi(items, String(desk.id))
  store.hydrateDesk({
    desk: deskFromApi(desk, store.currentDesk, mapped.objects, desk.supporterToken),
    messages: mapped.messages,
    readMessageIds: mapped.readMessageIds,
    basketMessageIds: mapped.basketMessageIds,
    ownerSettings: {
      publicFeedEnabled: desk.publicFeedEnabled,
      roomClosed: desk.roomClosed,
      pushEnabled: desk.pushEnabled,
      defaultMessageVisibility: desk.defaultMessageVisibility === 'PUBLIC' ? 'public' : 'private',
    },
  })

  const [replies, supporters, reactions] = await Promise.all([
    fetchOwnerReplies().catch(() => []),
    fetchSupporters().catch(() => []),
    loadReactions(mapped.messages.map((message) => message.id)),
  ])
  if (isCancelled()) return
  usePrototypeStore.setState({
    messageReplies: replies.map(replyFromApi),
    ownerSupporters: supporters,
    messageReactions: reactions,
  })
}

