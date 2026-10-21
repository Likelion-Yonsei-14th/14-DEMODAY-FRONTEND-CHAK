import { shareOrCopyLink } from '@/lib/shareLink'
import { buildPrototypeShareUrl } from '@/prototype/shareUrl'
import { getOwnSupporterToken } from '@/prototype/ownSupporterToken'
import { supporterPath } from '@/prototype/supporterRoute'

/** Copy for the owner's own "please cheer me on" share. */
export const ASK_FOR_CHEERS_LABEL = '친구에게 응원 부탁하기'

/**
 * The owner of a self-made desk asks friends to leave a cheer. Uses the
 * share sheet when there is one, otherwise copies the supporter link.
 */
export async function shareMyDeskLink(
  showToast: (message: string) => void,
  supporterToken: string = getOwnSupporterToken(),
) {
  await shareOrCopyLink(
    buildPrototypeShareUrl(supporterPath(supporterToken)),
    showToast,
    '응원 링크를 복사했어요. 친구에게 붙여넣어 보내세요.',
  )
}
