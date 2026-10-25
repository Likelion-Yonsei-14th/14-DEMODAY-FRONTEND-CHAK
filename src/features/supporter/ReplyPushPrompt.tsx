import { Bell } from 'lucide-react'
import { Button } from '@/design-system'
import { isApiEnabled } from '@/api/config'
import { usePushSubscription } from '@/lib/usePushSubscription'

/**
 * 응원을 남긴 직후, 답장이 오면 알려 줄지 묻는다. 이 브라우저에서 알림을 켤 수 있고 아직 켜지 않았을 때만 보인다.
 * (아이폰 일반 브라우저처럼 켤 수 없는 곳에서는 설정 화면의 안내로 대신한다.)
 */
export function ReplyPushPrompt() {
  const { support, subscribed, busy, error, enable, denied } = usePushSubscription()
  if (!isApiEnabled || support !== 'supported' || denied) return null

  if (subscribed) {
    return (
      <p className="support-complete__push" role="status">
        <Bell size={16} aria-hidden /> 답장이 오면 알려 드릴게요.
      </p>
    )
  }

  return (
    <section className="support-complete__push" aria-label="답장 알림">
      <p>
        <Bell size={16} aria-hidden /> 답장이 오면 알려 드릴까요?
      </p>
      <Button variant="secondary" size="m" fullWidth loading={busy} onClick={() => void enable()}>
        답장 알림 받기
      </Button>
      {error && (
        <small role="alert" className="support-complete__push-error">
          {error}
        </small>
      )}
    </section>
  )
}
