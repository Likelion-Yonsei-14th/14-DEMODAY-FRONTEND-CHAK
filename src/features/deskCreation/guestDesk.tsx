import { Button, Dialog } from '@/design-system'
import { useLoginToSaveGuestDesk } from './guestDeskState'
import './guestDesk.css'

const GUEST_DESK_TITLE = '로그인하면 책상을 저장하고 공유할 수 있어요'
const GUEST_DESK_DESCRIPTION =
  '로그인 하지 않으면 책상이 사라져요'

/** The note shown on a guest's desk: it is not saved yet, and logging in keeps it. */
export function GuestDeskNotice() {
  const loginToSave = useLoginToSaveGuestDesk()
  return (
    <section className="guest-desk-notice" role="status">
      <div>
        <strong>{GUEST_DESK_TITLE}</strong>
        <span>{GUEST_DESK_DESCRIPTION}</span>
      </div>
      <Button variant="brand" size="m" fullWidth onClick={loginToSave}>
        로그인하고 책상 저장하기
      </Button>
    </section>
  )
}

/** Shown when a guest tries something that needs the saved desk, like sharing its link. */
export function GuestDeskDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const loginToSave = useLoginToSaveGuestDesk()
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={GUEST_DESK_TITLE}
      description="응원 링크는 책상을 저장해야 만들어져요. 로그인하고 친구들에게 공유해 보세요."
      secondaryAction={{ label: '닫기', onClick: onClose }}
      primaryAction={{
        label: '로그인하고 책상 저장하기',
        onClick: () => {
          onClose()
          loginToSave()
        },
      }}
    />
  )
}
