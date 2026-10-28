import { useRef, useState, type FormEvent } from 'react'
import {
  ArrowLeft,
  ChevronRight,
  LogOut,
  Copy,
  Mail,
  Trash2,
} from 'lucide-react'
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import {
  AppBar,
  Button,
  IconButton,
  TextField,
  useFeedback,
} from '@/design-system'
import { logout as logoutFromServer, startGoogleLogin, startKakaoLogin } from '@/api/auth'
import { GOOGLE_CLIENT_ID, isApiEnabled, isKakaoLoginEnabled } from '@/api/config'
import { AppShell } from '@/layout/AppShell'
import { formatChaltteok } from '@/features/chaltteok/chaltteok'
import { MockModeBadge } from '@/features/chaltteok/MockModeBadge'
import {
  clearLoginReturn,
  peekLoginReturn,
  safePath,
} from '@/features/chaltteok/returnFlow'
import { useChaltteokBalance } from '@/features/chaltteok/useChaltteokBalance'
import { ComingSoonDialog, PAYMENTS_NOTICE } from '@/features/common/ComingSoon'
import { arePaymentsAvailable } from '@/lib/featureFlags'
import { LEGAL_CONTACT_EMAIL } from '@/features/legal/legalInfo'
import { usePrototypeStore } from '@/store/prototypeStore'
import type { AuthProvider } from '@/types'
import { ProfileAvatar } from './ProfileAvatar'
import './AccountPages.css'

const PROVIDER_LABELS: Record<AuthProvider, string> = {
  kakao: '카카오',
  google: 'Google',
  password: '이메일',
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const authSession = usePrototypeStore((state) => state.authSession)
  const lastLogin = usePrototypeStore((state) => state.lastLogin)
  const signIn = usePrototypeStore((state) => state.signIn)
  // The welcome screen passes the last email along for "이메일로 계속하기".
  const [email, setEmail] = useState(
    (location.state as { email?: string } | null)?.email ?? '',
  )
  const [password, setPassword] = useState('')
  // Set when a guest was sent here from a purchase; both the submit and the
  // signed-in redirect below (which renders first) must agree on it.
  const [loginReturn] = useState(peekLoginReturn)
  const returnPath = safePath(loginReturn?.path)

  if (authSession.status === 'authenticated') {
    return <Navigate to={returnPath ?? '/home'} replace />
  }

  // Returning users land on the two-door home; new sign-ups go to /start.
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!email.trim() || !password) return

    signIn(email)
    clearLoginReturn()
    navigate(returnPath ?? '/home', { replace: true })
  }

  const continueWithGoogle = () => {
    signIn('jisu@gmail.com', 'google')
    clearLoginReturn()
    navigate(returnPath ?? '/home', { replace: true })
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
              onClick={() => navigate('/')}
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
          {loginReturn?.notice && (
            <p className="account-auth__notice" role="status">
              {loginReturn.notice}
            </p>
          )}
        </section>

        {isApiEnabled && isKakaoLoginEnabled && (
          <Button
            variant="secondary"
            fullWidth
            className="account-auth__provider"
            onClick={startKakaoLogin}
          >
            <span className="account-auth__mark account-auth__mark--kakao" aria-hidden>
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path
                  fill="currentColor"
                  d="M12 3.5c-5 0-9 3.1-9 7 0 2.5 1.7 4.7 4.2 5.9l-.9 3.3c-.1.3.2.5.5.4l3.9-2.6c.4 0 .8.1 1.3.1 5 0 9-3.1 9-7s-4-7.1-9-7.1z"
                />
              </svg>
            </span>
            카카오로 계속하기
            {lastLogin?.provider === 'kakao' && (
              <span className="account-auth__recent">최근 사용</span>
            )}
          </Button>
        )}

        {/* With a backend, Google needs its client ID; without one, keep the prototype's mock sign-in. */}
        {(!isApiEnabled || GOOGLE_CLIENT_ID) && (
          <Button
            variant="secondary"
            fullWidth
            className="account-auth__provider"
            onClick={isApiEnabled ? startGoogleLogin : continueWithGoogle}
          >
            <span className="account-auth__mark" aria-hidden>
              G
            </span>
            Google로 계속하기
            {lastLogin?.provider === 'google' && (
              <span className="account-auth__recent">최근 사용</span>
            )}
          </Button>
        )}

        <p className="account-auth__consent">
          로그인하면 <Link to="/terms">이용약관</Link>과{' '}
          <Link to="/privacy">개인정보처리방침</Link>에 동의한 것으로 봅니다.
        </p>

        {/* The email form only exists in the offline prototype; a backend account needs Kakao or Google. */}
        {!isApiEnabled && (
          <>
            <div className="account-auth__divider" aria-hidden>
              <span>
                또는 이메일로
                {lastLogin?.provider === 'password' && ' · 최근 사용'}
              </span>
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

          </>
        )}

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
              label="처음으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate('/')}
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
  const [returnPath] = useState(() => safePath(peekLoginReturn()?.path))

  if (authSession.status === 'authenticated') {
    return <Navigate to={returnPath ?? '/account'} replace />
  }
  // E-mail sign-up only fakes a session in the browser, so with a backend it would
  // look signed in while every request failed. Kakao and Google create real accounts.
  if (isApiEnabled) {
    return <Navigate to="/auth/login" replace />
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!displayName.trim() || !email.trim() || password.length < 8) {
      return
    }

    signUp(displayName, email)
    clearLoginReturn()
    navigate(returnPath ?? '/start', { replace: true })
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
              label="처음으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate('/')}
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
  const location = useLocation()
  const backTo = (location.state as { from?: string } | null)?.from ?? '/home'
  const currentUser = usePrototypeStore((state) => state.currentUser)
  const authSession = usePrototypeStore((state) => state.authSession)
  const signOut = usePrototypeStore((state) => state.signOut)
  const paymentsOpen = arePaymentsAvailable()
  const [paymentsNotice, setPaymentsNotice] = useState(false)
  const { balance, failed } = useChaltteokBalance(paymentsOpen)
  // Set while logging out: the page re-renders signed out before the
  // navigation lands, and must not bounce to the login screen meanwhile.
  const loggingOut = useRef(false)

  if (authSession.status !== 'authenticated') {
    return loggingOut.current ? null : <Navigate to="/auth/login" replace />
  }

  const logout = () => {
    if (isApiEnabled) {
      // Fire and forget: local sign-out must not wait on (or fail with) the network.
      void logoutFromServer().catch(() => undefined)
    }
    loggingOut.current = true
    signOut()
    navigate('/', { replace: true })
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
              label="이전 화면으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate(backTo)}
            />
          }
        />
      }
    >
      <main className="account-page">
        <button
          type="button"
          className="account-profile account-profile--button"
          onClick={() => navigate('/account/profile', { state: { fromAccount: true } })}
        >
          <ProfileAvatar
            src={currentUser.profileImageUrl}
            size={48}
            className="account-profile__avatar"
          />
          <div>
            <strong>{currentUser.displayName}</strong>
            <span>{authSession.email}</span>
          </div>
          <span className="account-profile__edit">
            프로필 수정
            <ChevronRight size={16} aria-hidden />
          </span>
        </button>

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

        <section className="account-section">
          <h2 className="account-section__title">
            찰떡
            <MockModeBadge />
          </h2>
          {paymentsOpen ? (
            <div className="account-info-row">
              <span>보유 찰떡</span>
              <strong>
                {balance !== null
                  ? formatChaltteok(balance)
                  : failed
                    ? '불러오지 못했어요'
                    : '확인하는 중…'}
              </strong>
            </div>
          ) : (
            <p className="account-section__note">찰떡 충전과 구매는 아직 개발 중이에요.</p>
          )}
          <Button
            variant="secondary"
            fullWidth
            onClick={() =>
              paymentsOpen ? navigate('/chaltteok/charge?returnTo=%2Faccount') : setPaymentsNotice(true)
            }
          >
            찰떡 충전하기
          </Button>
        </section>
        <ComingSoonDialog
          open={paymentsNotice}
          onClose={() => setPaymentsNotice(false)}
          title={PAYMENTS_NOTICE.title}
          description={PAYMENTS_NOTICE.description}
        />

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
            className="account-actions__danger ds-hit-area"
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

