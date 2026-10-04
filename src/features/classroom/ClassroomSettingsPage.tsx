import { useState } from 'react'
import {
  ArrowLeft,
  Bell,
  Copy,
  LogOut,
  RefreshCw,
  Share2,
} from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  AppBar,
  Button,
  IconButton,
  TextField,
  useFeedback,
} from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import { buildPrototypeShareUrl } from '@/prototype/shareUrl'
import { usePrototypeStore } from '@/store/prototypeStore'
import './ClassroomSettingsPage.css'

export function ClassroomSettingsPage() {
  const navigate = useNavigate()
  const { classroomId } = useParams()
  const { showToast } = useFeedback()
  const classroom = usePrototypeStore((state) => state.classroom)
  const member = usePrototypeStore((state) => state.classroomMember)
  const updateClassroomSettings = usePrototypeStore(
    (state) => state.updateClassroomSettings,
  )
  const regenerateInviteCode = usePrototypeStore(
    (state) => state.regenerateClassroomInviteCode,
  )
  const updateClassroomMember = usePrototypeStore(
    (state) => state.updateClassroomMember,
  )
  const leaveClassroom = usePrototypeStore(
    (state) => state.leaveClassroom,
  )
  const [classroomName, setClassroomName] = useState(
    classroom.name,
  )
  const [displayName, setDisplayName] = useState(
    member?.displayName ?? '',
  )

  if (!member) {
    return (
      <Navigate
        to={`/prototype/classroom/${classroomId ?? classroom.id}/join`}
        replace
      />
    )
  }

  const id = classroomId ?? classroom.id
  const admin =
    classroom.lockers[0]?.id === member.lockerId

  const saveNames = () => {
    if (admin && classroomName.trim()) {
      updateClassroomSettings({
        name: classroomName.trim(),
      })
    }
    if (displayName.trim()) {
      updateClassroomMember({
        displayName: displayName.trim(),
      })
    }
    showToast('설정을 저장했어요.')
  }

  const share = async () => {
    const url = buildPrototypeShareUrl(
      `/prototype/classroom/${id}/join`,
    )

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${classroom.name} 응원 공간`,
          text: '우리끼리 칠판과 사물함에 응원을 남겨요.',
          url,
        })
        return
      }

      await navigator.clipboard.writeText(url)
      showToast('초대 링크를 복사했어요.')
    } catch {
      // 공유 시트를 닫은 경우에는 별도 오류를 노출하지 않습니다.
    }
  }

  return (
    <AppShell
      surface="base"
      contentClassName="classroom-settings-shell"
      appBar={
        <AppBar
          title="우리 공간 설정"
          leading={
            <IconButton
              label="교실로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() =>
                navigate(
                  `/prototype/classroom/${id}/map`,
                )
              }
            />
          }
        />
      }
      fixedAction={
        <Button
          variant="brand"
          fullWidth
          disabled={
            !displayName.trim() ||
            (admin && !classroomName.trim())
          }
          onClick={saveNames}
        >
          저장
        </Button>
      }
    >
      <main className="classroom-settings">
        {admin && (
          <section className="classroom-settings__section">
            <header>
              <h2>공간 관리</h2>
              <span className="classroom-settings__admin-badge">
                만든 사람
              </span>
            </header>

            <TextField
              id="classroom-settings-name"
              label="공간 이름"
              maxLength={20}
              value={classroomName}
              onChange={(event) =>
                setClassroomName(event.target.value)
              }
            />

            <label className="classroom-settings__native-field">
              <span>사물함 응원을 열 시간</span>
              <input
                type="time"
                value={classroom.dailyUnlockTime}
                onChange={(event) =>
                  updateClassroomSettings({
                    dailyUnlockTime: event.target.value,
                  })
                }
              />
            </label>

            <div className="classroom-settings__invite">
              <span>초대 코드</span>
              <strong>{classroom.inviteCode}</strong>
              <div>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(
                      classroom.inviteCode,
                    )
                    showToast('초대 코드를 복사했어요.')
                  }}
                >
                  <Copy size={15} aria-hidden />
                  복사
                </button>
                <button
                  type="button"
                  onClick={() => {
                    regenerateInviteCode()
                    showToast('새 초대 코드를 만들었어요.')
                  }}
                >
                  <RefreshCw size={15} aria-hidden />
                  새로 만들기
                </button>
              </div>
            </div>

            <Button
              variant="secondary"
              fullWidth
              leadingIcon={<Share2 size={17} aria-hidden />}
              onClick={share}
            >
              초대 링크 공유하기
            </Button>
          </section>
        )}

        <section className="classroom-settings__section">
          <header>
            <h2>내 설정</h2>
          </header>

          <TextField
            id="classroom-member-name"
            label="교실에서 보일 이름"
            maxLength={12}
            value={displayName}
            onChange={(event) =>
              setDisplayName(event.target.value)
            }
          />

          <ClassroomSettingToggle
            icon={<Bell size={18} aria-hidden />}
            title="새 응원과 답장 알림"
            description="내 사물함에 새 응원이 오거나 답장이 오면 알려줘요."
            checked={member.pushEnabled}
            onChange={(checked) =>
              updateClassroomMember({
                pushEnabled: checked,
              })
            }
          />
        </section>

        {!admin && (
          <section className="classroom-settings__section">
            <button
              type="button"
              className="classroom-settings__leave"
              onClick={() => {
                leaveClassroom()
                navigate('/start', { replace: true })
              }}
            >
              <LogOut size={16} aria-hidden />
              이 공간 나가기
            </button>
          </section>
        )}
      </main>
    </AppShell>
  )
}

function ClassroomSettingToggle({
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
    <label className="classroom-settings__toggle">
      <span className="classroom-settings__toggle-icon">
        {icon}
      </span>
      <span className="classroom-settings__toggle-copy">
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
      />
      <span className="classroom-settings__switch" aria-hidden />
    </label>
  )
}
