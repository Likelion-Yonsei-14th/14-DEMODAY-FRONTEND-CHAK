import { Mail } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { startGoogleLogin, startKakaoLogin } from '@/api/auth'
import { isApiEnabled } from '@/api/config'
import { Button } from '@/design-system'
import { getCsatDdayLabel } from '@/features/csat/csatSchedule'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import type { AuthProvider } from '@/types'
import './WelcomePage.css'

const providerLabels: Record<AuthProvider, string> = {
  kakao: '카카오',
  google: 'Google',
  password: '이메일',
}

/** "jisu@gmail.com" → "ji***@gmail.com", enough to recognise your own. */
function maskEmail(email: string) {
  const [name = '', domain = ''] = email.split('@')
  const shown = name.slice(0, Math.min(2, Math.max(1, name.length - 1)))
  return domain ? `${shown}***@${domain}` : `${shown}***`
}

/**
 * The front door, before we know who someone is. A first-timer signs up and
 * goes on to make a desk or class (/start); someone coming back logs in and
 * lands on their two doors (/home). If this device has signed in before,
 * that way back in is offered first.
 */
export function WelcomePage() {
  const navigate = useNavigate()
  const authSession = usePrototypeStore((state) => state.authSession)
  const lastLogin = usePrototypeStore((state) => state.lastLogin)
  const signIn = usePrototypeStore((state) => state.signIn)

  if (authSession.status === 'authenticated') {
    return <Navigate to="/home" replace />
  }

  const continueLastLogin = () => {
    if (!lastLogin) return
    // With a backend, Kakao and Google go back through their real sign-in.
    if (isApiEnabled && lastLogin.provider === 'kakao') {
      startKakaoLogin()
      return
    }
    if (isApiEnabled && lastLogin.provider === 'google') {
      startGoogleLogin()
      return
    }
    if (lastLogin.provider === 'google') {
      // Prototype: Google hands back the same account straight away.
      signIn(lastLogin.email, 'google')
      navigate('/home', { replace: true })
      return
    }
    navigate('/auth/login', { state: { email: lastLogin.email } })
  }

  return (
    <AppShell surface="base" contentClassName="welcome-page-shell">
      <main className="welcome-page">
        <span className="welcome-page__dday">{getCsatDdayLabel()}</span>

        <section className="welcome-page__brand">
          <img
            className="welcome-page__logo"
            src="/assets/brand/chak-logo.svg"
            alt="착, 우리 사이에 착"
            draggable={false}
          />
          <p>
            링크 하나로 친구들의 응원을 모으고,
            <br />
            정해둔 시간에 꺼내봐요.
          </p>
        </section>

        <section className="welcome-page__actions" aria-label="시작하기">
          {lastLogin ? (
            <>
              <div className="welcome-page__last">
                <span className="welcome-page__last-badge">최근 로그인</span>
                <span>
                  지난번엔 {providerLabels[lastLogin.provider]}로 들어왔어요
                </span>
                {lastLogin.email && (
                  <strong>{maskEmail(lastLogin.email)}</strong>
                )}
              </div>
              <Button
                variant="brand"
                fullWidth
                leadingIcon={<ProviderMark provider={lastLogin.provider} />}
                onClick={continueLastLogin}
              >
                {providerLabels[lastLogin.provider]}로 계속하기
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => navigate('/auth/login')}
              >
                다른 방법으로 로그인
              </Button>
              <p className="welcome-page__switch">
                처음이에요?{' '}
                <button type="button" onClick={() => navigate('/auth/signup')}>
                  회원가입
                </button>
              </p>
            </>
          ) : (
            <>
              <Button
                variant="brand"
                fullWidth
                onClick={() => navigate('/auth/signup')}
              >
                처음이에요, 시작할게요
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => navigate('/auth/login')}
              >
                이미 계정이 있어요
              </Button>
            </>
          )}

          <button
            type="button"
            className="welcome-page__guest"
            onClick={() => navigate('/start')}
          >
            로그인 없이 둘러보기
          </button>
        </section>
      </main>
    </AppShell>
  )
}

function ProviderMark({ provider }: { provider: AuthProvider }) {
  if (provider === 'kakao') return null
  return provider === 'google' ? (
    <span className="welcome-page__google-mark" aria-hidden>
      G
    </span>
  ) : (
    <Mail size={18} aria-hidden />
  )
}