/**
 * Account deletion is handled by email, as the privacy policy says: the team
 * verifies the request and deletes the account and its data on the backend.
 * Until an in-app deletion API exists, this page only explains how to ask.
 */
export function DeleteAccountPage() {
  const navigate = useNavigate()
  const { showToast } = useFeedback()
  const authSession = usePrototypeStore((state) => state.authSession)
  const lastLogin = usePrototypeStore((state) => state.lastLogin)

  if (authSession.status !== 'authenticated') {
    return <Navigate to="/auth/login" replace />
  }

  const accountLine = lastLogin?.email
    ? `${PROVIDER_LABELS[lastLogin.provider]} 로그인 · ${lastLogin.email}`
    : null
  const mailHref = `mailto:${LEGAL_CONTACT_EMAIL}?subject=${encodeURIComponent(
    '[착] 회원 탈퇴 요청',
  )}&body=${encodeURIComponent(
    `회원 탈퇴를 요청합니다.

가입한 계정: ${accountLine ?? '(로그인 방식과 이메일을 적어 주세요)'}
`,
  )}`

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(LEGAL_CONTACT_EMAIL)
      showToast('이메일 주소를 복사했어요.')
    } catch {
      showToast(`이메일 주소: ${LEGAL_CONTACT_EMAIL}`)
    }
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
        <Button variant="secondary" fullWidth onClick={() => navigate('/account')}>
          내 계정으로 돌아가기
        </Button>
      }
    >
      <main className="account-delete">
        <span className="account-delete__icon" aria-hidden>
          <Mail size={23} />
        </span>
        <h1>
          회원 탈퇴는
          <br />
          이메일로 요청해 주세요.
        </h1>
        <p>
          본인 확인 후 계정과 연결된 정보를 지체 없이 삭제하고, 처리 결과를 알려드려요.
        </p>

        <section className="account-delete__request" aria-label="탈퇴 요청 방법">
          <div className="account-delete__email">
            <span>보낼 곳</span>
            <strong>{LEGAL_CONTACT_EMAIL}</strong>
          </div>
          <div className="account-delete__email">
            <span>함께 적어 주세요</span>
            <strong>{accountLine ?? '가입한 로그인 방식과 이메일'}</strong>
          </div>
          <div className="account-delete__request-actions">
            <Button
              variant="primary"
              fullWidth
              leadingIcon={<Mail size={18} aria-hidden />}
              onClick={() => {
                window.location.href = mailHref
              }}
            >
              메일로 요청하기
            </Button>
            <Button
              variant="secondary"
              fullWidth
              leadingIcon={<Copy size={18} aria-hidden />}
              onClick={copyEmail}
            >
              이메일 주소 복사
            </Button>
          </div>
        </section>

        <p className="account-delete__note">
          자세한 내용은 <Link to="/privacy">개인정보처리방침</Link>에서 확인할 수 있어요.
        </p>
      </main>
    </AppShell>
  )
}
