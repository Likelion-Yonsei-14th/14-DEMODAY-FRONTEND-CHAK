import type { DeskObjectType, DeskZone, MessageDraft } from '@/types'

export function resolveDeskObjectType(draft: MessageDraft): DeskObjectType {
  if (draft.photoElements.length > 0) return 'photo-card'

  const expressiveAssets =
    draft.wordArtElements.length + draft.stickerElements.length

  if (expressiveAssets >= 3) return 'poster-card'
  if (draft.canvasMode === 'long') return 'letter'

  return 'memo'
}

const placementOrder: DeskZone[] = ['center', 'left', 'right', 'front', 'back']

export function resolveDeskZone(existingCount: number): DeskZone {
  const index = existingCount % placementOrder.length
  return placementOrder[index] ?? 'center'
}

export const deskObjectLabels: Record<DeskObjectType, string> = {
  memo: '작은 메모 카드',
  'photo-card': '사진 카드',
  charm: '행운 부적',
  'poster-card': '응원 포스터',
  letter: '편지',
  ticket: '약속 티켓',
  'generic-card': '응원 카드',
}
