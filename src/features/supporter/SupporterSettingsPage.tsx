import { useState } from 'react'
import {
  ArrowLeft,
  Bell,
  LogIn,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  AppBar,
  Button,
  IconButton,
  TextField,
  useFeedback,
} from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import './SupporterSettingsPage.css'

export function SupporterSettingsPage() {
  const navigate = useNavigate()
  const { showToast } = useFeedback()
  const authSession = usePrototypeStore((state) => state.authSession)
  const supporterIdentityName = usePrototypeStore(
    (state) => state.supporterIdentityName,
  )
  const settings = usePrototypeStore(
    (state) => state.supporterSettings,
  )
  const updateSettings = usePrototypeStore(
    (state) => state.updateSupporterSettings,
  )
  const [nickname, setNickname] = useState(
    settings.defaultNickname ||
      supporterIdentityName ||
      '',
  )

  const save = () => {
    updateSettings({
      defaultNickname: nickname.trim(),
    })
    showToast('설정을 저장했어요.')
  }

  return (
    <AppShell
      surface="base"
      contentClassName="supporter-settings-shell"
      appBar={
        <AppBar
          title="내 응원 설정"
          leading={
            <IconButton
              label="책상으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() =>
                navigate('/prototype/support/jisu')
              }
            />
          }
        />
      }
      fixedAction={
        <Button
          variant="brand"
          fullWidth
          disabled={!nickname.trim()}
          onClick={save}
        >
          저장
        </Button>
      }
    >
      <main className="supporter-settings">
        <section className="supporter-settings__section">
          <header>
            <h2>내 이름</h2>
            <p>
              다음 응원을 만들 때 이 이름이 기본으로 들어가요.
              작성할 때 이번 응원만 다른 이름으로 바꿀 수도 있어요.
            </p>
          </header>

          <TextField
            id="supporter-default-nickname"
            label="기본 이름 또는 닉네임"
            placeholder="예: 민지"
            maxLength={12}
            value={nickname}
            onChange={(event) =>
              setNickname(event.target.value)
            }
          />
        </section>

        <section className="supporter-settings__section">
          <header>
            <h2>수능이 끝난 뒤</h2>
          </header>

          <SupporterToggle
            icon={<Sparkles size={18} aria-hidden />}
            title="내 이름 보여주기"
            description="응원 기록에서 내가 남긴 이름을 공개해도 좋아요."
            checked={settings.revealAfterExam}
            onChange={(checked) =>
              updateSettings({ revealAfterExam: checked })
            }
          />

          <SupporterToggle
            icon={<Bell size={18} aria-hidden />}
            title="답장 알림 받기"
            description="내가 남긴 응원에 답장이 오면 알려줘요."
            checked={settings.pushEnabled}
            onChange={(checked) =>
              updateSettings({ pushEnabled: checked })
            }
          />
        </section>

        <section className="supporter-settings__section">
          <header>
            <h2>계정</h2>
          </header>

          <button
            type="button"
            className="supporter-settings__account"
            onClick={() =>
              navigate(
                authSession.status === 'authenticated'
                  ? '/account'
                  : '/auth/login',
              )
            }
          >
            <span className="supporter-settings__account-icon">
              {authSession.status === 'authenticated' ? (
                <UserRound size={18} aria-hidden />
              ) : (
                <LogIn size={18} aria-hidden />
              )}
            </span>
            <span>
              <strong>
                {authSession.status === 'authenticated'
                  ? '내 계정 관리'
                  : '로그인'}
              </strong>
              <small>
                {authSession.status === 'authenticated'
                  ? authSession.email
                  : '로그인하면 다른 기기에서도 내 활동을 이어볼 수 있어요.'}
              </small>
            </span>
          </button>
        </section>
      </main>
    </AppShell>
  )
}

function SupporterToggle({
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
    <label className="supporter-settings__toggle">
      <span className="supporter-settings__toggle-icon">
        {icon}
      </span>
      <span className="supporter-settings__toggle-copy">
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
      <span className="supporter-settings__switch" aria-hidden />
    </label>
  )
}
