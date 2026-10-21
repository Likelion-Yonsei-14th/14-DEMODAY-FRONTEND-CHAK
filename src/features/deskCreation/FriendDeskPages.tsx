import { useEffect, useState, type ReactNode } from 'react'
import { ArrowLeft, Share2, Trash2 } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { deleteDesk, fetchFriendDesks, type ApiFriendDesk } from '@/api/desks'
import { AppBar, Button, IconButton, useFeedback } from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import { shareOrCopyLink } from '@/lib/shareLink'
import { buildPrototypeShareUrl } from '@/prototype/shareUrl'
import { supporterPath } from '@/prototype/supporterRoute'
import './DeskCreation.css'

/** The link the friend who made the desk sends to the person it is for. */
const claimPath = (claimToken: string) => `/claim/${claimToken}`

const readModeLabel = (desk: ApiFriendDesk) =>
  desk.readModeType === 'DAILY'
    ? `매일 ${desk.dailyUnlockTime?.slice(0, 5) ?? ''}에 열어봐요`
    : `${new Date(desk.capsuleUnlockAt ?? '').toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}에 한 번에 열어봐요`

function FriendDeskShell({ title, back, children }: { title: string; back: () => void; children: ReactNode }) {
  return (
    <AppShell
      surface="base"
      contentClassName="desk-create-shell"
      appBar={
        <AppBar
          title={title}
          leading={<IconButton label="이전으로" icon={<ArrowLeft size={21} aria-hidden />} onClick={back} />}
        />
      }
    >
      <main className="desk-create">{children}</main>
    </AppShell>
  )
}

/** One desk made for a friend: the two links to send, how many cheers arrived (never what they say), and delete. */
function FriendDeskCard({ desk, onDelete }: { desk: ApiFriendDesk; onDelete?: (desk: ApiFriendDesk) => void }) {
  const { showToast } = useFeedback()
  const [sharing, setSharing] = useState(false)

  const share = async (kind: 'owner' | 'support') => {
    if (sharing) return
    setSharing(true)
    try {
      await shareOrCopyLink(
        kind === 'owner'
          ? {
              title: `${desk.displayName}님의 응원 책상`,
              text: '친구들이 응원 책상을 만들어두었어요. 받으러 와 주세요.',
              url: buildPrototypeShareUrl(claimPath(desk.claimToken)),
            }
          : {
              title: `${desk.displayName} 책상에 응원 하나 놓고 가줘!`,
              text: `${desk.displayName} 응원 책상을 만들었어. 응원 하나 놓고 가줘!`,
              url: buildPrototypeShareUrl(supporterPath(desk.supporterToken)),
            },
        showToast,
        '링크를 복사했어요.',
      )
    } finally {
      setSharing(false)
    }
  }

  return (
    <section className="friend-desk" aria-label={`${desk.displayName}님의 책상`}>
      <header>
        <h2>{desk.displayName}님의 책상</h2>
        <span>{readModeLabel(desk)}</span>
      </header>
      <p className="friend-desk__count">
        {desk.messageCount > 0
          ? `친구 ${desk.friendCount}명이 응원 ${desk.messageCount}개를 남겼어요.`
          : '아직 남긴 응원이 없어요.'}
        <small>응원 내용은 책상 주인만 볼 수 있어요.</small>
      </p>
      <div className="desk-create__complete-actions">
        <Button variant="secondary" fullWidth leadingIcon={<Share2 size={18} aria-hidden />} disabled={sharing} onClick={() => share('owner')}>
          책상 주인에게 보내기
        </Button>
        <Button variant="secondary" fullWidth leadingIcon={<Share2 size={18} aria-hidden />} disabled={sharing} onClick={() => share('support')}>
          응원 링크 보내기
        </Button>
        {onDelete && (
          <Button variant="tertiary" fullWidth leadingIcon={<Trash2 size={18} aria-hidden />} onClick={() => onDelete(desk)}>
            이 책상 삭제하기
          </Button>
        )}
      </div>
    </section>
  )
}

/** Shown right after making a desk for a friend: send the two links now. */
export function FriendDeskCreatedPage() {
  const navigate = useNavigate()
  const desk = (useLocation().state as { desk?: ApiFriendDesk } | null)?.desk

  if (!desk) {
    // Opened directly (e.g. a reload): the list shows the same desks.
    return <FriendDesksPage />
  }
  return (
    <FriendDeskShell title="응원 책상 만들기" back={() => navigate('/home')}>
      <section className="desk-create__heading">
        <h1>
          {desk.displayName}님의 응원 책상이
          <br />
          만들어졌어요.
        </h1>
      </section>
      <p className="friend-desk__hint">
        책상 주인에게는 <strong>받는 링크</strong>를, 응원을 남길 친구들에게는 <strong>응원 링크</strong>를 보내 주세요.
      </p>
      <FriendDeskCard desk={desk} />
      <Button variant="tertiary" fullWidth onClick={() => navigate('/friend-desks')}>
        내가 만든 친구 책상 보기
      </Button>
    </FriendDeskShell>
  )
}

/** Desks I made for friends that have not been handed over yet. */
export function FriendDesksPage() {
  const navigate = useNavigate()
  const { showToast } = useFeedback()
  const [desks, setDesks] = useState<ApiFriendDesk[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchFriendDesks()
      .then((result) => {
        if (cancelled) return
        setDesks(result)
        setFailed(false)
      })
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [reload])

  const remove = async (desk: ApiFriendDesk) => {
    if (!window.confirm(`${desk.displayName}님의 책상을 삭제할까요? 모인 응원도 함께 사라지고 되돌릴 수 없어요.`)) return
    try {
      await deleteDesk(desk.id)
      showToast('책상을 삭제했어요.')
      setReload((value) => value + 1)
    } catch (error) {
      showToast(error instanceof ApiError && error.status === 404 ? '이미 없는 책상이에요.' : '삭제하지 못했어요. 잠시 후 다시 시도해주세요.')
      setReload((value) => value + 1)
    }
  }

  return (
    <FriendDeskShell title="내가 만든 친구 책상" back={() => navigate('/home')}>
      <section className="desk-create__heading">
        <h1>
          친구에게 전달하지 않은
          <br />
          책상이에요.
        </h1>
      </section>
      {failed && <p role="alert">목록을 불러오지 못했어요.</p>}
      {desks === null && !failed && <p>불러오고 있어요...</p>}
      {desks?.length === 0 && <p>아직 전달하지 않은 친구 책상이 없어요.</p>}
      {desks?.map((desk) => <FriendDeskCard key={desk.id} desk={desk} onDelete={remove} />)}
      <Button variant="brand" fullWidth onClick={() => navigate('/prototype/create')}>
        새 책상 만들기
      </Button>
    </FriendDeskShell>
  )
}
