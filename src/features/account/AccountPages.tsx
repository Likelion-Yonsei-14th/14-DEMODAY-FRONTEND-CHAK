import { useState, type FormEvent } from 'react'
import {
  ArrowLeft,
  LogOut,
  Mail,
  Trash2,
  UserRound,
} from 'lucide-react'
import {
  Link,
  Navigate,
  useNavigate,
} from 'react-router-dom'
import {
  AppBar,
  Button,
  IconButton,
  TextField,
} from '@/design-system'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import './AccountPages.css'

export function LoginPage() {
  const navigate = useNavigate()
  const authSession = usePrototypeStore((state) => state.authSession)
  const signIn = usePrototypeStore((state) => state.signIn)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (authSession.status === 'authenticated') {
    return <Navigate to="/home" replace />
  }

  // Returning users land on the two-door home; new sign-ups go to /start.
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!email.trim() || !password) return

    signIn(email)
    navigate('/home', { replace: true })
  }

  const continueWithGoogle = () => {
    signIn('jisu@gmail.com', 'google')
    navigate('/home', { replace: true })
  }

  return (
    <AppShell
      surface="base"
      contentClassName="account-flow-shell"
      appBar={
        <AppBar
          title="로그인"
          leading={
            <IconButton
              label="처음으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate('/start')}
            />
          }
        />
      }
    >
      <main className="account-auth">
        <section className="account-auth__heading">
          <h1>
            모아둔 응원을
            <br />
            다음에도 이어서 볼 수 있어요.
          </h1>
          <p>
            로그인하지 않아도 응원을 남기고 둘러볼 수 있어요.
          </p>
        </section>

        <Button
          variant="secondary"
          fullWidth
          className="account-auth__google"
          onClick={continueWithGoogle}
        >
          <span className="account-auth__google-mark" aria-hidden>
            G
          </span>
          Google로 계속하기
        </Button>

        <div className="account-auth__divider" aria-hidden>
          <span>또는</span>
        </div>

        <form className="account-auth__form" onSubmit={submit}>
          <TextField
            id="login-email"
            label="이메일"
            type="email"
            autoComplete="email"
            placeholder="example@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <TextField
            id="login-password"
            label="비밀번호"
            type="password"
            autoComplete="current-password"
            placeholder="비밀번호를 입력해주세요"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <div className="account-auth__password-help">
            <Link to="/auth/reset-password">
              비밀번호를 잊었어요
            </Link>
          </div>
          <Button
            type="submit"
            variant="brand"
            fullWidth
            disabled={!email.trim() || !password}
          >
            로그인
          </Button>
        </form>

        <p className="account-auth__switch">
          아직 계정이 없나요?
          <Link to="/auth/signup">회원가입</Link>
        </p>

        <button
          type="button"
          className="account-auth__guest"
          onClick={() => navigate('/start')}
        >
          로그인 없이 계속하기
        </button>
      </main>
    </AppShell>
  )
}


export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!email.trim()) return

    navigate(
      `/auth/reset-password/new?email=${encodeURIComponent(
        email.trim(),
      )}`,
    )
  }

  return (
    <AppShell
      surface="base"
      contentClassName="account-flow-shell"
      appBar={
        <AppBar
          title="비밀번호 재설정"
          leading={
            <IconButton
              label="로그인으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate('/auth/login')}
            />
          }
        />
      }
    >
      <main className="account-auth">
        <section className="account-auth__heading">
          <h1>
            가입한 이메일을
            <br />
            입력해주세요.
          </h1>
          <p>
            실제 서비스에서는 이메일 인증 후 새 비밀번호를
            설정하게 돼요.
          </p>
        </section>

        <form className="account-auth__form" onSubmit={submit}>
          <TextField
            id="reset-email"
            label="이메일"
            type="email"
            autoComplete="email"
            placeholder="example@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Button
            type="submit"
            variant="brand"
            fullWidth
            disabled={!email.trim()}
          >
            인증 메일 보내기
          </Button>
        </form>
      </main>
    </AppShell>
  )
}

