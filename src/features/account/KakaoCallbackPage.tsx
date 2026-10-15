import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { consumeKakaoState, loginWithKakao } from '@/api/auth'
import { ApiError } from '@/api/client'
import { Button } from '@/design-system'
import { takeLoginReturn } from '@/features/chaltteok/returnFlow'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'

/** Kakao redirects here with ?code=...&state=...; we trade the code for a session. */
export function KakaoCallbackPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const signInWithServer = usePrototypeStore((state) => state.signInWithServer)
  const [error, setError] = useState<string | null>(null)
  // The authorization code is single use; StrictMode would otherwise run this twice.
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    const code = params.get('code')
    const state = params.get('state')
    const expectedState = consumeKakaoState()

    if (params.get('error') || !code) {
      setError('카카오 로그인이 취소되었어요.')
      return
    }
    if (expectedState && state !== expectedState) {
      setError('로그인 요청을 확인할 수 없어요. 다시 시도해주세요.')
      return
    }

    loginWithKakao(code)
      .then((tokens) => {
        signInWithServer(tokens.user)
        navigate(takeLoginReturn() ?? '/home', { replace: true })
      })
      .catch((reason: unknown) => {
        setError(
          reason instanceof ApiError && reason.code === 'INVALID_KAKAO_AUTH_CODE'
            ? '로그인 코드가 만료되었어요. 다시 시도해주세요.'
            : '로그인에 실패했어요. 잠시 후 다시 시도해주세요.',
        )
      })
  }, [navigate, params, signInWithServer])

  return (
    <AppShell surface="base">
      <main style={{ padding: 24, textAlign: 'center' }}>
        {error ? (
          <>
            <p>{error}</p>
            <Button variant="brand" onClick={() => navigate('/auth/login', { replace: true })}>
              로그인으로 돌아가기
            </Button>
          </>
        ) : (
          <p>로그인하고 있어요...</p>
        )}
      </main>
    </AppShell>
  )
}
