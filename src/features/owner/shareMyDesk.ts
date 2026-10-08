import { getCsatDdayLabel } from '@/features/csat/csatSchedule'
import { buildPrototypeShareUrl } from '@/prototype/shareUrl'
import { DEFAULT_SUPPORTER_TOKEN, supporterPath } from '@/prototype/supporterRoute'

/** Copy for the owner's own "please cheer me on" share. */
export const ASK_FOR_CHEERS_LABEL = '친구에게 응원 부탁하기'

/**
 * The owner of a self-made desk asks friends to leave a cheer. Uses the
 * share sheet when there is one, otherwise copies the supporter link.
 */
export async function shareMyDeskLink(
  showToast: (message: string) => void,
  supporterToken: string = DEFAULT_SUPPORTER_TOKEN,
) {
  const dday = getCsatDdayLabel()
  const url = buildPrototypeShareUrl(supporterPath(supporterToken))
  const title = '내 책상에 응원 하나 놓고 가줘!'
  const text = dday.startsWith('수능까지')
    ? `${dday}, 네 응원 하나면 버틸 수 있을 것 같아.`
    : '네 응원 하나면 버틸 수 있을 것 같아.'

  try {
    if (navigator.share) {
      await navigator.share({ title, text, url })
    } else {
      await navigator.clipboard.writeText(url)
      showToast('응원 링크를 복사했어요. 친구에게 붙여넣어 보내세요.')
    }
  } catch {
    // The share sheet was dismissed.
  }
}