export function ResetPasswordNewPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const valid =
    password.length >= 8 &&
    password === confirmPassword

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!valid) return

    navigate('/auth/reset-password/complete', {
      replace: true,
    })
  }

  return (
    <AppShell
      surface="base"
      contentClassName="account-flow-shell"
      appBar={
        <AppBar
          title="새 비밀번호"
          leading={
            <IconButton
              label="이전으로"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate('/auth/reset-password')}
            />
          }
        />
      }
    >
      <main className="account-auth">
        <section className="account-auth__heading">
          <h1>
            새로 사용할 비밀번호를
            <br />
            정해주세요.
          </h1>
        </section>

        <form className="account-auth__form" onSubmit={submit}>
          <TextField
            id="reset-new-password"
            label="새 비밀번호"
            type="password"
            autoComplete="new-password"
            placeholder="8자 이상 입력해주세요"
            helper="8자 이상"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <TextField
            id="reset-confirm-password"
            label="새 비밀번호 확인"
            type="password"
            autoComplete="new-password"
            placeholder="한 번 더 입력해주세요"
            error={
              confirmPassword.length > 0 &&
              password !== confirmPassword
                ? '비밀번호가 일치하지 않아요.'
                : undefined
            }
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
          />
          <Button
            type="submit"
            variant="brand"
            fullWidth
            disabled={!valid}
          >
            비밀번호 바꾸기
          </Button>
        </form>
      </main>
    </AppShell>
  )
}

export function ResetPasswordCompletePage() {
  const navigate = useNavigate()

  return (
    <AppShell
      surface="base"
      contentClassName="account-flow-shell"
      fixedAction={
        <Button
          variant="brand"
          fullWidth
          onClick={() =>
            navigate('/auth/login', { replace: true })
          }
        >
          새 비밀번호로 로그인하기
        </Button>
      }
    >
      <main className="account-delete account-delete--complete">
        <span className="account-delete__complete-mark" aria-hidden>
          ✓
        </span>
        <h1>비밀번호를 바꿨어요.</h1>
        <p>이제 새 비밀번호로 로그인할 수 있어요.</p>
      </main>
    </AppShell>
  )
}

export function SignupPage() {
  const navigate = useNavigate()
  const authSession = usePrototypeStore((state) => state.authSession)
  const signUp = usePrototypeStore((state) => state.signUp)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (authSession.status === 'authenticated') {
    return <Navigate to="/account" replace />
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!displayName.trim() || !email.trim() || password.length < 8) {
      return
    }

    signUp(displayName, email)
    navigate('/start', { replace: true })
  }

  return (
    <AppShell
      surface="base"
      contentClassName="account-flow-shell"
      appBar={
        <AppBar
          title="회원가입"
          leading={
            <IconButton
              label="로그인으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate('/auth/login')}
            />
          }
        />
      }
    >
      <main className="account-auth">
        <section className="account-auth__heading">
          <h1>
            다음에 다시 와도
            <br />
            내 공간을 이어볼 수 있게.
          </h1>
        </section>

        <form className="account-auth__form" onSubmit={submit}>
          <TextField
            id="signup-name"
            label="이름 또는 닉네임"
            autoComplete="nickname"
            placeholder="예: 지수"
            maxLength={12}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
          <TextField
            id="signup-email"
            label="이메일"
            type="email"
            autoComplete="email"
            placeholder="example@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <TextField
            id="signup-password"
            label="비밀번호"
            type="password"
            autoComplete="new-password"
            placeholder="8자 이상 입력해주세요"
            helper="8자 이상"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <Button
            type="submit"
            variant="brand"
            fullWidth
            disabled={
              !displayName.trim() ||
              !email.trim() ||
              password.length < 8
            }
          >
            계정 만들기
          </Button>
        </form>

        <p className="account-auth__switch">
          이미 계정이 있나요?
          <Link to="/auth/login">로그인</Link>
        </p>
      </main>
    </AppShell>
  )
}

