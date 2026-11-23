import { isRollingPaperReleased, PROTOTYPE_PARAM } from '@/lib/featureFlags'
import { shareOrCopyLink } from '@/lib/shareLink'
import { buildPrototypeShareUrl } from '@/prototype/shareUrl'

export const rollingPaperClassPath = (classId: string) =>
  `/rolling-paper/${classId}`

export async function shareRollingPaperInvite(
  classId: string,
  className: string,
  showToast: Parameters<typeof shareOrCopyLink>[1],
  personal = false,
) {
  await shareOrCopyLink(
    {
      title: personal ? className : `${className} 연말 롤링페이퍼`,
      text: personal
        ? '내 롤링페이퍼에 한마디 남겨 줘! 다른 사람 글은 나만 볼 수 있어.'
        : '너도 롤링페이퍼 걸고, 서로 한마디씩 남기자!',
      url: inviteUrl(classId),
    },
    showToast,
    '친구들에게 보낼 링크를 복사했어요.',
  )
}

/** 정식으로 열리기 전(테스트 모드)에는 받은 사람도 테스트 모드로 들어오게 표시를 붙인다. */
function inviteUrl(classId: string) {
  const url = new URL(buildPrototypeShareUrl(`${rollingPaperClassPath(classId)}/join`))
  if (!isRollingPaperReleased()) url.searchParams.set(PROTOTYPE_PARAM, '1')
  return url.toString()
}
