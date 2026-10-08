import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  Ban,
  Bell,
  Eye,
  Link2,
  LogOut,
  Share2,
  UsersRound,
} from 'lucide-react'
import {
  Navigate,
  useNavigate,
} from 'react-router-dom'
import {
  AppBar,
  Button,
  ChoiceCard,
  IconButton,
  TextField,
  useFeedback,
} from '@/design-system'
import {
  DEFAULT_CAPSULE_UNLOCK_AT,
  formatReadMode,
  joinDateTime,
  splitDateTime,
} from '@/features/desk/readModeUtils'
import { mergeSupportMessages } from '@/features/supporter/seededMessages'
import { AppShell } from '@/layout/AppShell'
import { buildPrototypeShareUrl } from '@/prototype/shareUrl'
import { DEFAULT_SUPPORTER_TOKEN, supporterPath } from '@/prototype/supporterRoute'
import { usePrototypeStore } from '@/store/prototypeStore'
import type { ReadMode } from '@/types'
import './DeskManagementPages.css'

export function DeskSettingsPage() {
  const navigate = useNavigate()
  const { showToast } = useFeedback()
  const desk = usePrototypeStore((state) => state.currentDesk)
  const settings = usePrototypeStore((state) => state.ownerSettings)
  const setDeskReadMode = usePrototypeStore(
    (state) => state.setDeskReadMode,
  )
  const updateSettings = usePrototypeStore(
    (state) => state.updateOwnerSettings,
  )

  const daily = desk.readMode.type === 'daily'
  const dailyTime =
    desk.readMode.type === 'daily'
      ? desk.readMode.unlockTime
      : '22:00'
  const capsule =
    desk.readMode.type === 'time-capsule'
      ? splitDateTime(desk.readMode.unlockAt)
      : splitDateTime(DEFAULT_CAPSULE_UNLOCK_AT)

  const setMode = (type: ReadMode['type']) => {
    if (type === 'daily') {
      setDeskReadMode({
        type: 'daily',
        unlockTime: dailyTime,
      })
      return
    }

    setDeskReadMode({
      type: 'time-capsule',
      unlockAt: joinDateTime(capsule.date, capsule.time),
    })
  }

  const share = async () => {
    const url = buildPrototypeShareUrl(supporterPath(DEFAULT_SUPPORTER_TOKEN))

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${desk.displayName}님의 응원 공간`,
          text: `${desk.displayName}님에게 응원을 남겨주세요.`,
          url,
        })
        return
      }

      await navigator.clipboard.writeText(url)
      showToast('응원 링크를 복사했어요.')
    } catch {
      // 공유 시트를 닫은 경우에는 별도 오류를 노출하지 않습니다.
    }
  }

  return (
    <AppShell
      surface="base"
      contentClassName="desk-settings-shell"
      appBar={
        <AppBar
          title="응원 공간 설정"
          leading={
            <IconButton
              label="내 책상으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate('/prototype/my/desk')}
            />
          }
        />
      }
    >
      <main className="desk-settings">
        <section className="desk-settings__section">
          <header>
            <h2>응원 열기</h2>
            <p>{formatReadMode(desk.readMode)}</p>
          </header>

          <div className="desk-settings__mode-list">
            <ChoiceCard
              title="하루를 마무리하며"
              description="매일 정해진 시간에 그날의 응원을 열어봐요."
              selected={daily}
              onClick={() => setMode('daily')}
            />

            {daily && (
              <label className="desk-settings__native-field">
                <span>응원을 열 시간</span>
                <input
                  type="time"
                  value={dailyTime}
                  onChange={(event) =>
                    setDeskReadMode({
                      type: 'daily',
                      unlockTime: event.target.value,
                    })
                  }
                />
              </label>
            )}

            <ChoiceCard
              title="한 번에 열어보기"
              description="정해둔 날까지 응원을 모아두고 한 번에 열어봐요."
              selected={!daily}
              onClick={() => setMode('time-capsule')}
            />

            {!daily && (
              <div className="desk-settings__split">
                <label className="desk-settings__native-field">
                  <span>날짜</span>
                  <input
                    type="date"
                    value={capsule.date}
                    onChange={(event) =>
                      setDeskReadMode({
                        type: 'time-capsule',
                        unlockAt: joinDateTime(
                          event.target.value,
                          capsule.time,
                        ),
                      })
                    }
                  />
                </label>
                <label className="desk-settings__native-field">
                  <span>시간</span>
                  <input
                    type="time"
                    value={capsule.time}
                    onChange={(event) =>
                      setDeskReadMode({
                        type: 'time-capsule',
                        unlockAt: joinDateTime(
                          capsule.date,
                          event.target.value,
                        ),
                      })
                    }
                  />
                </label>
              </div>
            )}
          </div>
        </section>

        <section className="desk-settings__section">
          <h2>공간 설정</h2>
          <SettingToggle
            icon={<Eye size={18} aria-hidden />}
            title="공개 응원 함께 보기"
            description="공개로 남긴 응원은 방문한 친구도 볼 수 있어요."
            checked={settings.publicFeedEnabled}
            onChange={(checked) =>
              updateSettings({ publicFeedEnabled: checked })
            }
          />
          <SettingToggle
            icon={<Bell size={18} aria-hidden />}
            title="새 응원 알림"
            description="새 응원이 도착하면 알려줘요."
            checked={settings.pushEnabled}
            onChange={(checked) =>
              updateSettings({ pushEnabled: checked })
            }
          />
        </section>

        <section className="desk-settings__section">
          <h2>관리</h2>
          <button
            type="button"
            className="desk-settings__row"
            onClick={share}
          >
            <Share2 size={18} aria-hidden />
            <span>
              <strong>친구 초대하기</strong>
              <small>응원 링크를 다시 공유해요.</small>
            </span>
          </button>
          <button
            type="button"
            className="desk-settings__row"
            onClick={() =>
              navigate('/prototype/my/settings/blocked')
            }
          >
            <Ban size={18} aria-hidden />
            <span>
              <strong>숨긴 친구 관리</strong>
              <small>
                {settings.blockedSupporters.length > 0
                  ? `${settings.blockedSupporters.length}명 숨김`
                  : '숨긴 친구가 없어요.'}
              </small>
            </span>
          </button>
          <button
            type="button"
            className="desk-settings__row"
            onClick={() =>
              navigate('/prototype/my/settings/connect')
            }
          >
            <Link2 size={18} aria-hidden />
            <span>
              <strong>다른 응원 공간 연결</strong>
              <small>별도로 만들어진 내 공간을 함께 관리해요.</small>
            </span>
          </button>
        </section>

        <button
          type="button"
          className="desk-settings__danger"
          onClick={() => navigate('/prototype/my/settings/end')}
        >
          응원 받기 종료
        </button>
      </main>
    </AppShell>
  )
}

export function BlockedSupportersPage() {
  const navigate = useNavigate()
  const storedMessages = usePrototypeStore((state) => state.messages)
  const settings = usePrototypeStore((state) => state.ownerSettings)
  const toggleBlocked = usePrototypeStore(
    (state) => state.toggleBlockedSupporter,
  )

  const supporters = useMemo(
    () =>
      Array.from(
        new Set(
          mergeSupportMessages(storedMessages).map(
            (message) => message.senderName,
          ),
        ),
      ).sort((a, b) => a.localeCompare(b, 'ko')),
    [storedMessages],
  )

  return (
    <AppShell
      surface="base"
      contentClassName="desk-settings-shell"
      appBar={
        <AppBar
          title="숨긴 친구 관리"
          leading={
            <IconButton
              label="설정으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate('/prototype/my/settings')}
            />
          }
        />
      }
    >
      <main className="desk-settings desk-settings--list">
        <section className="desk-settings__intro">
          <h1>보고 싶지 않은 응원은 숨길 수 있어요.</h1>
          <p>숨긴 친구가 남긴 응원은 내 책상과 응원 목록에서 보이지 않아요.</p>
        </section>

        <div className="desk-settings__people">
          {supporters.map((name) => {
            const blocked =
              settings.blockedSupporters.includes(name)

            return (
              <div className="desk-settings__person" key={name}>
                <span className="desk-settings__person-avatar">
                  {name.slice(0, 1)}
                </span>
                <strong>{name}</strong>
                <button
                  type="button"
                  className={
                    blocked
                      ? 'desk-settings__person-action desk-settings__person-action--blocked'
                      : 'desk-settings__person-action'
                  }
                  onClick={() => toggleBlocked(name)}
                >
                  {blocked ? '숨김 해제' : '숨기기'}
                </button>
              </div>
            )
          })}
        </div>
      </main>
    </AppShell>
  )
}

export function ConnectRoomsPage() {
  const navigate = useNavigate()
  const { showToast } = useFeedback()
  const settings = usePrototypeStore((state) => state.ownerSettings)
  const connectRoom = usePrototypeStore((state) => state.connectRoom)
  const [code, setCode] = useState('')

  const connect = () => {
    if (!code.trim()) return
    connectRoom(code)
    showToast('응원 공간을 연결했어요.')
    setCode('')
  }

  return (
    <AppShell
      surface="base"
      contentClassName="desk-settings-shell"
      appBar={
        <AppBar
          title="다른 응원 공간 연결"
          leading={
            <IconButton
              label="설정으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate('/prototype/my/settings')}
            />
          }
        />
      }
    >
      <main className="desk-settings desk-settings--list">
        <section className="desk-settings__intro">
          <h1>따로 만들어진 내 공간이 있나요?</h1>
          <p>
            연결 코드를 입력하면 한 계정에서 함께 찾아볼 수 있어요.
            응원이나 공간 자체가 합쳐지지는 않아요.
          </p>
        </section>

        <div className="desk-settings__connect-form">
          <TextField
            id="room-code"
            label="연결 코드"
            placeholder="예: JISU26"
            value={code}
            maxLength={16}
            onChange={(event) => setCode(event.target.value)}
          />
          <Button
            variant="brand"
            fullWidth
            disabled={!code.trim()}
            onClick={connect}
          >
            연결하기
          </Button>
        </div>

        {settings.connectedRooms.length > 0 && (
          <section className="desk-settings__section">
            <h2>연결된 공간</h2>
            {settings.connectedRooms.map((room) => (
              <div className="desk-settings__connected" key={room.id}>
                <span>
                  <strong>{room.name}</strong>
                  <small>{room.code}</small>
                </span>
              </div>
            ))}
          </section>
        )}
      </main>
    </AppShell>
  )
}

export function EndRoomPage() {
  const navigate = useNavigate()
  const settings = usePrototypeStore((state) => state.ownerSettings)
  const endRoom = usePrototypeStore((state) => state.endRoom)

  if (settings.roomClosed) {
    return <Navigate to="/prototype/my/desk" replace />
  }

  const confirm = () => {
    endRoom()
    navigate('/prototype/my/desk', { replace: true })
  }

  return (
    <AppShell
      surface="base"
      contentClassName="desk-settings-shell"
      appBar={
        <AppBar
          title="응원 받기 종료"
          leading={
            <IconButton
              label="설정으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate('/prototype/my/settings')}
            />
          }
        />
      }
      fixedAction={
        <div className="desk-settings__end-actions">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => navigate('/prototype/my/settings')}
          >
            계속 응원 받기
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={confirm}
          >
            응원 받기 종료
          </Button>
        </div>
      }
    >
      <main className="desk-settings__end">
        <span className="desk-settings__end-icon" aria-hidden>
          <LogOut size={23} />
        </span>
        <h1>
          이 공간에서
          <br />
          응원 받기를 끝낼까요?
        </h1>
        <p>
          기존에 받은 응원은 그대로 볼 수 있지만, 친구들은 더 이상 새 응원을 남길 수 없어요.
        </p>
      </main>
    </AppShell>
  )
}

export function CreatorManagementPage() {
  const navigate = useNavigate()
  const { showToast } = useFeedback()
  const desk = usePrototypeStore((state) => state.currentDesk)
  const setDeskReadMode = usePrototypeStore(
    (state) => state.setDeskReadMode,
  )

  const claimed = desk.claimStatus === 'claimed'
  const claimCode = desk.id
    .replace(/[^a-z0-9]/gi, '')
    .slice(-7)
    .toUpperCase()

  const share = async (kind: 'owner' | 'support') => {
    const path =
      kind === 'owner'
        ? '/prototype/claim'
        : supporterPath(DEFAULT_SUPPORTER_TOKEN)
    const url = buildPrototypeShareUrl(path)

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${desk.displayName}님의 응원 공간`,
          url,
        })
        return
      }

      await navigator.clipboard.writeText(url)
      showToast('링크를 복사했어요.')
    } catch {
      // 공유 시트를 닫은 경우에는 별도 오류를 노출하지 않습니다.
    }
  }

  if (claimed) {
    return (
      <AppShell
        surface="base"
        contentClassName="desk-settings-shell"
        appBar={
          <AppBar
            title="만든 공간 관리"
            leading={
              <IconButton
                label="책상으로 돌아가기"
                icon={<ArrowLeft size={21} aria-hidden />}
                onClick={() => navigate(supporterPath(DEFAULT_SUPPORTER_TOKEN))}
              />
            }
          />
        }
      >
        <main className="creator-management creator-management--claimed">
          <span className="creator-management__icon" aria-hidden>
            <UsersRound size={24} />
          </span>
          <h1>
            이제 {desk.displayName}님이
            <br />
            이 공간을 관리해요.
          </h1>
          <p>
            나는 다른 친구들과 같은 방식으로 응원을 남기고 공개된 응원을 볼 수 있어요.
          </p>
          <Button
            variant="brand"
            fullWidth
            onClick={() => navigate(supporterPath(DEFAULT_SUPPORTER_TOKEN))}
          >
            {desk.displayName}님의 책상으로 가기
          </Button>
        </main>
      </AppShell>
    )
  }

  return (
    <AppShell
      surface="base"
      contentClassName="desk-settings-shell"
      appBar={
        <AppBar
          title="만든 공간 관리"
          leading={
            <IconButton
              label="책상으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate(supporterPath(DEFAULT_SUPPORTER_TOKEN))}
            />
          }
        />
      }
    >
      <main className="creator-management">
        <section className="creator-management__heading">
          <span>아직 {desk.displayName}님이 가져가기 전이에요.</span>
          <h1>{desk.displayName}님의 응원 공간</h1>
        </section>

        <section className="desk-settings__section">
          <h2>응원 열기</h2>
          <strong className="creator-management__read-mode">
            {formatReadMode(desk.readMode)}
          </strong>
          {desk.readMode.type === 'daily' ? (
            <label className="desk-settings__native-field">
              <span>응원을 열 시간</span>
              <input
                type="time"
                value={desk.readMode.unlockTime}
                onChange={(event) =>
                  setDeskReadMode({
                    type: 'daily',
                    unlockTime: event.target.value,
                  })
                }
              />
            </label>
          ) : (
            <div className="desk-settings__split">
              <label className="desk-settings__native-field">
                <span>날짜</span>
                <input
                  type="date"
                  value={splitDateTime(desk.readMode.unlockAt).date}
                  onChange={(event) => {
                    const current = splitDateTime(
                      desk.readMode.type === 'time-capsule'
                        ? desk.readMode.unlockAt
                        : DEFAULT_CAPSULE_UNLOCK_AT,
                    )
                    setDeskReadMode({
                      type: 'time-capsule',
                      unlockAt: joinDateTime(
                        event.target.value,
                        current.time,
                      ),
                    })
                  }}
                />
              </label>
              <label className="desk-settings__native-field">
                <span>시간</span>
                <input
                  type="time"
                  value={splitDateTime(desk.readMode.unlockAt).time}
                  onChange={(event) => {
                    const current = splitDateTime(
                      desk.readMode.type === 'time-capsule'
                        ? desk.readMode.unlockAt
                        : DEFAULT_CAPSULE_UNLOCK_AT,
                    )
                    setDeskReadMode({
                      type: 'time-capsule',
                      unlockAt: joinDateTime(
                        current.date,
                        event.target.value,
                      ),
                    })
                  }}
                />
              </label>
            </div>
          )}
        </section>

        <section className="creator-management__code">
          <span>연결 코드</span>
          <strong>{claimCode}</strong>
          <small>책상 주인이 이 공간을 찾을 때 사용할 수 있어요.</small>
        </section>

        <div className="creator-management__actions">
          <Button
            variant="brand"
            fullWidth
            leadingIcon={<Share2 size={18} aria-hidden />}
            onClick={() => share('owner')}
          >
            {desk.displayName}님에게 보내기
          </Button>
          <Button
            variant="secondary"
            fullWidth
            leadingIcon={<Share2 size={18} aria-hidden />}
            onClick={() => share('support')}
          >
            응원 링크 공유하기
          </Button>
        </div>
      </main>
    </AppShell>
  )
}

function SettingToggle({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="desk-settings__toggle">
      <span className="desk-settings__toggle-icon">{icon}</span>
      <span className="desk-settings__toggle-copy">
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="desk-settings__switch" aria-hidden />
    </label>
  )
}