export function AccountPage() {
  const navigate = useNavigate()
  const currentUser = usePrototypeStore((state) => state.currentUser)
  const authSession = usePrototypeStore((state) => state.authSession)
  const signOut = usePrototypeStore((state) => state.signOut)

  if (authSession.status !== 'authenticated') {
    return <Navigate to="/auth/login" replace />
  }

  const logout = () => {
    signOut()
    navigate('/start', { replace: true })
  }

  return (
    <AppShell
      surface="base"
      contentClassName="account-flow-shell"
      appBar={
        <AppBar
          title="내 계정"
          leading={
            <IconButton
              label="처음으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate('/start')}
            />
          }
        />
      }
    >
      <main className="account-page">
        <section className="account-profile">
          <span className="account-profile__avatar" aria-hidden>
            <UserRound size={25} />
          </span>
          <div>
            <strong>{currentUser.displayName}</strong>
            <span>{authSession.email}</span>
          </div>
        </section>

        <section className="account-section">
          <h2>계정 정보</h2>
          <div className="account-info-row">
            <span>
              <Mail size={17} aria-hidden />
              이메일
            </span>
            <strong>{authSession.email}</strong>
          </div>
          <div className="account-info-row">
            <span>로그인 방식</span>
            <strong>
              {authSession.provider === 'google'
                ? 'Google'
                : '이메일'}
            </strong>
          </div>
        </section>

        <section className="account-actions">
          <Button
            variant="secondary"
            fullWidth
            leadingIcon={<LogOut size={18} aria-hidden />}
            onClick={logout}
          >
            로그아웃
          </Button>

          <button
            type="button"
            className="account-actions__danger"
            onClick={() => navigate('/account/delete')}
          >
            <Trash2 size={16} aria-hidden />
            회원 탈퇴
          </button>
        </section>
      </main>
    </AppShell>
  )
}

export function DeleteAccountPage() {
  const navigate = useNavigate()
  const authSession = usePrototypeStore((state) => state.authSession)
  const deleteAccount = usePrototypeStore(
    (state) => state.deleteAccount,
  )

  if (authSession.status !== 'authenticated') {
    return <Navigate to="/auth/login" replace />
  }

  const confirm = () => {
    deleteAccount()
    navigate('/account/delete/complete', { replace: true })
  }

  return (
    <AppShell
      surface="base"
      contentClassName="account-flow-shell"
      appBar={
        <AppBar
          title="회원 탈퇴"
          leading={
            <IconButton
              label="내 계정으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate('/account')}
            />
          }
        />
      }
      fixedAction={
        <div className="account-delete__actions">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => navigate('/account')}
          >
            계정 유지하기
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={confirm}
          >
            탈퇴하기
          </Button>
        </div>
      }
    >
      <main className="account-delete">
        <span className="account-delete__icon" aria-hidden>
          <Trash2 size={23} />
        </span>
        <h1>
          정말 계정을
          <br />
          탈퇴할까요?
        </h1>
        <p>
          로그인 계정과 연결된 정보는 더 이상 불러올 수 없어요.
        </p>
      </main>
    </AppShell>
  )
}

export function DeleteAccountCompletePage() {
  const navigate = useNavigate()

  return (
    <AppShell
      surface="base"
      contentClassName="account-flow-shell"
      fixedAction={
        <Button
          variant="brand"
          fullWidth
          onClick={() => navigate('/start', { replace: true })}
        >
          처음으로 돌아가기
        </Button>
      }
    >
      <main className="account-delete account-delete--complete">
        <span className="account-delete__complete-mark" aria-hidden>
          ✓
        </span>
        <h1>탈퇴가 완료됐어요.</h1>
        <p>언제든 다시 응원을 주고받으러 올 수 있어요.</p>
      </main>
    </AppShell>
  )
}
