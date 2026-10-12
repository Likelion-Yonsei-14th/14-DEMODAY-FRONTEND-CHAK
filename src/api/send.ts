import { sendMessage } from '@/api/desks'
import {
  letterRequest,
  objectFromApi,
  publicMessagesFromApi,
  stickerRequest,
} from '@/api/mappers'
import { emptyComposerDraft } from '@/prototype/mock/initialState'
import { resolveDeskZone } from '@/features/supporter/supporterFlow'
import { usePrototypeStore } from '@/store/prototypeStore'
import type { CharmMaterial, DeskGem, DeskObjectType, DeskPlacement } from '@/types'

export type SendToServerInput = {
  supporterToken: string
  stickerMode: boolean
  objectType: DeskObjectType
  objectColor?: string
  placement: DeskPlacement
  charm?: { assetId: string; material: CharmMaterial; charmPhrase?: string }
  gems?: DeskGem[]
  paymentOrderId?: number
}

/**
 * Sends the letter (or sticker) being composed to the backend and, once the
 * server accepts it, adds the server's copy to the on-screen desk. Throws the
 * ApiError so the caller can show a message and let the user retry.
 */
export async function sendToServer(input: SendToServerInput): Promise<void> {
  const state = usePrototypeStore.getState()
  const count = state.currentDesk.objects.length
  const zone = resolveDeskZone(count)
  const zIndex = count + 30
  const defaultNickname = state.supporterSettings.defaultNickname.trim()
  // A signed-in sender may leave the name blank: the server then uses the
  // account name. Guests must always send one.
  const signedIn = state.authSession.status === 'authenticated'
  const fallback = signedIn ? undefined : '익명의 친구'

  const request = input.stickerMode
    ? stickerRequest({
        stickerId: state.stickerDraft.stickerId,
        nickname: state.stickerDraft.senderName.trim() || defaultNickname || fallback,
        placement: input.placement,
        zone,
        order: count,
        zIndex,
      })
    : letterRequest({
        draft: state.composerDraft,
        nickname: state.composerDraft.senderName.trim() || defaultNickname || fallback,
        objectType: input.objectType,
        objectColor: input.objectColor,
        placement: input.placement,
        zone,
        order: count,
        zIndex,
        charm: input.charm,
        gems: input.gems,
        paymentOrderId: input.paymentOrderId,
      })

  const created = await sendMessage(input.supporterToken, request)

  const deskId = state.currentDesk.id
  const { messages } = publicMessagesFromApi([created], deskId)
  const message = messages[0]
  if (!message || !created.object) return
  const object = objectFromApi(created.object, message.id, count, message.visibility)

  state.appendServerMessage(message, object)
  if (!input.stickerMode) {
    usePrototypeStore.setState({
      composerDraft: { ...emptyComposerDraft, senderName: defaultNickname },
    })
  }
}

/** User-facing text for a failed send; the backend error code decides the wording. */
export function sendErrorMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code
  switch (code) {
    case 'DESK_CLOSED':
      return '이 책상은 지금 새로운 응원을 받고 있지 않아요.'
    case 'INVALID_CARD_PAYLOAD':
      return '카드 내용이 너무 크거나 올바르지 않아요. 사진이나 스티커를 줄여 주세요.'
    case 'GUEST_IMAGE_NOT_ALLOWED':
      return '사진은 로그인 후에 첨부할 수 있어요. 로그인하거나 사진을 빼고 보내주세요.'
    case 'PAYMENT_REQUIRED':
    case 'ORDER_ALREADY_USED':
      return '결제 정보를 확인할 수 없어요. 결제를 다시 진행해주세요.'
    case 'TOO_MANY_EVENTS':
      return '요청이 너무 많아요. 잠시 후 다시 시도해주세요.'
    default:
      return '응원을 보내지 못했어요. 잠시 후 다시 시도해주세요.'
  }
}
